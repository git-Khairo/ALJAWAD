import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { EmptyState } from '@/components/EmptyState';

/**
 * The journal index.
 *
 * An index, not a grid of matching cards: the newest piece takes the width
 * and the rest are ruled entries. Filters are underlined tabs on a rule
 * rather than a row of pills, which is the same device the masthead uses.
 */
const Blog = () => {
  const { t, language } = useLanguage();
  const { blogPosts } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const [filter, setFilter] = useState('all');

  const categories = [
    { key: 'all',    label: t('blog.all') },
    { key: 'forex',  label: t('blog.forex') },
    { key: 'crypto', label: t('blog.crypto') },
    { key: 'stocks', label: t('blog.stocks') },
  ];

  const sorted = useMemo(
    () =>
      [...(blogPosts ?? [])].sort((a, b) =>
        String(b.date ?? '').localeCompare(String(a.date ?? '')),
      ),
    [blogPosts],
  );

  const filtered = filter === 'all' ? sorted : sorted.filter((p) => p.category === filter);
  const [lead, ...rest] = filtered;

  return (
    <>
      {/* ═══════════ MASTHEAD ═══════════ */}
      <section className="container pt-16 md:pt-24">
        <p className="eyebrow mb-5 animate-rise">{l('المدونة', 'Journal')}</p>
        <h1
          className="measure animate-rise font-display text-display-sm font-bold text-foreground md:text-display-md"
          style={{ animationDelay: '60ms' }}
        >
          {t('blog.title')}
        </h1>
        <p
          className="measure animate-rise mt-5 text-lg leading-relaxed text-fg-muted"
          style={{ animationDelay: '140ms' }}
        >
          {t('blog.subtitle')}
        </p>

        {/* Filters */}
        <div
          className="animate-rise mt-10 flex flex-wrap items-center gap-1 border-b border-rule"
          style={{ animationDelay: '200ms' }}
          role="tablist"
          aria-label={l('تصفية حسب السوق', 'Filter by market')}
        >
          {categories.map((cat) => {
            const active = filter === cat.key;
            return (
              <button
                key={cat.key}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(cat.key)}
                className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm transition-colors duration-120 ${
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-fg-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          <span className="ms-auto ps-4 font-mono text-xs text-fg-faint" dir="ltr">
            {filtered.length}
          </span>
        </div>
      </section>

      {/* ═══════════ INDEX ═══════════ */}
      <section className="container pb-20 pt-12 md:pb-28">
        {filtered.length === 0 ? (
          <EmptyState
            title={l('لا توجد مقالات في هذا التصنيف', 'Nothing filed under this market yet')}
            description={l(
              'جرّب تصنيفاً آخر، أو تابع الصفحة لاحقاً.',
              'Try another market, or check back later.',
            )}
          />
        ) : (
          <>
            {/* Lead */}
            <AnimatedSection>
              <Link to={`/blog/${lead.id}`} className="group block border-b border-rule-strong pb-12">
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                  {lead.image && (
                    <div className="lg:col-span-6">
                      <img
                        src={lead.image}
                        alt=""
                        className="w-full border border-rule object-cover"
                        style={{ aspectRatio: '16 / 10' }}
                      />
                    </div>
                  )}
                  <div className={lead.image ? 'lg:col-span-5 lg:col-start-8' : 'lg:col-span-8'}>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-fg-faint">
                      <span className="font-mono uppercase tracking-[0.12em] text-primary">
                        {t(`blog.${lead.category}`)}
                      </span>
                      {lead.date && <span dir="ltr">{lead.date}</span>}
                      {(lead.readTime ?? lead.read_time) && (
                        <span dir="ltr" className="font-mono">
                          {lead.readTime ?? lead.read_time} {t('blog.readTime')}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 font-display text-display-xs font-bold text-foreground underline-offset-4 group-hover:underline md:text-display-sm">
                      {l(lead.title_ar, lead.title_en)}
                    </h2>
                    <p className="measure mt-4 text-base leading-relaxed text-fg-muted">
                      {l(lead.excerpt_ar, lead.excerpt_en)}
                    </p>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            {/* Ruled entries */}
            <StaggerContainer className="mt-2">
              {rest.map((post) => (
                <StaggerItem key={post.id}>
                  <Link
                    to={`/blog/${post.id}`}
                    className="group grid gap-x-8 gap-y-2 border-b border-rule py-6 md:grid-cols-12"
                  >
                    <div className="md:col-span-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-fg-faint">
                        <span className="font-mono uppercase tracking-[0.12em] text-primary">
                          {t(`blog.${post.category}`)}
                        </span>
                        {post.date && <span dir="ltr">{post.date}</span>}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline md:col-span-5">
                      {l(post.title_ar, post.title_en)}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted md:col-span-4">
                      {l(post.excerpt_ar, post.excerpt_en)}
                    </p>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}
      </section>
    </>
  );
};

export default Blog;
