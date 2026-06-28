<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientTransaction;
use App\Models\Expense;
use App\Models\Wallet;
use Illuminate\Http\Request;

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

    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'client_name' => 'required|string',
            'client_id'   => 'nullable|exists:clients,id',
            'type'        => 'required|in:cash,sham_cash,crypto,bank,wise',
            'direction'   => 'required|in:deposit,withdrawal',
            'amount'      => 'required|numeric|min:0',
            'currency'    => 'required|in:USD,SYP',
            'status'      => 'nullable|in:completed,pending,failed',
            'notes'       => 'nullable|string',
        ]);

        $tx = ClientTransaction::create($validated);
        $this->maybeActivateClient($tx);

        return response()->json(['data' => $tx], 201);
    }

    public function updateTransaction(Request $request, ClientTransaction $tx)
    {
        $validated = $request->validate([
            'status'    => 'sometimes|in:completed,pending,failed',
            'client_id' => 'nullable|exists:clients,id',
            'notes'     => 'nullable|string',
        ]);

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

        $expense = Expense::create($validated);

        // Deduct from wallet
        $wallet = Wallet::main();
        if ($validated['currency'] === 'SYP') {
            $wallet->decrement('syp', $validated['amount']);
        } else {
            $wallet->decrement('usd', $validated['amount']);
        }

        return response()->json(['data' => $expense], 201);
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

    public function topUpWallet(Request $request)
    {
        $validated = $request->validate([
            'currency' => 'required|in:USD,SYP',
            'amount'   => 'required|numeric|min:0',
        ]);

        $wallet = Wallet::main();
        if ($validated['currency'] === 'SYP') {
            $wallet->increment('syp', $validated['amount']);
        } else {
            $wallet->increment('usd', $validated['amount']);
        }

        return response()->json(['data' => $wallet->fresh()]);
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
