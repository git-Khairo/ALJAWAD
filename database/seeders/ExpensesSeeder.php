<?php

namespace Database\Seeders;

use App\Models\Expense;
use Illuminate\Database\Seeder;

class ExpensesSeeder extends Seeder
{
    public function run(): void
    {
        $expenses = [
            ['category' => 'salary',    'description_ar' => 'رواتب الموظفين - يناير',        'description_en' => 'Staff Salaries - January',          'amount' => 950000, 'currency' => 'SYP', 'date' => '2026-01-31'],
            ['category' => 'rent',      'description_ar' => 'إيجار المكتب - يناير',           'description_en' => 'Office Rent - January',             'amount' => 250000, 'currency' => 'SYP', 'date' => '2026-01-05'],
            ['category' => 'marketing', 'description_ar' => 'إعلانات سوشيال ميديا - يناير',  'description_en' => 'Social Media Ads - Jan',            'amount' => 120,    'currency' => 'USD', 'date' => '2026-01-15', 'notes' => 'Meta Ads'],
            ['category' => 'software',  'description_ar' => 'اشتراك أدوات التصميم',          'description_en' => 'Design Tools Subscription',         'amount' => 55,     'currency' => 'USD', 'date' => '2026-01-01', 'notes' => 'Figma + Adobe'],
            ['category' => 'salary',    'description_ar' => 'رواتب الموظفين - فبراير',        'description_en' => 'Staff Salaries - February',         'amount' => 950000, 'currency' => 'SYP', 'date' => '2026-02-28'],
            ['category' => 'rent',      'description_ar' => 'إيجار المكتب - فبراير',          'description_en' => 'Office Rent - February',            'amount' => 250000, 'currency' => 'SYP', 'date' => '2026-02-05'],
            ['category' => 'marketing', 'description_ar' => 'إعلانات جوجل - فبراير',          'description_en' => 'Google Ads - Feb',                  'amount' => 180,    'currency' => 'USD', 'date' => '2026-02-10'],
            ['category' => 'utilities', 'description_ar' => 'فاتورة الكهرباء والإنترنت',     'description_en' => 'Electricity & Internet Bill',       'amount' => 55000,  'currency' => 'SYP', 'date' => '2026-02-15'],
            ['category' => 'salary',    'description_ar' => 'رواتب الموظفين - مارس',          'description_en' => 'Staff Salaries - March',            'amount' => 950000, 'currency' => 'SYP', 'date' => '2026-03-31'],
            ['category' => 'rent',      'description_ar' => 'إيجار المكتب - مارس',            'description_en' => 'Office Rent - March',               'amount' => 250000, 'currency' => 'SYP', 'date' => '2026-03-05'],
            ['category' => 'software',  'description_ar' => 'اشتراك Zoom',                   'description_en' => 'Zoom Subscription',                  'amount' => 25,     'currency' => 'USD', 'date' => '2026-03-01'],
            ['category' => 'equipment', 'description_ar' => 'معدات تصوير جديدة',             'description_en' => 'New Camera Equipment',              'amount' => 450,    'currency' => 'USD', 'date' => '2026-03-20'],
            ['category' => 'salary',    'description_ar' => 'رواتب الموظفين - أبريل',         'description_en' => 'Staff Salaries - April',            'amount' => 980000, 'currency' => 'SYP', 'date' => '2026-04-30'],
            ['category' => 'rent',      'description_ar' => 'إيجار المكتب - أبريل',           'description_en' => 'Office Rent - April',               'amount' => 250000, 'currency' => 'SYP', 'date' => '2026-04-05'],
            ['category' => 'marketing', 'description_ar' => 'مؤثرون - أبريل',                'description_en' => 'Influencer Marketing - Apr',        'amount' => 280,    'currency' => 'USD', 'date' => '2026-04-15'],
            ['category' => 'utilities', 'description_ar' => 'فاتورة الاتصالات',              'description_en' => 'Phone Bills',                        'amount' => 30000,  'currency' => 'SYP', 'date' => '2026-04-10'],
            ['category' => 'salary',    'description_ar' => 'رواتب الموظفين - مايو',          'description_en' => 'Staff Salaries - May',              'amount' => 980000, 'currency' => 'SYP', 'date' => '2026-05-31'],
            ['category' => 'rent',      'description_ar' => 'إيجار المكتب - مايو',            'description_en' => 'Office Rent - May',                 'amount' => 250000, 'currency' => 'SYP', 'date' => '2026-05-05'],
            ['category' => 'software',  'description_ar' => 'اشتراكات متعددة - مايو',        'description_en' => 'Various Subscriptions - May',       'amount' => 110,    'currency' => 'USD', 'date' => '2026-05-01'],
            ['category' => 'travel',    'description_ar' => 'سفر للمؤتمر السنوي',            'description_en' => 'Annual Conference Travel',          'amount' => 700,    'currency' => 'USD', 'date' => '2026-05-20'],
        ];

        foreach ($expenses as $data) {
            Expense::create(array_merge(['notes' => null], $data));
        }
    }
}
