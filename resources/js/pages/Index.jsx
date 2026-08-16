import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { SectionHead } from '@/components/editorial/SectionHead';
import { EmptyState } from '@/components/EmptyState';
import { MarketLedger, MarketTape } from '@/components/market/Quotes';
import { marketApi, statsApi } from '@/lib/api';
import heroPhoto from '@/assets/hero-slide-1.jpg';

const Index = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const { blogPosts } = useAppData();

  /* ── Live quotes ──────────────────────────────────────────────────────
     Server-cached proxy, re-pulled each minute. The previous build also
     jittered the prices with Math.random() between fetches so the tape
     "felt alive". A firm whose entire pitch is that it does not mislead
     cannot invent price movement, so the jitter is gone: when the market
     is closed, the tape sits still, which is the truth. */
  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['market-quotes'],
    queryFn: async () => (await marketApi.quotes()).data.data,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 55_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => (await statsApi.get()).data.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const latestPosts = useMemo(
    () =>
      [...(blogPosts ?? [])]
        .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
        .slice(0, 3),
    [blogPosts],
  );

  /* Only figures we can actually stand behind. The previous build showed a
     hardcoded "98% client satisfaction" that nothing measures. */
  const figures = [
    { value: stats?.active_clients, suffix: '+', label: t('trust.students') },
    { value: stats?.active_members, suffix: '+', label: t('trust.members') },
    { value: 500, suffix: '+', label: t('trust.experts') },
    // A year is not a quantity: no thousands separator.
    { value: 2015, suffix: '', label: l('نعمل منذ', 'Trading since'), plain: true },
  ];

  const services = [1, 2, 3, 4, 5, 6];
  const steps = [1, 2, 3, 4];

  return (
    <>
      {/* ═══════════════ MASTHEAD ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="container relative">
          <div className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10 lg:py-28">
            {/* Entry is CSS, not JS. `animate-rise` fills `both`, so the final
                state is painted even if requestAnimationFrame is throttled
                (busy main thread, background tab, battery saver), and the
                reduced-motion rule in app.css collapses it to that state
                outright. Above-the-fold copy must never depend on a running
                animation loop to be visible. */}
            <div className="lg:col-span-7">
              <p className="eyebrow mb-6 animate-rise">
                {l('دمشق · منذ 2015', 'Damascus · Since 2015')}
              </p>

              <h1
                className="animate-rise font-display text-display-sm text-foreground sm:text-display-md lg:text-display-lg"
                style={{ animationDelay: '60ms' }}
              >
                {t('hero.title')}
              </h1>

              <p
                className="measure animate-rise mt-7 text-base leading-relaxed text-fg-muted md:text-lg"
                style={{ animationDelay: '140ms' }}
              >
                {t('hero.subtitle')}
              </p>

              <div
                className="animate-rise mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: '220ms' }}
              >
                <Link to="/auth/register">
                  <Button variant="accent" size="lg">
                    {t('hero.cta1')}
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg">{t('hero.cta2')}</Button>
                </Link>
              </div>
            </div>

            <div className="animate-rise lg:col-span-4 lg:col-start-9" style={{ animationDelay: '300ms' }}>
              <MarketLedger quotes={quotes} isLoading={quotesLoading} />
            </div>
          </div>
        </div>
      </section>

      <MarketTape quotes={quotes} />

      {/* ═══════════════ FIGURES ═══════════════
          A ruled masthead statistics line, not four glowing gradient
          numbers in glass tiles. */}
      <section className="container">
        <dl className="grid grid-cols-2 divide-rule border-b border-rule sm:grid-cols-4 sm:divide-x rtl:sm:divide-x-reverse">
          {figures.map((f) => (
            <div key={f.label} className="px-1 py-8 first:ps-0 sm:px-6 sm:first:ps-0 sm:last:pe-0">
              <dd className="ledger-num text-2xl text-foreground sm:text-3xl" dir="ltr">
                {f.value == null
                  ? '—'
                  : `${f.plain ? f.value : f.value.toLocaleString('en-US')}${
                      // "0+" is not a number anyone writes.
                      f.value > 0 ? f.suffix : ''
                    }`}
              </dd>
              <dt className="mt-2 text-sm text-fg-muted">{f.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ═══════════════ SERVICES ═══════════════
          A numbered index with the figure hanging in the margin. Six
          identical icon cards in a three-column grid is the single most
          recognisable marketing-page reflex there is. */}
      <section className="container py-20 md:py-28">
        <AnimatedSection>
          <SectionHead align="split" eyebrow={l('ما نقدمه', 'What we do')} title={t('services.title')}>
            {t('services.subtitle')}
          </SectionHead>
        </AnimatedSection>

        <StaggerContainer className="mt-14 border-t border-rule-strong">
          {services.map((i) => (
            <StaggerItem key={i}>
              <article className="group grid gap-x-8 gap-y-3 border-b border-rule py-8 md:grid-cols-12 md:py-10">
                <div className="md:col-span-1">
                  <span className="font-mono text-sm text-fg-faint" dir="ltr">
                    {String(i).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="font-display text-display-xs text-foreground md:col-span-5">
                  {t(`services.s${i}_title`)}
                </h3>
                <p className="text-base leading-relaxed text-fg-muted md:col-span-6">
                  {t(`services.s${i}_desc`)}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-10">
          <Link
            to="/services"
            className="group inline-flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
          >
            {l('تفاصيل كل خدمة', 'Detail on every service')}
            <ArrowUpRight className="h-4 w-4 text-brand transition-transform duration-200 ease-out-quart group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section className="border-y border-rule bg-surface-sunken">
        <div className="container grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-16">
          <AnimatedSection direction="right" className="lg:col-span-5">
            <figure>
              <img
                src={heroPhoto}
                alt={l('مكتب الجواد للتداول في دمشق', 'The AlJawad trading desk in Damascus')}
                loading="lazy"
                className="w-full border border-rule object-cover"
                style={{ aspectRatio: '4 / 5' }}
              />
              <figcaption className="mt-3 text-xs leading-relaxed text-fg-faint">
                {l(
                  'مكتب الجواد، أبو رمانة، دمشق.',
                  'The AlJawad desk, Abu Rumana, Damascus.',
                )}
              </figcaption>
            </figure>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className="lg:col-span-6 lg:col-start-7">
            <p className="eyebrow mb-4">{l('من نحن', 'About us')}</p>
            <h2 className="font-display text-display-sm text-foreground md:text-display-md">
              {t('about_section.title')}
            </h2>
            <p className="measure mt-5 text-base leading-relaxed text-fg-muted">
              {t('about_section.subtitle')}
            </p>

            <ul className="mt-10 border-t border-rule">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex gap-5 border-b border-rule py-4">
                  <span className="mt-0.5 font-mono text-xs text-brand" dir="ltr">
                    {String(i).padStart(2, '0')}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">
                    {t(`about_section.bullet${i}`)}
                  </span>
                </li>
              ))}
            </ul>

            <Link to="/about" className="mt-8 inline-flex">
              <Button variant="outline">{l('قصة الشركة', 'The company story')}</Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════ PROCESS ═══════════════
          Four steps as a ruled sequence. The previous build drew this as an
          SVG path that redrew itself on scroll. */}
      <section className="container py-20 md:py-28">
        <AnimatedSection>
          <SectionHead eyebrow={l('الطريقة', 'How it works')} title={t('howItWorks.title')} />
        </AnimatedSection>

        <StaggerContainer className="mt-14 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((i) => (
            <StaggerItem key={i} className="bg-surface">
              <div className="flex h-full flex-col p-6 lg:p-8">
                <span className="font-mono text-xs text-brand" dir="ltr">
                  {String(i).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-foreground">
                  {t(`howItWorks.step${i}_title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {t(`howItWorks.step${i}_desc`)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ═══════════════ JOURNAL ═══════════════
          An index, not a row of matching cards: the lead article gets the
          weight and the rest are ruled entries. */}
      <section className="border-y border-rule bg-surface-sunken">
        <div className="container py-20 md:py-28">
          <AnimatedSection>
            <SectionHead align="split" eyebrow={l('المدونة', 'Journal')} title={l('أحدث التحليلات', 'Latest analysis')}>
              {l(
                'قراءات موجزة في الأسواق والاستراتيجيات، ينشرها فريق المحللين.',
                'Short reads on markets and strategy from the analyst desk.',
              )}
            </SectionHead>
          </AnimatedSection>

          {latestPosts.length === 0 ? (
            <EmptyState
              className="mt-14 bg-surface"
              title={l('لا توجد مقالات بعد', 'No articles yet')}
              description={l(
                'ينشر فريق التحليل قراءاته هنا أول بأول.',
                'The analyst desk publishes its reads here as they are written.',
              )}
            />
          ) : (
            <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Lead */}
              <AnimatedSection className="lg:col-span-7">
                <Link to={`/blog/${latestPosts[0].id}`} className="group block">
                  {latestPosts[0].image && (
                    <img
                      src={latestPosts[0].image}
                      alt=""
                      loading="lazy"
                      className="mb-6 w-full border border-rule object-cover"
                      style={{ aspectRatio: '16 / 9' }}
                    />
                  )}
                  <div className="flex items-center gap-3 text-xs text-fg-faint">
                    <span className="font-mono uppercase tracking-[0.12em] text-brand">
                      {t(`blog.${latestPosts[0].category}`)}
                    </span>
                    {latestPosts[0].date && <span dir="ltr">{latestPosts[0].date}</span>}
                  </div>
                  <h3 className="mt-3 font-display text-display-xs text-foreground underline-offset-4 group-hover:underline md:text-display-sm">
                    {l(latestPosts[0].title_ar, latestPosts[0].title_en)}
                  </h3>
                  <p className="measure mt-3 line-clamp-3 text-base leading-relaxed text-fg-muted">
                    {l(latestPosts[0].excerpt_ar, latestPosts[0].excerpt_en)}
                  </p>
                </Link>
              </AnimatedSection>

              {/* Ruled entries */}
              <div className="lg:col-span-4 lg:col-start-9">
                <div className="border-t border-rule-strong">
                  {latestPosts.slice(1).map((post) => (
                    <Link key={post.id} to={`/blog/${post.id}`} className="group block border-b border-rule py-6">
                      <div className="flex items-center gap-3 text-xs text-fg-faint">
                        <span className="font-mono uppercase tracking-[0.12em] text-brand">
                          {t(`blog.${post.category}`)}
                        </span>
                        {post.date && <span dir="ltr">{post.date}</span>}
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline">
                        {l(post.title_ar, post.title_en)}
                      </h3>
                      {post.readTime && (
                        <p className="mt-2 font-mono text-xs text-fg-faint" dir="ltr">
                          {post.readTime} {t('blog.readTime')}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>

                <Link
                  to="/blog"
                  className="group mt-6 inline-flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
                >
                  {l('كل المقالات', 'All articles')}
                  <ArrowUpRight className="h-4 w-4 text-brand transition-transform duration-200 ease-out-quart group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ CONTACT ═══════════════ */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <AnimatedSection className="lg:col-span-6">
            <p className="eyebrow mb-4">{l('تواصل', 'Get in touch')}</p>
            <h2 className="font-display text-display-sm text-foreground md:text-display-md">
              {t('contact_section.title')}
            </h2>
            <p className="measure mt-5 text-base leading-relaxed text-fg-muted">
              {l(
                'كل رسالة تصل عبر مركز الدعم تتحول إلى تذكرة برقم تتابع به الرد، فلا يضيع سؤال في بريد أحدهم.',
                'Every message through the support centre becomes a numbered ticket you can track, so nothing gets lost in somebody\'s inbox.',
              )}
            </p>
            <Link to="/support" className="mt-8 inline-flex">
              <Button variant="accent" size="lg">
                {l('إرسال تذكرة', 'Send a ticket')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className="lg:col-span-5 lg:col-start-8">
            <dl className="border-t border-rule-strong">
              {[
                { term: l('العنوان', 'Address'), value: t('contact_section.address') },
                { term: l('الهاتف', 'Phone'), value: t('contact_section.phone_val'), ltr: true },
                { term: l('البريد', 'Email'), value: t('contact_section.email_val'), ltr: true },
              ].map((row) => (
                <div key={row.term} className="flex items-baseline justify-between gap-6 border-b border-rule py-5">
                  <dt className="text-sm text-fg-faint">{row.term}</dt>
                  <dd
                    className={`text-end text-sm text-foreground ${row.ltr ? 'font-mono' : ''}`}
                    dir={row.ltr ? 'ltr' : undefined}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
};

export default Index;
