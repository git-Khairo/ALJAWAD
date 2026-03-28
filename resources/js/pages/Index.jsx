import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockCourses, mockTestimonials, mockMarketData } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { TrendingUp, BarChart3, Shield, Zap, LineChart, GraduationCap, CheckCircle, ArrowUpRight, ArrowDownRight, Bitcoin, DollarSign, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import heroSlide1 from '@/assets/hero-slide-1.jpg';
import heroSlide2 from '@/assets/hero-slide-2.jpg';
import heroSlide3 from '@/assets/hero-slide-3.jpg';
import marketForex from '@/assets/market-forex.jpg';
import marketCrypto from '@/assets/market-crypto.jpg';
import marketStocks from '@/assets/market-stocks.jpg';

const heroSlides = [heroSlide1, heroSlide2, heroSlide3];

const Index = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeMarket, setActiveMarket] = useState('forex');

  const serviceIcons = [Activity, LineChart, Shield, Zap, BarChart3, GraduationCap];
  const marketIcons = { forex: TrendingUp, crypto: Bitcoin, stocks: BarChart3 };
  const marketImages = { forex: marketForex, crypto: marketCrypto, stocks: marketStocks };

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleContact = (e) => {
    e.preventDefault();
    toast.success(t('common.success'));
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  const [prices, setPrices] = useState(mockMarketData);
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: +(p.price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(p.price > 1000 ? 0 : p.price > 100 ? 2 : 4),
        change: +(p.change + (Math.random() - 0.5) * 0.1).toFixed(2),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Carousel */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        {/* Carousel Images */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={heroSlides[currentSlide]}
              alt="Trading"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          </motion.div>
        </AnimatePresence>

        {/* Overlay grid */}
        <div className="absolute inset-0 grid-bg opacity-30 z-[1]" />

        {/* Hero Text */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm text-primary text-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            {t('hero.badge')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-foreground max-w-5xl text-glow"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/auth/register">
              <Button variant="accent" size="lg" className="text-base px-8 shadow-lg shadow-primary/25">
                {t('hero.cta1')}
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" size="lg" className="text-base px-8 border-foreground/20 text-foreground hover:bg-foreground/10 backdrop-blur-sm">
                {t('hero.cta2')}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute start-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/20 backdrop-blur-md border border-primary/20 flex items-center justify-center text-foreground hover:bg-primary/20 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute end-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/20 backdrop-blur-md border border-primary/20 flex items-center justify-center text-foreground hover:bg-primary/20 transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-10 bg-primary' : 'w-4 bg-foreground/30 hover:bg-foreground/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Live Market Ticker */}
      <section className="py-3 bg-card/80 backdrop-blur-sm border-b border-primary/10 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...prices, ...prices].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-3 px-6 text-sm">
              <span className="font-bold text-foreground">{item.symbol}</span>
              <span className="font-mono">{item.price.toLocaleString()}</span>
              <span className={`flex items-center gap-0.5 ${item.change >= 0 ? 'text-chart-up' : 'text-destructive'}`}>
                {item.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(item.change)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-14 bg-card/50 border-b border-primary/10">
        <StaggerContainer className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{ val: '15,000+', label: t('trust.students') }, { val: '200+', label: t('trust.courses') }, { val: '50+', label: t('trust.experts') }, { val: '98%', label: t('trust.satisfaction') }].map((s, i) => (
            <StaggerItem key={i}>
              <div className="text-3xl md:text-4xl font-bold text-primary animate-count-up">{s.val}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Neo-Futuristic Markets Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        {/* Floating orbs */}
        <div className="absolute top-10 start-10 w-64 h-64 rounded-full bg-primary/5 blur-[100px] animate-float" />
        <div className="absolute bottom-10 end-10 w-80 h-80 rounded-full bg-primary/8 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-3">{t('markets.title')}</h2>
            <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">{t('markets.subtitle')}</p>
          </AnimatedSection>

          {/* Market Selector Tabs */}
          <div className="flex justify-center gap-2 mb-12">
            {(['forex', 'crypto', 'stocks']).map(market => {
              const Icon = marketIcons[market];
              return (
                <motion.button
                  key={market}
                  onClick={() => setActiveMarket(market)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 border ${
                    activeMarket === market
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                      : 'bg-card/50 text-muted-foreground border-primary/20 hover:border-primary/50 backdrop-blur-sm'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(`markets.${market}`)}
                </motion.button>
              );
            })}
          </div>

          {/* Active Market Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMarket}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-primary/20 bg-card/30 backdrop-blur-md"
            >
              {/* Image Side */}
              <div className="relative h-64 lg:h-[450px] overflow-hidden">
                <img
                  src={marketImages[activeMarket]}
                  alt={activeMarket}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 rtl:bg-gradient-to-l" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent lg:hidden" />
                {/* Glowing border accent */}
                <div className="absolute bottom-0 end-0 top-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent hidden lg:block" />
              </div>

              {/* Data Side */}
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  {(() => { const Icon = marketIcons[activeMarket]; return (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  );})()}
                  <div>
                    <h3 className="text-2xl font-bold">{t(`markets.${activeMarket}`)}</h3>
                    <p className="text-xs text-primary">{l('تحديث مباشر', 'Live Updates')}</p>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t(`markets.${activeMarket}Desc`)}</p>

                {/* Live Prices Grid */}
                <div className="space-y-2">
                  {prices.filter(p => p.category === activeMarket).map((p, idx) => (
                    <motion.div
                      key={p.symbol}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between bg-background/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary/10 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                        <span className="font-bold text-sm">{p.symbol}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm">{p.price.toLocaleString()}</span>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.change >= 0
                            ? 'text-chart-up bg-chart-up/10'
                            : 'text-destructive bg-destructive/10'
                        }`}>
                          {p.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {p.change >= 0 ? '+' : ''}{p.change}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link to="/courses" className="mt-6 inline-flex">
                  <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    {l('استكشف الدورات', 'Explore Courses')} →
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-card/50 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">{t('services.title')}</h2>
            <p className="text-muted-foreground text-center mb-12">{t('services.subtitle')}</p>
          </AnimatedSection>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => {
              const Icon = serviceIcons[i - 1];
              return (
                <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                    className="bg-background/50 backdrop-blur-sm rounded-xl border border-primary/10 p-6 card-hover group hover:border-primary/30"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t(`services.s${i}_title`)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(`services.s${i}_desc`)}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* About / Why Us */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <AnimatedSection direction="right">
            <div className="relative rounded-2xl h-72 md:h-96 overflow-hidden border border-primary/20">
              <img src={heroSlide1} alt="Trading Floor" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <img src={logo} alt="AlJawad Trading" className="absolute bottom-6 start-6 h-16 w-auto drop-shadow-2xl" />
            </div>
          </AnimatedSection>
          <AnimatedSection direction="left">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('about_section.title')}</h2>
            <p className="text-muted-foreground mb-8">{t('about_section.subtitle')}</p>
            <ul className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{t(`about_section.bullet${i}`)}</span>
                </motion.li>
              ))}
            </ul>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/50 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('howItWorks.title')}</h2>
          </AnimatedSection>
          <StaggerContainer className="grid md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <StaggerItem key={i}>
                <div className="text-center relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg shadow-primary/20 text-primary-foreground"
                  >
                    {i}
                  </motion.div>
                  <h3 className="font-bold text-lg mb-2">{t(`howItWorks.step${i}_title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`howItWorks.step${i}_desc`)}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">{t('testimonials.title')}</h2>
            <p className="text-muted-foreground text-center mb-12">{t('testimonials.subtitle')}</p>
          </AnimatedSection>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockTestimonials.map(item => (
              <StaggerItem key={item.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-card/50 backdrop-blur-sm rounded-xl border border-primary/10 p-6 h-full flex flex-col hover:border-primary/30 transition-all"
                >
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed flex-1">"{l(item.text_ar, item.text_en)}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center font-bold text-sm text-primary-foreground">
                      {l(item.name_ar, item.name_en)[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{l(item.name_ar, item.name_en)}</div>
                      <div className="text-xs text-primary">{l(item.role_ar, item.role_en)}</div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-card/50 border-t border-primary/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">{t('contact_section.title')}</h2>
            <p className="text-muted-foreground text-center mb-12">{t('contact_section.subtitle')}</p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="grid md:grid-cols-2 gap-8">
              <form onSubmit={handleContact} className="space-y-4">
                <input placeholder={t('contact_section.name')} value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
                <input type="email" placeholder={t('contact_section.email')} value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
                <input placeholder={t('contact_section.phone')} value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                <textarea placeholder={t('contact_section.message')} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
                <Button type="submit" variant="accent" className="w-full">{t('contact_section.send')}</Button>
              </form>
              <div className="space-y-4 text-sm">
                <div className="bg-background/50 backdrop-blur-sm rounded-xl border border-primary/10 p-5 card-hover"><strong>{l('العنوان', 'Address')}:</strong><br />{t('contact_section.address')}</div>
                <div className="bg-background/50 backdrop-blur-sm rounded-xl border border-primary/10 p-5 card-hover"><strong>{l('الهاتف', 'Phone')}:</strong><br />{t('contact_section.phone_val')}</div>
                <div className="bg-background/50 backdrop-blur-sm rounded-xl border border-primary/10 p-5 card-hover"><strong>{l('البريد', 'Email')}:</strong><br />{t('contact_section.email_val')}</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Index;
