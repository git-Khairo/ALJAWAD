<?php

namespace Database\Seeders;

use App\Models\SentNotification;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;

class NotificationsSeeder extends Seeder
{
    public function run(): void
    {
        $userNotifications = [
            [
                'title_ar'   => 'إشارة تداول: شراء EUR/USD',
                'title_en'   => 'Trade Signal: Buy EUR/USD',
                'message_ar' => 'إشارة شراء على EUR/USD عند 1.0850 — هدف 1.0920 — وقف 1.0810',
                'message_en' => 'Buy signal on EUR/USD at 1.0850 — Target 1.0920 — Stop 1.0810',
                'type'       => 'success',
                'read'       => false,
                'created_at' => '2026-06-01 10:00:00',
            ],
            [
                'title_ar'   => 'تنبيه سوق',
                'title_en'   => 'Market Alert',
                'message_ar' => 'البيتكوين يقترب من مستوى مقاومة رئيسي عند 105,000$',
                'message_en' => 'Bitcoin approaching key resistance level at $105,000',
                'type'       => 'info',
                'read'       => false,
                'created_at' => '2026-06-02 15:00:00',
            ],
            [
                'title_ar'   => 'دورة جديدة متاحة',
                'title_en'   => 'New Course Available',
                'message_ar' => 'تم إضافة دورة جديدة: تداول الخيارات المتقدم',
                'message_en' => 'New course added: Advanced Options Trading',
                'type'       => 'info',
                'read'       => true,
                'created_at' => '2026-06-02 09:00:00',
            ],
            [
                'title_ar'   => 'تحديث الحساب',
                'title_en'   => 'Account Update Required',
                'message_ar' => 'يرجى تحديث بيانات التحقق الخاصة بك',
                'message_en' => 'Please update your verification documents',
                'type'       => 'warning',
                'read'       => true,
                'created_at' => '2026-06-01 12:00:00',
            ],
        ];

        foreach ($userNotifications as $n) {
            UserNotification::create($n);
        }

        $sentNotifications = [
            ['message' => 'مرحباً بكم في منصة الجواد! تم إطلاق الدورة الجديدة في التحليل الفني.', 'recipients' => 'all',     'count' => 21, 'created_at' => '2026-05-20 10:00:00'],
            ['message' => 'تذكير: جلسة التحليل المباشرة اليوم الساعة 8 مساءً.',                    'recipients' => 'clients', 'count' => 5,  'created_at' => '2026-06-01 14:00:00'],
            ['message' => 'عرض خاص: خصم 20% على دورة إدارة المخاطر هذا الأسبوع فقط!',             'recipients' => 'leads',   'count' => 4,  'created_at' => '2026-06-02 09:00:00'],
        ];

        foreach ($sentNotifications as $sn) {
            SentNotification::create($sn);
        }
    }
}
