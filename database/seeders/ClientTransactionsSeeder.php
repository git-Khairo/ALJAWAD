<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientTransaction;
use Illuminate\Database\Seeder;

class ClientTransactionsSeeder extends Seeder
{
    public function run(): void
    {
        // Transactions are now linked to a CRM client. Cycle the demo rows across
        // the seeded clients so each carries a real client_id + name.
        $clients = Client::clients()->with('user')->orderBy('id')->get();
        if ($clients->isEmpty()) {
            return;
        }

        // direction: deposit | withdrawal | wallet_charge | close_debt
        // type (method): cash | usdt | sham_cash · place: damascus | tartus · USD only
        $transactions = [
            ['direction' => 'deposit',       'type' => 'cash',      'place' => 'damascus', 'amount' => 2500, 'commission' => 25,   'status' => 'completed', 'notes' => null,                   'created_at' => '2026-01-15 10:00:00'],
            ['direction' => 'deposit',       'type' => 'usdt',      'place' => 'damascus', 'amount' => 1400, 'commission' => null, 'status' => 'completed', 'notes' => 'USDT TRC20',           'created_at' => '2026-01-20 14:00:00'],
            ['direction' => 'deposit',       'type' => 'sham_cash', 'place' => 'tartus',   'amount' => 800,  'commission' => 10,   'status' => 'completed', 'notes' => null,                   'created_at' => '2026-02-05 09:00:00'],
            ['direction' => 'wallet_charge', 'type' => 'cash',      'place' => 'damascus', 'amount' => 350,  'commission' => null, 'status' => 'completed', 'notes' => 'Wallet top-up',        'created_at' => '2026-02-18 11:00:00'],
            ['direction' => 'withdrawal',    'type' => 'cash',      'place' => 'damascus', 'amount' => 500,  'commission' => 5,    'status' => 'completed', 'notes' => 'Partial withdrawal',   'created_at' => '2026-03-10 16:00:00'],
            ['direction' => 'deposit',       'type' => 'sham_cash', 'place' => 'tartus',   'amount' => 1200, 'commission' => null, 'status' => 'completed', 'notes' => null,                   'created_at' => '2026-03-15 13:00:00'],
            ['direction' => 'close_debt',    'type' => 'usdt',      'place' => 'damascus', 'amount' => 600,  'commission' => null, 'status' => 'completed', 'notes' => 'Debt settled',         'created_at' => '2026-04-02 10:00:00'],
            ['direction' => 'deposit',       'type' => 'usdt',      'place' => 'tartus',   'amount' => 900,  'commission' => 15,   'status' => 'completed', 'notes' => null,                   'created_at' => '2026-04-20 08:00:00'],
            ['direction' => 'deposit',       'type' => 'cash',      'place' => 'damascus', 'amount' => 1000, 'commission' => null, 'status' => 'pending',   'notes' => null,                   'created_at' => '2026-05-05 10:00:00'],
            ['direction' => 'withdrawal',    'type' => 'cash',      'place' => 'tartus',   'amount' => 200,  'commission' => null, 'status' => 'completed', 'notes' => null,                   'created_at' => '2026-05-12 15:00:00'],
            ['direction' => 'deposit',       'type' => 'sham_cash', 'place' => 'damascus', 'amount' => 2100, 'commission' => 20,   'status' => 'completed', 'notes' => null,                   'created_at' => '2026-05-25 09:00:00'],
            ['direction' => 'deposit',       'type' => 'usdt',      'place' => 'tartus',   'amount' => 450,  'commission' => null, 'status' => 'failed',    'notes' => 'Transaction rejected', 'created_at' => '2026-06-01 08:00:00'],
            ['direction' => 'deposit',       'type' => 'cash',      'place' => 'damascus', 'amount' => 750,  'commission' => null, 'status' => 'pending',   'notes' => null,                   'created_at' => '2026-06-03 11:00:00'],
        ];

        foreach ($transactions as $i => $tx) {
            $client = $clients[$i % $clients->count()];
            ClientTransaction::create(array_merge($tx, [
                'currency'    => 'USD',
                'client_id'   => $client->id,
                'client_name' => $client->user?->name ?? '',
            ]));
        }
    }
}
