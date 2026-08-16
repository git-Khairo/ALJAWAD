import { useEffect, useState } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, FileText, Bell, Settings, LogOut, Menu, X,
  Wallet, NotebookPen, Network,
} from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Wordmark } from '@/components/brand/Wordmark';

/**
 * Client dashboard shell.
 *
 * The previous shell floated a rounded, blurred, glowing card over two
 * ambient blur blobs and a grid background. This one is flat: a sidebar
 * flush to the edge, separated by a single rule and a value step.
 *
 * Sides are expressed with logical properties throughout (`start`/`end`,
 * `ms`/`ps`), so the whole thing mirrors correctly in Arabic instead of
 * needing a `language === 'ar' ? ... : ...` at every position.
 */
const AppLayout = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { notifications } = useAppData();
  const location = useLocation();
  const navigate = useNavigate();

  // Every hook runs before any early return: React identifies hooks by call
  // order, so a guard that returns ahead of one changes the hook count between
  // renders and throws "Rendered fewer hooks than expected" the moment
  // isAuthenticated flips (a logout, or the session resolving after mount).
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const unread = (notifications ?? []).filter((n) => !n.read).length;

  const links = [
    { to: '/app/overview',      label: t('app.overview'),      icon: LayoutDashboard },
    { to: '/app/profile',       label: t('app.profile'),       icon: User },
    { to: '/app/applications',  label: t('app.applications'),  icon: FileText },
    { to: '/app/transactions',  label: t('app.transactions'),  icon: Wallet },
    { to: '/app/journal',       label: t('app.myJournal'),     icon: NotebookPen },
    ...(currentUser?.affiliate_code
      ? [{ to: '/app/network', label: language === 'ar' ? 'شبكتي' : 'My Network', icon: Network }]
      : []),
    { to: '/app/notifications', label: t('app.notifications'), icon: Bell, badge: unread },
    { to: '/app/settings',      label: t('app.settings'),      icon: Settings },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  const userName = currentUser?.name || (language === 'ar' ? 'متدرب' : 'Trader');
  const initials = userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const nav = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-5">
        <Wordmark size="sm" showDescriptor={false} />
        <button
          onClick={() => setSidebarOpen(false)}
          className="-me-2 rounded p-2 text-fg-muted transition-colors duration-120 hover:text-foreground lg:hidden"
          aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Who you are signed in as */}
      <div className="flex shrink-0 items-center gap-3 border-b border-rule px-5 py-4">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary text-sm font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-fg-faint">{t('app.welcome')}</span>
          <span className="block truncate text-sm font-semibold text-foreground">{userName}</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors duration-120 ${
                active
                  ? 'bg-primary/12 font-medium text-primary'
                  : 'text-foreground/75 hover:bg-surface-sunken hover:text-foreground'
              }`}
            >
              {/* A rule on the leading edge marks the active item. It reads at
                  a glance and, unlike a shared layoutId pill, does not fly
                  across the sidebar on every route change. */}
              <span
                className={`absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary transition-opacity duration-120 ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
              <link.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{link.label}</span>
              {link.badge > 0 && (
                <span className="ledger-num rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground" dir="ltr">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-rule p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-destructive transition-colors duration-120 hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          {t('app.logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* ───────── Sidebar, desktop ───────── */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-e border-rule bg-surface-sunken lg:flex">
        {nav}
      </aside>

      {/* ───────── Sidebar, mobile drawer ───────── */}
      {sidebarOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-background/80 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
            tabIndex={-1}
          />
          <aside className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-rule bg-surface-sunken lg:hidden">
            {nav}
          </aside>
        </>
      )}

      {/* ───────── Main column ───────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-rule bg-background px-4 md:px-6">
          <button
            className="-ms-2 rounded p-2 text-foreground transition-colors duration-120 hover:bg-surface-sunken lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div className="ms-auto flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              className="rounded px-2.5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
              lang={language === 'ar' ? 'en' : 'ar'}
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </button>

            <Link
              to="/app/notifications"
              className="relative rounded p-2 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
              aria-label={
                unread > 0
                  ? `${t('app.notifications')} (${unread})`
                  : t('app.notifications')
              }
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              {/* Only shown when something is actually unread. The old dot was
                  always on, which trains people to ignore it. */}
              {unread > 0 && (
                <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>

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

        {/* Keyed on the path so each route re-runs the entry animation. CSS
            rather than framer-motion: `animate-rise` fills `both`, so content
            is painted even if rAF is throttled. */}
        <main key={location.pathname} className="animate-rise flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
