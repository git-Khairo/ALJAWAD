import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Send, Users, UserCheck, UserX, Info } from 'lucide-react';
import { toast } from 'sonner';

const RECIPIENT_GROUPS = [
  { key: 'all',     ar: 'الجميع',                   en: 'Everyone',           icon: Users,     color: 'text-primary' },
  { key: 'coaches', ar: 'الكوتشز فقط',              en: 'Coaches only',        icon: UserCheck, color: 'text-violet-400' },
  { key: 'clients', ar: 'العملاء فقط',               en: 'Clients only',        icon: UserCheck, color: 'text-emerald-400' },
  { key: 'leads',   ar: 'العملاء المحتملون فقط',     en: 'Leads only',          icon: UserX,     color: 'text-amber-400' },
];

const RECIPIENT_LABELS = {
  all: { ar: 'الجميع', en: 'Everyone' },
  coaches: { ar: 'الكوتشز', en: 'Coaches' },
  clients: { ar: 'العملاء', en: 'Clients' },
  leads:   { ar: 'العملاء المحتملون', en: 'Leads' },
};

const TelegramNotifications = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  // `users` was removed — use `coaches` from AppDataContext instead
  const { coaches, clients, leads, sentNotifications, sendTelegramNotification } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [message,   setMessage]   = useState('');
  const [recipient, setRecipient] = useState('all');

  // ── Count who will actually receive (has telegram_chat_id) ──────────────
  const counts = useMemo(() => {
    const coachCount  = (coaches  ?? []).filter(c => c.telegram_chat_id).length;
    const clientCount = (clients  ?? []).filter(c => c.telegram_chat_id).length;
    const leadCount   = (leads    ?? []).filter(l => l.telegram_chat_id).length;
    return {
      coaches: coachCount,
      clients: clientCount,
      leads:   leadCount,
      all:     coachCount + clientCount + leadCount,
    };
  }, [coaches, clients, leads]);

  const reachCount = counts[recipient] ?? 0;

  const handleSend = () => {
    if (!message.trim()) {
      toast.error(l('اكتب رسالة أولاً', 'Write a message first')); return;
    }
    if (reachCount === 0) {
      toast.error(l('لا يوجد مستخدمون مرتبطون بتليغرام في هذه المجموعة', 'No Telegram-linked users in this group')); return;
    }
    sendTelegramNotification({ message: message.trim(), recipients: recipient, count: reachCount });
    toast.success(l(`تم إرسال الإشعار إلى ${reachCount} مستخدم`, `Notification sent to ${reachCount} users`));
    setMessage('');
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">{l('إشعارات تليغرام', 'Telegram Notifications')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('إرسال إشعارات مباشرة للمستخدمين عبر تليغرام', 'Send direct notifications to users via Telegram')}
        </p>
      </div>

      {/* ── Info box ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-sm">
        <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-blue-300/80 text-xs leading-relaxed">
          {l(
            'الإشعارات تُرسل عبر بوت تليغرام المرتبط بالمنصة. يجب أن يكون المستخدم قد فعّل حسابه على تليغرام (telegram_chat_id) حتى يستقبل الإشعار.',
            'Notifications are sent via the platform\'s linked Telegram bot. Users must have their Telegram account linked (telegram_chat_id) to receive them.'
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Compose ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold mb-4">{l('إنشاء إشعار', 'Compose Notification')}</h2>

            {/* Recipient selector */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block font-medium">{l('إرسال إلى', 'Send To')}</label>
              <div className="grid grid-cols-2 gap-2">
                {RECIPIENT_GROUPS.map((g) => {
                  const Icon = g.icon;
                  const cnt  = counts[g.key];
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setRecipient(g.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-start transition-all ${
                        recipient === g.key
                          ? 'border-primary/60 bg-primary/8'
                          : 'border-border hover:border-primary/30 bg-card'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${recipient === g.key ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${recipient === g.key ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {l(g.ar, g.en)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cnt} {l('مرتبط','linked')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block font-medium">{l('نص الرسالة', 'Message')}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                placeholder={l('اكتب رسالتك هنا...', 'Write your message here...')}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm resize-none"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-muted-foreground mt-1">{message.length} {l('حرف','chars')}</p>
            </div>

            {/* Preview reach */}
            <div className={`flex items-center justify-between p-3 rounded-xl border mb-4 ${reachCount > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/30'}`}>
              <span className="text-sm text-muted-foreground">
                {l('سيصل إلى', 'Will reach')}:
              </span>
              <span className={`font-bold text-lg ${reachCount > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {reachCount} {l('مستخدم','users')}
              </span>
            </div>

            <Button onClick={handleSend} className="w-full gap-2" disabled={!hasPermission('create telegram notifications') || !message.trim() || reachCount === 0}>
              <Send className="h-4 w-4" />
              {hasPermission('create telegram notifications')
                ? l('إرسال الإشعار', 'Send Notification')
                : l('ليس لديك صلاحية الإرسال', 'No permission to send')}
            </Button>
          </div>

          {/* ── Telegram stats ─────────────────────────────────────────────── */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold mb-3">{l('حسابات تليغرام المرتبطة', 'Linked Telegram Accounts')}</h2>
            <div className="space-y-2">
              {[
                { label: l('الكوتشز', 'Coaches'),              count: counts.coaches, total: (coaches ?? []).length },
                { label: l('العملاء', 'Clients'),              count: counts.clients, total: clients.length },
                { label: l('العملاء المحتملون', 'Leads'),      count: counts.leads,   total: leads.length },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-36 shrink-0">{row.label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: row.total > 0 ? `${(row.count / row.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-14 text-end shrink-0">{row.count}/{row.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sent history ─────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">{l('سجل الإشعارات المرسلة', 'Sent Notifications Log')}</h2>
          </div>
          <div className="divide-y">
            {sentNotifications.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {l('لم يتم إرسال أي إشعارات بعد', 'No notifications sent yet')}
              </div>
            )}
            {sentNotifications.map((n) => {
              const rl = RECIPIENT_LABELS[n.recipients] ?? { ar: n.recipients, en: n.recipients };
              return (
                <div key={n.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium line-clamp-2 flex-1">{n.message}</p>
                    <span className="text-xs font-bold text-emerald-400 shrink-0">{n.count} {l('مستخدم','users')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {l(rl.ar, rl.en)}
                    </span>
                    <span>·</span>
                    <span>{new Date(n.sent_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramNotifications;
