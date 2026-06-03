<?php

namespace Database\Seeders;

use App\Models\Webinar;
use Illuminate\Database\Seeder;

class WebinarsSeeder extends Seeder
{
    public function run(): void
    {
        $webinars = [
            [
                'title_ar'       => 'مقدمة في التداول',
                'title_en'       => 'Intro to Trading',
                'description_ar' => 'ندوة مباشرة للمبتدئين تشمل أساسيات أسواق الفوركس والأسهم والعملات الرقمية.',
                'description_en' => 'Live introductory webinar covering Forex, stocks, and crypto fundamentals.',
                'date'           => '2026-06-20',
                'time'           => '19:00:00',
                'duration'       => 60,
                'platform'       => 'zoom',
                'registered'     => 45,
                'capacity'       => 100,
                'status'         => 'upcoming',
            ],
            [
                'title_ar'       => 'تحليل فني متقدم',
                'title_en'       => 'Advanced Technical Analysis',
                'description_ar' => 'جلسة متقدمة في قراءة المخططات وأنماط الشموع اليابانية واستراتيجيات الدخول.',
                'description_en' => 'Advanced session on chart reading, candlestick patterns, and entry strategies.',
                'date'           => '2026-06-25',
                'time'           => '20:00:00',
                'duration'       => 90,
                'platform'       => 'zoom',
                'registered'     => 32,
                'capacity'       => 80,
                'status'         => 'upcoming',
            ],
            [
                'title_ar'       => 'إدارة المخاطر',
                'title_en'       => 'Risk Management Masterclass',
                'description_ar' => 'ماستركلاس شامل في إدارة المخاطر وحماية رأس المال.',
                'description_en' => 'Comprehensive masterclass on risk management and capital protection.',
                'date'           => '2026-05-15',
                'time'           => '19:00:00',
                'duration'       => 60,
                'platform'       => 'youtube',
                'registered'     => 78,
                'capacity'       => 500,
                'status'         => 'completed',
            ],
            [
                'title_ar'       => 'سيكولوجية المتداول',
                'title_en'       => 'Trader Psychology',
                'description_ar' => 'كيفية التغلب على العواطف وبناء عقلية المتداول الناجح.',
                'description_en' => 'How to overcome emotions and build the mindset of a successful trader.',
                'date'           => '2026-07-05',
                'time'           => '20:00:00',
                'duration'       => 75,
                'platform'       => 'google_meet',
                'registered'     => 12,
                'capacity'       => 50,
                'status'         => 'upcoming',
            ],
        ];

        foreach ($webinars as $data) {
            Webinar::updateOrCreate(
                ['date' => $data['date'], 'time' => $data['time']],
                $data
            );
        }
    }
}
