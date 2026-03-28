import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, DollarSign, Megaphone, Calendar, Settings, LogOut, Menu,
  ChevronDown, PieChart, BarChart3, UserCog, Target, CalendarDays,
  Receipt, CreditCard, TrendingUp, FileText, UserPlus, Mail, BarChart,
  Newspaper, Share2, MessageSquare, Clock, Video, Bell, Shield, Palette,
  Database, Globe, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

const AdminLayout = () => {
  const { t, language, toggleLanguage, toggleTheme, theme } = useLanguage();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['overview']);

  const l = (ar, en) => language === 'ar' ? ar : en;

  const groups = [
    {
      key: 'overview',
      label: l('نظرة عامة', 'Overview'),
      icon: LayoutDashboard,
      children: [
        { to: '/admin/overview', label: l('لوحة التحكم', 'Dashboard'), icon: LayoutDashboard },
        { to: '/admin/performance', label: l('الأداء', 'Performance'), icon: BarChart3 },
        { to: '/admin/reports', label: l('التقارير', 'Reports'), icon: FileText },
        { to: '/admin/activity-log', label: l('سجل النشاط', 'Activity Log'), icon: Clock },
      ],
    },
    {
      key: 'crm',
      label: l('إدارة العملاء', 'CRM'),
      icon: Users,
      children: [
        { to: '/admin/crm', label: l('العملاء', 'Clients'), icon: Users },
        { to: '/admin/users', label: l('المستخدمون', 'Users'), icon: UserCog },
        { to: '/admin/leads', label: l('العملاء المحتملون', 'Leads'), icon: Target },
        { to: '/admin/support-tickets', label: l('تذاكر الدعم', 'Support Tickets'), icon: HelpCircle },
      ],
    },
    {
      key: 'finance',
      label: l('المالية', 'Finance'),
      icon: DollarSign,
      children: [
        { to: '/admin/financing', label: l('نظرة مالية', 'Finance Overview'), icon: PieChart },
        { to: '/admin/invoices', label: l('الفواتير', 'Invoices'), icon: Receipt },
        { to: '/admin/transactions', label: l('المعاملات', 'Transactions'), icon: CreditCard },
        { to: '/admin/revenue', label: l('الإيرادات', 'Revenue Analytics'), icon: BarChart },
      ],
    },
    {
      key: 'marketing',
      label: l('التسويق', 'Marketing'),
      icon: Megaphone,
      children: [
        { to: '/admin/marketing', label: l('الحملات', 'Campaigns'), icon: Target },
        { to: '/admin/email-marketing', label: l('التسويق بالبريد', 'Email Marketing'), icon: Mail },
        { to: '/admin/social-media', label: l('وسائل التواصل', 'Social Media'), icon: Share2 },
        { to: '/admin/analytics', label: l('التحليلات', 'Analytics'), icon: BarChart3 },
      ],
    },
    {
      key: 'content',
      label: l('المحتوى', 'Content'),
      icon: Newspaper,
      children: [
        { to: '/admin/blog-manager', label: l('إدارة المدونة', 'Blog Manager'), icon: Newspaper },
        { to: '/admin/media-library', label: l('مكتبة الوسائط', 'Media Library'), icon: Database },
        { to: '/admin/notifications', label: l('الإشعارات', 'Notifications'), icon: Bell },
        { to: '/admin/messages', label: l('الرسائل', 'Messages'), icon: MessageSquare },
      ],
    },
    {
      key: 'scheduling',
      label: l('الجدولة', 'Scheduling'),
      icon: Calendar,
      children: [
        { to: '/admin/scheduling', label: l('التقويم', 'Calendar'), icon: CalendarDays },
        { to: '/admin/appointments', label: l('المواعيد', 'Appointments'), icon: Calendar },
        { to: '/admin/webinars', label: l('الندوات', 'Webinars'), icon: Video },
      ],
    },
    {
      key: 'settings',
      label: l('الإعدادات', 'Settings'),
      icon: Settings,
      children: [
        { to: '/admin/settings', label: l('إعدادات عامة', 'General'), icon: Settings },
        { to: '/admin/security', label: l('الأمان', 'Security'), icon: Shield },
        { to: '/admin/appearance', label: l('المظهر', 'Appearance'), icon: Palette },
        { to: '/admin/integrations', label: l('التكاملات', 'Integrations'), icon: Globe },
      ],
    },
  ];

  const activeGroup = groups.find(g => g.children.some(c => location.pathname === c.to));

  const toggleGroup = (key) => {
    setOpenGroups(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isGroupOpen = (key) =>
    openGroups.includes(key) || (activeGroup?.key === key);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')} lg:relative flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center justify-center">
            <img src={logo} alt="Logo" className="h-auto w-40" />
          </Link>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {groups.map(group => {
            const open = isGroupOpen(group.key);
            const hasActive = group.children.some(c => location.pathname === c.to);

            return (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${hasActive ? 'bg-sidebar-accent/60 text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30'}`}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    {group.label}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`${language === 'ar' ? 'pr-4 border-r' : 'pl-4 border-l'} border-sidebar-border/50 mt-1 mb-1 ms-3 space-y-0.5`}>
                        {group.children.map(child => (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all ${location.pathname === child.to ? 'bg-sidebar-accent text-sidebar-primary font-medium shadow-sm' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'}`}
                          >
                            <child.icon className="h-3.5 w-3.5" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full">
            <LogOut className="h-4 w-4" />{t('app.logout')}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 bg-card border-b flex items-center justify-between px-4 sticky top-0 z-20">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-3 ms-auto">
            <button onClick={toggleTheme} className="text-xs text-muted-foreground">{theme === 'light' ? '🌙' : '☀️'}</button>
            <button onClick={toggleLanguage} className="text-xs text-muted-foreground">{language === 'ar' ? 'EN' : 'عربي'}</button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">
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

export default AdminLayout;
