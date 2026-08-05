import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { Parallax, ScrollReveal } from '@/components/interactive/ParallaxSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import MagneticButton from '@/components/interactive/MagneticButton';
import CountUp from '@/components/interactive/CountUp';
import { CurvyTimeline } from '@/components/interactive/CurvyTimeline';
import HeroStage from '@/components/hero/HeroStage';
import EditorialGrid from '@/components/hero/EditorialGrid';
import BlurUpText from '@/components/hero/BlurUpText';
import {
  TrendingUp, BarChart3, Shield, Zap, LineChart, GraduationCap,
  CheckCircle, ArrowUpRight, ArrowDownRight, Bitcoin, Activity,
  ChevronDown, ChevronRight, Sparkles, Star,
  UserPlus, BookOpen, Target, Trophy, Clock, LifeBuoy,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi, statsApi } from '@/lib/api';

import { motion, useScroll, useTransform } from 'framer-motion';
import logo from '@/assets/logo.png';
import heroSlide1 from '@/assets/hero-slide-1.jpg';

const blogCategoryIcons = { forex: TrendingUp, crypto: Bitcoin, stocks: BarChart3 };
const blogCategoryColors = {
  forex: 'from-primary/25 to-primary/5',
  crypto: 'from-amber-500/25 to-amber-500/5',
  stocks: 'from-violet-500/25 to-violet-500/5',
};

const marketData = [
  { symbol: 'EUR/USD', price: 1.0856, change: +0.32, category: 'forex' },
  { symbol: 'GBP/USD', price: 1.2734, change: -0.15, category: 'forex' },
  { symbol: 'USD/JPY', price: 149.82, change: +0.45, category: 'forex' },
  { symbol: 'BTC/USD', price: 104523, change: +2.14, category: 'crypto' },
  { symbol: 'ETH/USD', price: 3856,   change: +1.87, category: 'crypto' },
  { symbol: 'SOL/USD', price: 187.45, change: -3.21, category: 'crypto' },
  { symbol: 'AAPL',    price: 198.45, change: +0.82, category: 'stocks' },
  { symbol: 'TSLA',    price: 256.78, change: -1.24, category: 'stocks' },
  { symbol: 'NVDA',    price: 875.32, change: +3.45, category: 'stocks' },
];

