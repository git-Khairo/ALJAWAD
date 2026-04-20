import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ScrollProgress from '@/components/interactive/ScrollProgress';
import CursorGlow from '@/components/interactive/CursorGlow';

const PublicLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-clip">
      {/* Ambient decorative background (pure CSS, cheap) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-radial-glow" />
        <div className="absolute inset-0 grid-bg-lg" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/5 blur-[140px] animate-float-slow" />
        <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-primary/8 blur-[160px] animate-float-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 noise-bg" />
      </div>

      <ScrollProgress />
      <CursorGlow />
      <Navbar />
      <main className="relative flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
