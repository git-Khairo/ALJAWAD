<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles & permissions (coaches only — must run first)
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. KPI definitions
        $this->call(KpiDefinitionsSeeder::class);

        // 2b. Brokers (the two the company works with) — IBs + trading accounts reference these
        $this->call(BrokersSeeder::class);

        // 3. Default super-admin account
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@aljawad.com'],
            [
                'name'            => 'Super Admin',
                'phone'           => null,
                'password'        => bcrypt('password'),
                'password_set_at' => now(),
                'user_type'       => 'coach',
                'is_active'       => true,
            ]
        );
        $adminUser->assignRole('admin');

        Coach::firstOrCreate(
            ['user_id' => $adminUser->id],
            ['status' => 'active']
        );


        // 6. Course Plans & Features
        $this->call(CoursePlansSeeder::class);
    }
}
