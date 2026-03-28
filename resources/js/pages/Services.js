import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, LineChart, Shield, Zap, BarChart3, GraduationCap, ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import { useState } from 'react';

const services = [
  { icon: Activity, color: 'from-primary/20 to-primary/5', accent: 'text-primary', num: 1 },
  { icon: LineChart, color: 'from-emerald-500/20 to-emerald-500/5', accent: 'text-emerald-400', num: 2 },
  { icon: Shield, color: 'from-amber-500/20 to-amber-500/5', accent: 'text-amber-400', num: 3 },
  { icon: Zap, color: 'from-violet-500/20 to-violet-500/5', accent: 'text-violet-400', num: 4 },
  { icon: BarChart3, color: 'from-rose-500/20 to-rose-500/5', accent: 'text-rose-400', num: 5 },
  { icon: GraduationCap, color: 'from-cyan-500/20 to-cyan-500/5', accent: 'text-cyan-400', num: 6 },
];

const Services = () => {
  const { t, language } = useLanguage();
  const [activeService, setActiveService] = useState(0);
  const ActiveIcon = services[activeService].icon;

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Hero header */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {language === 'ar' ? '🚀 ما نقدمه' : '🚀 What We Offer'}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('services.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('services.subtitle')}</p>
          </div>
        </AnimatedSection>

        {/* Interactive showcase */}
        <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto mb-20">
          {/* Service selector - vertical tabs */}
          <div className="lg:col-span-2 space-y-2">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              const isActive = activeService === idx;
              return (
                <motion.button
                  key={idx}
                  onClick={() => setActiveService(idx)}
                  whileHover={{ x: language === 'ar' ? -4 : 4 }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-start transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r ' + svc.color + ' border border-primary/20 shadow-lg'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary ' + svc.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t(`services.s${svc.num}_title`)}
                    </h3>
                  </div>
                  {isActive && (
                    <motion.div layoutId="service-arrow" className="ms-auto text-primary">
                      {language === 'ar' ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Detail panel */}
          <motion.div
            key={activeService}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-3 relative"
          >
            <div className={`rounded-2xl border p-8 md:p-10 bg-gradient-to-br ${services[activeService].color} h-full flex flex-col justify-center min-h-[320px]`}>
              <div className="absolute top-6 end-6 opacity-10">
                <ActiveIcon className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 shadow-lg shadow-primary/25`}>
                  <ActiveIcon className="h-8 w-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  {t(`services.s${services[activeService].num}_title`)}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                  {t(`services.s${services[activeService].num}_desc`)}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-chart-up" />
                    {language === 'ar' ? 'تحديثات مستمرة' : 'Continuous Updates'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {language === 'ar' ? 'دعم احترافي' : 'Professional Support'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <AnimatedSection delay={0.3}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { val: '0.1s', label: language === 'ar' ? 'سرعة التنفيذ' : 'Execution Speed' },
              { val: '100+', label: language === 'ar' ? 'مؤشر فني' : 'Technical Indicators' },
              { val: '24/7', label: language === 'ar' ? 'دعم العملاء' : 'Customer Support' },
              { val: '50+', label: language === 'ar' ? 'سوق متاح' : 'Markets Available' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 rounded-xl bg-card border border-border"
              >
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.val}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Services;
