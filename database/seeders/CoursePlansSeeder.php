<?php

namespace Database\Seeders;

use App\Models\CoursePlan;
use App\Models\CoursePlanFeature;
use Illuminate\Database\Seeder;

class CoursePlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'plan' => [
                    'label'       => 'L1',
                    'icon'        => 'Zap',
                    'name_ar'     => 'المستوى الأول — الأساس',
                    'name_en'     => 'Level 1 — Foundation',
                    'subtitle_ar' => 'ابدأ من الصفر بثقة',
                    'subtitle_en' => 'Start from zero with confidence',
                    'access_ar'   => 'وصول لمدة شهر',
                    'access_en'   => '1-month access',
                    'price'       => 100,
                    'currency'    => 'USD',
                    'is_featured' => false,
                    'status'      => 'active',
                    'sort_order'  => 1,
                    'bot_plan'    => 'beginner',
                    'access_days' => 30,
                ],
                'features' => [
                    ['text_ar' => 'محتوى كورس المستوى الأول كاملاً', 'text_en' => 'Full Level 1 course content',       'included' => true],
                    ['text_ar' => 'اختبار تقييمي',                    'text_en' => 'Knowledge assessment test',         'included' => true],
                    ['text_ar' => 'وصول للمجتمع (قراءة)',             'text_en' => 'Community access (read only)',       'included' => true],
                    ['text_ar' => 'قناة الإشارات',                    'text_en' => 'Signals channel',                   'included' => false],
                    ['text_ar' => 'التفاعل في المجتمع',               'text_en' => 'Community interaction',             'included' => false],
                    ['text_ar' => 'الاستشارة الخاصة',                 'text_en' => 'Private consultation',              'included' => false],
                ],
            ],
            [
                'plan' => [
                    'label'       => 'L2',
                    'icon'        => 'Crown',
                    'name_ar'     => 'المستوى الثاني — الممارس',
                    'name_en'     => 'Level 2 — Practitioner',
                    'subtitle_ar' => 'الأكثر طلباً',
                    'subtitle_en' => 'Most in-demand',
                    'access_ar'   => 'وصول لمدة شهرين',
                    'access_en'   => '2-month access',
                    'price'       => 200,
                    'currency'    => 'USD',
                    'is_featured' => true,
                    'status'      => 'active',
                    'sort_order'  => 2,
                    'bot_plan'    => 'intermediate',
                    'access_days' => 60,
                ],
                'features' => [
                    ['text_ar' => 'كورس L1 + L2',                   'text_en' => 'Level 1 + Level 2 course',           'included' => true],
                    ['text_ar' => 'اختبار تقييمي',                   'text_en' => 'Assessment test',                    'included' => true],
                    ['text_ar' => 'قناة الإشارات مجاناً',            'text_en' => 'Free signals channel',               'included' => true],
                    ['text_ar' => 'تفاعل كامل في المجتمع',           'text_en' => 'Full community interaction',          'included' => true],
                    ['text_ar' => 'الاستشارة الخاصة',                'text_en' => 'Private consultation',               'included' => false],
                ],
            ],
            [
                'plan' => [
                    'label'       => 'L3',
                    'icon'        => 'Rocket',
                    'name_ar'     => 'المستوى الثالث — النظام الكامل',
                    'name_en'     => 'Level 3 — Full System',
                    'subtitle_ar' => 'الخيار الأذكى والأشمل',
                    'subtitle_en' => 'The smartest, most complete choice',
                    'access_ar'   => 'وصول كامل لمدة 3 أشهر',
                    'access_en'   => 'Full 3-month access',
                    'price'       => 500,
                    'currency'    => 'USD',
                    'is_featured' => false,
                    'status'      => 'active',
                    'sort_order'  => 3,
                    'bot_plan'    => 'expert',
                    'access_days' => 90,
                ],
                'features' => [
                    ['text_ar' => 'الكورس الكامل 1+2+3',             'text_en' => 'Full course L1+L2+L3',               'included' => true],
                    ['text_ar' => 'اختبار تقييمي',                   'text_en' => 'Assessment test',                    'included' => true],
                    ['text_ar' => 'قناة الإشارات',                   'text_en' => 'Signals channel',                    'included' => true],
                    ['text_ar' => 'تفاعل كامل',                      'text_en' => 'Full interaction',                   'included' => true],
                    ['text_ar' => 'مجتمع خاص L3',                    'text_en' => 'Exclusive L3 community',             'included' => true],
                    ['text_ar' => 'ساعة استشارة خاصة',               'text_en' => '1-hour private consultation',        'included' => true],
                ],
            ],
        ];

        foreach ($plans as $data) {
            $plan = CoursePlan::firstOrCreate(
                ['label' => $data['plan']['label']],
                $data['plan']
            );

            // Delete existing features before re-seeding to ensure idempotency
            $plan->features()->delete();

            foreach ($data['features'] as $index => $feature) {
                CoursePlanFeature::create(array_merge($feature, [
                    'course_plan_id' => $plan->id,
                    'sort_order'     => $index + 1,
                ]));
            }
        }
    }
}
