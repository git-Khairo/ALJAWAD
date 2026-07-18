<?php

namespace Database\Seeders;

use App\Models\Broker;
use Illuminate\Database\Seeder;

class BrokersSeeder extends Seeder
{
    /**
     * The company works with two brokers. Names are placeholders until the
     * user provides the real ones — rename in the admin (or re-seed) later.
     * Idempotent: keyed on `code` so re-running never duplicates.
     */
    public function run(): void
    {
        $brokers = [
            ['code' => 'broker_a', 'name' => 'Tickmill'],
            ['code' => 'broker_b', 'name' => 'Moneta Markets'],
        ];

        foreach ($brokers as $broker) {
            Broker::updateOrCreate(
                ['code' => $broker['code']],
                ['name' => $broker['name'], 'is_active' => true],
            );
        }
    }
}
