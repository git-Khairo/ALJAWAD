import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { SectionHead } from '@/components/editorial/SectionHead';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

/**
 * About.
 *
 * The previous version put the nine-person team into nine identical glass
 * cards, each with a gradient avatar disc and a ring spinning around it. A
 * directory of real people reads as more credible set as a directory: name,
 * role, rule. That is also the only treatment that survives the team growing
 * to twenty.
 */

const team = [
  { name_ar: 'سيلفا',        name_en: 'Silva',       role_ar: 'المؤسس والرئيس التنفيذي',                role_en: 'Founder & CEO' },
  { name_ar: 'محمد خير',     name_en: 'Mhd Khair',   role_ar: 'المدير التقني والمشرف العام',            role_en: 'CTO & General Supervisor' },
  { name_ar: 'علي',          name_en: 'Ali',         role_ar: 'رئيس قسم التحليل والاستشارات',           role_en: 'Head of Analysis & Advisory' },
  { name_ar: 'محمد العوير',  name_en: 'Mhd Alaweer', role_ar: 'مؤسس الفرع والمدير الإداري، طرطوس',      role_en: 'Branch Founder & MD, Tartus' },
  { name_ar: 'اغيد',         name_en: 'Aghiad',      role_ar: 'مدرّب مالي ورئيس العلاقات العامة، طرطوس', role_en: 'Financial Trainer & Head of PR, Tartus' },
  { name_ar: 'إلياس',        name_en: 'Elias',       role_ar: 'مختص التواصل الاجتماعي',                 role_en: 'Social Media Specialist' },
  { name_ar: 'ميرفا',        name_en: 'Merva',       role_ar: 'مختصة التواصل الاجتماعي',                role_en: 'Social Media Specialist' },
  { name_ar: 'بتول',         name_en: 'Batoul',      role_ar: 'رئيسة خدمة العملاء',                     role_en: 'Head of Customer Service' },
  { name_ar: 'ابراهيم',      name_en: 'Ibrahim',     role_ar: 'مدرب مالي',                              role_en: 'Financial Trainer' },
];

const milestones = [
  { year: '2024', ar: 'تأسيس الجواد للتداول',            en: 'AlJawad Trading founded' },
  { year: '2025', ar: 'إطلاق برامج التعليم والتحليل',    en: 'Education and analysis programmes launched' },
  { year: '2025', ar: 'افتتاح فرع طرطوس',                en: 'Tartus branch opened' },
  { year: '2026', ar: 'توسع الخدمات وزيادة العملاء',     en: 'Service expansion and client growth' },
];

