import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

/**
 * Services.
 *
 * Six numbered bands rather than six matching cards. Each service gets a
 * hanging figure, a heading, its description, and a line on who it is for,
 * which is the question the card grid never had room to answer.
 */

// Who each service is actually for. Kept here rather than in the shared
// translations file because it is page copy, not reused strings.
const audience = {
  1: { ar: 'لمن يريد قراءة يومية للسوق دون أن يبني التحليل بنفسه.',
       en: 'For traders who want a daily read on the market without building the analysis themselves.' },
  2: { ar: 'لمن يتعلّم أسرع بمتابعة قرارات مباشرة لحظة اتخاذها.',
       en: 'For people who learn faster by watching decisions get made in real time.' },
  3: { ar: 'لمن يبدأ من الصفر ويريد مساراً مرتباً بدل مقاطع متفرقة.',
       en: 'For beginners who want an ordered path instead of scattered videos.' },
  4: { ar: 'لمن يحتاج إيداعاً وسحباً يعملان فعلاً داخل سوريا.',
       en: 'For anyone who needs deposits and withdrawals that actually work inside Syria.' },
  5: { ar: 'لمن لا يريد انتظار يوم عمل كامل للحصول على إجابة.',
       en: 'For anyone who does not want to wait a business day for an answer.' },
  6: { ar: 'لمن يتداول منذ فترة ويريد خطة ومراجعة مع مختص.',
       en: 'For traders with some experience who want a plan and a second opinion.' },
};

const Services = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const services = [1, 2, 3, 4, 5, 6];

  return (
    <>
      {/* ═══════════ MASTHEAD ═══════════ */}
      <section className="container border-b border-rule py-16 md:py-24">
        <p className="eyebrow mb-5 animate-rise">{l('ما نقدمه', 'What we do')}</p>
        <h1
          className="measure animate-rise font-display text-display-sm font-bold text-foreground md:text-display-md"
          style={{ animationDelay: '60ms' }}
        >
          {t('services.title')}
        </h1>
        <p
          className="measure animate-rise mt-5 text-lg leading-relaxed text-fg-muted"
          style={{ animationDelay: '140ms' }}
        >
          {t('services.subtitle')}
        </p>
      </section>

      {/* ═══════════ THE SIX ═══════════ */}
      <section className="container">
        <StaggerContainer>
          {services.map((i) => (
            <StaggerItem key={i}>
              <article className="grid gap-x-10 gap-y-4 border-b border-rule py-12 md:grid-cols-12 md:py-16">
                <div className="md:col-span-1">
                  <span className="font-mono text-sm text-primary" dir="ltr">
                    {String(i).padStart(2, '0')}
                  </span>
                </div>

                <h2 className="font-display text-display-xs font-bold text-foreground md:col-span-4 md:text-display-sm">
                  {t(`services.s${i}_title`)}
                </h2>

                <div className="md:col-span-6 md:col-start-7">
                  <p className="text-base leading-relaxed text-fg-muted md:text-lg">
                    {t(`services.s${i}_desc`)}
                  </p>
                  <p className="mt-4 border-t border-rule pt-4 text-sm leading-relaxed text-fg-faint">
                    {l(audience[i].ar, audience[i].en)}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="container py-16 md:py-24">
        <AnimatedSection>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 className="font-display text-display-xs font-bold text-foreground md:text-display-sm">
                {l('غير متأكد أي خدمة تناسبك؟', 'Not sure which of these you need?')}
              </h2>
              <p className="measure mt-4 text-base leading-relaxed text-fg-muted">
                {l(
                  'اسأل قبل أن تشترك. سنقول لك بصراحة إن كانت الخدمة لا تناسب وضعك الحالي.',
                  'Ask before you subscribe. We will tell you plainly if a service is not right for where you are.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:col-start-9 lg:justify-end">
              <Link to="/support">
                <Button variant="accent">
                  {l('اسأل الفريق', 'Ask the team')}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline">{l('الدورات', 'Courses')}</Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
};

export default Services;
