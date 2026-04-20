import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, LineChart, Shield, Zap, BarChart3, GraduationCap, ArrowRight } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import { Parallax } from '@/components/interactive/ParallaxSection';
import CountUp from '@/components/interactive/CountUp';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';

const services = [
  { icon: Activity, tint: 'from-primary/25 to-primary/5', accent: 'text-primary', num: 1 },
  { icon: LineChart, tint: 'from-emerald-500/25 to-emerald-500/5', accent: 'text-emerald-400', num: 2 },
  { icon: Shield, tint: 'from-amber-500/25 to-amber-500/5', accent: 'text-amber-400', num: 3 },
  { icon: Zap, tint: 'from-violet-500/25 to-violet-500/5', accent: 'text-violet-400', num: 4 },
  { icon: BarChart3, tint: 'from-rose-500/25 to-rose-500/5', accent: 'text-rose-400', num: 5 },
  { icon: GraduationCap, tint: 'from-cyan-500/25 to-cyan-500/5', accent: 'text-cyan-400', num: 6 },
];

const Services = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const [activeService, setActiveService] = useState(0);
  const ActiveIcon = services[activeService].icon;

  return (
    <div className="py-20 relative">
      <Parallax speed={0.2} className="absolute top-40 start-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <Parallax speed={-0.25} className="absolute bottom-40 end-10 h-80 w-80 rounded-full bg-primary/8 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 shadow-[0_0_20px_hsl(195_65%_55%/0.2)]">
              {l('ما نقدمه', 'What we offer')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              <AnimatedText text={t('services.title')} className="gradient-text" />
            </h1>
            <p className="text-muted-foreground text-lg">{t('services.subtitle')}</p>
          </div>
        </AnimatedSection>

        {/* Interactive Showcase */}
        <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto mb-24">
          {/* Service selector */}
          <div className="lg:col-span-2 space-y-2">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              const isActive = activeService === idx;
              return (
                <motion.button
                  key={idx}
                  onClick={() => setActiveService(idx)}
                  whileHover={{ x: language === 'ar' ? -4 : 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-start transition-all duration-300 border ${
                    isActive
                      ? 'bg-gradient-to-r ' + svc.tint + ' border-primary/30 shadow-neon'
                      : 'border-transparent hover:border-primary/15 hover:bg-primary/5'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-background/60 border border-primary/10 ' + svc.accent
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t(`services.s${svc.num}_title`)}
                    </h3>
                    <div className="text-xs text-muted-foreground/80 truncate">
                      {t(`services.s${svc.num}_desc`).split(' ').slice(0, 6).join(' ')}…
                    </div>
                  </div>
                  {isActive && (
                    <motion.div layoutId="service-arrow" className="ms-auto text-primary">
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeService}
                initial={{ opacity: 0, scale: 0.96, rotateY: 6 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.96, rotateY: -6 }}
                transition={{ duration: 0.5 }}
                style={{ transformPerspective: 1000 }}
                className={`relative rounded-3xl border border-primary/20 p-8 md:p-10 h-full flex flex-col justify-center min-h-[360px] overflow-hidden glass-strong`}
              >
                {/* Rotating background accents */}
                <div className="absolute -top-16 -end-16 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute -bottom-16 -start-16 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute inset-0 grid-bg opacity-25" />

                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                  animate={{ opacity: 0.08, scale: 1, rotate: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute top-6 end-6"
                >
                  <ActiveIcon className="h-40 w-40" />
                </motion.div>

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 shadow-neon"
                  >
                    <ActiveIcon className="h-8 w-8" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    {t(`services.s${services[activeService].num}_title`)}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                    {t(`services.s${services[activeService].num}_desc`)}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-chart-up animate-pulse-glow" />
                      {l('تحديثات مستمرة', 'Continuous Updates')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                      {l('دعم احترافي', 'Professional Support')}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Service cards grid (scroll reveal) */}
        <AnimatedSection className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold">
            <AnimatedText text={l('كل الخدمات لمحة واحدة', 'All services at a glance')} className="gradient-text-soft" />
          </h3>
        </AnimatedSection>
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-24 perspective-1200">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <StaggerItem key={idx}>
                <Tilt3DCard>
                  <div
                    className={`relative h-full rounded-2xl border border-primary/15 glass p-6 overflow-hidden group cursor-pointer ${
                      activeService === idx ? 'ring-2 ring-primary/40' : ''
                    }`}
                    onClick={() => setActiveService(idx)}
                  >
                    <div className={`absolute -top-14 -right-14 h-32 w-32 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 ${svc.accent} flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all duration-500`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-semibold mb-2">{t(`services.s${svc.num}_title`)}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(`services.s${svc.num}_desc`)}
                      </p>
                    </div>
                  </div>
                </Tilt3DCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Stats */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { val: 0.1, suffix: 's', label: l('سرعة التنفيذ', 'Execution Speed'), float: true },
              { val: 100, suffix: '+', label: l('مؤشر فني', 'Technical Indicators') },
              { val: 24, suffix: '/7', label: l('دعم العملاء', 'Customer Support') },
              { val: 50, suffix: '+', label: l('سوق متاح', 'Markets Available') },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative text-center p-6 rounded-2xl glass border border-primary/10 overflow-hidden group"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity gradient-glow" />
                <div className="relative">
                  <div className="text-3xl md:text-4xl font-extrabold gradient-text mb-1">
                    {stat.float ? (
                      <span>{stat.val}{stat.suffix}</span>
                    ) : (
                      <CountUp end={stat.val} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

const Tilt3DCard = ({ children, intensity = 8 }) => {
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
    if (el) el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative h-full transition-transform duration-300 ease-out will-change-transform"
      style={{
        backgroundImage:
          'radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), hsl(195 65% 55% / 0.1), transparent 60%)',
      }}
    >
      {children}
    </div>
  );
};

export default Services;
