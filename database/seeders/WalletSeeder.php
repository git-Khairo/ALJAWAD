<?php

namespace Database\Seeders;

use App\Models\Wallet;
use Illuminate\Database\Seeder;

class WalletSeeder extends Seeder
{
    public function run(): void
    {
        Wallet::updateOrCreate(
            ['key' => 'main'],
            ['syp' => 18500000, 'usd' => 32000, 'rate' => 14200]
        );
    }
}
