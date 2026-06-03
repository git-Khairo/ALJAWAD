<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientsAndLeadsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Clients ───────────────────────────────────────────────────────
        $clients = [
            ['name' => 'خالد المطيري',  'email' => 'khalid@email.com', 'phone' => '+966551234567', 'type' => 'client', 'status' => 'active',   'source' => null,           'notes' => null,                    'tags' => ['VIP', 'Forex'], 'telegram_chat_id' => '@khalid_mutairi', 'courses_count' => 2, 'last_contact' => '2026-05-28'],
            ['name' => 'نور سالم',       'email' => 'noor@email.com',   'phone' => '+966502345678', 'type' => 'client', 'status' => 'active',   'source' => null,           'notes' => null,                    'tags' => ['New'],          'telegram_chat_id' => '@noor_salem_tr',  'courses_count' => 1, 'last_contact' => '2026-06-01'],
            ['name' => 'فاطمة الزهراء', 'email' => 'fatima@email.com', 'phone' => '+966543456789', 'type' => 'client', 'status' => 'inactive', 'source' => null,           'notes' => 'Paused due to travel.', 'tags' => [],               'telegram_chat_id' => null,              'courses_count' => 1, 'last_contact' => '2026-02-10'],
            ['name' => 'أحمد الرشيدي',  'email' => 'ahmed@email.com',  'phone' => '+966564567890', 'type' => 'client', 'status' => 'active',   'source' => null,           'notes' => null,                    'tags' => ['Crypto'],       'telegram_chat_id' => '@ahmed_rashidi',  'courses_count' => 3, 'last_contact' => '2026-05-30'],
            ['name' => 'منى الحربي',     'email' => 'mona@email.com',   'phone' => '+966595678901', 'type' => 'client', 'status' => 'active',   'source' => null,           'notes' => 'Prefers evenings.',     'tags' => ['VIP'],          'telegram_chat_id' => '@mona_harbi_fx',  'courses_count' => 2, 'last_contact' => '2026-05-25'],
            ['name' => 'ريم الدوسري',   'email' => 'reem@email.com',   'phone' => '+966577890123', 'type' => 'client', 'status' => 'active',   'source' => null,           'notes' => null,                    'tags' => ['Stocks'],       'telegram_chat_id' => '@reem_dosari',    'courses_count' => 1, 'last_contact' => '2026-06-02'],
        ];

        // ── Leads ─────────────────────────────────────────────────────────
        $leads = [
            ['name' => 'عمر اليامي',     'email' => 'omar@email.com',   'phone' => '+966558901234', 'type' => 'lead', 'status' => 'active', 'source' => 'Social Media', 'notes' => null,                         'tags' => [],           'telegram_chat_id' => null,               'lead_status' => 'new',            'last_contact' => null],
            ['name' => 'لجين الفرج',     'email' => 'lujain@email.com', 'phone' => '+966509012345', 'type' => 'lead', 'status' => 'active', 'source' => 'Website',      'notes' => 'Called once, no answer.',    'tags' => [],           'telegram_chat_id' => '@lujain_faraj',    'lead_status' => 'contacted',      'last_contact' => '2026-05-26'],
            ['name' => 'بدر القريشي',    'email' => 'bader@email.com',  'phone' => '+966540123456', 'type' => 'lead', 'status' => 'active', 'source' => 'Referral',     'notes' => 'Interested in Forex.',       'tags' => [],           'telegram_chat_id' => '@bader_q',         'lead_status' => 'interested',     'last_contact' => '2026-05-29'],
            ['name' => 'حصة آل سعود',    'email' => 'hessa@email.com',  'phone' => '+966561234560', 'type' => 'lead', 'status' => 'active', 'source' => 'Social Media', 'notes' => null,                         'tags' => [],           'telegram_chat_id' => null,               'lead_status' => 'new',            'last_contact' => null],
            ['name' => 'وليد الزهراني', 'email' => 'walid@email.com',  'phone' => '+966592345671', 'type' => 'lead', 'status' => 'active', 'source' => 'Referral',     'notes' => 'Ready to enroll next month.','tags' => [],           'telegram_chat_id' => '@walid_zahrani',   'lead_status' => 'qualified',      'last_contact' => '2026-06-02'],
        ];

        foreach (array_merge($clients, $leads) as $data) {
            Client::firstOrCreate(
                ['email' => $data['email']],
                $data
            );
        }
    }
}
