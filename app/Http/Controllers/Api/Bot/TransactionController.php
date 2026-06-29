<?php

namespace App\Http\Controllers\Api\Bot;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ClientTransactionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function __construct(private ClientTransactionService $transactions) {}

    /**
     * POST /api/bot/transactions
     * Insert a deposit/withdrawal by phone. Bot-entered payments default to
     * "completed" so a first deposit activates the client. 422 if the phone
     * matches no client.
     */
    public function store(Request $request)
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

        $validated['status'] = $validated['status'] ?? 'completed';

        $result = $this->transactions->recordByPhone($validated);

        return response()->json([
            'ok'          => true,
            'transaction' => $result['transaction'],
            'client'      => [
                'id'    => $result['client']->id,
                'name'  => $result['client']->user?->name,
                'stage' => $result['client']->stage,
            ],
            'activated'   => $result['activated'],
        ], 201);
    }

    /**
     * GET /api/bot/clients/{phone}
     * Lets the bot verify a phone resolves to a client before inserting.
     */
    public function lookup(string $phone)
    {
        $client = $this->transactions->resolveClient(User::normalizePhone($phone));

        if (! $client) {
            return response()->json(['ok' => true, 'found' => false]);
        }

        return response()->json([
            'ok'     => true,
            'found'  => true,
            'client' => [
                'id'    => $client->id,
                'name'  => $client->user?->name,
                'stage' => $client->stage,
            ],
        ]);
    }
}