const Index = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const { blogPosts } = useAppData();

  const serviceIcons = [Activity, LineChart, Shield, Zap, BarChart3, GraduationCap];

  // The three most recent published posts headline the blog section.
  const latestPosts = useMemo(
    () =>
      [...(blogPosts ?? [])]
        .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
        .slice(0, 3),
    [blogPosts]
  );

  /* ---------- Hero ---------- */
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroContentY = useTransform(heroProgress, [0, 1], ['0%', '30%']);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  // Arabic is cursive: splitting it per letter would break the joining forms,
  // so only Latin headlines animate character by character.
  const isLatinHeadline = language !== 'ar';

  /* ---------- Live prices ---------- */
  // Real quotes come from our backend proxy (Twelve Data, cached server-side).
  // Both the ticker and the Financial Markets section read from `prices`,
  // so seeding this one source makes both go live at once. `marketData` is
  // only the initial placeholder until the first fetch resolves.
  const { data: liveQuotes } = useQuery({
    queryKey: ['market-quotes'],
    queryFn: async () => (await marketApi.quotes()).data.data,
    refetchInterval: 60000,           // re-pull the (server-cached) quotes each minute
    refetchOnWindowFocus: false,
    staleTime: 55000,
  });

  const [prices, setPrices] = useState(marketData);

  // Reset the baseline whenever fresh real quotes arrive.
  useEffect(() => {
    if (liveQuotes?.length) setPrices(liveQuotes);
  }, [liveQuotes]);

  // Subtle wiggle between fetches so the tape always feels alive. The next
  // real fetch (every 60s) snaps values back to the true market price.
  // Closed markets (e.g. forex/stocks on weekends) stay frozen — accurate.
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) =>
          (p.is_market_open ?? true)
            ? {
                ...p,
                price: +(p.price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(
                  p.price > 1000 ? 0 : p.price > 100 ? 2 : 4
                ),
              }
            : p
        )
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Headline stats (trust cards) ---------- */
  // Active clients + course count come live from the database; markets and
  // satisfaction stay static (satisfaction will move to a ratings system later).
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => (await statsApi.get()).data.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const trustStats = [
    { val: stats?.active_clients ?? 0, suffix: '+', label: t('trust.students') },     // DB: active clients
    { val: stats?.active_members ?? 0, suffix: '+', label: t('trust.members') },       // DB: active access grants
    { val: 500, suffix: '+', label: t('trust.experts') },                             // static: markets available
    { val: 98, suffix: '%', label: t('trust.satisfaction') },                          // static (future ratings)
  ];

  return (
    <div className="overflow-x-clip">
      {/* ══════════════ HERO — bronze horse stage ══════════════ */}
      <section
        ref={heroRef}
        className="relative flex min-h-[88vh] items-center overflow-hidden isolate bg-[#10171F] md:min-h-[92vh]"
      >
        {/* ── The 3D stage: bronze horse, forge sparks, liquid-metal waves ── */}
        <HeroStage
          className="absolute inset-0 z-0"
          lookAtOffset={language === 'ar' ? 0.9 : -0.9}
        />

        {/* Scrims: keep the headline legible over the statue, and tint the
            stage toward the brand navy. */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] rtl:hidden"
          style={{
            background:
              'linear-gradient(100deg, rgba(16,23,31,0.95) 0%, rgba(16,23,31,0.88) 30%, rgba(16,23,31,0.45) 48%, rgba(16,23,31,0.05) 68%, rgba(16,23,31,0.30) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] ltr:hidden"
          style={{
            background:
              'linear-gradient(260deg, rgba(16,23,31,0.95) 0%, rgba(16,23,31,0.88) 30%, rgba(16,23,31,0.45) 48%, rgba(16,23,31,0.05) 68%, rgba(16,23,31,0.30) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(to top, rgba(16,23,31,0.85) 0%, transparent 45%)' }}
        />
        {/* Teal glow pool */}
        <div
          className="pointer-events-none absolute -top-32 start-[-12rem] z-[1] h-[40rem] w-[40rem] rounded-full"
          style={{ background: 'radial-gradient(closest-side, hsl(195 85% 60% / 0.20), transparent 70%)' }}
        />

        {/* Editorial grid + stories-style scroll progress */}
        <EditorialGrid />

        {/* ── Content ── */}
        <motion.div
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          className="container relative z-10 mx-auto px-4 py-24 md:py-0"
        >
          <div className="max-w-4xl text-start">
            {/* Kicker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mb-6 inline-flex items-center gap-3"
            >
              <span className="h-px w-10 bg-primary" />
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-primary">
                {l('منصتك للتداول الاحترافي', 'Your Professional Trading Platform')}
              </span>
            </motion.div>

            {/* Headline — the site's own display treatment, revealed with the
                per-letter blur-up. Arabic animates per word, since splitting it
                per letter would break the cursive joining forms. */}
            <h1
              className="mb-6 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ color: 'hsl(200 20% 96%)' }}
            >
              <BlurUpText
                text={t('hero.title')}
                byChar={isLatinHeadline}
                stagger={isLatinHeadline ? 0.035 : 0.06}
              />
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.4 }}
              className="mb-8 max-w-xl text-base leading-relaxed text-white/75 md:text-lg"
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link to="/auth/register">
                <MagneticButton>
                  <Button variant="accent" size="lg" className="px-8 text-base shadow-neon shadow-neon-hover">
                    {t('hero.cta1')}
                    <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                  </Button>
                </MagneticButton>
              </Link>
              <Link to="/services">
                <MagneticButton strength={0.25}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 px-8 text-base text-white backdrop-blur-md hover:bg-white/10"
                  >
                    {t('hero.cta2')}
                  </Button>
                </MagneticButton>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-6 start-6 z-20 hidden flex-col items-start gap-2 font-mono text-[0.62rem] tracking-[0.28em] text-white/55 md:start-10 md:flex"
        >
          <span>{l('مرر للاستكشاف', 'SCROLL')}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="h-8 w-px bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>

        {/* Bottom seam into next section */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-20"
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
            {trustStats.map((s, i) => (
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

      {/* ══════════════ LATEST FROM THE BLOG ══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <Parallax speed={0.18} className="absolute top-10 start-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <Parallax speed={-0.25} className="absolute bottom-10 end-10 h-80 w-80 rounded-full bg-primary/8 blur-[140px]" />

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('المدونة', 'From the Blog')}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">
                <AnimatedText text={l('أحدث التحليلات والمقالات', 'Latest Analysis & Insights')} className="gradient-text-soft" />
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {l(
                  'قراءات موجزة في الأسواق والاستراتيجيات، محدّثة باستمرار من فريق المحللين.',
                  'Short reads on markets and strategy, published regularly by our analyst team.'
                )}
              </p>
            </div>
          </AnimatedSection>

          {latestPosts.length === 0 ? (
            <ScrollReveal>
              <div className="glass rounded-3xl border border-primary/15 p-12 text-center">
                <BookOpen className="h-10 w-10 text-primary/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {l('لا توجد مقالات منشورة بعد.', 'No articles published yet.')}
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <StaggerContainer className="grid gap-6 md:grid-cols-3">
              {latestPosts.map((post) => {
                const Icon = blogCategoryIcons[post.category] ?? BookOpen;
                return (
                  <StaggerItem key={post.id}>
                    <Link to={`/blog/${post.id}`} className="block h-full">
                      <motion.article
                        whileHover={{ y: -6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-primary/20 glass-strong transition-colors hover:border-primary/45"
                      >
                        {/* Cover */}
                        <div
                          className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${
                            blogCategoryColors[post.category] ?? 'from-primary/25 to-primary/5'
                          }`}
                        >
                          {post.image ? (
                            <img
                              src={post.image}
                              alt={l(post.title_ar, post.title_en)}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <>
                              <div className="absolute inset-0 grid-bg opacity-30" />
                              <Icon className="relative h-14 w-14 text-primary/70 drop-shadow-[0_0_30px_hsl(195_65%_55%/0.5)] transition-transform duration-500 group-hover:scale-110" />
                            </>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
                        </div>

                        {/* Body */}
                        <div className="flex flex-1 flex-col p-6">
                          <div className="mb-3 flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-primary/25 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                              {t(`blog.${post.category}`)}
                            </span>
                            {post.readTime && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {post.readTime} {t('blog.readTime')}
                              </span>
                            )}
                          </div>

                          <h3 className="mb-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary">
                            {l(post.title_ar, post.title_en)}
                          </h3>
                          <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {l(post.excerpt_ar, post.excerpt_en)}
                          </p>

                          <div className="mt-auto flex items-center justify-between border-t border-primary/10 pt-4">
                            <span className="text-xs text-muted-foreground">{post.date}</span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                              {l('اقرأ المزيد', 'Read more')}
                              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:rotate-[-90deg]" />
                            </span>
                          </div>
                        </div>
                      </motion.article>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}

          <ScrollReveal delay={0.15}>
            <div className="mt-12 text-center">
              <Link to="/blog" className="inline-flex">
                <MagneticButton strength={0.25}>
                  <Button variant="outline" size="lg" className="border-primary/30 px-8 text-primary hover:bg-primary/10">
                    {l('كل المقالات', 'View all articles')}
                    <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Button>
                </MagneticButton>
              </Link>
            </div>
          </ScrollReveal>
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
              {/* Contact goes through the support desk so every message becomes
                  a tracked ticket rather than an unrouted form post. */}
              <div className="glass-strong rounded-2xl border border-primary/20 p-8 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-neon mb-5">
                  <LifeBuoy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {l('افتح تذكرة دعم', 'Open a support ticket')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {l(
                    'أرسل استفسارك عبر مركز الدعم ليصل مباشرة إلى الفريق المختص، مع رقم تذكرة تتابع به الرد.',
                    'Send your enquiry through the support centre and it reaches the right team directly, with a ticket number you can track the reply on.'
                  )}
                </p>
                <Link to="/support" className="inline-flex">
                  <MagneticButton className="w-full">
                    <Button variant="accent" className="w-full shadow-neon">
                      {l('إرسال تذكرة', 'Send a ticket')}
                      <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                    </Button>
                  </MagneticButton>
                </Link>
              </div>
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
