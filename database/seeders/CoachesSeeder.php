<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Database\Seeder;

class CoachesSeeder extends Seeder
{
    public function run(): void
    {
        $coaches = [
            [
                'user' => [
                    'name'      => 'Saad AlJawad',
                    'email'     => 'saad@aljawad.com',
                    'phone'     => '+966500000001',
                    'password'  => bcrypt('password'),
                    'user_type' => 'coach',
                    'is_active' => true,
                ],
                'role' => 'coach',
            ],
            [
                'user' => [
                    'name'      => 'Nour Al-Ali',
                    'email'     => 'nour@aljawad.com',
                    'phone'     => '+966500000002',
                    'password'  => bcrypt('password'),
                    'user_type' => 'coach',
                    'is_active' => true,
                ],
                'role' => 'coach',
            ],
            [
                'user' => [
                    'name'      => 'Fahad Al-Qahtani',
                    'email'     => 'fahad@aljawad.com',
                    'phone'     => '+966500000003',
                    'password'  => bcrypt('password'),
                    'user_type' => 'coach',
                    'is_active' => true,
                ],
                'role' => 'coach',
            ],
        ];

        foreach ($coaches as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['user']['email']],
                array_merge($data['user'], [
                    'phone'           => User::normalizePhone($data['user']['phone']),
                    'password_set_at' => now(),
                ])
            );

            if (! $user->hasRole($data['role'])) {
                $user->assignRole($data['role']);
            }

            Coach::firstOrCreate(
                ['user_id' => $user->id],
                ['status' => 'active']
            );
        }
    }
}
