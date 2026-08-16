import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/Wordmark';

/**
 * Masthead.
 *
 * Sticky rather than fixed, so the page never needs a compensating top pad.
 * Separated from the content by a hairline rule and a value step, never by a
 * blur or a shadow. The active link is marked with a rule under the label:
 * the previous pill wandered around behind the text on every route change.
 */
export const Navbar = () => {
  const { t, toggleLanguage, language } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const location = useLocation();

  // Threshold-guarded so this only re-renders on the two crossings, not on
  // every scroll frame.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => {
    setCondensed((prev) => (prev === y > 24 ? prev : y > 24));
  });

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // The sheet takes over the viewport, so the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const links = [
    { to: '/',         label: t('nav.home') },
    { to: '/about',    label: t('nav.about') },
    { to: '/services', label: t('nav.services') },
    { to: '/courses',  label: t('nav.courses') },
    { to: '/blog',     label: t('nav.blog') },
    { to: '/contact',  label: t('nav.contact') },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b bg-surface transition-[border-color,box-shadow] duration-320 ease-out-quart ${
          condensed ? 'border-rule-strong shadow-sm' : 'border-rule'
        }`}
      >
        <div className="container">
          <div
            className={`flex items-center justify-between transition-[height] duration-320 ease-out-quart ${
              condensed ? 'h-14' : 'h-[4.5rem]'
            }`}
          >
            <Wordmark size="sm" showDescriptor={!condensed} />

            <nav className="hidden items-center lg:flex" aria-label={language === 'ar' ? 'رئيسية' : 'Primary'}>
              {links.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={active ? 'page' : undefined}
                    className={`relative px-3.5 py-2 text-sm transition-colors duration-120 ${
                      active ? 'text-foreground' : 'text-fg-muted hover:text-foreground'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute inset-x-3.5 bottom-0 h-0.5 origin-center bg-brand transition-transform duration-200 ease-out-quart ${
                        active ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-1 lg:flex">
              <button
                onClick={toggleLanguage}
                className="rounded-sm px-2.5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
                lang={language === 'ar' ? 'en' : 'ar'}
              >
                {language === 'ar' ? 'EN' : 'ع'}
              </button>

              <span className="mx-2 h-5 w-px bg-rule" aria-hidden="true" />

              {isAuthenticated ? (
                <Link to={role === 'admin' ? '/admin' : '/app'}>
                  <Button size="sm">{t('app.overview')}</Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button variant="accent" size="sm">{t('nav.cta')}</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="-me-2 rounded-sm p-2 text-foreground lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-sheet mobile nav. Links are set at display size: on a phone the
          menu is the whole page, so it may as well read like one. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden"
          >
            <div className="container flex h-[4.5rem] shrink-0 items-center justify-between border-b border-rule">
              <Wordmark size="sm" />
              <button
                className="-me-2 rounded-sm p-2 text-foreground"
                onClick={() => setMobileOpen(false)}
                aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="container flex-1 overflow-y-auto py-6">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.035, duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
                >
                  <Link
                    to={link.to}
                    className="flex items-baseline gap-4 border-b border-rule py-4"
                  >
                    <span className="font-mono text-xs text-fg-faint" dir="ltr">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`font-display text-display-xs ${
                        location.pathname === link.to ? 'text-brand' : 'text-foreground'
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="container flex shrink-0 items-center gap-3 border-t border-rule py-5">
              <button
                onClick={toggleLanguage}
                className="rounded-sm border border-rule-strong px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-muted"
                lang={language === 'ar' ? 'en' : 'ar'}
              >
                {language === 'ar' ? 'English' : 'عربي'}
              </button>
              <div className="ms-auto flex gap-2">
                {isAuthenticated ? (
                  <Link to={role === 'admin' ? '/admin' : '/app'}>
                    <Button size="sm">{t('app.overview')}</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth/login"><Button variant="outline" size="sm">{t('nav.login')}</Button></Link>
                    <Link to="/auth/register"><Button variant="accent" size="sm">{t('nav.cta')}</Button></Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