const About = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  return (
    <>
      {/* ═══════════ MASTHEAD ═══════════ */}
      <section className="container border-b border-rule py-16 md:py-24">
        <p className="eyebrow mb-5 animate-rise">{l('من نحن', 'About us')}</p>
        <h1
          className="measure animate-rise font-display text-display-sm font-bold text-foreground md:text-display-md"
          style={{ animationDelay: '60ms' }}
        >
          {t('pages.about.title')}
        </h1>
        <p
          className="measure animate-rise mt-6 text-lg leading-relaxed text-fg-muted"
          style={{ animationDelay: '140ms' }}
        >
          {t('pages.about.content')}
        </p>
      </section>

      {/* ═══════════ STORY ═══════════ */}
      <section className="container py-16 md:py-24">
        <AnimatedSection>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <h2 className="font-display text-display-xs font-bold text-foreground lg:col-span-4 md:text-display-sm">
              {l('قصة الجواد', 'The AlJawad story')}
            </h2>
            <div className="space-y-6 lg:col-span-7 lg:col-start-6">
              <p className="text-base leading-relaxed text-fg-muted md:text-lg">
                {l(
                  'شركة الجواد للتداول شركة سورية متخصصة في التداول المالي، تأسست على يد مجموعة من المتداولين المحترفين جمعتهم رؤية واحدة: تقديم بيئة تداول نزيهة وشفافة بعيدة عن الضبابية والتضليل.',
                  'AlJawad Trading is a Syrian company specialising in financial trading, founded by working traders united by a single vision: an honest, transparent trading environment, free of obfuscation and misleading practice.',
                )}
              </p>
              <p className="text-base leading-relaxed text-fg-muted">
                {l(
                  'ومن خلال مجموعة متكاملة من الخدمات تشمل التحليل الفني اليومي، ومتابعة VIP، والتعليم من الصفر للاحتراف، وحلول الإيداع والسحب المحلية، يعمل الفريق على تمكين كل متداول من بناء أساس متين.',
                  'Through daily technical analysis, VIP trade tracking, education from beginner to professional, and local deposit and withdrawal solutions, the team works to give every trader a solid foundation.',
                )}
              </p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ═══════════ MISSION & VISION ═══════════ */}
      <section className="border-y border-rule bg-surface-sunken">
        <div className="container grid gap-px bg-rule py-0 md:grid-cols-2">
          {[
            { title: t('pages.about.mission'), text: t('pages.about.missionText') },
            { title: t('pages.about.vision'),  text: t('pages.about.visionText') },
          ].map((b) => (
            <div key={b.title} className="bg-surface-sunken py-14 md:py-20 md:px-10 md:first:ps-0 md:last:pe-0">
              <h2 className="font-display text-display-xs font-bold text-foreground">{b.title}</h2>
              <p className="measure mt-4 text-base leading-relaxed text-fg-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ VALUES ═══════════ */}
      <section className="container py-16 md:py-24">
        <AnimatedSection>
          <SectionHead eyebrow={l('ما نؤمن به', 'What we hold to')} title={t('pages.about.values')} />
        </AnimatedSection>

        <StaggerContainer className="mt-12 border-t border-rule-strong">
          {[1, 2, 3, 4].map((num) => (
            <StaggerItem key={num}>
              <div className="flex items-baseline gap-6 border-b border-rule py-5">
                <span className="font-mono text-xs text-primary" dir="ltr">
                  {String(num).padStart(2, '0')}
                </span>
                <span className="text-lg text-foreground">{t(`pages.about.value${num}`)}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ═══════════ MILESTONES ═══════════ */}
      <section className="border-y border-rule bg-surface-sunken">
        <div className="container py-16 md:py-24">
          <AnimatedSection>
            <SectionHead
              eyebrow={l('الرحلة', 'The journey')}
              title={l('محطات في رحلتنا', 'Milestones')}
            />
          </AnimatedSection>

          <StaggerContainer className="mt-12 border-t border-rule-strong">
            {milestones.map((m, i) => (
              <StaggerItem key={i}>
                <div className="flex flex-col gap-1 border-b border-rule py-5 sm:flex-row sm:items-baseline sm:gap-10">
                  <span className="font-mono text-lg text-primary sm:w-24 sm:shrink-0" dir="ltr">
                    {m.year}
                  </span>
                  <span className="text-base text-foreground">{l(m.ar, m.en)}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════ TEAM ═══════════ */}
      <section className="container py-16 md:py-24">
        <AnimatedSection>
          <SectionHead align="split" eyebrow={l('الفريق', 'The team')} title={l('من يقف خلف الجواد', 'Who runs the desk')}>
            {l(
              'فريق من المتداولين والمدرّبين بين دمشق وطرطوس.',
              'Traders and trainers working between Damascus and Tartus.',
            )}
          </SectionHead>
        </AnimatedSection>

        {/* A directory, not nine avatar cards. */}
        <StaggerContainer className="mt-12 grid border-t border-rule-strong md:grid-cols-2 md:gap-x-12">
          {team.map((m, i) => (
            <StaggerItem key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-4">
                <span className="text-base font-semibold text-foreground">
                  {l(m.name_ar, m.name_en)}
                </span>
                <span className="text-sm text-fg-muted">{l(m.role_ar, m.role_en)}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <AnimatedSection delay={0.1}>
          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-rule pt-10">
            <p className="measure-narrow text-base text-fg-muted">
              {l(
                'إن كان لديك سؤال قبل أن تبدأ، اسأل قبل أن تودع أي مبلغ.',
                'If you have a question before you start, ask it before you deposit anything.',
              )}
            </p>
            <Link to="/support" className="ms-auto">
              <Button variant="accent">
                {l('إرسال تذكرة', 'Send a ticket')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
};

export default About;
