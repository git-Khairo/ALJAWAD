<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientTransaction;
use App\Models\Expense;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Models\WalletTransfer;
use App\Services\ClientTransactionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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

        // Don't let an expense overdraw the wallet it is paid from. The check
        // runs on the locked row, so two expenses racing on one wallet cannot
        // both pass it.
        $deltas = [];
        $this->applyDelta($deltas, $wallet->id, $validated['currency'], -(float) $validated['amount']);

        $expense = DB::transaction(function () use ($deltas, $validated, $wallet) {
            $this->commitDeltas($deltas, "Insufficient {$validated['currency']} balance in {$wallet->name_en}.");

            // The resolved id has to win over a validated null (the form's
            // "Main wallet" option), or the row is saved with no wallet at all
            // and later reads as one whose wallet was deleted.
            return Expense::create(array_merge($validated, ['wallet_id' => $wallet->id]));
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

        DB::transaction(function () use ($expense, $validated) {
            $current = $this->lockExpense($expense);

            $newAmount   = (float) ($validated['amount'] ?? $current->amount);
            $newCurrency = $validated['currency'] ?? $current->currency;
            $oldWallet   = $this->resolveWallet($current->wallet_id);
            $newWallet   = array_key_exists('wallet_id', $validated)
                ? $this->resolveWallet($validated['wallet_id'])
                : $oldWallet;

            if ($newWallet->id !== $oldWallet->id) {
                $this->assertNotArchived($newWallet);
            }

            // Refund the original expense, then charge the edited one. Both
            // sides are applied before the solvency check, because an edit that
            // moves an expense between wallets touches two balances and either
            // could go negative.
            $deltas = [];
            $this->applyDelta($deltas, $oldWallet->id, $current->currency, +(float) $current->amount);
            $this->applyDelta($deltas, $newWallet->id, $newCurrency, -$newAmount);

            $this->commitDeltas($deltas);
            $current->update(array_merge($validated, ['wallet_id' => $newWallet->id]));
        });

        return response()->json(['data' => $expense->fresh()->load('wallet:id,name_ar,name_en')]);
    }

    public function destroyExpense(Expense $expense)
    {
        DB::transaction(function () use ($expense) {
            $current = $this->lockExpense($expense);

            $deltas = [];
            $this->applyDelta($deltas, $current->wallet_id, $current->currency, +(float) $current->amount);

            $this->commitDeltas($deltas);
            $current->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    /** Re-read an expense under a row lock; see lockTransfer() for why. */
    private function lockExpense(Expense $expense): Expense
    {
        $current = Expense::lockForUpdate()->find($expense->getKey());

        if (! $current) {
            throw ValidationException::withMessages([
                'expense' => ['This expense has already been deleted.'],
            ]);
        }

        $this->assertWalletStillExists($current->wallet_id, 'The wallet this expense was paid from has been deleted, so it can no longer be changed.');

        return $current;
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

    // ── Wallet transfers ──────────────────────────────────────

    private const TRANSFER_RELATIONS = [
        'fromWallet:id,name_ar,name_en',
        'toWallet:id,name_ar,name_en',
        'creator:id,name',
    ];

    /**
     * The transfer ledger. Filtering by wallet matches either side, so one
     * wallet's view shows both the money it sent and the money it received.
     *
     * Unpaginated on purpose, like the other finance lists: the page pages it
     * client-side, and transfers between company wallets are low-volume.
     */
    public function transfers(Request $request)
    {
        $query = WalletTransfer::with(self::TRANSFER_RELATIONS);

        if ($request->filled('wallet_id')) {
            $id = $request->wallet_id;
            $query->where(fn ($q) => $q->where('from_wallet_id', $id)->orWhere('to_wallet_id', $id));
        }

        return response()->json([
            'data' => $query->orderByDesc('created_at')->orderByDesc('id')->get(),
        ]);
    }

    /** Move money between two wallets in one currency, and record why. */
    public function transferBetweenWallets(Request $request)
    {
        $validated = $this->validateTransfer($request);

        $from = Wallet::findOrFail($validated['from_wallet_id']);
        $to   = Wallet::findOrFail($validated['to_wallet_id']);
        $this->assertNotArchived($to);

        $deltas = [];
        $this->applyDelta($deltas, $from->id, $validated['currency'], -(float) $validated['amount']);
        $this->applyDelta($deltas, $to->id, $validated['currency'], +(float) $validated['amount']);

        // The balance check runs on locked rows inside the transaction, so two
        // transfers racing out of the same wallet cannot both pass it.
        $transfer = DB::transaction(function () use ($deltas, $validated, $from, $request) {
            $this->commitDeltas($deltas, "Insufficient {$validated['currency']} balance in {$from->name_en}.");

            return WalletTransfer::create($this->transferAttributes($validated) + [
                'created_by' => $request->user()?->id,
            ]);
        });

        return response()->json([
            'data'     => Wallet::orderByDesc('is_main')->orderBy('name_en')->get(),
            'transfer' => $transfer->load(self::TRANSFER_RELATIONS),
        ], 201);
    }

    public function updateTransfer(Request $request, WalletTransfer $transfer)
    {
        $validated = $this->validateTransfer($request);

        DB::transaction(function () use ($transfer, $validated) {
            $current = $this->lockTransfer($transfer);

            // An archived wallet cannot receive new money, so on a transfer
            // into one only the reason may change.
            $moneyChanged = (int) $current->from_wallet_id !== (int) $validated['from_wallet_id']
                || (int) $current->to_wallet_id !== (int) $validated['to_wallet_id']
                || $current->currency !== $validated['currency']
                || abs((float) $current->amount - (float) $validated['amount']) > 0.001;
            if ($moneyChanged) {
                $this->assertNotArchived(Wallet::findOrFail($validated['to_wallet_id']));
            }

            // Rewind the original transfer, then apply the edited one, and
            // check every touched balance as one unit: an edit can involve up
            // to four wallet/currency pairs and any of them could go negative.
            $deltas = [];
            $this->applyDelta($deltas, $current->from_wallet_id, $current->currency, +(float) $current->amount);
            $this->applyDelta($deltas, $current->to_wallet_id, $current->currency, -(float) $current->amount);
            $this->applyDelta($deltas, $validated['from_wallet_id'], $validated['currency'], -(float) $validated['amount']);
            $this->applyDelta($deltas, $validated['to_wallet_id'], $validated['currency'], +(float) $validated['amount']);

            $this->commitDeltas($deltas);
            $current->update($this->transferAttributes($validated));
        });

        return response()->json(['data' => $transfer->fresh()->load(self::TRANSFER_RELATIONS)]);
    }

    /** Undo a transfer: the money goes back to the wallet it came from. */
    public function destroyTransfer(WalletTransfer $transfer)
    {
        DB::transaction(function () use ($transfer) {
            $current = $this->lockTransfer($transfer);

            $deltas = [];
            $this->applyDelta($deltas, $current->from_wallet_id, $current->currency, +(float) $current->amount);
            $this->applyDelta($deltas, $current->to_wallet_id, $current->currency, -(float) $current->amount);

            $this->commitDeltas($deltas, 'This transfer cannot be undone — the receiving wallet has already spent the funds.');
            $current->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    /** Shared validation for creating and editing a transfer. */
    private function validateTransfer(Request $request): array
    {
        $validated = $request->validate([
            'from_wallet_id' => ['required', 'integer', Rule::exists('wallets', 'id')],
            'to_wallet_id'   => ['required', 'integer', 'different:from_wallet_id', Rule::exists('wallets', 'id')],
            'currency'       => 'required|in:USD,SYP',
            // Two decimals, matching the columns. A third one would be rounded
            // separately on the sender, the receiver and the ledger row, and a
            // cent would appear or vanish between them.
            'amount'         => 'required|numeric|min:0.01|decimal:0,2',
            // The reason is the point of the ledger: a transfer nobody can
            // explain later is the problem this table exists to solve.
            'note'           => 'required|string|max:255',
        ]);

        // `different` compares strictly, so 1 and "1" slip past it.
        if ((int) $validated['from_wallet_id'] === (int) $validated['to_wallet_id']) {
            throw ValidationException::withMessages([
                'to_wallet_id' => ['A wallet cannot transfer to itself.'],
            ]);
        }

        return $validated;
    }

    /**
     * Re-read a transfer under a row lock, inside the caller's transaction.
     *
     * The route-bound model was loaded before any lock was taken, so two
     * requests acting on the same transfer (an undo in two tabs, two edits)
     * would otherwise both rewind the amount they loaded, and the second would
     * move the money again after the first had already settled it.
     */
    private function lockTransfer(WalletTransfer $transfer): WalletTransfer
    {
        $current = WalletTransfer::lockForUpdate()->find($transfer->getKey());

        if (! $current) {
            throw ValidationException::withMessages([
                'transfer' => ['This transfer has already been undone.'],
            ]);
        }

        $this->assertTransferWalletsExist($current);

        return $current;
    }

    private function transferAttributes(array $validated): array
    {
        return [
            'from_wallet_id' => $validated['from_wallet_id'],
            'to_wallet_id'   => $validated['to_wallet_id'],
            'currency'       => $validated['currency'],
            'amount'         => $validated['amount'],
            'note'           => trim($validated['note']),
        ];
    }

    /**
     * A transfer whose wallet was deleted cannot be rewound: there is no
     * balance left to put the money back into or take it out of.
     */
    private function assertTransferWalletsExist(WalletTransfer $transfer): void
    {
        if (! $transfer->from_wallet_id || ! $transfer->to_wallet_id) {
            throw ValidationException::withMessages([
                'transfer' => ['One of the wallets in this transfer has been deleted, so it can no longer be changed.'],
            ]);
        }
    }

    // ── Wallet top-ups ────────────────────────────────────────

    /**
     * Every wallet top-up. Unpaginated: the Wallets page pages it client-side,
     * and the Finance overview sums it for revenue, which a row cap would
     * silently undercount.
     */
    public function topups(Request $request)
    {
        $query = WalletTopup::with(['broker:id,name', 'wallet:id,name_ar,name_en', 'creator:id,name']);

        if ($request->filled('wallet_id')) {
            $query->where('wallet_id', $request->wallet_id);
        }

        return response()->json([
            'data' => $query->orderByDesc('created_at')->orderByDesc('id')->get(),
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

        DB::transaction(function () use ($topup, $validated) {
            $current = $this->lockTopup($topup);

            $oldWallet = $this->resolveWallet($current->wallet_id);
            $newWallet = array_key_exists('wallet_id', $validated)
                ? $this->resolveWallet($validated['wallet_id'])
                : $oldWallet;

            // An archived wallet cannot receive new money, so on a top-up into
            // one only the source and note may change.
            $moneyChanged = $newWallet->id !== $oldWallet->id
                || $current->currency !== $validated['currency']
                || abs((float) $current->amount - (float) $validated['amount']) > 0.001;
            if ($moneyChanged) {
                $this->assertNotArchived($newWallet);
            }

            // Rewind the original top-up and apply the edited one. If the money
            // has since been spent, the rewind pushes a wallet negative — reject.
            $deltas = [];
            $this->applyDelta($deltas, $oldWallet->id, $current->currency, -(float) $current->amount);
            $this->applyDelta($deltas, $newWallet->id, $validated['currency'], +(float) $validated['amount']);

            $this->commitDeltas($deltas, 'This change would overdraw the wallet — the funds have already been spent.');
            $current->update($this->topupAttributes($validated) + ['wallet_id' => $newWallet->id]);
        });

        return response()->json([
            'data' => $topup->fresh()->load(['broker:id,name', 'wallet:id,name_ar,name_en']),
        ]);
    }

    public function destroyTopup(WalletTopup $topup)
    {
        // Deleting a top-up takes the money back out of the wallet — refuse if
        // that would leave the balance negative.
        DB::transaction(function () use ($topup) {
            $current = $this->lockTopup($topup);

            $deltas = [];
            $this->applyDelta($deltas, $current->wallet_id, $current->currency, -(float) $current->amount);

            $this->commitDeltas($deltas, 'This top-up cannot be deleted — the funds have already been spent.');
            $current->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    /** Re-read a top-up under a row lock; see lockTransfer() for why. */
    private function lockTopup(WalletTopup $topup): WalletTopup
    {
        $current = WalletTopup::lockForUpdate()->find($topup->getKey());

        if (! $current) {
            throw ValidationException::withMessages([
                'topup' => ['This top-up has already been deleted.'],
            ]);
        }

        $this->assertWalletStillExists($current->wallet_id, 'The wallet this top-up went into has been deleted, so it can no longer be changed.');

        return $current;
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

    /**
     * A top-up or expense whose wallet was deleted has a null wallet_id, and
     * cannot be re-settled. Falling back to the main wallet, as resolveWallet()
     * would, moves main's money for something that never touched it.
     */
    private function assertWalletStillExists(?int $walletId, string $message): void
    {
        if (! $walletId) {
            throw ValidationException::withMessages(['wallet_id' => [$message]]);
        }
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
        // Lock every touched wallet in one query, in id order, so two movements
        // in opposite directions (A→B and B→A) cannot each hold one lock while
        // waiting on the other.
        $ids = collect(array_keys($deltas))->map(fn ($key) => (int) explode(':', $key)[0])->unique()->sort()->values();
        $wallets = Wallet::lockForUpdate()->whereIn('id', $ids)->orderBy('id')->get()->keyBy('id');

        foreach ($deltas as $key => $delta) {
            [$walletId, $column] = explode(':', $key);
            $wallet = $wallets->get((int) $walletId)
                ?? throw (new ModelNotFoundException)->setModel(Wallet::class, [$walletId]);
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

        $rate   = (float) ($validated['rate'] ?? Wallet::rate());
        $amount = (float) $validated['amount'];
        $to     = $validated['from'] === 'SYP' ? 'USD' : 'SYP';

        // Both legs as deltas on the one wallet, so the solvency check and the
        // write happen on the locked row. Saving balances read before the lock
        // would overwrite any movement that committed in between.
        $deltas = [];
        $this->applyDelta($deltas, $wallet->id, $validated['from'], -$amount);
        $this->applyDelta($deltas, $wallet->id, $to, $validated['from'] === 'SYP' ? $amount / $rate : $amount * $rate);

        DB::transaction(function () use ($deltas, $validated, $wallet, $rate) {
            $this->commitDeltas($deltas, "Insufficient {$validated['from']} balance in {$wallet->name_en}.");

            // A conversion done at an ad-hoc rate also updates the company
            // rate, so the books and the converter never disagree.
            Wallet::setRate($rate);
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
