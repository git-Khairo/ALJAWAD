<?php

namespace Database\Seeders;

use App\Models\Campaign;
use Illuminate\Database\Seeder;

class CampaignsSeeder extends Seeder
{
    public function run(): void
    {
        $campaigns = [
            [
                'name_ar'     => 'حملة إطلاق المنصة',
                'name_en'     => 'Platform Launch Campaign',
                'status'      => 'active',
                'platform'    => 'instagram',
                'budget'      => 25000,
                'spent'       => 14500,
                'leads'       => 534,
                'conversions' => 89,
                'start_date'  => '2026-01-01',
                'end_date'    => '2026-03-31',
            ],
            [
                'name_ar'     => 'دورة التحليل الفني المجانية',
                'name_en'     => 'Free TA Course Campaign',
                'status'      => 'completed',
                'platform'    => 'tiktok',
                'budget'      => 8000,
                'spent'       => 7800,
                'leads'       => 1256,
                'conversions' => 432,
                'start_date'  => '2026-02-01',
                'end_date'    => '2026-03-15',
            ],
            [
                'name_ar'     => 'حملة رمضان',
                'name_en'     => 'Ramadan Trading Campaign',
                'status'      => 'draft',
                'platform'    => 'multi',
                'budget'      => 30000,
                'spent'       => 0,
                'leads'       => 0,
                'conversions' => 0,
                'start_date'  => '2026-03-01',
                'end_date'    => '2026-03-30',
            ],
            [
                'name_ar'     => 'برنامج الإحالة',
                'name_en'     => 'Trader Referral Program',
                'status'      => 'active',
                'platform'    => 'instagram',
                'budget'      => 10000,
                'spent'       => 6200,
                'leads'       => 289,
                'conversions' => 128,
                'start_date'  => '2026-04-01',
                'end_date'    => '2026-12-31',
            ],
            [
                'name_ar'     => 'حملة الكريبتو',
                'name_en'     => 'Crypto Trading Campaign',
                'status'      => 'active',
                'platform'    => 'youtube',
                'budget'      => 15000,
                'spent'       => 4200,
                'leads'       => 178,
                'conversions' => 34,
                'start_date'  => '2026-05-01',
                'end_date'    => '2026-07-31',
            ],
        ];

        foreach ($campaigns as $data) {
            Campaign::firstOrCreate(
                ['name_en' => $data['name_en']],
                $data
            );
        }
    }
}
