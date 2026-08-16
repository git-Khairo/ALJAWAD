import { Link } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { SectionHead } from '@/components/editorial/SectionHead';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * Contact.
 *
 * There is no message form here on purpose: every enquiry routes through the
 * support desk so it becomes a numbered, trackable ticket. A second, separate
 * contact form would create a channel with no record and no reference number,
 * which is exactly the thing this business says it does not do.
 */
const branches = [
  {
    city_ar: 'دمشق', city_en: 'Damascus',
    type_ar: 'الفرع الرئيسي', type_en: 'Main branch',
    detail_ar: 'أبو رمانة، مقابل سناك الرواد',
    detail_en: 'Abu Rumana, opposite Al-Ruwwad Snack',
  },
  {
    city_ar: 'طرطوس', city_en: 'Tartus',
    type_ar: 'فرع طرطوس', type_en: 'Tartus branch',
    detail_ar: 'شارع المحكمة، مقابل بنك الآغا خان',
    detail_en: 'Al-Mahkama Street, opposite Aga Khan Bank',
  },
];

const Contact = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const phone = t('contact_section.phone_val');
  const email = t('contact_section.email_val');

  const details = [
    { term: l('العنوان', 'Address'), value: t('contact_section.address') },
    { term: l('الهاتف', 'Phone'),   value: phone, href: `tel:${phone.replace(/\s/g, '')}`, ltr: true },
    { term: l('البريد', 'Email'),   value: email, href: `mailto:${email}`, ltr: true },
  ];

  const faqs = [1, 2, 3, 4, 5];

  return (
    <>
      {/* ═══════════ MASTHEAD ═══════════ */}
      <section className="container border-b border-rule py-16 md:py-24">
        <p className="eyebrow mb-5 animate-rise">{l('تواصل', 'Get in touch')}</p>
        <h1
          className="measure animate-rise font-display text-display-sm font-bold text-foreground md:text-display-md"
          style={{ animationDelay: '60ms' }}
        >
          {t('contact_section.title')}
        </h1>
        <p
          className="measure animate-rise mt-5 text-lg leading-relaxed text-fg-muted"
          style={{ animationDelay: '140ms' }}
        >
          {t('contact_section.subtitle')}
        </p>
      </section>

      {/* ═══════════ TICKET + DETAILS ═══════════ */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <AnimatedSection className="lg:col-span-6">
            <h2 className="font-display text-display-xs font-bold text-foreground md:text-display-sm">
              {l('افتح تذكرة دعم', 'Open a support ticket')}
            </h2>
            <p className="measure mt-5 text-base leading-relaxed text-fg-muted">
              {l(
                'يمرّ التواصل عبر مركز الدعم: أرسل تذكرة ليصل استفسارك مباشرة إلى الفريق المختص، وتحصل على رقم تتابع به الرد.',
                'Contact runs through the support centre. Send a ticket, your enquiry reaches the right team directly, and you get a reference number to track the reply on.',
              )}
            </p>

            <ul className="mt-8 space-y-3">
              {[
                l('يصل إلى الفريق المختص مباشرة', 'Goes straight to the right team'),
                l('رقم تذكرة لمتابعة الرد', 'A ticket number to track the reply'),
                l('سجل كامل للمحادثة', 'A full record of the conversation'),
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-base text-fg-muted">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>

            <Link to="/support" className="mt-9 inline-flex">
              <Button variant="accent" size="lg">
                {l('إرسال تذكرة', 'Send a ticket')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className="lg:col-span-5 lg:col-start-8">
            <h2 className="eyebrow mb-5">{l('تفاصيل الاتصال', 'Contact details')}</h2>
            <dl className="border-t border-rule-strong">
              {details.map((row) => (
                <div
                  key={row.term}
                  className="flex items-baseline justify-between gap-6 border-b border-rule py-4"
                >
                  <dt className="shrink-0 text-sm text-fg-faint">{row.term}</dt>
                  <dd
                    className={`text-end text-sm text-foreground ${row.ltr ? 'font-mono' : ''}`}
                    dir={row.ltr ? 'ltr' : undefined}
                  >
                    {row.href ? (
                      <a href={row.href} className="underline-offset-4 hover:text-primary hover:underline">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════ BRANCHES ═══════════ */}
      <section className="border-y border-rule bg-surface-sunken">
        <div className="container py-16 md:py-24">
          <AnimatedSection>
            <SectionHead eyebrow={l('فروعنا', 'Our branches')} title={l('أين تجدنا', 'Where to find us')} />
          </AnimatedSection>

          <StaggerContainer className="mt-12 grid gap-px border border-rule bg-rule md:grid-cols-2">
            {branches.map((b) => (
              <StaggerItem key={b.city_en} className="bg-surface-sunken">
                <div className="p-7 md:p-9">
                  <p className="eyebrow">{l(b.type_ar, b.type_en)}</p>
                  <h3 className="mt-3 font-display text-display-xs font-bold text-foreground">
                    {l(b.city_ar, b.city_en)}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-fg-muted">
                    {l(b.detail_ar, b.detail_en)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <AnimatedSection className="lg:col-span-4">
            <p className="eyebrow mb-4">{l('أسئلة', 'Questions')}</p>
            <h2 className="font-display text-display-xs font-bold text-foreground md:text-display-sm">
              {t('faq_section.title')}
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className="lg:col-span-7 lg:col-start-6">
            <Accordion type="single" collapsible className="border-t border-rule-strong">
              {faqs.map((i) => (
                <AccordionItem key={i} value={`q${i}`}>
                  <AccordionTrigger>{t(`faq_section.q${i}`)}</AccordionTrigger>
                  <AccordionContent>{t(`faq_section.a${i}`)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
};

export default Contact;
