<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientTransaction;
use App\Models\Expense;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Services\ClientTransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $query = Expense::with('wallet:id,name_ar,name_en');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('wallet_id')) {
            $query->where('wallet_id', $request->wallet_id);
        }

        return response()->json(['data' => $query->orderByDesc('date')->get()]);
    }

    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'wallet_id'      => ['nullable', 'integer', Rule::exists('wallets', 'id')],
            'category'       => 'required|string',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'amount'         => 'required|numeric|min:0',
            'currency'       => 'required|in:USD,SYP',
            'date'           => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        $wallet = $this->resolveWallet($validated['wallet_id'] ?? null);
        $this->assertNotArchived($wallet);

        // Don't let an expense overdraw the wallet it is paid from.
        if ($validated['amount'] > $wallet->balanceIn($validated['currency'])) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient {$validated['currency']} balance in {$wallet->name_en}."],
            ]);
        }

        $expense = DB::transaction(function () use ($validated, $wallet) {
            $expense = Expense::create($validated + ['wallet_id' => $wallet->id]);
            $wallet->decrement(Wallet::columnFor($validated['currency']), $validated['amount']);
            return $expense;
        });

        return response()->json(['data' => $expense->load('wallet:id,name_ar,name_en')], 201);
    }

    public function updateExpense(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'wallet_id'      => ['nullable', 'integer', Rule::exists('wallets', 'id')],
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
        $oldWallet   = $this->resolveWallet($expense->wallet_id);
        $newWallet   = array_key_exists('wallet_id', $validated)
            ? $this->resolveWallet($validated['wallet_id'])
            : $oldWallet;

        if ($newWallet->id !== $oldWallet->id) {
            $this->assertNotArchived($newWallet);
        }

        // Refund the original expense, then charge the edited one. Both sides
        // are applied before the solvency check, because an edit that moves an
        // expense between wallets touches two balances and either could go
        // negative.
        $deltas = [];
        $this->applyDelta($deltas, $oldWallet->id, $expense->currency, +(float) $expense->amount);
        $this->applyDelta($deltas, $newWallet->id, $newCurrency, -$newAmount);

        DB::transaction(function () use ($deltas, $expense, $validated, $newWallet) {
            $this->commitDeltas($deltas);
            $expense->update($validated + ['wallet_id' => $newWallet->id]);
        });

        return response()->json(['data' => $expense->fresh()->load('wallet:id,name_ar,name_en')]);
    }

    public function destroyExpense(Expense $expense)
    {
        $wallet = $this->resolveWallet($expense->wallet_id);

        DB::transaction(function () use ($wallet, $expense) {
            $wallet->increment(Wallet::columnFor($expense->currency), $expense->amount);
            $expense->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    // ── Wallets ───────────────────────────────────────────────

    /**
     * Back-compat: the single-wallet clients still call /wallet and expect one
     * object. It returns the main wallet.
     */
    public function wallet()
    {
        return response()->json(['data' => Wallet::main()]);
    }

    /** Every wallet, main first, with the company rate attached to each. */
    public function wallets()
    {
        return response()->json([
            'data' => Wallet::orderByDesc('is_main')->orderBy('name_en')->get(),
            'meta' => ['rate' => Wallet::rate()],
        ]);
    }

    public function storeWallet(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:120',
            'name_en' => 'required|string|max:120',
            'syp'     => 'nullable|numeric|min:0',
            'usd'     => 'nullable|numeric|min:0',
        ]);

        // A new wallet starts empty. Opening balances would be money appearing
        // from nowhere; fund it with a top-up so the ledger explains it.
        $wallet = Wallet::create([
            'key'     => Wallet::makeKey($validated['name_en']),
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'],
            'is_main' => Wallet::count() === 0,
            'syp'     => 0,
            'usd'     => 0,
        ]);

        return response()->json(['data' => $wallet], 201);
    }

    public function updateWallet(Request $request, Wallet $wallet)
    {
        $validated = $request->validate([
            'name_ar'     => 'sometimes|required|string|max:120',
            'name_en'     => 'sometimes|required|string|max:120',
            'is_archived' => 'sometimes|boolean',
        ]);

        // The main wallet is where unattributed money lands, so it has to stay
        // reachable.
        if (($validated['is_archived'] ?? false) && $wallet->is_main) {
            throw ValidationException::withMessages([
                'is_archived' => ['The main wallet cannot be archived. Make another wallet main first.'],
            ]);
        }

        $wallet->update($validated);

        return response()->json(['data' => $wallet->fresh()]);
    }

    public function makeMainWallet(Wallet $wallet)
    {
        $wallet->makeMain();

        return response()->json(['data' => Wallet::orderByDesc('is_main')->orderBy('name_en')->get()]);
    }

    public function destroyWallet(Wallet $wallet)
    {
        if ($wallet->is_main) {
            throw ValidationException::withMessages([
                'wallet' => ['The main wallet cannot be deleted. Make another wallet main first.'],
            ]);
        }

        if (abs($wallet->syp) > 0.001 || abs($wallet->usd) > 0.001) {
            throw ValidationException::withMessages([
                'wallet' => ['This wallet still holds a balance. Transfer it out before deleting.'],
            ]);
        }

        // History survives: wallet_id is nullOnDelete, so past top-ups and
        // expenses keep their rows and simply lose the wallet reference.
        $wallet->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /** Move money between two wallets in one currency. */
    public function transferBetweenWallets(Request $request)
    {
        $validated = $request->validate([
            'from_wallet_id' => ['required', 'integer', Rule::exists('wallets', 'id')],
            'to_wallet_id'   => ['required', 'integer', 'different:from_wallet_id', Rule::exists('wallets', 'id')],
            'currency'       => 'required|in:USD,SYP',
            'amount'         => 'required|numeric|min:0.01',
        ]);

        $from = Wallet::findOrFail($validated['from_wallet_id']);
        $to   = Wallet::findOrFail($validated['to_wallet_id']);
        $this->assertNotArchived($to);

        $column = Wallet::columnFor($validated['currency']);

        if ($from->balanceIn($validated['currency']) < $validated['amount']) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient {$validated['currency']} balance in {$from->name_en}."],
            ]);
        }

        DB::transaction(function () use ($from, $to, $column, $validated) {
            $from->decrement($column, $validated['amount']);
            $to->increment($column, $validated['amount']);
        });

        return response()->json(['data' => Wallet::orderByDesc('is_main')->orderBy('name_en')->get()]);
    }

    /** Recent wallet top-ups (the ledger shown on the Wallets page). */
    public function topups(Request $request)
    {
        $query = WalletTopup::with(['broker:id,name', 'wallet:id,name_ar,name_en']);

        if ($request->filled('wallet_id')) {
            $query->where('wallet_id', $request->wallet_id);
        }

        return response()->json([
            'data' => $query->orderByDesc('created_at')->limit(50)->get(),
        ]);
    }

    public function topUpWallet(Request $request)
    {
        $validated = $request->validate($this->topupRules());

        $wallet = $this->resolveWallet($validated['wallet_id'] ?? null);
        $this->assertNotArchived($wallet);

        $topup = DB::transaction(function () use ($validated, $wallet, $request) {
            $wallet->increment(Wallet::columnFor($validated['currency']), $validated['amount']);

            return WalletTopup::create($this->topupAttributes($validated) + [
                'wallet_id'  => $wallet->id,
                'created_by' => $request->user()?->id,
            ]);
        });

        return response()->json([
            'data'   => $wallet->fresh(),
            'topup'  => $topup->load(['broker:id,name', 'wallet:id,name_ar,name_en']),
        ]);
    }

    public function updateTopup(Request $request, WalletTopup $topup)
    {
        $validated = $request->validate($this->topupRules());

        $oldWallet = $this->resolveWallet($topup->wallet_id);
        $newWallet = array_key_exists('wallet_id', $validated)
            ? $this->resolveWallet($validated['wallet_id'])
            : $oldWallet;

        if ($newWallet->id !== $oldWallet->id) {
            $this->assertNotArchived($newWallet);
        }

        // Rewind the original top-up and apply the edited one. If the money has
        // since been spent, the rewind pushes a wallet negative — reject it.
        $deltas = [];
        $this->applyDelta($deltas, $oldWallet->id, $topup->currency, -(float) $topup->amount);
        $this->applyDelta($deltas, $newWallet->id, $validated['currency'], +(float) $validated['amount']);

        DB::transaction(function () use ($deltas, $topup, $validated, $newWallet) {
            $this->commitDeltas($deltas, 'This change would overdraw the wallet — the funds have already been spent.');
            $topup->update($this->topupAttributes($validated) + ['wallet_id' => $newWallet->id]);
        });

        return response()->json([
            'data' => $topup->fresh()->load(['broker:id,name', 'wallet:id,name_ar,name_en']),
        ]);
    }

    public function destroyTopup(WalletTopup $topup)
    {
        // Deleting a top-up takes the money back out of the wallet — refuse if
        // that would leave the balance negative.
        $wallet = $this->resolveWallet($topup->wallet_id);
        $column = Wallet::columnFor($topup->currency);

        if ($wallet->balanceIn($topup->currency) < (float) $topup->amount) {
            throw ValidationException::withMessages([
                'amount' => ['This top-up cannot be deleted — the funds have already been spent.'],
            ]);
        }

        DB::transaction(function () use ($wallet, $column, $topup) {
            $wallet->decrement($column, $topup->amount);
            $topup->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    /** Shared validation for creating and editing a wallet top-up. */
    private function topupRules(): array
    {
        return [
            'wallet_id'    => ['nullable', 'integer', Rule::exists('wallets', 'id')],
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

    /* ── Balance helpers ───────────────────────────────────────────────── */

    /** A wallet by id, falling back to the main wallet. Never null. */
    private function resolveWallet(?int $id): Wallet
    {
        return $id ? Wallet::findOrFail($id) : Wallet::main();
    }

    private function assertNotArchived(Wallet $wallet): void
    {
        if ($wallet->is_archived) {
            throw ValidationException::withMessages([
                'wallet_id' => ["{$wallet->name_en} is archived and cannot receive new movements."],
            ]);
        }
    }

    /**
     * Accumulate a pending balance change, keyed by wallet and currency, so an
     * edit that spans two wallets is checked as one unit instead of one side
     * at a time.
     */
    private function applyDelta(array &$deltas, int $walletId, string $currency, float $amount): void
    {
        $key = $walletId . ':' . Wallet::columnFor($currency);
        $deltas[$key] = ($deltas[$key] ?? 0) + $amount;
    }

    /** Verify every affected balance stays solvent, then write them all. */
    private function commitDeltas(array $deltas, ?string $message = null): void
    {
        $wallets = [];

        foreach ($deltas as $key => $delta) {
            [$walletId, $column] = explode(':', $key);
            $wallet = $wallets[$walletId] ??= Wallet::lockForUpdate()->findOrFail($walletId);
            $wallet->{$column} = (float) $wallet->{$column} + $delta;
        }

        foreach ($wallets as $wallet) {
            if ($wallet->syp < -0.001 || $wallet->usd < -0.001) {
                throw ValidationException::withMessages([
                    'amount' => [$message ?? "Insufficient balance in {$wallet->name_en}."],
                ]);
            }
        }

        foreach ($wallets as $wallet) {
            $wallet->save();
        }
    }

    // ── Currency ──────────────────────────────────────────────

    /** Convert within one wallet, at the company rate. */
    public function convertCurrency(Request $request)
    {
        $validated = $request->validate([
            'wallet_id' => ['nullable', 'integer', Rule::exists('wallets', 'id')],
            'amount'    => 'required|numeric|min:0',
            'from'      => 'required|in:USD,SYP',
            'rate'      => 'nullable|numeric|min:1',
        ]);

        $wallet = $this->resolveWallet($validated['wallet_id'] ?? null);
        $this->assertNotArchived($wallet);

        $rate = (float) ($validated['rate'] ?? Wallet::rate());

        if ($validated['amount'] > $wallet->balanceIn($validated['from'])) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient {$validated['from']} balance in {$wallet->name_en}."],
            ]);
        }

        DB::transaction(function () use ($wallet, $validated, $rate) {
            // A conversion done at an ad-hoc rate also updates the company
            // rate, so the books and the converter never disagree.
            Wallet::setRate($rate);

            if ($validated['from'] === 'SYP') {
                $wallet->syp -= $validated['amount'];
                $wallet->usd += $validated['amount'] / $rate;
            } else {
                $wallet->usd -= $validated['amount'];
                $wallet->syp += $validated['amount'] * $rate;
            }

            $wallet->save();
        });

        return response()->json(['data' => $wallet->fresh()]);
    }

    public function updateRate(Request $request)
    {
        $validated = $request->validate(['rate' => 'required|numeric|min:1']);
        Wallet::setRate((float) $validated['rate']);

        return response()->json(['data' => Wallet::main(), 'meta' => ['rate' => Wallet::rate()]]);
    }
}
