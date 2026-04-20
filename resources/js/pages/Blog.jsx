import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockBlogPosts } from '@/data/mockData';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import { Parallax } from '@/components/interactive/ParallaxSection';
import { Clock, User, TrendingUp, Bitcoin, BarChart3, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryIcons = { forex: TrendingUp, crypto: Bitcoin, stocks: BarChart3 };
const categoryColors = {
  forex: 'from-primary/25 to-primary/5',
  crypto: 'from-amber-500/25 to-amber-500/5',
  stocks: 'from-violet-500/25 to-violet-500/5',
};

const Blog = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const [filter, setFilter] = useState('all');

  const categories = [
    { key: 'all', label: t('blog.all') },
    { key: 'forex', label: t('blog.forex') },
    { key: 'crypto', label: t('blog.crypto') },
    { key: 'stocks', label: t('blog.stocks') },
  ];

  const filtered = filter === 'all' ? mockBlogPosts : mockBlogPosts.filter((p) => p.category === filter);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="py-20 relative">
      <Parallax speed={0.18} className="absolute top-20 start-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <Parallax speed={-0.2} className="absolute bottom-20 end-10 h-80 w-80 rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <AnimatedSection>
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
              {l('المدونة', 'Blog')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              <AnimatedText text={t('blog.title')} className="gradient-text" />
            </h1>
            <p className="text-muted-foreground text-lg">{t('blog.subtitle')}</p>
          </div>
        </AnimatedSection>

        {/* Filter pills */}
        <AnimatedSection delay={0.1}>
          <div className="flex justify-center flex-wrap gap-2 mb-12">
            {categories.map((cat) => (
              <motion.button
                key={cat.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(cat.key)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  filter === cat.key ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter === cat.key && (
                  <motion.span
                    layoutId="blog-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-neon"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </AnimatedSection>

        {/* Featured */}
        <AnimatePresence mode="wait">
          {featured && (
            <motion.div
              key={featured.id + filter}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-14"
            >
              <Link to={`/blog/${featured.id}`}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="relative grid md:grid-cols-2 gap-0 glass-strong rounded-3xl border border-primary/20 overflow-hidden group"
                >
                  <div
                    className={`relative flex items-center justify-center p-12 overflow-hidden bg-gradient-to-br ${
                      categoryColors[featured.category]
                    } min-h-[260px]`}
                  >
                    <div className="absolute inset-0 grid-bg opacity-30" />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative"
                    >
                      {(() => {
                        const Icon = categoryIcons[featured.category];
                        return <Icon className="h-28 w-28 text-primary/70 drop-shadow-[0_0_30px_hsl(195_65%_55%/0.5)] group-hover:scale-110 transition-transform duration-500" />;
                      })()}
                    </motion.div>
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                        {t(`blog.${featured.category}`)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {featured.readTime} {t('blog.readTime')}
                      </span>
                      <span className="text-xs text-muted-foreground">{featured.date}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {l(featured.title_ar, featured.title_en)}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {l(featured.excerpt_ar, featured.excerpt_en)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> {l(featured.author_ar, featured.author_en)}
                      </span>
                      <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t('common.readMore')} <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rest — staggered list */}
        <StaggerContainer className="grid md:grid-cols-2 gap-5">
          {rest.map((post) => {
            const Icon = categoryIcons[post.category];
            return (
              <StaggerItem key={post.id}>
                <Link to={`/blog/${post.id}`}>
                  <motion.article
                    whileHover={{ y: -4 }}
                    className="group relative h-full flex items-start gap-5 glass rounded-2xl border border-primary/10 p-5 hover:border-primary/30 transition-colors overflow-hidden"
                  >
                    <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div
                      className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryColors[post.category]} flex items-center justify-center shrink-0 border border-primary/15`}
                    >
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-primary">{t(`blog.${post.category}`)}</span>
                        <span className="text-xs text-muted-foreground">{post.date}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {post.readTime} {t('blog.readTime')}
                        </span>
                      </div>
                      <h3 className="font-bold text-base mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
                        {l(post.title_ar, post.title_en)}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {l(post.excerpt_ar, post.excerpt_en)}
                      </p>
                    </div>
                    <ArrowUpRight className="relative h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0" />
                  </motion.article>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
};

export default Blog;
