import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, DollarSign, Megaphone, Calendar, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight, PieChart, BarChart3, UserCog, Target, CalendarDays,
  Receipt, CreditCard, FileText, Mail, BarChart,
  Newspaper, Share2, MessageSquare, Clock, Video, Bell, Shield, Palette,
  Database, Globe, HelpCircle, Search, Moon, Sun, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

const AdminLayout = () => {
  const { t, language, toggleLanguage, toggleTheme, theme } = useLanguage();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['overview']);

  const l = (ar, en) => (language === 'ar' ? ar : en);

  const groups = [
    {
      key: 'overview',
      label: l('نظرة عامة', 'Overview'),
      icon: LayoutDashboard,
      children: [
        { to: '/admin/overview',     label: l('لوحة التحكم', 'Dashboard'),    icon: LayoutDashboard },
        { to: '/admin/performance',  label: l('الأداء', 'Performance'),       icon: BarChart3 },
        { to: '/admin/reports',      label: l('التقارير', 'Reports'),          icon: FileText },
        { to: '/admin/activity-log', label: l('سجل النشاط', 'Activity Log'),  icon: Clock },
      ],
    },
    {
      key: 'crm',
      label: l('إدارة العملاء', 'CRM'),
      icon: Users,
      children: [
        { to: '/admin/crm',             label: l('العملاء', 'Clients'),                icon: Users },
        { to: '/admin/users',           label: l('المستخدمون', 'Users'),                icon: UserCog },
        { to: '/admin/leads',           label: l('العملاء المحتملون', 'Leads'),          icon: Target },
        { to: '/admin/support-tickets', label: l('تذاكر الدعم', 'Support Tickets'),    icon: HelpCircle },
      ],
    },
    {
      key: 'finance',
      label: l('المالية', 'Finance'),
      icon: DollarSign,
      children: [
        { to: '/admin/financing',    label: l('نظرة مالية', 'Finance Overview'),  icon: PieChart },
        { to: '/admin/invoices',     label: l('الفواتير', 'Invoices'),              icon: Receipt },
        { to: '/admin/transactions', label: l('المعاملات', 'Transactions'),         icon: CreditCard },
        { to: '/admin/revenue',      label: l('الإيرادات', 'Revenue Analytics'),    icon: BarChart },
      ],
    },
    {
      key: 'marketing',
      label: l('التسويق', 'Marketing'),
      icon: Megaphone,
      children: [
        { to: '/admin/marketing',       label: l('الحملات', 'Campaigns'),               icon: Target },
        { to: '/admin/email-marketing', label: l('التسويق بالبريد', 'Email Marketing'), icon: Mail },
        { to: '/admin/social-media',    label: l('وسائل التواصل', 'Social Media'),      icon: Share2 },
        { to: '/admin/analytics',       label: l('التحليلات', 'Analytics'),              icon: BarChart3 },
      ],
    },
    {
      key: 'content',
      label: l('المحتوى', 'Content'),
      icon: Newspaper,
      children: [
        { to: '/admin/blog-manager',  label: l('إدارة المدونة', 'Blog Manager'),    icon: Newspaper },
        { to: '/admin/media-library', label: l('مكتبة الوسائط', 'Media Library'),  icon: Database },
        { to: '/admin/notifications', label: l('الإشعارات', 'Notifications'),       icon: Bell },
        { to: '/admin/messages',      label: l('الرسائل', 'Messages'),                icon: MessageSquare },
      ],
    },
    {
      key: 'scheduling',
      label: l('الجدولة', 'Scheduling'),
      icon: Calendar,
      children: [
        { to: '/admin/scheduling',   label: l('التقويم', 'Calendar'),     icon: CalendarDays },
        { to: '/admin/appointments', label: l('المواعيد', 'Appointments'), icon: Calendar },
        { to: '/admin/webinars',     label: l('الندوات', 'Webinars'),       icon: Video },
      ],
    },
    {
      key: 'settings',
      label: l('الإعدادات', 'Settings'),
      icon: Settings,
      children: [
        { to: '/admin/settings',     label: l('إعدادات عامة', 'General'),    icon: Settings },
        { to: '/admin/security',     label: l('الأمان', 'Security'),           icon: Shield },
        { to: '/admin/appearance',   label: l('المظهر', 'Appearance'),         icon: Palette },
        { to: '/admin/integrations', label: l('التكاملات', 'Integrations'),    icon: Globe },
      ],
    },
  ];

  const activeGroup = groups.find(g => g.children.some(c => location.pathname === c.to));

  const toggleGroup = (key) =>
    setOpenGroups(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const isGroupOpen = (key) => openGroups.includes(key) || activeGroup?.key === key;

  const handleLogout = () => { logout(); navigate('/'); };

  const userName = currentUser?.[language === 'ar' ? 'name_ar' : 'name_en'] || 'Admin';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen flex bg-background relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.08]" />
      </div>

      {/* ───────── Sidebar ───────── */}
      <aside
        className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-40 w-72 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
        } lg:sticky lg:top-0 lg:h-screen lg:self-start flex flex-col`}
      >
        <div className="relative h-full m-3 lg:m-4 rounded-2xl overflow-hidden border border-primary/15 bg-sidebar/70 backdrop-blur-xl shadow-xl flex flex-col text-sidebar-foreground">
          <div className="absolute -top-24 -right-12 h-48 w-48 rounded-full bg-primary/25 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative p-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Logo" className="h-auto w-36" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-primary transition"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Admin badge */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/10">
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold shadow-neon">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] uppercase tracking-wider text-sidebar-foreground/60 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {l('مسؤول', 'Administrator')}
                </p>
                <p className="text-sm font-semibold truncate">{userName}</p>
              </div>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="relative flex-1 overflow-y-auto p-3 space-y-1 mt-2">
            {groups.map(group => {
              const open = isGroupOpen(group.key);
              const hasActive = group.children.some(c => location.pathname === c.to);

              return (
                <div key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      hasActive
                        ? 'bg-primary/15 text-sidebar-primary'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/30'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <group.icon className="h-4 w-4" />
                      {group.label}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className={`${language === 'ar' ? 'pr-4 border-r' : 'pl-4 border-l'} border-primary/20 mt-1 mb-1 ms-3 space-y-0.5`}>
                          {group.children.map(child => {
                            const active = location.pathname === child.to;
                            return (
                              <Link
                                key={child.to}
                                to={child.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  active
                                    ? 'text-primary-foreground'
                                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                                }`}
                              >
                                {active && (
                                  <motion.span
                                    layoutId="admin-nav-active"
                                    className="absolute inset-0 rounded-lg gradient-gold shadow-neon"
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                  />
                                )}
                                <span className="relative flex items-center gap-2.5 w-full">
                                  <child.icon className="h-3.5 w-3.5" />
                                  <span className="flex-1">{child.label}</span>
                                  {active && <ChevronRight className="h-3 w-3 rtl:rotate-180 opacity-80" />}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Pro tip */}
          <div className="m-3 mb-2 p-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/30 blur-2xl" />
            <div className="relative flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-[0.7rem] font-semibold">{l('نصيحة سريعة', 'Pro tip')}</p>
                <p className="text-[0.65rem] text-sidebar-foreground/60 leading-relaxed mt-0.5">
                  {l('استخدم ⌘K لفتح البحث السريع.', 'Press ⌘K to open quick search.')}
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition"
            >
              <LogOut className="h-4 w-4" />{t('app.logout')}
            </button>
          </div>
        </div>
      </aside>

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

          <div className="hidden md:flex relative w-full max-w-md mx-4">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
              type="search"
              placeholder={l('ابحث عن أي شيء...', 'Search anything...')}
              className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
            <kbd className={`hidden lg:inline-flex absolute top-1/2 -translate-y-1/2 text-[0.65rem] font-semibold text-muted-foreground/70 border border-primary/15 px-1.5 py-0.5 rounded bg-primary/5 ${language === 'ar' ? 'left-2' : 'right-2'}`}>
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-1 ms-auto">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition flex items-center gap-1.5 text-xs font-medium"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <Link
              to="/admin/notifications"
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

export default AdminLayout;
