import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Target, Eye, Users, Award, ShieldCheck, Headphones } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

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
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('pages.about.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">{t('pages.about.content')}</p>
          </div>
        </AnimatedSection>

        {/* Brand story with logo */}
        <AnimatedSection delay={0.1}>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20 max-w-5xl mx-auto">
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="gradient-hero rounded-3xl p-12 flex items-center justify-center border border-border relative overflow-hidden"
              >
                <div className="absolute inset-0 grid-bg opacity-30" />
                <img src={logo} alt="AlJawad Trading" className="h-48 w-auto relative z-10 drop-shadow-2xl" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">
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
            </div>
          </div>
        </AnimatedSection>

        {/* Mission & Vision */}
        <StaggerContainer className="grid md:grid-cols-2 gap-6 mb-20 max-w-5xl mx-auto">
          <StaggerItem>
            <motion.div whileHover={{ y: -4 }} className="bg-card rounded-2xl border p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold mb-3">{t('pages.about.mission')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('pages.about.missionText')}</p>
            </motion.div>
          </StaggerItem>
          <StaggerItem>
            <motion.div whileHover={{ y: -4 }} className="bg-card rounded-2xl border p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Eye className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold mb-3">{t('pages.about.vision')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('pages.about.visionText')}</p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Values */}
        <AnimatedSection delay={0.2}>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('pages.about.values')}</h2>
        </AnimatedSection>
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20 max-w-5xl mx-auto">
          {[
            { icon: Target, num: 1 },
            { icon: Award, num: 2 },
            { icon: ShieldCheck, num: 3 },
            { icon: Users, num: 4 },
          ].map(({ icon: Icon, num }) => (
            <StaggerItem key={num}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex flex-col items-center text-center bg-card border rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{t(`pages.about.value${num}`)}</span>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Team Section */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {l('فريق القيادة', 'Leadership Team')}
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
                whileHover={{ y: -6 }}
                className="bg-card rounded-2xl border p-6 text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                  {member.initials}
                </div>
                <h3 className="font-bold text-lg mb-1">{l(member.name_ar, member.name_en)}</h3>
                <p className="text-sm text-primary">{l(member.role_ar, member.role_en)}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
};

export default About;
