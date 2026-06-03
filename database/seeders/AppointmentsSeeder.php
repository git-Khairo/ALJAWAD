<?php

namespace Database\Seeders;

use App\Models\Appointment;
use Illuminate\Database\Seeder;

class AppointmentsSeeder extends Seeder
{
    public function run(): void
    {
        $appointments = [
            [
                'client_name' => 'أحمد الشمري',
                'type_ar'     => 'استشارة',
                'type_en'     => 'Consultation',
                'date'        => '2026-06-10',
                'time'        => '10:00:00',
                'status'      => 'confirmed',
                'notes'       => null,
            ],
            [
                'client_name' => 'فاطمة القحطاني',
                'type_ar'     => 'مراجعة محفظة',
                'type_en'     => 'Portfolio Review',
                'date'        => '2026-06-10',
                'time'        => '14:00:00',
                'status'      => 'pending',
                'notes'       => null,
            ],
            [
                'client_name' => 'عبدالله العنزي',
                'type_ar'     => 'جلسة تدريبية',
                'type_en'     => 'Training Session',
                'date'        => '2026-06-11',
                'time'        => '11:00:00',
                'status'      => 'confirmed',
                'notes'       => null,
            ],
            [
                'client_name' => 'نورة الحربي',
                'type_ar'     => 'متابعة',
                'type_en'     => 'Follow-up',
                'date'        => '2026-06-12',
                'time'        => '16:00:00',
                'status'      => 'pending',
                'notes'       => null,
            ],
        ];

        foreach ($appointments as $data) {
            Appointment::updateOrCreate(
                ['date' => $data['date'], 'time' => $data['time']],
                $data
            );
        }
    }
}
