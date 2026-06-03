<?php

namespace Database\Seeders;

use App\Models\MediaLibraryItem;
use Illuminate\Database\Seeder;

class MediaLibrarySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['category' => 'idea',        'title' => 'سلسلة: سيكولوجية التداول',          'notes' => 'سلسلة من 5 أجزاء: الخوف / الجشع / الانضباط / الصبر / العقلية الرابحة', 'status' => 'inbox',       'tags' => ['series', 'psychology']],
            ['category' => 'video_draft', 'title' => 'ريل: شرح وقف الخسارة على MT4',      'notes' => 'تصوير شاشة الموبايل. مدة: 30-45 ثانية',                                  'status' => 'in_progress', 'tags' => ['tutorial', 'mt4']],
            ['category' => 'reference',   'title' => 'مثال: حساب @forexguru إنستغرام',     'notes' => 'أسلوب التصميم والألوان جيد - مزيج الأبيض والأخضر مع فونت واضح',         'status' => 'inbox',       'tags' => ['design', 'inspiration']],
            ['category' => 'image',       'title' => 'موود بورد: تصميم الريلز الجديد',    'notes' => 'ألوان: أزرق غامق + ذهبي. فونت: Cairo Bold. خلفية سوداء',                 'status' => 'in_progress', 'tags' => ['design', 'brand']],
            ['category' => 'idea',        'title' => 'فكرة: مقارنة الفوركس والكريبتو',   'notes' => 'منشور كاروسيل يوضح الفروقات في المخاطرة والعوائد والسيولة',               'status' => 'inbox',       'tags' => ['comparison', 'carousel']],
            ['category' => 'video_draft', 'title' => 'بث مباشر: تحليل أسبوعي EUR/USD',   'notes' => 'كل خميس 8 مساءً. محتوى: التحليل الفني + أسئلة المتابعين.',               'status' => 'done',        'tags' => ['live', 'analysis']],
        ];

        foreach ($items as $item) {
            MediaLibraryItem::create($item);
        }
    }
}
