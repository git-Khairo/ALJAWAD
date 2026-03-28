import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';

const ActivityLog = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const logs = [
    { action: l('تم تحديث حالة الطلب', 'Application status updated'), user: 'Admin', time: '2 min ago', type: 'update' },
    { action: l('تم إضافة عميل جديد', 'New client added'), user: 'Admin', time: '15 min ago', type: 'create' },
    { action: l('تم إرسال فاتورة', 'Invoice sent'), user: 'System', time: '1 hour ago', type: 'system' },
    { action: l('تم تسجيل دخول المستخدم', 'User logged in'), user: 'Ahmad', time: '2 hours ago', type: 'auth' },
    { action: l('تم تعديل الإعدادات', 'Settings updated'), user: 'Admin', time: '5 hours ago', type: 'update' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('سجل النشاط', 'Activity Log')}</h1>
      <div className="space-y-3">
        {logs.map((log, i) => (
          <div key={i} className="bg-card rounded-xl border p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">{log.user} · {log.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
