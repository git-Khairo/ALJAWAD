import { useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, DollarSign, Megaphone, Calendar, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight, PieChart, BarChart3, UserCog, Target, CalendarDays,
  Receipt, CreditCard, FileText, Mail, BarChart, Sparkles, BookOpen,
  Newspaper, Share2, MessageSquare, Clock, Shield, GraduationCap,
  Database, Globe, HelpCircle, Search, Moon, Sun, Star, UserCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

const AdminLayout = () => {
  const { t, language, toggleLanguage, toggleTheme, theme } = useLanguage();
  const { currentUser, isAuthenticated, role, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  // Redirect regular users to their dashboard
  if (!['admin', 'super-admin'].includes(role) && currentUser?.user_type !== 'coach') {
    return <Navigate to="/app/overview" replace />;
  }
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['overview']);

  const l = (ar, en) => (language === 'ar' ? ar : en);

  const groups = [
    {
      key: 'overview',
      label: l('نظرة عامة', 'Overview'),
      icon: LayoutDashboard,
      children: [
        { to: '/admin/overview',     label: l('لوحة التحكم', 'Dashboard'),    icon: LayoutDashboard, perm: 'view dashboard' },
        { to: '/admin/performance',  label: l('الأداء', 'Performance'),       icon: BarChart3, perm: 'view performance' },
        { to: '/admin/reports',      label: l('التقارير', 'Reports'),          icon: FileText, perm: 'view reports' },
        { to: '/admin/activity-log', label: l('سجل النشاط', 'Activity Log'),  icon: Clock, perm: 'view activity log' },
      ],
    },
    {
      key: 'crm',
      label: l('إدارة العملاء', 'CRM'),
      icon: Users,
      children: [
        { to: '/admin/crm',             label: l('العملاء', 'Clients'),                icon: Users, perm: 'view clients' },
        { to: '/admin/users',           label: l('المستخدمون', 'Users'),                icon: UserCog, perm: 'view users' },
        { to: '/admin/leads',           label: l('العملاء المحتملون', 'Leads'),          icon: Target, perm: 'view leads' },
        { to: '/admin/support-tickets', label: l('تذاكر الدعم', 'Support Tickets'),    icon: HelpCircle, perm: 'view support tickets' },
        { to: '/admin/csat',            label: l('تقييم الخدمة', 'CSAT Ratings'),       icon: Star, perm: 'view csat' },
      ],
    },
    {
      key: 'finance',
      label: l('المالية', 'Finance'),
      icon: DollarSign,
      perm: 'view finance',
      children: [
        { to: '/admin/financing',    label: l('نظرة مالية', 'Finance Overview'),   icon: PieChart },
        { to: '/admin/invoices',     label: l('المصاريف', 'Expenses'),              icon: Receipt, perm: 'view expenses' },
        { to: '/admin/transactions', label: l('الإيداعات والسحوبات', 'Deposits & Withdrawals'), icon: CreditCard, perm: 'view transactions' },
        { to: '/admin/revenue',      label: l('المحافظ', 'Wallets'),               icon: BarChart, perm: 'view wallets' },
      ],
    },
    {
      key: 'marketing',
      label: l('التسويق', 'Marketing'),
      icon: Megaphone,
      children: [
        { to: '/admin/marketing',       label: l('الحملات', 'Campaigns'),           icon: Target, perm: 'view campaigns' },
        { to: '/admin/email-marketing', label: l('خطط المحتوى', 'Content Plans'),    icon: CalendarDays, perm: 'view content plans' },
        { to: '/admin/notifications',   label: l('إشعارات تليغرام', 'Telegram Notifications'), icon: MessageSquare, perm: 'view telegram notifications' },
      ],
    },
    {
      key: 'content',
      label: l('المحتوى', 'Content'),
      icon: Newspaper,
      children: [
        { to: '/admin/blog-manager',     label: l('إدارة المدونة', 'Blog Manager'),         icon: Newspaper, perm: 'view blog' },
        { to: '/admin/course-manager',   label: l('إدارة الدورات', 'Course Manager'),       icon: BookOpen, perm: 'view courses' },
        { to: '/admin/content-creation', label: l('إنشاء المحتوى', 'Content Creation'),    icon: Sparkles, perm: 'view content' },
        { to: '/admin/media-library',    label: l('الأفكار والمسودات', 'Ideas & Drafts'),   icon: Database, perm: 'view media library' },
      ],
    },
    {
      key: 'scheduling',
      label: l('الجدولة', 'Scheduling'),
      icon: Calendar,
      children: [
        { to: '/admin/scheduling',   label: l('التقويم', 'Calendar'),     icon: CalendarDays, perm: 'view scheduling' },
        { to: '/admin/appointments', label: l('المواعيد', 'Appointments'), icon: Calendar, perm: 'view appointments' },
      ],
    },
    {
      key: 'settings',
      label: l('الإعدادات', 'Settings'),
      icon: Settings,
      children: [
        { to: '/admin/profile',      label: l('الملف الشخصي', 'My Profile'),  icon: UserCircle },
        { to: '/admin/settings',     label: l('إعدادات عامة', 'General'),    icon: Settings, perm: 'view settings' },
        { to: '/admin/coaches',      label: l('المدربون', 'Coaches'),         icon: GraduationCap, perm: 'view users' },
      ],
    },
  ];

  // Hide nav items the user lacks permission for, then drop any group left empty.
  const visibleGroups = groups
    .map(g => ({ ...g, children: (g.children ?? []).filter(c => !c.perm || hasPermission(c.perm)) }))
    .filter(g => (!g.perm || hasPermission(g.perm)) && g.children.length > 0);

  const activeGroup = visibleGroups.find(g => g.children.some(c => location.pathname === c.to));

  const toggleGroup = (key) =>
    setOpenGroups(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const isGroupOpen = (key) => openGroups.includes(key) || activeGroup?.key === key;

  const handleLogout = () => { logout(); navigate('/'); };

  const userName = currentUser?.name || 'Admin';
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
        className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-40 w-80 transform transition-transform duration-300 lg:translate-x-0 ${
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
            {visibleGroups.map(group => {
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
