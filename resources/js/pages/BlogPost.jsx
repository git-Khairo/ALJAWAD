import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { AnimatedSection } from '@/components/AnimatedSection';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

/**
 * A single article, set as an article: narrow measure, real byline, and the
 * body given the `prose` treatment tuned in tailwind.config.
 */
const BlogPost = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { blogPosts } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  // Route params are strings, post ids are numbers.
  const post = (blogPosts ?? []).find((p) => String(p.id) === String(id));

  if (!post) {
    return (
      <div className="container py-24">
        <EmptyState
          title={l('لم نعثر على هذه المقالة', 'We could not find that article')}
          description={l(
            'ربما حُذفت أو تغيّر رابطها.',
            'It may have been removed, or its link has changed.',
          )}
          action={
            <Link to="/blog">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t('blog.backToBlog')}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const related = (blogPosts ?? [])
    .filter((p) => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  const readTime = post.readTime ?? post.read_time;

  return (
    <article className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('blog.backToBlog')}
        </Link>

        <AnimatedSection className="mt-8">
          <p className="eyebrow">{t(`blog.${post.category}`)}</p>

          <h1 className="mt-4 font-display text-display-xs font-bold leading-tight text-foreground md:text-display-sm">
            {l(post.title_ar, post.title_en)}
          </h1>

          {/* Byline, as a rule-bounded row. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-rule py-3 text-sm text-fg-muted">
            {(post.author_ar || post.author_en) && (
              <span>
                <span className="text-fg-faint">{t('blog.by')} </span>
                {l(post.author_ar, post.author_en)}
              </span>
            )}
            {post.date && (
              <span className="font-mono text-xs" dir="ltr">{post.date}</span>
            )}
            {readTime && (
              <span className="ms-auto font-mono text-xs" dir="ltr">
                {readTime} {t('blog.readTime')}
              </span>
            )}
          </div>

          {post.image && (
            <img
              src={post.image}
              alt=""
              className="mt-8 w-full border border-rule object-cover"
              style={{ aspectRatio: '16 / 9' }}
            />
          )}

          <div className="prose prose-invert mt-10 max-w-none whitespace-pre-line">
            {l(post.content_ar, post.content_en)}
          </div>
        </AnimatedSection>

        {related.length > 0 && (
          <AnimatedSection delay={0.1} className="mt-16">
            <h2 className="eyebrow mb-5">{t('blog.relatedPosts')}</h2>
            <div className="border-t border-rule-strong">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.id}`}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-4"
                >
                  <span className="text-base font-semibold text-foreground underline-offset-4 group-hover:underline">
                    {l(r.title_ar, r.title_en)}
                  </span>
                  {r.date && (
                    <span className="font-mono text-xs text-fg-faint" dir="ltr">{r.date}</span>
                  )}
                </Link>
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </article>
  );
};

export default BlogPost;
