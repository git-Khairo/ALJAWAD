<?php

namespace Database\Seeders;

use App\Models\KpiDefinition;
use Illuminate\Database\Seeder;

/**
 * Mirrors the signed performance contracts (2026-07):
 *   · التواصل الاجتماعي والتسويق — cap 100% of base salary
 *   · دعم العملاء                  — cap 100%
 *   · قسم المحللين                 — cap 125%
 *   · إدارة الشركاء (الوسطاء الفرعيين) — cap 100%
 *
 * Tier thresholds are minimums (maximums for lower_is_better); a value below
 * tier_a_min lands on tier F → 0% bonus + a warning. See KpiDefinition::evaluate().
 */
class KpiDefinitionsSeeder extends Seeder
{
    public function run(): void
    {
        $kpis = [

            // ── Marketer — total cap 100% ─────────────────────────────────
            [
                'role'           => 'marketer',
                'slug'           => 'activity_rate',
                'name_ar'        => 'معدل النشاط',
                'name_en'        => 'Activity Rate',
                'description_ar' => 'متوسط (إعجابات + تعليقات + مشاركات) ÷ متابعين × 100',
                'description_en' => 'Average (likes + comments + shares) ÷ followers × 100',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 30,
                'tier_a_min'     => 7,   'tier_a_bonus' => 10,
                'tier_b_min'     => 10,  'tier_b_bonus' => 20,
                'tier_c_min'     => 15,  'tier_c_bonus' => 30,
                'sort_order'     => 1,
            ],
            [
                'role'           => 'marketer',
                'slug'           => 'follower_growth',
                'name_ar'        => 'نمو المتابعين',
                'name_en'        => 'Follower Growth',
                'description_ar' => 'نسبة النمو الشهري عبر جميع المنصات (من لوحة التحكم)',
                'description_en' => 'Monthly growth rate across all platforms (from the dashboard)',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 5,   'tier_a_bonus' => 10,
                'tier_b_min'     => 8,   'tier_b_bonus' => 20,
                'tier_c_min'     => 12,  'tier_c_bonus' => 25,
                'sort_order'     => 2,
            ],
            [
                'role'           => 'marketer',
                'slug'           => 'new_leads',
                'name_ar'        => 'العملاء المحتملون الجدد',
                'name_en'        => 'New Leads (Inbound Messages)',
                'description_ar' => 'إجمالي رسائل الاستفسار الواردة عبر منصات التواصل',
                'description_en' => 'Total inbound enquiry messages via social platforms',
                'unit'           => 'messages',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 10,  'tier_a_bonus' => 10,
                'tier_b_min'     => 25,  'tier_b_bonus' => 20,
                'tier_c_min'     => 40,  'tier_c_bonus' => 25,
                'sort_order'     => 3,
            ],
            [
                'role'           => 'marketer',
                'slug'           => 'content_creation',
                'name_ar'        => 'إنتاج المحتوى',
                'name_en'        => 'Content Creation',
                'description_ar' => 'إجمالي المنشورات والريلز والستوريز المنشورة شهرياً',
                'description_en' => 'Total posts, reels and stories published per month',
                'unit'           => 'pieces',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 20,
                'tier_a_min'     => 8,   'tier_a_bonus' => 5,
                'tier_b_min'     => 14,  'tier_b_bonus' => 10,
                'tier_c_min'     => 20,  'tier_c_bonus' => 20,
                'sort_order'     => 4,
            ],

            // ── Customer Support — total cap 100% ─────────────────────────
            [
                'role'           => 'customer_support',
                'slug'           => 'ticket_resolution_rate',
                'name_ar'        => 'معدل حل التذاكر',
                'name_en'        => 'Ticket Resolution Rate',
                'description_ar' => 'نسبة التذاكر المُغلقة بنجاح خلال الشهر عبر جوجل شيت',
                'description_en' => '% of tickets successfully closed within the month (via Google Sheet)',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 70,  'tier_a_bonus' => 10,
                'tier_b_min'     => 85,  'tier_b_bonus' => 15,
                'tier_c_min'     => 95,  'tier_c_bonus' => 25,
                'sort_order'     => 1,
            ],
            [
                'role'           => 'customer_support',
                'slug'           => 'response_time',
                'name_ar'        => 'وقت الاستجابة',
                'name_en'        => 'Average Response Time',
                'description_ar' => 'يُقاس بالساعات عبر جوجل شيت — كلما قلّ كان أفضل',
                'description_en' => 'Measured in hours via Google Sheet — lower is better',
                'unit'           => 'hours',
                'direction'      => 'lower_is_better',
                'max_bonus_pct'  => 25,
                // For lower_is_better: tier_c_min is the best (lowest) threshold
                'tier_a_min'     => 6,   'tier_a_bonus' => 10,
                'tier_b_min'     => 4,   'tier_b_bonus' => 15,
                'tier_c_min'     => 1,   'tier_c_bonus' => 25,
                'sort_order'     => 2,
            ],
            [
                'role'           => 'customer_support',
                'slug'           => 'active_client_followup',
                'name_ar'        => 'متابعة العملاء النشطين',
                'name_en'        => 'Active Client Follow-up',
                'description_ar' => 'نسبة العملاء النشطين الذين تلقّوا متابعة واحدة على الأقل خلال الشهر، تُسجَّل عبر جوجل شيت',
                'description_en' => '% of active clients who received at least one follow-up during the month (via Google Sheet)',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 60,  'tier_a_bonus' => 10,
                'tier_b_min'     => 75,  'tier_b_bonus' => 15,
                'tier_c_min'     => 90,  'tier_c_bonus' => 25,
                'sort_order'     => 3,
            ],
            [
                'role'           => 'customer_support',
                'slug'           => 'csat',
                'name_ar'        => 'رضا العملاء',
                'name_en'        => 'Customer Satisfaction (CSAT)',
                'description_ar' => 'متوسط تقييم العميل عبر الاستطلاع بعد كل تذكرة (من 1 إلى 5)',
                'description_en' => 'Average customer rating via post-ticket survey (1 to 5)',
                'unit'           => '/ 5',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 3.0,  'tier_a_bonus' => 10,
                'tier_b_min'     => 4.0,  'tier_b_bonus' => 15,
                'tier_c_min'     => 4.5,  'tier_c_bonus' => 25,
                'sort_order'     => 4,
            ],

            // ── Analyst — total cap 125% ──────────────────────────────────
            [
                'role'           => 'analyst',
                'slug'           => 'live_sessions',
                'name_ar'        => 'الجلسات المباشرة',
                'name_en'        => 'Live Sessions',
                'description_ar' => 'عدد بثوث تيليغرام المباشرة للتداول شهرياً',
                'description_en' => 'Number of live Telegram trading broadcasts per month',
                'unit'           => 'broadcasts',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 20,
                'tier_a_min'     => 2,   'tier_a_bonus' => 5,
                'tier_b_min'     => 4,   'tier_b_bonus' => 10,
                'tier_c_min'     => 6,   'tier_c_bonus' => 20,
                'sort_order'     => 1,
            ],
            [
                'role'           => 'analyst',
                'slug'           => 'win_rate',
                'name_ar'        => 'معدل الربح (PIPS)',
                'name_en'        => 'Win Rate (PIPS)',
                'description_ar' => 'نسبة إشارات التداول التي حققت هدف الـ PIPS',
                'description_en' => 'Percentage of trading signals that hit the PIPS target',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 30,
                'tier_a_min'     => 50,  'tier_a_bonus' => 10,
                'tier_b_min'     => 65,  'tier_b_bonus' => 20,
                'tier_c_min'     => 80,  'tier_c_bonus' => 30,
                'sort_order'     => 2,
            ],
            [
                'role'           => 'analyst',
                'slug'           => 'Pips Count',
                'name_ar'        => 'عدد النقاط',
                'name_en'        => 'Pips Count',
                'description_ar' => 'إجمالي النقاط التداول المرسلة عبر القنوات شهرياً',
                'description_en' => 'Total trading pips sent via channels per month',
                'unit'           => 'pips',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 30,
                'tier_a_min'     => 5000,   'tier_a_bonus' => 10,
                'tier_b_min'     => 10000,  'tier_b_bonus' => 20,
                'tier_c_min'     => 15000,  'tier_c_bonus' => 30,
                'sort_order'     => 3,
            ],
            [
                'role'           => 'analyst',
                'slug'           => 'reels_production',
                'name_ar'        => 'تصوير الريلز',
                'name_en'        => 'Reels Production',
                'description_ar' => 'إجمالي فيديوهات المحتوى التداولي المنتجة والمنشورة شهرياً',
                'description_en' => 'Total trading-content reels produced and published per month',
                'unit'           => 'reels',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 2,   'tier_a_bonus' => 10,
                'tier_b_min'     => 4,   'tier_b_bonus' => 15,
                'tier_c_min'     => 6,   'tier_c_bonus' => 25,
                'sort_order'     => 4,
            ],
            [
                'role'           => 'analyst',
                'slug'           => 'trader_followup',
                'name_ar'        => 'متابعة المتداولين',
                'name_en'        => 'Trader Follow-up',
                'description_ar' => 'نسبة استفسارات المتداولين التي أُجيب عليها خلال 24 ساعة',
                'description_en' => '% of trader enquiries answered within 24 hours',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 20,
                'tier_a_min'     => 60,  'tier_a_bonus' => 5,
                'tier_b_min'     => 70,  'tier_b_bonus' => 10,
                'tier_c_min'     => 85,  'tier_c_bonus' => 20,
                'sort_order'     => 5,
            ],

            // ── Account Manager (Sub-IB partner network) — total cap 100% ──
            [
                'role'           => 'account_manager',
                'slug'           => 'sub_ib_activity_rate',
                'name_ar'        => 'معدل نشاط الوسطاء الفرعيين',
                'name_en'        => 'Sub-IB Activity Rate',
                'description_ar' => 'نسبة الوسطاء الفرعيين الذين حققوا الحد الأدنى المطلوب من النشاط، عبر لوحة تحكم البروكر وجوجل شيت',
                'description_en' => '% of sub-IBs meeting the required minimum activity (broker dashboard + Google Sheet)',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 25,
                'tier_a_min'     => 60,  'tier_a_bonus' => 10,
                'tier_b_min'     => 75,  'tier_b_bonus' => 15,
                'tier_c_min'     => 90,  'tier_c_bonus' => 25,
                'sort_order'     => 1,
            ],
            [
                'role'           => 'account_manager',
                'slug'           => 'sub_ib_network_growth',
                'name_ar'        => 'نمو شبكة الوسطاء الفرعيين',
                'name_en'        => 'Sub-IB Network Growth',
                'description_ar' => 'عدد الوسطاء الفرعيين الجدد المؤهَّلين والمُفعَّلين خلال الشهر',
                'description_en' => 'Number of new qualified and activated sub-IBs during the month',
                'unit'           => 'sub-IBs',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 20,
                'tier_a_min'     => 2,   'tier_a_bonus' => 5,
                'tier_b_min'     => 3,   'tier_b_bonus' => 10,
                'tier_c_min'     => 5,   'tier_c_bonus' => 20,
                'sort_order'     => 2,
            ],
            [
                'role'           => 'account_manager',
                'slug'           => 'sub_ib_social_support',
                'name_ar'        => 'متابعة ودعم وسائل التواصل',
                'name_en'        => 'Social Media Follow-up & Support',
                'description_ar' => 'نسبة الوسطاء الذين تلقّوا المتابعة والدعم المتفق عليه، تُسجَّل عبر جوجل شيت',
                'description_en' => '% of sub-IBs who received the agreed follow-up and support (via Google Sheet)',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 20,
                'tier_a_min'     => 60,  'tier_a_bonus' => 5,
                'tier_b_min'     => 75,  'tier_b_bonus' => 10,
                'tier_c_min'     => 90,  'tier_c_bonus' => 20,
                'sort_order'     => 3,
            ],
            [
                'role'           => 'account_manager',
                'slug'           => 'sub_ib_contract_compliance',
                'name_ar'        => 'الالتزام التعاقدي للوسطاء الفرعيين',
                'name_en'        => 'Sub-IB Contract Compliance',
                'description_ar' => 'نسبة الوسطاء الملتزمين ببنود عقدهم وفق تدقيق شهري',
                'description_en' => '% of sub-IBs complying with their contract terms, per monthly audit',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 20,
                'tier_a_min'     => 70,  'tier_a_bonus' => 5,
                'tier_b_min'     => 85,  'tier_b_bonus' => 10,
                'tier_c_min'     => 95,  'tier_c_bonus' => 20,
                'sort_order'     => 4,
            ],
            [
                'role'           => 'account_manager',
                'slug'           => 'sub_ib_volume_growth',
                'name_ar'        => 'نمو حجم تداول الشبكة',
                'name_en'        => 'Network Trading Volume Growth',
                'description_ar' => 'إجمالي اللوتات الشهرية للشبكة مقارنةً بالشهر السابق، عبر لوحة تحكم البروكر',
                'description_en' => 'Network monthly lots vs. the previous month (via broker dashboard)',
                'unit'           => '%',
                'direction'      => 'higher_is_better',
                'max_bonus_pct'  => 15,
                'tier_a_min'     => 5,   'tier_a_bonus' => 5,
                'tier_b_min'     => 10,  'tier_b_bonus' => 10,
                'tier_c_min'     => 20,  'tier_c_bonus' => 15,
                'sort_order'     => 5,
            ],
        ];

        foreach ($kpis as $kpi) {
            KpiDefinition::updateOrCreate(
                ['role' => $kpi['role'], 'slug' => $kpi['slug']],
                $kpi
            );
        }

        // The support department's 3rd KPI changed metric outright — escalations
        // (cases, lower_is_better) became active-client follow-up (%, higher_is_better),
        // so the old definition is retired rather than repurposed. Deleting it
        // cascades to its kpi_entries, hence the warning.
        $legacy = KpiDefinition::where('role', 'customer_support')->where('slug', 'escalations')->first();

        if ($legacy) {
            $entries = $legacy->entries()->count();

            if ($entries > 0) {
                $this->command?->warn("Removing the legacy 'escalations' KPI also deletes {$entries} historical kpi_entries (FK cascade).");
            }

            $legacy->delete();
            $this->command?->info("Removed legacy 'escalations' KPI — replaced by 'active_client_followup'.");
        }
    }
}
