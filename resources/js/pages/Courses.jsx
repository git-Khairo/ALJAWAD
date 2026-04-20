import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import MagneticButton from '@/components/interactive/MagneticButton';
import { Parallax } from '@/components/interactive/ParallaxSection';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Rocket, ArrowRight, Sparkles, X as XIcon } from 'lucide-react';

const Courses = () => {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const [period, setPeriod] = useState('month'); // 'month' | 'year'

  const plans = [
    {
      id: 'starter',
      name: l('المبتدئ', 'Starter'),
      subtitle: l('ابدأ رحلتك في التداول', 'Begin your trading journey'),
      price: { month: 299, year: 2990 },
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
      price: { month: 699, year: 6990 },
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
      notIncluded: [l('جلسات إرشاد فردية', '1-on-1 Mentorship')],
    },
    {
      id: 'elite',
      name: l('النخبة', 'Elite'),
      subtitle: l('التداول الاحترافي الكامل', 'Complete professional trading'),
      price: { month: 1299, year: 12990 },
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
    <div className="py-20 md:py-24 relative">
      <Parallax speed={0.2} className="absolute top-20 start-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <Parallax speed={-0.25} className="absolute bottom-40 end-10 h-80 w-80 rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 shadow-[0_0_20px_hsl(195_65%_55%/0.2)]">
            <Sparkles className="h-3 w-3" />
            {l('خطط التداول', 'Trading Plans')}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            <AnimatedText text={l('اختر خطتك المناسبة', 'Choose Your Plan')} className="gradient-text" />
          </h1>
          <p className="text-muted-foreground text-lg">
            {l(
              'خطط مرنة تناسب جميع مستويات المتداولين. ابدأ اليوم وارتقِ بتداولك إلى المستوى التالي.',
              'Flexible plans for all trader levels. Start today and elevate your trading to the next level.'
            )}
          </p>
        </AnimatedSection>

        {/* Billing toggle */}
        <AnimatedSection delay={0.1}>
          <div className="flex justify-center mb-14">
            <div className="relative inline-flex items-center rounded-full border border-primary/20 glass p-1">
              {['month', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors z-10 ${
                    period === p ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {period === p && (
                    <motion.span
                      layoutId="billing-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-neon"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    {p === 'month' ? l('شهري', 'Monthly') : l('سنوي', 'Yearly')}
                    {p === 'year' && (
                      <span className="ms-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-chart-up/20 text-chart-up border border-chart-up/30">
                        -17%
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Plans */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start perspective-1200">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPro = plan.popular;
            const price = plan.price[period];
            return (
              <StaggerItem key={plan.id}>
                <motion.div
                  whileHover={{ y: isPro ? -10 : -6, rotateY: 3 }}
                  transition={{ type: 'spring', stiffness: 260 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className={`relative rounded-3xl border transition-colors duration-500 overflow-hidden group ${
                    isPro
                      ? 'bg-gradient-to-b from-primary/10 via-card to-card border-primary/40 shadow-neon scale-[1.03] z-10'
                      : 'glass border-primary/15 hover:border-primary/35'
                  }`}
                >
                  {/* Popular ribbon */}
                  {isPro && (
                    <>
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-b-lg bg-primary text-primary-foreground shadow-neon">
                        {l('الأكثر شعبية', 'Most Popular')}
                      </div>
                    </>
                  )}

                  {/* Background orb decoration */}
                  <div className="absolute -top-20 -end-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute -bottom-20 -start-20 h-56 w-56 rounded-full bg-primary/8 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative p-7 lg:p-8">
                    {/* Icon orb */}
                    <div className="relative mb-6 flex items-center justify-between">
                      <div
                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${
                          isPro ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        <Icon className="h-7 w-7" />
                        {isPro && (
                          <span className="absolute -inset-1 rounded-2xl border border-primary/30 animate-spin-slow pointer-events-none" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.subtitle}</p>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <motion.span
                          key={period + plan.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="text-5xl font-extrabold tracking-tight gradient-text-soft"
                        >
                          ${price}
                        </motion.span>
                        <span className="text-sm text-muted-foreground">
                          {period === 'month' ? l('/شهر', '/mo') : l('/سنة', '/yr')}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link to="/auth/register">
                      <MagneticButton className="w-full" strength={0.25}>
                        <Button
                          className={`w-full group/btn ${
                            isPro
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon'
                              : 'bg-muted text-foreground hover:bg-primary hover:text-primary-foreground'
                          }`}
                          size="lg"
                        >
                          {l('ابدأ الآن', 'Get Started')}
                          <ArrowRight className="h-4 w-4 ms-2 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 rtl:rotate-180" />
                        </Button>
                      </MagneticButton>
                    </Link>

                    {/* Features */}
                    <div className="space-y-3 mt-8">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        {l('المزايا المتضمنة', "What's included")}
                      </p>
                      {plan.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: language === 'ar' ? 8 : -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03, duration: 0.4 }}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 rounded-full p-0.5 bg-primary/20 text-primary shrink-0 border border-primary/30">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </motion.div>
                      ))}
                      {plan.notIncluded.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 opacity-40">
                          <div className="mt-0.5 rounded-full p-0.5 bg-muted text-muted-foreground shrink-0 border border-border">
                            <XIcon className="h-3 w-3" />
                          </div>
                          <span className="text-sm line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Money back guarantee */}
        <AnimatedSection delay={0.3} className="text-center mt-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-primary/20 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            {l(
              'جميع الخطط تشمل ضمان استرداد الأموال خلال 14 يوماً. بدون التزامات طويلة الأمد.',
              'All plans include a 14-day money-back guarantee. No long-term commitments.'
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Courses;
