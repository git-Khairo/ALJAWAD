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
                'role'    => 'coach',
                'profile' => [
                    'name'           => 'سعد الجواد',
                    'specialization' => 'Forex',
                    'status'         => 'active',
                ],
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
                'role'    => 'coach',
                'profile' => [
                    'name'           => 'نور العلي',
                    'specialization' => 'Crypto',
                    'status'         => 'active',
                ],
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
                'role'    => 'coach',
                'profile' => [
                    'name'           => 'فهد القحطاني',
                    'specialization' => 'Stocks',
                    'status'         => 'active',
                ],
            ],
        ];

        foreach ($coaches as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['user']['email']],
                $data['user']
            );

            if (! $user->hasRole('coach')) {
                $user->assignRole('coach');
            }

            Coach::firstOrCreate(
                ['user_id' => $user->id],
                array_merge($data['profile'], [
                    'email' => $user->email,
                    'phone' => $user->phone,
                ])
            );
        }
    }
}
