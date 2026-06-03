<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class BlogPostsSeeder extends Seeder
{
    public function run(): void
    {
        $posts = [
            [
                'title_ar'     => 'توقعات الدولار أمام اليورو',
                'title_en'     => 'USD/EUR Forecast 2026',
                'category'     => 'forex',
                'author_ar'    => 'م. سعد الجواد',
                'author_en'    => 'Eng. Saad AlJawad',
                'excerpt_ar'   => 'تحليل شامل لزوج EUR/USD مع توقعات الربع الأول من عام 2026.',
                'excerpt_en'   => 'Comprehensive EUR/USD analysis with Q1 forecasts.',
                'content_ar'   => 'يُظهر التحليل الفني دعماً قوياً عند 1.0650 ومقاومة عند 1.1200. تابع عن كثب سياسات الفيدرالي الأمريكي والبنك المركزي الأوروبي للحصول على توجيهات دقيقة.',
                'content_en'   => 'Technical analysis shows strong support at 1.0650 and resistance at 1.1200. Monitor Fed and ECB monetary policies closely.',
                'image_type'   => 'forex',
                'read_time'    => 8,
                'views'        => 1240,
                'status'       => 'published',
                'published_at' => '2026-01-15 00:00:00',
            ],
            [
                'title_ar'     => 'بيتكوين يتجاوز 100 ألف',
                'title_en'     => 'Bitcoin Breaks $100K: What Next?',
                'category'     => 'crypto',
                'author_ar'    => 'أ. نور العلي',
                'author_en'    => 'Ms. Nour Al-Ali',
                'excerpt_ar'   => 'بعد اختراق البيتكوين حاجز 100 ألف دولار، نحلل المستويات الفنية الرئيسية.',
                'excerpt_en'   => 'After Bitcoin broke the $100K barrier, we analyze key technical levels.',
                'content_ar'   => 'حقق البيتكوين إنجازاً تاريخياً. أسهم اعتماد صناديق ETF والاهتمام المؤسسي في دفع هذا الاختراق. تستهدف الأسعار مستويات 120 ألف و150 ألف دولار.',
                'content_en'   => 'Bitcoin achieved a historic milestone. ETF approvals and institutional interest drove the breakout. Price targets at $120K and $150K.',
                'image_type'   => 'crypto',
                'read_time'    => 6,
                'views'        => 2890,
                'status'       => 'published',
                'published_at' => '2026-02-10 00:00:00',
            ],
            [
                'title_ar'     => 'أفضل 5 أسهم تقنية 2026',
                'title_en'     => 'Top 5 Tech Stocks for 2026',
                'category'     => 'stocks',
                'author_ar'    => 'د. فهد القحطاني',
                'author_en'    => 'Dr. Fahad Al-Qahtani',
                'excerpt_ar'   => 'تحليل مفصّل لأفضل أسهم التكنولوجيا بناءً على الأساسيات والنمو المتوقع.',
                'excerpt_en'   => 'Detailed analysis of the best tech stocks based on fundamentals and expected growth.',
                'content_ar'   => 'تقود NVIDIA الطلب على الذكاء الاصطناعي. يستمر نمو Microsoft Azure. تتصدر منظومة Apple. تهيمن Amazon AWS على السحابة. تحافظ Tesla على ريادتها في السيارات الكهربائية.',
                'content_en'   => 'NVIDIA leads AI demand. Microsoft Azure growth continues. Apple ecosystem remains strongest. Amazon AWS dominates cloud. Tesla EV leadership persists.',
                'image_type'   => 'stocks',
                'read_time'    => 10,
                'views'        => 876,
                'status'       => 'published',
                'published_at' => '2026-02-20 00:00:00',
            ],
            [
                'title_ar'     => 'استراتيجية السكالبينج',
                'title_en'     => 'Scalping Strategy: Beginner Guide',
                'category'     => 'forex',
                'author_ar'    => 'م. سعد الجواد',
                'author_en'    => 'Eng. Saad AlJawad',
                'excerpt_ar'   => 'تعلّم استراتيجية السكالبينج وكيفية الاستفادة من التحركات السعرية الصغيرة.',
                'excerpt_en'   => 'Learn scalping and how to profit from small market movements.',
                'content_ar'   => 'يتطلب السكالبينج تركيزاً عالياً وتنفيذاً سريعاً. أفضل الأزواج: EUR/USD وGBP/USD وUSD/JPY. تداول خلال تداخل الجلستين الأوروبية والأمريكية.',
                'content_en'   => 'Scalping requires high focus and fast execution. Best pairs: EUR/USD, GBP/USD, USD/JPY. Trade during European-American session overlap.',
                'image_type'   => 'forex',
                'read_time'    => 7,
                'views'        => 543,
                'status'       => 'published',
                'published_at' => '2026-03-05 00:00:00',
            ],
            [
                'title_ar'     => 'إيثريوم وإثبات الحصة',
                'title_en'     => 'Ethereum Proof of Stake Explained',
                'category'     => 'crypto',
                'author_ar'    => 'أ. نور العلي',
                'author_en'    => 'Ms. Nour Al-Ali',
                'excerpt_ar'   => 'كيف تُغيّر آلية إثبات الحصة في إيثريوم مشهد DeFi وقيمة ETH على المدى البعيد.',
                'excerpt_en'   => "How Ethereum's PoS transition changes DeFi and long-term ETH value.",
                'content_ar'   => 'تقلل آلية إثبات الحصة استهلاك الطاقة بنسبة 99% وتُحسّن قابلية التوسع. ومن المتوقع أن تُسرّع اعتماد DeFi وتزيد قيمة ETH على المدى البعيد.',
                'content_en'   => 'PoS reduces energy consumption by 99% and boosts scalability. Expected to accelerate DeFi adoption and increase ETH value long-term.',
                'image_type'   => 'crypto',
                'read_time'    => 9,
                'views'        => 678,
                'status'       => 'published',
                'published_at' => '2026-03-15 00:00:00',
            ],
            [
                'title_ar'     => 'كيف تقرأ تقرير الأرباح',
                'title_en'     => 'How to Read Earnings Reports',
                'category'     => 'stocks',
                'author_ar'    => 'د. فهد القحطاني',
                'author_en'    => 'Dr. Fahad Al-Qahtani',
                'excerpt_ar'   => 'دليل شامل لفهم تقارير الأرباح الفصلية واتخاذ قرارات استثمارية مدروسة.',
                'excerpt_en'   => 'Complete guide to understanding quarterly earnings reports for investment decisions.',
                'content_ar'   => 'المؤشرات الرئيسية: EPS والإيرادات والتوجيهات والهوامش. تؤدي المفاجآت الإيجابية عادةً إلى ارتفاع السهم بنسبة 5-15% في يوم الإعلان.',
                'content_en'   => 'Key metrics: EPS, Revenue, Guidance, Margins. Positive surprises typically drive 5-15% stock increase on announcement day.',
                'image_type'   => 'stocks',
                'read_time'    => 12,
                'views'        => 321,
                'status'       => 'draft',
                'published_at' => null,
            ],
        ];

        foreach ($posts as $data) {
            BlogPost::firstOrCreate(
                ['title_en' => $data['title_en']],
                $data
            );
        }
    }
}
