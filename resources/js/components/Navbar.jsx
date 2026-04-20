import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '@/components/interactive/MagneticButton';
import logo from '@/assets/logo.png';

export const Navbar = () => {
  const { t, toggleLanguage, language } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/about', label: t('nav.about') },
    { to: '/services', label: t('nav.services') },
    { to: '/courses', label: t('nav.courses') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/70 backdrop-blur-xl border-b border-primary/15 shadow-[0_12px_40px_-20px_hsl(195_65%_47%/0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="group flex items-center gap-2">
          <motion.img
            src={logo}
            alt="AlJawad Trading"
            className="h-auto w-36 drop-shadow-[0_0_12px_hsl(195_65%_47%/0.35)]"
            whileHover={{ scale: 1.04, filter: 'drop-shadow(0 0 16px hsl(195 65% 55% / 0.6))' }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <motion.button
            onClick={toggleLanguage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <Globe className="h-4 w-4" />
            {language === 'ar' ? 'EN' : 'عربي'}
          </motion.button>
          {isAuthenticated ? (
            <Link to={role === 'admin' ? '/admin' : '/app'}>
              <MagneticButton>
                <Button size="sm" variant="accent" className="shadow-neon">
                  {t('app.overview')}
                </Button>
              </MagneticButton>
            </Link>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/auth/register">
                <MagneticButton>
                  <Button variant="accent" size="sm" className="shadow-neon">
                    {t('nav.cta')}
                    <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                  </Button>
                </MagneticButton>
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 rounded-lg border border-primary/20 bg-background/60 backdrop-blur-md"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Menu className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden glass-strong border-t border-primary/10 overflow-hidden"
          >
            <div className="p-5 space-y-1">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: language === 'ar' ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={link.to}
                    className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors ${
                      location.pathname === link.to
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground/80 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-50 rtl:rotate-180" />
                  </Link>
                </motion.div>
              ))}
              <div className="mt-4 pt-4 border-t border-primary/10 flex items-center gap-3">
                <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <Globe className="h-4 w-4" /> {language === 'ar' ? 'EN' : 'عربي'}
                </button>
                <div className="ms-auto flex gap-2">
                  <Link to="/auth/login"><Button size="sm" variant="ghost">{t('nav.login')}</Button></Link>
                  <Link to="/auth/register"><Button variant="accent" size="sm">{t('nav.cta')}</Button></Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
