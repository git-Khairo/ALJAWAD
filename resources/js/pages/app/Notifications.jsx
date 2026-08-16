import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/lib/format';

/**
 * Notifications.
 *
 * Each row is a real <button>, so it can be reached and fired from the
 * keyboard. The previous version put the click handler on a plain div, which
 * meant the only way to mark anything read was a mouse.
 *
 * Tones come from the palette. The old chips used bg-green-100 / text-green-600,
 * light-mode values that rendered as bright pastel blocks on the dark ground.
 */
const TYPE = {
  success: { icon: CheckCircle2,  cls: 'text-chart-up' },
  warning: { icon: AlertTriangle, cls: 'text-warn' },
  info:    { icon: Info,          cls: 'text-primary' },
};

const Notifications = () => {
  const { t, language } = useLanguage();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const rows = notifications ?? [];
  const unreadCount = rows.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title={t('app.notifications')}
        description={
          unreadCount > 0
            ? l(`${unreadCount} إشعار غير مقروء.`, `${unreadCount} unread.`)
            : l('كل شيء مقروء.', 'Everything is read.')
        }
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
              {l('تعليم الكل كمقروء', 'Mark all as read')}
            </Button>
          )
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={l('لا توجد إشعارات', 'No notifications')}
          description={l(
            'ستظهر هنا تحديثات طلباتك وجلساتك ومعاملاتك.',
            'Updates about your requests, sessions and transactions will appear here.',
          )}
        />
      ) : (
        <ul className="border-t border-rule-strong">
          {rows.map((n) => {
            const { icon: Icon, cls } = TYPE[n.type] ?? { icon: Bell, cls: 'text-fg-muted' };
            const title = l(n.title_ar, n.title_en);
            const message = l(n.message_ar, n.message_en);

            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  disabled={n.read}
                  aria-label={
                    n.read
                      ? title
                      : l(`${title}. تعليم كمقروء`, `${title}. Mark as read`)
                  }
                  className={`flex w-full items-start gap-4 border-b border-rule px-1 py-4 text-start transition-colors duration-120 ${
                    n.read ? 'cursor-default' : 'hover:bg-surface-sunken'
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${n.read ? 'text-fg-faint' : cls}`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm ${
                        n.read ? 'text-fg-muted' : 'font-semibold text-foreground'
                      }`}
                    >
                      {title}
                    </span>
                    {message && (
                      <span className="measure mt-1 block text-sm leading-relaxed text-fg-muted">
                        {message}
                      </span>
                    )}
                    {n.date && (
                      <span className="mt-1.5 block text-xs text-fg-faint">
                        {fmtDate(n.date, language)}
                      </span>
                    )}
                  </span>

                  {!n.read && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default Notifications;
