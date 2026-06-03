<?php

namespace Database\Seeders;

use App\Models\MarketingPlan;
use App\Models\MarketingPlanItem;
use Illuminate\Database\Seeder;

class MarketingPlansSeeder extends Seeder
{
    public function run(): void
    {
        $plan1 = MarketingPlan::create([
            'name_ar' => 'خطة التسويق — يونيو 2026',
            'name_en' => 'Marketing Plan — June 2026',
            'month'   => 6,
            'year'    => 2026,
            'goal_ar' => 'زيادة المتابعين بنسبة 20% وتوليد 50 عميل محتمل جديد عبر السوشيال ميديا',
            'goal_en' => 'Grow social media followers 20% and generate 50 new leads',
            'status'  => 'active',
        ]);

        $items = [
            ['type' => 'reel',     'platform' => 'instagram', 'title_ar' => 'تقنيات التداول اليومي',       'title_en' => 'Daily Trading Tips',              'date' => '2026-06-05', 'time' => '14:00', 'status' => 'published'],
            ['type' => 'post',     'platform' => 'instagram', 'title_ar' => 'نتائج طلابنا هذا الشهر',     'title_en' => 'Our Students Results',            'date' => '2026-06-07', 'time' => '12:00', 'status' => 'published'],
            ['type' => 'story',    'platform' => 'instagram', 'title_ar' => 'استطلاع: هل تعرف الفوركس؟', 'title_en' => 'Poll: Do you know Forex?',         'date' => '2026-06-08', 'time' => '18:00', 'status' => 'published'],
            ['type' => 'reel',     'platform' => 'tiktok',    'title_ar' => 'كيف تقرأ الشمعة اليابانية؟','title_en' => 'How to Read Candlestick Charts',  'date' => '2026-06-10', 'time' => '20:00', 'status' => 'scheduled'],
            ['type' => 'live',     'platform' => 'instagram', 'title_ar' => 'جلسة تحليل الأسواق',         'title_en' => 'Weekly Market Analysis Session',  'date' => '2026-06-12', 'time' => '20:00', 'status' => 'scheduled'],
            ['type' => 'carousel', 'platform' => 'instagram', 'title_ar' => '5 أخطاء يرتكبها المبتدئ',   'title_en' => '5 Mistakes Beginner Traders Make','date' => '2026-06-15', 'time' => '13:00', 'status' => 'draft'],
            ['type' => 'reel',     'platform' => 'tiktok',    'title_ar' => 'ما هو الذهب الرقمي؟',       'title_en' => 'What is Digital Gold?',           'date' => '2026-06-18', 'time' => '19:00', 'status' => 'draft'],
            ['type' => 'post',     'platform' => 'instagram', 'title_ar' => 'اقتباس تحفيزي أسبوعي',     'title_en' => 'Weekly Motivational Quote',       'date' => '2026-06-20', 'time' => '10:00', 'status' => 'draft'],
        ];

        foreach ($items as $item) {
            $plan1->items()->create($item);
        }

        MarketingPlan::create([
            'name_ar' => 'خطة التسويق — يوليو 2026',
            'name_en' => 'Marketing Plan — July 2026',
            'month'   => 7,
            'year'    => 2026,
            'goal_ar' => 'إطلاق حملة الكريبتو والوصول لـ 100 عميل محتمل جديد',
            'goal_en' => 'Launch crypto campaign and reach 100 new leads',
            'status'  => 'draft',
        ]);
    }
}
