<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ClientsAndLeadsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Clients ───────────────────────────────────────────────────────
        $clients = [
            [
                'user' => [
                    'name'             => 'خالد المطيري',
                    'email'            => 'khalid@email.com',
                    'phone'            => '+966551234567',
                    'telegram_chat_id' => '@khalid_mutairi',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'          => 'client',
                    'status'        => 'active',
                    'tags'          => ['VIP', 'Forex'],
                    'courses_count' => 2,
                    'last_contact'  => '2026-05-28',
                ],
            ],
            [
                'user' => [
                    'name'             => 'نور سالم',
                    'email'            => 'noor@email.com',
                    'phone'            => '+966502345678',
                    'telegram_chat_id' => '@noor_salem_tr',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'          => 'client',
                    'status'        => 'active',
                    'tags'          => ['New'],
                    'courses_count' => 1,
                    'last_contact'  => '2026-06-01',
                ],
            ],
            [
                'user' => [
                    'name'             => 'فاطمة الزهراء',
                    'email'            => 'fatima@email.com',
                    'phone'            => '+966543456789',
                    'telegram_chat_id' => null,
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'          => 'client',
                    'status'        => 'inactive',
                    'tags'          => [],
                    'courses_count' => 1,
                    'last_contact'  => '2026-02-10',
                ],
            ],
            [
                'user' => [
                    'name'             => 'أحمد الرشيدي',
                    'email'            => 'ahmed@email.com',
                    'phone'            => '+966564567890',
                    'telegram_chat_id' => '@ahmed_rashidi',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'          => 'client',
                    'status'        => 'active',
                    'tags'          => ['Crypto'],
                    'courses_count' => 3,
                    'last_contact'  => '2026-05-30',
                ],
            ],
            [
                'user' => [
                    'name'             => 'منى الحربي',
                    'email'            => 'mona@email.com',
                    'phone'            => '+966595678901',
                    'telegram_chat_id' => '@mona_harbi_fx',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'          => 'client',
                    'status'        => 'active',
                    'tags'          => ['VIP'],
                    'courses_count' => 2,
                    'last_contact'  => '2026-05-25',
                    'source'        => 'Referral',
                ],
            ],
            [
                'user' => [
                    'name'             => 'ريم الدوسري',
                    'email'            => 'reem@email.com',
                    'phone'            => '+966577890123',
                    'telegram_chat_id' => '@reem_dosari',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'          => 'client',
                    'status'        => 'active',
                    'tags'          => ['Stocks'],
                    'courses_count' => 1,
                    'last_contact'  => '2026-06-02',
                ],
            ],
        ];

        // ── Leads ─────────────────────────────────────────────────────────
        $leads = [
            [
                'user' => [
                    'name'             => 'عمر اليامي',
                    'email'            => 'omar@email.com',
                    'phone'            => '+966558901234',
                    'telegram_chat_id' => null,
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'        => 'lead',
                    'source'      => 'Social Media',
                    'lead_status' => 'new',
                    'tags'        => [],
                ],
            ],
            [
                'user' => [
                    'name'             => 'لجين الفرج',
                    'email'            => 'lujain@email.com',
                    'phone'            => '+966509012345',
                    'telegram_chat_id' => '@lujain_faraj',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'        => 'lead',
                    'source'      => 'Website',
                    'lead_status' => 'contacted',
                    'tags'        => [],
                    'last_contact'=> '2026-05-26',
                ],
            ],
            [
                'user' => [
                    'name'             => 'بدر القريشي',
                    'email'            => 'bader@email.com',
                    'phone'            => '+966540123456',
                    'telegram_chat_id' => '@bader_q',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'        => 'lead',
                    'source'      => 'Referral',
                    'lead_status' => 'interested',
                    'tags'        => [],
                    'last_contact'=> '2026-05-29',
                ],
            ],
            [
                'user' => [
                    'name'             => 'حصة آل سعود',
                    'email'            => 'hessa@email.com',
                    'phone'            => '+966561234560',
                    'telegram_chat_id' => null,
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'        => 'lead',
                    'source'      => 'Social Media',
                    'lead_status' => 'new',
                    'tags'        => [],
                ],
            ],
            [
                'user' => [
                    'name'             => 'وليد الزهراني',
                    'email'            => 'walid@email.com',
                    'phone'            => '+966592345671',
                    'telegram_chat_id' => '@walid_zahrani',
                    'user_type'        => 'client',
                    'is_active'        => true,
                ],
                'crm' => [
                    'type'        => 'lead',
                    'source'      => 'Referral',
                    'lead_status' => 'qualified',
                    'tags'        => [],
                    'last_contact'=> '2026-06-02',
                ],
            ],
        ];

        foreach (array_merge($clients, $leads) as $entry) {
            $user = User::firstOrCreate(
                ['email' => $entry['user']['email']],
                array_merge($entry['user'], [
                    'password' => bcrypt(Str::random(16)),
                ])
            );

            Client::firstOrCreate(
                ['user_id' => $user->id],
                $entry['crm']
            );
        }
    }
}
