<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientTransaction;
use App\Models\Expense;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Services\ClientTransactionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class FinanceController extends Controller
{
    // ── Client Transactions ───────────────────────────────────

    public function transactions(Request $request)
    {
        $query = ClientTransaction::query();

        if ($request->filled('direction')) {
            $query->where('direction', $request->direction);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where('client_name', 'like', '%' . $request->search . '%');
        }

        return response()->json(['data' => $query->orderByDesc('created_at')->get()]);
    }

    public function storeTransaction(Request $request, ClientTransactionService $transactions)
    {
        $validated = $request->validate([
            'phone'      => ['required', 'string', 'regex:' . config('transactions.phone_regex')],
            'direction'  => ['required', Rule::in(config('transactions.directions'))],
            'method'     => ['required', Rule::in(config('transactions.methods'))],
            'place'      => ['nullable', Rule::in(config('transactions.places'))],
            'amount'     => 'required|numeric|min:0',
            'commission' => 'nullable|numeric|min:0',
            'status'     => 'nullable|in:completed,pending,failed',
            'notes'      => 'nullable|string',
        ]);

        // Resolve the client by phone, record the entry, and activate on first
        // completed deposit. Throws 422 if the phone matches no client.
        $result = $transactions->recordByPhone($validated);

        return response()->json([
            'data'      => $result['transaction'],
            'activated' => $result['activated'],
        ], 201);
    }

    public function updateTransaction(Request $request, ClientTransaction $tx)
    {
        $validated = $request->validate([
            'status'     => 'sometimes|in:completed,pending,failed',
            'direction'  => ['sometimes', Rule::in(config('transactions.directions'))],
            'method'     => ['sometimes', Rule::in(config('transactions.methods'))],
            'place'      => ['nullable', Rule::in(config('transactions.places'))],
            'amount'     => 'sometimes|numeric|min:0',
            'commission' => 'nullable|numeric|min:0',
            'notes'      => 'nullable|string',
        ]);

        // "method" from the frontend is stored in the "type" column
        if (isset($validated['method'])) {
            $validated['type'] = $validated['method'];
            unset($validated['method']);
        }

        $tx->update($validated);
        $this->maybeActivateClient($tx->fresh());

        return response()->json(['data' => $tx]);
    }

    /**
     * A completed inbound deposit that is linked to a CRM client promotes that
     * client to "active" (their first money in).
     */
    private function maybeActivateClient(ClientTransaction $tx): void
    {
        if ($tx->direction === 'deposit' && $tx->status === 'completed' && $tx->client_id) {
            $tx->client?->activate();
        }
    }

    public function destroyTransaction(ClientTransaction $tx)
    {
        $tx->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Expenses ──────────────────────────────────────────────

    public function expenses(Request $request)
    {
        $query = Expense::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json(['data' => $query->orderByDesc('date')->get()]);
    }

    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'category'       => 'required|string',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'amount'         => 'required|numeric|min:0',
            'currency'       => 'required|in:USD,SYP',
            'date'           => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        // Don't let an expense overdraw the wallet.
        $wallet  = Wallet::main();
        $balance = $validated['currency'] === 'SYP' ? $wallet->syp : $wallet->usd;
        if ($validated['amount'] > $balance) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient {$validated['currency']} balance in the wallet."],
            ]);
        }

        $expense = Expense::create($validated);

        // Deduct from wallet
        if ($validated['currency'] === 'SYP') {
            $wallet->decrement('syp', $validated['amount']);
        } else {
            $wallet->decrement('usd', $validated['amount']);
        }

        return response()->json(['data' => $expense], 201);
    }

    public function updateExpense(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'category'       => 'sometimes|required|string',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'amount'         => 'sometimes|required|numeric|min:0',
            'currency'       => 'sometimes|required|in:USD,SYP',
            'date'           => 'sometimes|required|date',
            'notes'          => 'nullable|string',
        ]);

        $newAmount   = (float) ($validated['amount'] ?? $expense->amount);
        $newCurrency = $validated['currency'] ?? $expense->currency;

        // Refund the original expense, then charge the edited one — the wallet
        // must stay solvent once both sides are applied.
        $wallet   = Wallet::main();
        $balances = ['syp' => (float) $wallet->syp, 'usd' => (float) $wallet->usd];
        $balances[$this->walletColumn($expense->currency)] += (float) $expense->amount;
        $balances[$this->walletColumn($newCurrency)]       -= $newAmount;

        if ($balances['syp'] < 0 || $balances['usd'] < 0) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient {$newCurrency} balance in the wallet."],
            ]);
        }

        $wallet->update($balances);
        $expense->update($validated);

        return response()->json(['data' => $expense->fresh()]);
    }

    public function destroyExpense(Expense $expense)
    {
        // Refund to wallet
        $wallet = Wallet::main();
        if ($expense->currency === 'SYP') {
            $wallet->increment('syp', $expense->amount);
        } else {
            $wallet->increment('usd', $expense->amount);
        }

        $expense->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Wallet ────────────────────────────────────────────────

    public function wallet()
    {
        return response()->json(['data' => Wallet::main()]);
    }

    /** Recent wallet top-ups (the ledger shown on the Wallets page). */
    public function topups()
    {
        return response()->json([
            'data' => WalletTopup::with('broker:id,name')
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(),
        ]);
    }

    public function topUpWallet(Request $request)
    {
        $validated = $request->validate($this->topupRules());

        $wallet = Wallet::main();
        if ($validated['currency'] === 'SYP') {
            $wallet->increment('syp', $validated['amount']);
        } else {
            $wallet->increment('usd', $validated['amount']);
        }

        WalletTopup::create($this->topupAttributes($validated) + [
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(['data' => $wallet->fresh()]);
    }

    public function updateTopup(Request $request, WalletTopup $topup)
    {
        $validated = $request->validate($this->topupRules());

        // Rewind the original top-up and apply the edited one. If the money has
        // since been spent, the rewind would push a wallet negative — reject it.
        $wallet   = Wallet::main();
        $balances = ['syp' => (float) $wallet->syp, 'usd' => (float) $wallet->usd];
        $balances[$this->walletColumn($topup->currency)]        -= (float) $topup->amount;
        $balances[$this->walletColumn($validated['currency'])]  += (float) $validated['amount'];

        if ($balances['syp'] < 0 || $balances['usd'] < 0) {
            throw ValidationException::withMessages([
                'amount' => ['This change would overdraw the wallet — the funds have already been spent.'],
            ]);
        }

        $wallet->update($balances);
        $topup->update($this->topupAttributes($validated));

        return response()->json(['data' => $topup->fresh()->load('broker:id,name')]);
    }

    public function destroyTopup(WalletTopup $topup)
    {
        // Deleting a top-up takes the money back out of the wallet — refuse if
        // that would leave the balance negative.
        $wallet = Wallet::main();
        $column = $this->walletColumn($topup->currency);

        if ((float) $wallet->{$column} < (float) $topup->amount) {
            throw ValidationException::withMessages([
                'amount' => ['This top-up cannot be deleted — the funds have already been spent.'],
            ]);
        }

        $wallet->decrement($column, $topup->amount);
        $topup->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /** Shared validation for creating and editing a wallet top-up. */
    private function topupRules(): array
    {
        return [
            'currency'     => 'required|in:USD,SYP',
            'amount'       => 'required|numeric|min:0',
            'broker_id'    => 'nullable|integer|exists:brokers,id',
            'broker_other' => 'nullable|string|max:120',
            'note'         => 'nullable|string',
        ];
    }

    /**
     * A top-up is sourced either from a contracted broker or from a free-text
     * "Other" — never both.
     */
    private function topupAttributes(array $validated): array
    {
        $brokerId = $validated['broker_id'] ?? null;

        return [
            'currency'     => $validated['currency'],
            'amount'       => $validated['amount'],
            'broker_id'    => $brokerId,
            'broker_other' => $brokerId ? null : ($validated['broker_other'] ?? null),
            'note'         => $validated['note'] ?? null,
        ];
    }

    /** Wallet balance column for a currency code. */
    private function walletColumn(string $currency): string
    {
        return $currency === 'SYP' ? 'syp' : 'usd';
    }

    public function convertCurrency(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'from'   => 'required|in:USD,SYP',
            'rate'   => 'nullable|numeric|min:1',
        ]);

        $wallet = Wallet::main();
        $rate = $validated['rate'] ?? $wallet->rate;

        // Don't let a conversion overdraw the source wallet.
        $balance = $validated['from'] === 'SYP' ? $wallet->syp : $wallet->usd;
        if ($validated['amount'] > $balance) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient {$validated['from']} balance to convert."],
            ]);
        }

        $wallet->rate = $rate;

        if ($validated['from'] === 'SYP') {
            $wallet->syp -= $validated['amount'];
            $wallet->usd += $validated['amount'] / $rate;
        } else {
            $wallet->usd -= $validated['amount'];
            $wallet->syp += $validated['amount'] * $rate;
        }

        $wallet->save();
        return response()->json(['data' => $wallet]);
    }

    public function updateRate(Request $request)
    {
        $validated = $request->validate(['rate' => 'required|numeric|min:1']);
        $wallet = Wallet::main();
        $wallet->update(['rate' => $validated['rate']]);
        return response()->json(['data' => $wallet]);
    }
}
