<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ClientTransactionService
{
    /**
     * Record a deposit/withdrawal against the client matched by phone number.
     * Rejects (422) if no client matches. A completed *deposit* activates an
     * inactive client (their first money in). Used by both the dashboard form
     * and the Telegram bot endpoint so the behaviour is identical.
     *
     * @return array{transaction: ClientTransaction, client: Client, activated: bool}
     */
    public function recordByPhone(array $data): array
    {
        $client = $this->resolveClient(User::normalizePhone($data['phone'] ?? null));

        if (! $client) {
            throw ValidationException::withMessages([
                'phone' => ['No client found with this phone number.'],
            ]);
        }

        $tx = ClientTransaction::create([
            'client_id'   => $client->id,
            'client_name' => $client->user?->name ?? '',
            'direction'   => $data['direction'],
            'type'        => $data['method'] ?? $data['type'] ?? 'cash', // "method" stored in the type column
            'place'       => $data['place'] ?? null,
            'amount'      => $data['amount'],
            'commission'  => $data['commission'] ?? null,
            'currency'    => config('transactions.currency', 'USD'),     // client txns are USD only
            'status'      => $data['status'] ?? 'completed',
            'notes'       => $data['notes']  ?? null,
        ]);

        // Only an inbound payment (config: just "deposit") activates an inactive client.
        $activated = false;
        if (in_array($tx->direction, config('transactions.inbound', ['deposit']), true)
            && $tx->status === 'completed'
            && ! $client->isActive()) {
            $client->activate();
            $activated = true;
        }

        return ['transaction' => $tx, 'client' => $client, 'activated' => $activated];
    }

    /** The CRM client whose user has this (already-normalized) phone, or null. */
    public function resolveClient(?string $normalizedPhone): ?Client
    {
        if (! $normalizedPhone) {
            return null;
        }

        return User::where('phone', $normalizedPhone)->first()?->client;
    }
}
