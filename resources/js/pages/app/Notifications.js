import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockNotifications } from '@/data/mockData';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const Notifications = () => {
  const { t, language } = useLanguage();
  const [notifs, setNotifs] = useState(mockNotifications);

  const markRead = (id) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const typeIcons = { success: CheckCircle, warning: AlertTriangle, info: Info };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.notifications')}</h1>
      <div className="space-y-3">
        {notifs.map(n => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`bg-card rounded-xl border p-4 flex items-start gap-4 cursor-pointer transition-colors ${!n.read ? 'border-accent/50 bg-accent/5' : ''}`}>
              <div className={`p-2 rounded-lg shrink-0 ${n.type === 'success' ? 'bg-green-100 text-green-600' : n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n[language === 'ar' ? 'title_ar' : 'title_en']}</p>
                <p className="text-xs text-muted-foreground mt-1">{n[language === 'ar' ? 'message_ar' : 'message_en']}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
