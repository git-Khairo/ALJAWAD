import { useEffect, useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, DollarSign, Megaphone, Calendar, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight, PieChart, BarChart3, UserCog, Target, CalendarDays,
  Receipt, CreditCard, FileText, Mail, BarChart, Sparkles, BookOpen,
  Newspaper, Share2, MessageSquare, Clock, Shield, GraduationCap,
  Database, Globe, HelpCircle, Search, Moon, Sun, Star, UserCircle, Network,
} from 'lucide-react';
import { Wordmark } from '@/components/brand/Wordmark';

const AdminLayout = () => {
  const { t, language, toggleLanguage, toggleTheme, theme } = useLanguage();
  const { currentUser, isAuthenticated, role, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Every hook runs before any early return: React identifies hooks by call
  // order, so a guard that returns ahead of one changes the hook count between
  // renders and throws "Rendered fewer hooks than expected" the moment a guard
  // flips (a logout, or role resolving after mount).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['overview']);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // The drawer covers the viewport, so the page behind it must not scroll.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  // Redirect regular users to their dashboard
  if (!['admin', 'super-admin'].includes(role) && currentUser?.user_type !== 'coach') {
    return <Navigate to="/app/overview" replace />;
  }

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
      // No group-level perm: the transactions page is independent of 'view finance',
      // so each child carries its own permission instead.
      children: [
        { to: '/admin/financing',    label: l('نظرة مالية', 'Finance Overview'),   icon: PieChart, perm: 'view finance' },
        { to: '/admin/invoices',     label: l('المصاريف', 'Expenses'),              icon: Receipt, perm: ['view finance', 'view expenses'] },
        { to: '/admin/transactions', label: l('الإيداعات والسحوبات', 'Deposits & Withdrawals'), icon: CreditCard, perm: 'view transactions' },
        { to: '/admin/revenue',      label: l('المحافظ', 'Wallets'),               icon: BarChart, perm: ['view finance', 'view wallets'] },
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
      key: 'affiliates',
      label: l('الوسطاء', 'Affiliates'),
      icon: Network,
      children: [
        { to: '/admin/affiliates',          label: l('الوسطاء الفرعيون', 'Sub-IBs'),      icon: Network,  perm: 'view affiliates' },
        { to: '/admin/affiliates/reports',  label: l('تقارير الوسطاء', 'IB Reports'),     icon: BarChart3, perm: 'view affiliates' },
        { to: '/admin/affiliates/settings', label: l('إعدادات الوسطاء', 'IB Settings'),   icon: Settings, perm: 'manage affiliates' },
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

  // `perm` may be a single permission or an array of permissions that are all required.
  const allowed = (perm) =>
    !perm || (Array.isArray(perm) ? perm.every(hasPermission) : hasPermission(perm));

  // Hide nav items the user lacks permission for, then drop any group left empty.
  const visibleGroups = groups
    .map(g => ({ ...g, children: (g.children ?? []).filter(c => allowed(c.perm)) }))
    .filter(g => allowed(g.perm) && g.children.length > 0);

  const activeGroup = visibleGroups.find(g => g.children.some(c => location.pathname === c.to));

  const toggleGroup = (key) =>
    setOpenGroups(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const isGroupOpen = (key) => openGroups.includes(key) || activeGroup?.key === key;

  const handleLogout = () => { logout(); navigate('/'); };

  const userName = currentUser?.name || 'Admin';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* ───────── Sidebar ─────────
          Flush to the edge, separated by a rule and a value step. Sides use
          logical properties so the whole shell mirrors in Arabic. */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-rule bg-sidebar text-sidebar-foreground transition-transform duration-320 ease-out-quart lg:sticky lg:top-0 lg:z-30 lg:h-[100dvh] lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-5">
          <Wordmark size="sm" showDescriptor={false} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="-me-2 rounded p-2 text-fg-muted transition-colors duration-120 hover:text-foreground lg:hidden"
            aria-label={l('إغلاق القائمة', 'Close menu')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Who is signed in, and with what authority */}
        <div className="flex shrink-0 items-center gap-3 border-b border-rule px-5 py-4">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary text-sm font-bold text-primary-foreground"
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-xs text-fg-faint">
              <Shield className="h-3 w-3" />
              {l('مسؤول', 'Administrator')}
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">{userName}</span>
          </span>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {visibleGroups.map(group => {
              const open = isGroupOpen(group.key);
              const hasActive = group.children.some(c => location.pathname === c.to);

              return (
                <div key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={open}
                    className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-sm transition-colors duration-120 ${
                      hasActive
                        ? 'font-medium text-primary'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <group.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out-quart ${open ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* No height animation: animating height is a layout property,
                      and the whole point of a nav is that it is there when you
                      reach for it. */}
                  {open && (
                    <ul className="my-1 ms-6 border-s border-rule ps-3">
                      {group.children.map(child => {
                        const active = location.pathname === child.to;
                        return (
                          <li key={child.to}>
                            <Link
                              to={child.to}
                              onClick={() => setSidebarOpen(false)}
                              aria-current={active ? 'page' : undefined}
                              className={`relative flex items-center gap-2.5 rounded px-3 py-2 text-xs transition-colors duration-120 ${
                                active
                                  ? 'bg-primary/12 font-medium text-primary'
                                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-foreground'
                              }`}
                            >
                              <span
                                className={`absolute inset-y-1 -start-3.5 w-0.5 rounded-full bg-primary transition-opacity duration-120 ${
                                  active ? 'opacity-100' : 'opacity-0'
                                }`}
                                aria-hidden="true"
                              />
                              <child.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                              <span className="flex-1">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-rule p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-destructive transition-colors duration-120 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t('app.logout')}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-background/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={l('إغلاق القائمة', 'Close menu')}
          tabIndex={-1}
        />
      )}

      {/* ───────── Main column ───────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-rule bg-background px-4 md:px-6">
          <button
            className="-ms-2 rounded p-2 text-foreground transition-colors duration-120 hover:bg-surface-sunken lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={l('فتح القائمة', 'Open menu')}
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          {/* The global search box and its ⌘K hint were bound to nothing: no
              handler, no results, no shortcut listener. Removed rather than
              left as an affordance that lies. */}

          <div className="ms-auto flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="rounded p-2 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
              aria-label={l('تبديل المظهر', 'Toggle theme')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" strokeWidth={1.75} /> : <Sun className="h-4 w-4" strokeWidth={1.75} />}
            </button>
            <button
              onClick={toggleLanguage}
              className="rounded px-2.5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
              lang={language === 'ar' ? 'en' : 'ar'}
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </button>

            <span className="mx-1 hidden h-5 w-px bg-rule sm:block" aria-hidden="true" />

            <span className="hidden items-center gap-2 sm:flex">
              <span
                className="grid h-8 w-8 place-items-center rounded bg-primary text-xs font-bold text-primary-foreground"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="hidden text-sm text-foreground md:inline">{userName}</span>
            </span>
          </div>
        </header>

        {/* CSS rather than framer-motion: `animate-rise` fills `both`, so the
            page is painted even when rAF is throttled. */}
        <main key={location.pathname} className="animate-rise flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
