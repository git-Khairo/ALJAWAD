import { useRef, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Eye, Users, Award, ShieldCheck } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { Parallax, ScrollReveal } from '@/components/interactive/ParallaxSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import { motion, useScroll, useTransform } from 'framer-motion';

const FloatingLogo3D = lazy(() => import('@/components/three/FloatingLogo3D'));

const teamMembers = [
  { name_ar: 'م. سعد الجواد', name_en: 'Eng. Saad AlJawad', role_ar: 'المؤسس والرئيس التنفيذي', role_en: 'Founder & CEO', initials: 'سج' },
  { name_ar: 'أ. نور العلي', name_en: 'Ms. Noor Al-Ali', role_ar: 'رئيسة قسم التحليل', role_en: 'Head of Analysis', initials: 'نع' },
  { name_ar: 'د. فهد القحطاني', name_en: 'Dr. Fahad Al-Qahtani', role_ar: 'كبير المحللين الاقتصاديين', role_en: 'Chief Economist', initials: 'فق' },
  { name_ar: 'أ. ليلى أحمد', name_en: 'Ms. Layla Ahmed', role_ar: 'مديرة تطوير المنتجات', role_en: 'Product Development Manager', initials: 'لأ' },
  { name_ar: 'م. خالد إبراهيم', name_en: 'Eng. Khaled Ibrahim', role_ar: 'مدير التقنية', role_en: 'CTO', initials: 'خإ' },
  { name_ar: 'أ. سارة يوسف', name_en: 'Ms. Sara Youssef', role_ar: 'مديرة علاقات العملاء', role_en: 'Client Relations Manager', initials: 'سي' },
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
    { year: '2015', ar: 'انطلاق الجواد', en: 'AlJawad launch' },
    { year: '2018', ar: 'توسع إقليمي', en: 'Regional expansion' },
    { year: '2021', ar: 'منصة تحليلية جديدة', en: 'New analytics platform' },
    { year: '2024', ar: '15,000+ متداول', en: '15,000+ traders' },
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
                'تأسست الجواد للتداول بهدف سد الفجوة بين المتداولين العرب والأسواق المالية العالمية. من خلال توفير أحدث التقنيات وأقوى أدوات التحليل، نمكّن متداولينا من اتخاذ قرارات مدروسة وتحقيق أهدافهم المالية.',
                'AlJawad Trading was founded to bridge the gap between Arab traders and global financial markets. By providing cutting-edge technology and powerful analysis tools, we empower our traders to make informed decisions and achieve their financial goals.'
              )}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {l(
                'مع فريق من الخبراء والمحللين المتخصصين، نقدم تجربة تداول متكاملة تشمل التعليم والتحليل والتنفيذ بأعلى معايير الجودة والأمان.',
                'With a team of specialized experts and analysts, we deliver a comprehensive trading experience covering education, analysis, and execution with the highest standards of quality and security.'
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
