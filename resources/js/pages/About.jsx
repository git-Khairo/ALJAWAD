import { useRef, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Eye, Users, Award, ShieldCheck } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { Parallax, ScrollReveal } from '@/components/interactive/ParallaxSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import { motion, useScroll, useTransform } from 'framer-motion';

const FloatingLogo3D = lazy(() => import('@/components/three/FloatingLogo3D'));

const teamMembers = [
  { name_ar: 'سيلفا', name_en: 'Silva', role_ar: 'المؤسس والرئيس التنفيذي', role_en: 'Founder & CEO', initials: 'سـ' },
  { name_ar: 'محمد خير', name_en: 'Mhd Khair', role_ar: 'المدير التقني والمشرف العام', role_en: 'CTO & General Supervisor', initials: 'م' },
  { name_ar: 'علي', name_en: 'Ali', role_ar: 'رئيس قسم التحليل والاستشارات', role_en: 'Head of Analysis & Advisory', initials: 'ع' },
  { name_ar: 'محمد العوير', name_en: 'Mhd Alaweer', role_ar: 'مؤسس الفرع والمدير الإداري — طرطوس', role_en: 'Branch Founder & MD — Tartus', initials: 'مع' },
  { name_ar: 'اغيد', name_en: 'Aghiad', role_ar: 'مدرّب مالي ورئيس العلاقات العامة — طرطوس', role_en: 'Financial Trainer & Head of PR — Tartus', initials: 'أغ' },
  { name_ar: 'إلياس', name_en: 'Elias', role_ar: 'مختص التواصل الاجتماعي', role_en: 'Social Media Specialist', initials: 'إل' },
  { name_ar: 'ميرفا', name_en: 'Merva', role_ar: 'مختصة التواصل الاجتماعي', role_en: 'Social Media Specialist', initials: 'مر' },
  { name_ar: 'بتول', name_en: 'Batoul', role_ar: 'رئيسة خدمة العملاء', role_en: 'Head of Customer Service', initials: 'بت' },
  { name_ar: 'ابراهيم', name_en: 'Ibrahim', role_ar: 'مدرب مالي', role_en: 'Financial Trainer', initials: 'اب' },
];

