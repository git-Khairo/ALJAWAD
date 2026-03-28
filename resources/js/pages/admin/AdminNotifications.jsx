import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminNotifications = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const notifications = [
    { title: l('طلب جديد مقدم', 'New application submitted'), time: '5 min ago', read: false },
    { title: l('دفع مستلم', 'Payment received'), time: '1 hour ago', read: false },
    { title: l('تحديث النظام', 'System update'), time: '3 hours ago', read: true },
    { title: l('تسجيل مستخدم جديد', 'New user registered'), time: '1 day ago', read: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('الإشعارات', 'Notifications')}</h1>
        <Button size="sm"><Send className="h-4 w-4 me-1" />{l('إرسال إشعار', 'Send Notification')}</Button>
      </div>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div key={i} className={`bg-card rounded-xl border p-4 flex items-center gap-4 ${!n.read ? 'border-primary/30' : ''}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!n.read ? 'bg-primary/10' : 'bg-muted/50'}`}>
              <Bell className={`h-4 w-4 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications;
