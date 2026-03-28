import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockBlogPosts } from '@/data/mockData';
import { AnimatedSection } from '@/components/AnimatedSection';
import { Clock, User, ArrowRight, ArrowLeft, TrendingUp, Bitcoin, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categoryIcons = { forex: TrendingUp, crypto: Bitcoin, stocks: BarChart3 };

const BlogPost = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const post = mockBlogPosts.find(p => p.id === id);
  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

  if (!post) return <div className="py-20 text-center text-muted-foreground">{t('common.noData')}</div>;

  const related = mockBlogPosts.filter(p => p.category === post.category && p.id !== post.id).slice(0, 2);
  const Icon = categoryIcons[post.category];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <AnimatedSection>
          <Link to="/blog" className="inline-flex items-center gap-2 text-accent text-sm mb-6 hover:underline">
            <ArrowBack className="h-4 w-4" /> {t('blog.backToBlog')}
          </Link>

          <div className="gradient-hero rounded-2xl h-56 flex items-center justify-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <Icon className="h-16 w-16 text-accent relative z-10" />
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {l(post.author_ar, post.author_en)}</span>
            <span>{post.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {post.readTime} {t('blog.readTime')}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-6">{l(post.title_ar, post.title_en)}</h1>

          <div className="prose max-w-none text-foreground/90 leading-relaxed whitespace-pre-line text-base">
            {l(post.content_ar, post.content_en)}
          </div>
        </AnimatedSection>

        {related.length > 0 && (
          <AnimatedSection delay={0.2} className="mt-16">
            <h3 className="text-xl font-bold mb-6">{t('blog.relatedPosts')}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.id}`} className="bg-card rounded-xl border p-5 hover:shadow-lg transition-all card-hover">
                  <h4 className="font-semibold mb-2">{l(r.title_ar, r.title_en)}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{l(r.excerpt_ar, r.excerpt_en)}</p>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
