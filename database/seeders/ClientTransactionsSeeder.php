<?php

namespace Database\Seeders;

use App\Models\ClientTransaction;
use Illuminate\Database\Seeder;

class ClientTransactionsSeeder extends Seeder
{
    public function run(): void
    {
        $transactions = [
            ['client_name' => 'Khalid Al-Mutairi',  'type' => 'cash',      'direction' => 'deposit',    'amount' => 2500,    'currency' => 'USD', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-01-15 10:00:00'],
            ['client_name' => 'Noor Salem',           'type' => 'sham_cash', 'direction' => 'deposit',    'amount' => 1400000, 'currency' => 'SYP', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-01-20 14:00:00'],
            ['client_name' => 'Ahmed Al-Rashidi',    'type' => 'crypto',    'direction' => 'deposit',    'amount' => 800,     'currency' => 'USD', 'status' => 'completed', 'notes' => 'USDT TRC20',            'created_at' => '2026-02-05 09:00:00'],
            ['client_name' => 'Mona Al-Harbi',       'type' => 'bank',      'direction' => 'deposit',    'amount' => 3500,    'currency' => 'USD', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-02-18 11:00:00'],
            ['client_name' => 'Khalid Al-Mutairi',   'type' => 'cash',      'direction' => 'withdrawal', 'amount' => 500,     'currency' => 'USD', 'status' => 'completed', 'notes' => 'Partial withdrawal',    'created_at' => '2026-03-10 16:00:00'],
            ['client_name' => 'Fatima Al-Zahra',     'type' => 'sham_cash', 'direction' => 'deposit',    'amount' => 850000,  'currency' => 'SYP', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-03-15 13:00:00'],
            ['client_name' => 'Reem Al-Dosari',      'type' => 'wise',      'direction' => 'deposit',    'amount' => 1200,    'currency' => 'USD', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-04-02 10:00:00'],
            ['client_name' => 'Tariq Al-Shammari',   'type' => 'crypto',    'direction' => 'deposit',    'amount' => 600,     'currency' => 'USD', 'status' => 'completed', 'notes' => 'BTC',                   'created_at' => '2026-04-20 08:00:00'],
            ['client_name' => 'Omar Al-Yami',         'type' => 'cash',      'direction' => 'deposit',    'amount' => 1000,    'currency' => 'USD', 'status' => 'pending',   'notes' => null,                    'created_at' => '2026-05-05 10:00:00'],
            ['client_name' => 'Ahmed Al-Rashidi',    'type' => 'cash',      'direction' => 'withdrawal', 'amount' => 200,     'currency' => 'USD', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-05-12 15:00:00'],
            ['client_name' => 'Mona Al-Harbi',       'type' => 'sham_cash', 'direction' => 'deposit',    'amount' => 2100000, 'currency' => 'SYP', 'status' => 'completed', 'notes' => null,                    'created_at' => '2026-05-25 09:00:00'],
            ['client_name' => 'Bader Al-Quraishi',   'type' => 'crypto',    'direction' => 'deposit',    'amount' => 450,     'currency' => 'USD', 'status' => 'failed',    'notes' => 'Transaction rejected',  'created_at' => '2026-06-01 08:00:00'],
            ['client_name' => 'Noor Salem',           'type' => 'wise',      'direction' => 'deposit',    'amount' => 750,     'currency' => 'USD', 'status' => 'pending',   'notes' => null,                    'created_at' => '2026-06-03 11:00:00'],
        ];

        foreach ($transactions as $tx) {
            ClientTransaction::create($tx);
        }
    }
}
