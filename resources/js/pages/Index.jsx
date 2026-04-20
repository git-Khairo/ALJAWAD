import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockTestimonials, mockMarketData } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { Parallax, ScrollReveal } from '@/components/interactive/ParallaxSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import MagneticButton from '@/components/interactive/MagneticButton';
import CountUp from '@/components/interactive/CountUp';
import { CurvyTimeline } from '@/components/interactive/CurvyTimeline';
import {
  TrendingUp, BarChart3, Shield, Zap, LineChart, GraduationCap,
  CheckCircle, ArrowUpRight, ArrowDownRight, Bitcoin, Activity,
  ChevronDown, ChevronRight, Sparkles, Star,
  UserPlus, BookOpen, Target, Trophy,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { toast } from 'sonner';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import logo from '@/assets/logo.png';
import heroSlide1 from '@/assets/hero-slide-1.jpg';
import heroSlide2 from '@/assets/hero-slide-2.jpg';
import heroSlide3 from '@/assets/hero-slide-3.jpg';
import marketForex from '@/assets/market-forex.jpg';
import marketCrypto from '@/assets/market-crypto.jpg';
import marketStocks from '@/assets/market-stocks.jpg';

const Index = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [activeMarket, setActiveMarket] = useState('forex');

  const serviceIcons = [Activity, LineChart, Shield, Zap, BarChart3, GraduationCap];
  const marketIcons = { forex: TrendingUp, crypto: Bitcoin, stocks: BarChart3 };
  const marketImages = { forex: marketForex, crypto: marketCrypto, stocks: marketStocks };

  /* ---------- Hero slider ---------- */
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroContentY = useTransform(heroProgress, [0, 1], ['0%', '30%']);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  const slides = [
    {
      image: heroSlide1,
      kicker: l('منصتك للتداول الاحترافي', 'Your Professional Trading Platform'),
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      cta1: t('hero.cta1'),
      cta2: t('hero.cta2'),
      to1: '/auth/register',
      to2: '/services',
    },
    {
      image: heroSlide2,
      kicker: l('إشارات حيّة وتحليل يومي', 'Live Signals & Daily Analysis'),
      title: l('تداول مع محترفين في السوق', 'Trade Alongside Market Pros'),
      subtitle: l(
        'انضم إلى الغرفة الحية واحصل على إشارات الدخول والخروج والإدارة في الزمن الحقيقي.',
        'Join the live room and receive real-time entry, exit and management calls from verified analysts.'
      ),
      cta1: l('انضم الآن', 'Join now'),
      cta2: l('استكشف الخدمات', 'Explore services'),
      to1: '/auth/register',
      to2: '/services',
    },
    {
      image: heroSlide3,
      kicker: l('أكاديمية متكاملة', 'Complete Trading Academy'),
      title: l('تعلّم. طبّق. اربح.', 'Learn. Apply. Profit.'),
      subtitle: l(
        'مسارات تعليمية مُنظَّمة من الأساسيات حتى الاحتراف، مع مشاريع حقيقية وتقييم مستمر.',
        'Structured learning paths from fundamentals to pro-level, with real projects and continuous feedback.'
      ),
      cta1: l('ابدأ مسارك', 'Start your path'),
      cta2: l('شاهد الدورات', 'Browse courses'),
      to1: '/auth/register',
      to2: '/courses',
    },
  ];

  const [slideIdx, setSlideIdx] = useState(0);
  const DURATION = 5000;

  useEffect(() => {
    const id = setTimeout(
      () => setSlideIdx((i) => (i + 1) % slides.length),
      DURATION
    );
    return () => clearTimeout(id);
  }, [slideIdx, slides.length]);

  const goTo = (i) => setSlideIdx((i + slides.length) % slides.length);
  const next = () => goTo(slideIdx + 1);
  const prev = () => goTo(slideIdx - 1);

  /* ---------- Live prices ---------- */
  const [prices, setPrices] = useState(mockMarketData);
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) => ({
          ...p,
          price: +(p.price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(
            p.price > 1000 ? 0 : p.price > 100 ? 2 : 4
          ),
          change: +(p.change + (Math.random() - 0.5) * 0.1).toFixed(2),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleContact = useCallback(
    (e) => {
      e.preventDefault();
      toast.success(t('common.success'));
      setContactForm({ name: '', email: '', phone: '', message: '' });
    },
    [t]
  );

  return (
    <div className="overflow-x-clip">
      {/* ══════════════ HERO — image slider ══════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[88vh] md:min-h-[92vh] flex items-center overflow-hidden isolate bg-[#10171F]"
        aria-roledescription="carousel"
      >
        {/* ── Slides ── */}
        <div className="absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={slideIdx}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 will-change-transform"
            >
              <img
                src={slides[slideIdx].image}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
                fetchpriority="high"
              />
              {/* Ken Burns slow zoom on the active slide */}
              <motion.div
                key={`kb-${slideIdx}`}
                initial={{ scale: 1 }}
                animate={{ scale: 1.08 }}
                transition={{ duration: 8, ease: 'linear' }}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${slides[slideIdx].image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0,
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays for legibility + brand tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(100deg, rgba(16,23,31,0.92) 0%, rgba(16,23,31,0.72) 38%, rgba(16,23,31,0.25) 70%, rgba(16,23,31,0.55) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none rtl:hidden"
            style={{
              background:
                'linear-gradient(to top, rgba(16,23,31,0.85) 0%, transparent 40%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none ltr:hidden"
            style={{
              background:
                'linear-gradient(260deg, rgba(16,23,31,0.92) 0%, rgba(16,23,31,0.72) 38%, rgba(16,23,31,0.25) 70%, rgba(16,23,31,0.55) 100%)',
            }}
          />
          {/* Subtle teal glow pool */}
          <div
            className="absolute -top-32 start-[-12rem] h-[40rem] w-[40rem] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(closest-side, hsl(195 85% 60% / 0.22), transparent 70%)',
            }}
          />
        </div>

        {/* ── Content ── */}
        <motion.div
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          className="relative z-10 container mx-auto px-4 py-24 md:py-0"
        >
          <div className="max-w-3xl text-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIdx}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Kicker */}
                <div className="inline-flex items-center gap-3 mb-5">
                  <span className="h-px w-10 bg-primary" />
                  <span className="font-mono text-[0.7rem] tracking-[0.3em] uppercase text-primary">
                    {slides[slideIdx].kicker}
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.04] tracking-tight mb-5 text-white max-w-3xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
                  <span className="gradient-text">{slides[slideIdx].title}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-white/75 mb-8 max-w-xl leading-relaxed">
                  {slides[slideIdx].subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <Link to={slides[slideIdx].to1}>
                    <MagneticButton>
                      <Button
                        variant="accent"
                        size="lg"
                        className="text-base px-8 shadow-neon shadow-neon-hover"
                      >
                        {slides[slideIdx].cta1}
                        <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                      </Button>
                    </MagneticButton>
                  </Link>
                  <Link to={slides[slideIdx].to2}>
                    <MagneticButton strength={0.25}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-base px-8 border-white/30 text-white hover:bg-white/10 backdrop-blur-md"
                      >
                        {slides[slideIdx].cta2}
                      </Button>
                    </MagneticButton>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Trust row (static across slides) */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/60">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {l('الغرفة الحيّة مفتوحة', 'Live room is open')}
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                {l('مُعتمد', 'Certified')}
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                4.9/5 · 5,000+
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Side arrows ── */}
        <button
          type="button"
          onClick={prev}
          aria-label={l('السابق', 'Previous slide')}
          className="group absolute start-4 md:start-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-md text-white/90 hover:border-primary/60 hover:bg-primary/15 hover:text-primary transition-all"
        >
          <ChevronRight className="h-5 w-5 mx-auto rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={l('التالي', 'Next slide')}
          className="group absolute end-4 md:end-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-md text-white/90 hover:border-primary/60 hover:bg-primary/15 hover:text-primary transition-all"
        >
          <ChevronRight className="h-5 w-5 mx-auto rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </button>

        {/* ── Indicator bars + counter ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
          <span className="font-mono text-xs text-white/70 tabular-nums">
            {String(slideIdx + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={l(`الشريحة ${i + 1}`, `Go to slide ${i + 1}`)}
                className="relative h-1 w-10 md:w-14 rounded-full bg-white/20 overflow-hidden transition-all hover:bg-white/30"
              >
                {i === slideIdx && (
                  <motion.span
                    key={`bar-${slideIdx}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: DURATION / 1000, ease: 'linear' }}
                    className="absolute inset-y-0 start-0 bg-primary shadow-[0_0_8px_hsl(195_85%_60%/0.8)]"
                  />
                )}
                {i < slideIdx && (
                  <span className="absolute inset-0 bg-primary/70" />
                )}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-white/50 tabular-nums">
            {String(slides.length).padStart(2, '0')}
          </span>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute start-6 md:start-10 bottom-6 hidden md:flex flex-col items-start gap-2 z-20 text-[0.62rem] tracking-[0.28em] font-mono text-white/55"
        >
          <span>{l('مرر للاستكشاف', 'SCROLL')}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>

        {/* Bottom seam into next section */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-[1]"
          style={{ background: 'linear-gradient(to bottom, transparent, #10171F)' }}
        />
      </section>

      {/* ══════════════ TICKER ══════════════ */}
      <section className="relative py-4 border-y border-primary/15 bg-card/40 backdrop-blur-md overflow-hidden mask-fade-x">
        <div className={`flex whitespace-nowrap ${language === 'ar' ? 'animate-ticker-rtl' : 'animate-ticker'}`}>
          {[...prices, ...prices].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-3 px-6 text-sm">
              <span className="font-bold text-foreground">{item.symbol}</span>
              <span className="font-mono text-foreground/80">{item.price.toLocaleString()}</span>
              <span
                className={`flex items-center gap-0.5 font-semibold ${
                  item.change >= 0 ? 'text-chart-up' : 'text-destructive'
                }`}
              >
                {item.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(item.change)}%
              </span>
              <span className="text-primary/30">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ TRUST / STATS ══════════════ */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: 15000, suffix: '+', label: t('trust.students') },
              { val: 200, suffix: '+', label: t('trust.courses') },
              { val: 50, suffix: '+', label: t('trust.experts') },
              { val: 98, suffix: '%', label: t('trust.satisfaction') },
            ].map((s, i) => (
              <StaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -6, rotateX: 6, rotateY: -3 }}
                  transition={{ type: 'spring', stiffness: 280 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative group rounded-2xl glass p-6 overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-4xl md:text-5xl font-extrabold gradient-text mb-1">
                      <CountUp end={s.val} suffix={s.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════ MARKETS (interactive) ══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <Parallax speed={0.18} className="absolute top-10 start-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <Parallax speed={-0.25} className="absolute bottom-10 end-10 h-80 w-80 rounded-full bg-primary/8 blur-[140px]" />

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('الأسواق المالية', 'Financial Markets')}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">
                <AnimatedText text={t('markets.title')} className="gradient-text-soft" />
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t('markets.subtitle')}</p>
            </div>
          </AnimatedSection>

          {/* Market Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {['forex', 'crypto', 'stocks'].map((market) => {
              const Icon = marketIcons[market];
              const active = activeMarket === market;
              return (
                <motion.button
                  key={market}
                  onClick={() => setActiveMarket(market)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-colors duration-300 border ${
                    active
                      ? 'text-primary-foreground border-primary'
                      : 'text-muted-foreground border-primary/20 hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="market-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-neon"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {t(`markets.${market}`)}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeMarket}
              initial={{ opacity: 0, y: 30, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, rotateX: -6 }}
              transition={{ duration: 0.5 }}
              style={{ transformPerspective: 1000 }}
              className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-primary/25 glass-strong shadow-neon"
            >
              {/* Image Side */}
              <div className="relative h-64 lg:h-[460px] overflow-hidden group">
                <motion.img
                  key={activeMarket + '-img'}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  src={marketImages[activeMarket]}
                  alt={activeMarket}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 rtl:bg-gradient-to-l" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent lg:hidden" />
                <div className="absolute bottom-0 end-0 top-0 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent hidden lg:block" />
              </div>

              {/* Data Side */}
              <div className="p-8 lg:p-10 flex flex-col justify-center relative">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const Icon = marketIcons[activeMarket];
                    return (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-neon">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-2xl font-bold">{t(`markets.${activeMarket}`)}</h3>
                    <p className="text-xs text-primary flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                      {l('تحديث مباشر', 'Live Updates')}
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {t(`markets.${activeMarket}Desc`)}
                </p>

                <div className="space-y-2">
                  {prices
                    .filter((p) => p.category === activeMarket)
                    .map((p, idx) => (
                      <motion.div
                        key={p.symbol}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: language === 'ar' ? -6 : 6 }}
                        className="flex items-center justify-between bg-background/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary/10 hover:border-primary/40 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                          <span className="font-bold text-sm">{p.symbol}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm">{p.price.toLocaleString()}</span>
                          <span
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.change >= 0 ? 'text-chart-up bg-chart-up/10' : 'text-destructive bg-destructive/10'
                            }`}
                          >
                            {p.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {p.change >= 0 ? '+' : ''}
                            {p.change}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                </div>

                <Link to="/courses" className="mt-6 inline-flex">
                  <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    {l('استكشف الدورات', 'Explore Courses')}
                    <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════ SERVICES (3D tilt cards) ══════════════ */}
      <section className="py-24 relative bg-card/30 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('ما نقدمه', 'Our Services')}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">
                <AnimatedText text={t('services.title')} className="gradient-text-soft" />
              </h2>
              <p className="text-muted-foreground">{t('services.subtitle')}</p>
            </div>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1200">
            {[1, 2, 3, 4, 5, 6].map((i) => {
              const Icon = serviceIcons[i - 1];
              return (
                <StaggerItem key={i}>
                  <TiltCard>
                    <div className="relative h-full rounded-2xl border border-primary/15 glass p-6 overflow-hidden group">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 gradient-glow" />
                      <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all duration-500">
                          <Icon className="h-7 w-7" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                          {t(`services.s${i}_title`)}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t(`services.s${i}_desc`)}
                        </p>
                        <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                          {l('اكتشف المزيد', 'Learn more')}
                          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════ ABOUT WITH PARALLAX ══════════════ */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <Parallax speed={0.2} scale>
            <div className="relative rounded-3xl h-80 md:h-[460px] overflow-hidden border border-primary/20 shadow-neon">
              <img src={heroSlide1} alt="Trading Floor" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 grid-bg opacity-40" />
              <motion.img
                src={logo}
                alt="AlJawad Trading"
                className="absolute bottom-6 start-6 h-16 w-auto drop-shadow-2xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />
              <div className="absolute top-4 end-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-primary/20 text-xs text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                {l('منذ 2015', 'Since 2015')}
              </div>
            </div>
          </Parallax>
          <ScrollReveal delay={0.1}>
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
              {l('من نحن', 'About us')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">
              <AnimatedText text={t('about_section.title')} className="gradient-text-soft" />
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{t('about_section.subtitle')}</p>
            <ul className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all duration-300">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm leading-relaxed pt-1">{t(`about_section.bullet${i}`)}</span>
                </motion.li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS — curvy scroll timeline ══════════════ */}
      <section className="py-24 relative bg-card/30 border-y border-primary/10 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('الطريقة', 'The process')}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold">
                <AnimatedText text={t('howItWorks.title')} className="gradient-text-soft" />
              </h2>
              <p className="text-muted-foreground mt-4 text-sm md:text-base max-w-xl mx-auto">
                {l(
                  'تابع مسارك على طول المسار — تتكشف كل خطوة مع كل تمريرة.',
                  'Follow your journey along the trail — each step unfolds as you scroll.'
                )}
              </p>
            </div>
          </AnimatedSection>

          <CurvyTimeline
            rtl={language === 'ar'}
            steps={[
              { icon: UserPlus,  title: t('howItWorks.step1_title'), description: t('howItWorks.step1_desc') },
              { icon: BookOpen,  title: t('howItWorks.step2_title'), description: t('howItWorks.step2_desc') },
              { icon: Target,    title: t('howItWorks.step3_title'), description: t('howItWorks.step3_desc') },
              { icon: Trophy,    title: t('howItWorks.step4_title'), description: t('howItWorks.step4_desc') },
            ]}
          />
        </div>
      </section>


      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('شهادات العملاء', 'Testimonials')}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">
                <AnimatedText text={t('testimonials.title')} className="gradient-text-soft" />
              </h2>
              <p className="text-muted-foreground">{t('testimonials.subtitle')}</p>
            </div>
          </AnimatedSection>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockTestimonials.map((item) => (
              <StaggerItem key={item.id}>
                <TiltCard intensity={6}>
                  <div className="relative h-full glass rounded-2xl p-6 flex flex-col overflow-hidden group border border-primary/10 hover:border-primary/30 transition-colors">
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-center gap-1 mb-3 text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-primary" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-5 leading-relaxed flex-1">
                        &ldquo;{l(item.text_ar, item.text_en)}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center font-bold text-sm text-primary-foreground shadow-neon">
                          {l(item.name_ar, item.name_en)[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{l(item.name_ar, item.name_en)}</div>
                          <div className="text-xs text-primary">{l(item.role_ar, item.role_en)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════ CONTACT ══════════════ */}
      <section className="py-24 relative bg-card/30 border-t border-primary/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('تواصل', 'Get in touch')}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">
                <AnimatedText text={t('contact_section.title')} className="gradient-text-soft" />
              </h2>
              <p className="text-muted-foreground">{t('contact_section.subtitle')}</p>
            </div>
          </AnimatedSection>
          <ScrollReveal delay={0.15}>
            <div className="grid md:grid-cols-2 gap-8">
              <form onSubmit={handleContact} className="space-y-4">
                {[
                  { key: 'name', placeholder: t('contact_section.name'), type: 'text' },
                  { key: 'email', placeholder: t('contact_section.email'), type: 'email' },
                  { key: 'phone', placeholder: t('contact_section.phone'), type: 'text' },
                ].map((f) => (
                  <InputField
                    key={f.key}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={contactForm[f.key]}
                    onChange={(e) => setContactForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required={f.key !== 'phone'}
                  />
                ))}
                <TextareaField
                  placeholder={t('contact_section.message')}
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  rows={4}
                  required
                />
                <MagneticButton className="w-full">
                  <Button type="submit" variant="accent" className="w-full shadow-neon">
                    {t('contact_section.send')}
                    <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Button>
                </MagneticButton>
              </form>
              <div className="space-y-4 text-sm">
                {[
                  { label: l('العنوان', 'Address'), value: t('contact_section.address') },
                  { label: l('الهاتف', 'Phone'), value: t('contact_section.phone_val') },
                  { label: l('البريد', 'Email'), value: t('contact_section.email_val') },
                ].map((c, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: language === 'ar' ? -6 : 6 }}
                    className="glass rounded-xl border border-primary/10 p-5 hover:border-primary/30 transition-all"
                  >
                    <strong className="text-primary">{c.label}:</strong>
                    <br />
                    {c.value}
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

/* ---------- local helpers ---------- */

const InputField = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${className}`}
  />
);
const TextareaField = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all resize-none ${className}`}
  />
);

/**
 * 3D tilt card — follows cursor with a subtle parallax and specular glare.
 */
const TiltCard = ({ children, intensity = 8 }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(0)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative h-full transition-transform duration-300 ease-out will-change-transform"
      style={{
        backgroundImage:
          'radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), hsl(195 65% 55% / 0.08), transparent 60%)',
      }}
    >
      {children}
    </div>
  );
};

export default Index;