const About = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const logoHovered = useRef(false);
  const timelineRef = useRef(null);

  const { scrollYProgress: tlProg } = useScroll({
    target: timelineRef,
    offset: ['start 80%', 'end 20%'],
  });
  const lineHeight = useTransform(tlProg, [0, 1], ['0%', '100%']);

  const milestones = [
    { year: '2024', ar: 'تأسيس الجواد للتداول', en: 'AlJawad Trading founded' },
    { year: '2025', ar: 'إطلاق برامج التعليم والتحليل', en: 'Education & analysis programs launched' },
    { year: '2025', ar: 'افتتاح فرع طرطوس', en: 'Tartus branch opened' },
    { year: '2026', ar: 'توسع الخدمات وزيادة العملاء', en: 'Service expansion & client growth' },
  ];

  return (
    <div className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
              {l('من نحن', 'About us')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-5">
              <AnimatedText text={t('pages.about.title')} className="gradient-text" />
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{t('pages.about.content')}</p>
          </div>
        </AnimatedSection>

        {/* Brand story with 3D block */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24 max-w-6xl mx-auto">
          <Parallax speed={0.18} scale>
            <div
              onMouseEnter={() => (logoHovered.current = true)}
              onMouseLeave={() => (logoHovered.current = false)}
              className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border border-primary/20 gradient-hero shadow-neon"
            >
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute -inset-20 animate-spin-slow">
                <div className="absolute inset-0 gradient-conic" />
              </div>
              <Suspense fallback={<div className="absolute inset-0" />}>
                <FloatingLogo3D hovered={logoHovered} className="absolute inset-0" />
              </Suspense>
              <div className="absolute bottom-4 inset-x-0 text-center text-xs text-primary font-semibold tracking-widest uppercase">
                {l('الجواد للتداول', 'AlJawad Trading')}
              </div>
            </div>
          </Parallax>
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-5 gradient-text-soft">
              {l('قصة الجواد للتداول', 'The AlJawad Trading Story')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {l(
                'شركة الجواد للتداول هي شركة سورية متخصصة في مجال التداول المالي، تأسست على يد مجموعة من المتداولين المحترفين الذين جمعتهم رؤية واحدة: تقديم بيئة تداول نزيهة وشفافة بعيدة عن الضبابية والتضليل.',
                'AlJawad Trading is a Syrian company specializing in financial trading, founded by a group of professional traders united by a single vision: to provide an honest, transparent trading environment free from ambiguity and misleading practices.'
              )}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {l(
                'من خلال مجموعة متكاملة من الخدمات تشمل التحليل الفني اليومي، ومتابعة VIP، والتعليم من الصفر للاحتراف، وحلول الإيداع والسحب المحلية، يسعى فريق الجواد إلى تمكين كل متداول من بناء أساس متين في عالم التداول.',
                'Through a comprehensive suite of services including daily technical analysis, VIP tracking, education from zero-to-pro, and local deposit & withdrawal solutions, the AlJawad team strives to help every trader build a solid foundation in the world of trading.'
              )}
            </p>
          </ScrollReveal>
        </div>

        {/* Scroll Timeline — milestones */}
        <div ref={timelineRef} className="relative max-w-3xl mx-auto mb-24">
          <div className="absolute top-0 bottom-0 start-4 w-px bg-primary/10" />
          <motion.div
            className="absolute top-0 start-4 w-px bg-gradient-to-b from-primary via-primary to-primary/0 shadow-[0_0_16px_hsl(195_65%_55%/0.7)]"
            style={{ height: lineHeight }}
          />
          <AnimatedSection className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              {l('محطات في رحلتنا', 'Milestones in our journey')}
            </h2>
          </AnimatedSection>
          <div className="space-y-10">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: language === 'ar' ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative ps-12 flex items-baseline gap-6"
              >
                <div className="absolute start-0 top-2 w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center shadow-neon">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-glow" />
                </div>
                <div className="text-2xl font-extrabold text-primary w-20 shrink-0">{m.year}</div>
                <div className="text-foreground/90">{l(m.ar, m.en)}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <StaggerContainer className="grid md:grid-cols-2 gap-6 mb-24 max-w-5xl mx-auto">
          {[
            { icon: Target, title: t('pages.about.mission'), text: t('pages.about.missionText') },
            { icon: Eye, title: t('pages.about.vision'), text: t('pages.about.visionText') },
          ].map((b, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -6 }}
                className="relative glass rounded-3xl border border-primary/15 p-8 h-full overflow-hidden group"
              >
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/25 flex items-center justify-center mb-4 shadow-neon">
                  <b.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-3">{b.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{b.text}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Values */}
        <AnimatedSection delay={0.1}>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            <AnimatedText text={t('pages.about.values')} className="gradient-text-soft" />
          </h2>
        </AnimatedSection>
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24 max-w-5xl mx-auto">
          {[
            { icon: Target, num: 1 },
            { icon: Award, num: 2 },
            { icon: ShieldCheck, num: 3 },
            { icon: Users, num: 4 },
          ].map(({ icon: Icon, num }) => (
            <StaggerItem key={num}>
              <motion.div
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 260 }}
                className="relative flex flex-col items-center text-center glass border border-primary/10 rounded-2xl p-6 group overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity gradient-glow" />
                <div className="relative w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all duration-500">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium relative">{t(`pages.about.value${num}`)}</span>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Team */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
              {l('الفريق', 'The team')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3">
              <AnimatedText text={l('فريق القيادة', 'Leadership Team')} className="gradient-text-soft" />
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {l('خبراء ومتخصصون يقودون رحلتك في عالم التداول', 'Experts and specialists leading your trading journey')}
            </p>
          </div>
        </AnimatedSection>
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {teamMembers.map((member, idx) => (
            <StaggerItem key={idx}>
              <motion.div
                whileHover={{ y: -8, rotateX: 4, rotateY: -3 }}
                transition={{ type: 'spring', stiffness: 260 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative glass rounded-2xl border border-primary/10 p-6 text-center group overflow-hidden"
              >
                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                  background: 'linear-gradient(135deg, hsl(195 65% 55% / 0.15), transparent 60%)',
                }} />
                <div className="relative">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/30 shadow-neon group-hover:shadow-neon-hover transition-all" />
                    <div className="relative w-full h-full rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {member.initials}
                    </div>
                    <div className="absolute -inset-2 rounded-full border border-primary/25 animate-spin-slow pointer-events-none" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{l(member.name_ar, member.name_en)}</h3>
                  <p className="text-sm text-primary">{l(member.role_ar, member.role_en)}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
};

export default About;
