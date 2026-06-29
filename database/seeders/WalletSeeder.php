<?php

namespace Database\Seeders;

use App\Models\Wallet;
use App\Models\WalletTopup;
use Illuminate\Database\Seeder;

class WalletSeeder extends Seeder
{
    public function run(): void
    {
        Wallet::updateOrCreate(
            ['key' => 'main'],
            ['syp' => 18500000, 'usd' => 32000, 'rate' => 14200]
        );

        // A few top-ups for the Wallets ledger demo.
        if (WalletTopup::count() === 0) {
            foreach ([
                ['currency' => 'USD', 'amount' => 20000,    'note' => 'Opening balance',     'created_at' => '2026-01-02 09:00:00'],
                ['currency' => 'SYP', 'amount' => 15000000, 'note' => 'Cash injection',      'created_at' => '2026-02-10 10:00:00'],
                ['currency' => 'USD', 'amount' => 12000,    'note' => 'Partner contribution','created_at' => '2026-04-15 12:00:00'],
                ['currency' => 'SYP', 'amount' => 3500000,  'note' => null,                  'created_at' => '2026-05-20 11:00:00'],
            ] as $row) {
                WalletTopup::create($row);
            }
        }
    }
}
