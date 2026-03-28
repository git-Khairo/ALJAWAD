import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, User, FileText, PlusCircle, Bell, Settings, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const AppLayout = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { to: '/app/overview', label: t('app.overview'), icon: LayoutDashboard },
    { to: '/app/profile', label: t('app.profile'), icon: User },
    { to: '/app/applications', label: t('app.applications'), icon: FileText },
    { to: '/app/apply', label: t('app.apply'), icon: PlusCircle },
    { to: '/app/notifications', label: t('app.notifications'), icon: Bell },
    { to: '/app/settings', label: t('app.settings'), icon: Settings },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-40 w-64 bg-card border-e transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')} lg:relative`}>
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="AlJawad" className="h-auto w-40" />
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${location.pathname === link.to ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-foreground/70 hover:bg-muted'}`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full">
            <LogOut className="h-4 w-4" />{t('app.logout')}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 bg-card border-b flex items-center justify-between px-4 sticky top-0 z-20">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-3 ms-auto">
            <button onClick={toggleLanguage} className="text-xs text-muted-foreground">{language === 'ar' ? 'EN' : 'عربي'}</button>
            <span className="text-sm font-medium">{t('app.welcome')}، {currentUser?.[language === 'ar' ? 'name_ar' : 'name_en']}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
