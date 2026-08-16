import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Public shell.
 *
 * The previous version stacked a radial glow, a masked grid, two animated
 * blur blobs and a cursor-following glow behind every page. All of it is
 * gone. The navy ground is the background now, and sections separate with
 * rules and value steps instead of with light effects.
 */
const PublicLayout = () => {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {language === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content'}
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
