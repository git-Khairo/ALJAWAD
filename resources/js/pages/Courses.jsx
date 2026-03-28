import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Rocket, ArrowRight } from 'lucide-react';

const Courses = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: l('المبتدئ', 'Starter'),
      subtitle: l('ابدأ رحلتك في التداول', 'Begin your trading journey'),
      price: 299,
      period: l('/شهر', '/mo'),
      icon: Zap,
      popular: false,
      features: [
        l('أساسيات تداول الفوركس', 'Forex Trading Fundamentals'),
        l('تداول العملات الرقمية', 'Cryptocurrency Trading'),
        l('سيكولوجية التداول', 'Trading Psychology'),
        l('حساب تجريبي $100K', '$100K Demo Account'),
        l('دعم عبر البريد الإلكتروني', 'Email Support'),
        l('6 جلسات تدريبية', '6 Training Sessions'),
      ],
      notIncluded: [
        l('إشارات تداول حية', 'Live Trading Signals'),
        l('جلسات إرشاد فردية', '1-on-1 Mentorship'),
        l('وصول VIP للتحليلات', 'VIP Analytics Access'),
      ],
    },
    {
      id: 'pro',
      name: l('المحترف', 'Professional'),
      subtitle: l('للمتداولين الجادين', 'For serious traders'),
      price: 699,
      period: l('/شهر', '/mo'),
      icon: Crown,
      popular: true,
      features: [
        l('كل مزايا خطة المبتدئ', 'Everything in Starter'),
        l('التحليل الفني المتقدم', 'Advanced Technical Analysis'),
        l('إدارة المخاطر في التداول', 'Trading Risk Management'),
        l('إشارات تداول حية يومية', 'Daily Live Trading Signals'),
        l('تداول الأسهم الأمريكية', 'US Stock Market Trading'),
        l('12 جلسة تدريبية أسبوعياً', '12 Weekly Training Sessions'),
        l('مجتمع المتداولين الخاص', 'Private Traders Community'),
        l('دعم أولوية 24/7', 'Priority 24/7 Support'),
      ],
      notIncluded: [
        l('جلسات إرشاد فردية', '1-on-1 Mentorship'),
      ],
    },
    {
      id: 'elite',
      name: l('النخبة', 'Elite'),
      subtitle: l('التداول الاحترافي الكامل', 'Complete professional trading'),
      price: 1299,
      period: l('/شهر', '/mo'),
      icon: Rocket,
      popular: false,
      features: [
        l('كل مزايا خطة المحترف', 'Everything in Professional'),
        l('تداول العقود الآجلة', 'Futures Trading'),
        l('تداول الخيارات Options', 'Options Trading'),
        l('DeFi والتمويل اللامركزي', 'DeFi & Decentralized Finance'),
        l('جلسات إرشاد فردية أسبوعية', 'Weekly 1-on-1 Mentorship'),
        l('وصول VIP لجميع التحليلات', 'VIP Access to All Analytics'),
        l('استراتيجيات حصرية', 'Exclusive Strategies'),
        l('مدير حساب شخصي', 'Personal Account Manager'),
        l('شهادة معتمدة', 'Certified Diploma'),
      ],
      notIncluded: [],
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-accent/10 text-accent border border-accent/20 mb-4">
            {l('خطط التداول', 'Trading Plans')}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {l('اختر خطتك المناسبة', 'Choose Your Plan')}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {l(
              'خطط مرنة تناسب جميع مستويات المتداولين. ابدأ اليوم وارتقِ بتداولك إلى المستوى التالي.',
              'Flexible plans for all trader levels. Start today and elevate your trading to the next level.'
            )}
          </p>
        </AnimatedSection>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.id;
            const isPro = plan.popular;

            return (
              <AnimatedSection key={plan.id} delay={index * 0.15}>
                <motion.div
                  onHoverStart={() => setHoveredPlan(plan.id)}
                  onHoverEnd={() => setHoveredPlan(null)}
                  className={`relative rounded-2xl border transition-all duration-500 overflow-hidden ${
                    isPro
                      ? 'bg-gradient-to-b from-accent/10 via-card to-card border-accent/40 shadow-lg shadow-accent/10 scale-[1.03] z-10'
                      : 'bg-card border-border hover:border-accent/30'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPro && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />
                  )}

                  <div className="p-6 lg:p-8">
                    {/* Plan Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${isPro ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {isPro && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                          {l('الأكثر شعبية', 'Most Popular')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.subtitle}</p>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl lg:text-5xl font-extrabold tracking-tight">${plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link to="/auth/register">
                      <Button
                        className={`w-full mb-8 group ${
                          isPro
                            ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20'
                            : 'bg-muted text-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                        size="lg"
                      >
                        {l('ابدأ الآن', 'Get Started')}
                        <ArrowRight className="h-4 w-4 ms-2 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      </Button>
                    </Link>

                    {/* Features */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {l('المزايا المتضمنة', 'What\'s included')}
                      </p>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full p-0.5 bg-accent/20 text-accent shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 opacity-40">
                          <div className="mt-0.5 rounded-full p-0.5 bg-muted text-muted-foreground shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-sm line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Bottom note */}
        <AnimatedSection delay={0.5} className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            {l(
              'جميع الخطط تشمل ضمان استرداد الأموال خلال 14 يوماً. بدون التزامات طويلة الأمد.',
              'All plans include a 14-day money-back guarantee. No long-term commitments.'
            )}
          </p>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Courses;
