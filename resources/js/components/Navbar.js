import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

export const Navbar = () => {
  const { t, toggleLanguage, language } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/about', label: t('nav.about') },
    { to: '/services', label: t('nav.services') },
    { to: '/courses', label: t('nav.courses') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-card/95 backdrop-blur-xl shadow-lg shadow-foreground/5 border-b border-border' : 'bg-card/60 backdrop-blur-md'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AlJawad Trading" className="h-auto w-40" />
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.to ? 'text-primary' : 'text-foreground/70'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button onClick={toggleLanguage} className="text-sm text-muted-foreground hover:text-foreground font-medium px-2">
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>
          {isAuthenticated ? (
            <Link to={role === 'admin' ? '/admin' : '/app'}>
              <Button size="sm" variant="accent">{t('app.overview')}</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
              <Link to="/auth/register"><Button variant="accent" size="sm">{t('nav.cta')}</Button></Link>
            </>
          )}
        </div>

        <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t overflow-hidden"
          >
            <div className="p-4">
              {links.map(link => (
                <Link key={link.to} to={link.to} className="block py-2.5 text-foreground/80 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t flex items-center gap-3">
                <button onClick={toggleLanguage} className="text-sm">{language === 'ar' ? 'EN' : 'عربي'}</button>
                <Link to="/auth/login" onClick={() => setMobileOpen(false)}><Button size="sm">{t('nav.login')}</Button></Link>
                <Link to="/auth/register" onClick={() => setMobileOpen(false)}><Button variant="accent" size="sm">{t('nav.cta')}</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
