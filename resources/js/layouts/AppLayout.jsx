import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, User, FileText, Bell, Settings, LogOut, Menu, X,
  Search, Globe, ChevronRight, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

const AppLayout = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { to: '/app/overview',      label: t('app.overview'),      icon: LayoutDashboard },
    { to: '/app/profile',       label: t('app.profile'),       icon: User },
    { to: '/app/applications',  label: t('app.applications'),  icon: FileText },
    { to: '/app/notifications', label: t('app.notifications'), icon: Bell },
    { to: '/app/settings',      label: t('app.settings'),      icon: Settings },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  const userName = currentUser?.[language === 'ar' ? 'name_ar' : 'name_en'] || (language === 'ar' ? 'متدرب' : 'Trader');
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen flex bg-background relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.08]" />
      </div>

      {/* ───────── Sidebar ───────── */}
      <aside
        className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-40 w-72 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
        } lg:sticky lg:top-0 lg:h-screen lg:self-start flex flex-col`}
      >
        <div className="relative h-full m-3 lg:m-4 rounded-2xl overflow-hidden border border-primary/15 bg-card/70 backdrop-blur-xl shadow-xl flex flex-col">
          {/* Glow header */}
          <div className="absolute -top-24 -right-12 h-48 w-48 rounded-full bg-primary/25 blur-3xl pointer-events-none" />

          <div className="relative p-5 border-b border-primary/10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="AlJawad" className="h-auto w-36" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Greeting tile */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/15 bg-primary/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold shadow-neon">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{t('app.welcome')}</p>
                <p className="text-sm font-semibold truncate">{userName}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="relative flex-1 overflow-y-auto p-3 space-y-1 mt-2">
            {links.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                    active
                      ? 'text-primary-foreground'
                      : 'text-foreground/70 hover:text-foreground hover:bg-primary/5'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="app-nav-active"
                      className="absolute inset-0 rounded-xl gradient-gold shadow-neon"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-3 w-full">
                    <link.icon className={`h-4 w-4 transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
                    <span className="flex-1">{link.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180 opacity-80" />}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Upsell block */}
          <div className="m-3 mb-2 p-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold">
                  {language === 'ar' ? 'افتح الغرفة الحية' : 'Unlock live room'}
                </p>
              </div>
              <p className="text-[0.7rem] text-muted-foreground leading-relaxed mb-3">
                {language === 'ar'
                  ? 'إشارات مباشرة من مدرّبينا يوميًا.'
                  : 'Real-time signals from our mentors every day.'}
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                {language === 'ar' ? 'استكشف' : 'Explore'}
                <ChevronRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          <div className="p-3 border-t border-primary/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition"
            >
              <LogOut className="h-4 w-4" />{t('app.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop on mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ───────── Main column ───────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-20 h-16 px-4 md:px-6 flex items-center justify-between bg-background/70 backdrop-blur-xl border-b border-primary/10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex relative w-full max-w-sm mx-4">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
              type="search"
              placeholder={language === 'ar' ? 'ابحث...' : 'Search...'}
              className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>

          <div className="flex items-center gap-1 ms-auto">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition flex items-center gap-1.5 text-xs font-medium"
              title="Toggle language"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <Link
              to="/app/notifications"
              className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 ps-2 ms-1 border-s border-primary/10">
              <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold text-xs shadow-neon">
                {initials}
              </div>
              <span className="text-sm font-medium hidden md:inline">{userName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
