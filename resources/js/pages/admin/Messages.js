import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare } from 'lucide-react';

const Messages = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const messages = [
    { from: l('أحمد', 'Ahmad'), subject: l('استفسار عن الدورة', 'Course inquiry'), time: '10 min ago', read: false },
    { from: l('سارة', 'Sara'), subject: l('طلب استرداد', 'Refund request'), time: '2 hours ago', read: false },
    { from: l('محمد', 'Mohammed'), subject: l('شكراً على الخدمة', 'Thanks for the service'), time: '1 day ago', read: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('الرسائل', 'Messages')}</h1>
      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`bg-card rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 ${!m.read ? 'border-primary/30' : ''}`}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {m.from[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm ${!m.read ? 'font-semibold' : ''}`}>{m.from}</p>
                <p className="text-xs text-muted-foreground">{m.time}</p>
              </div>
              <p className="text-xs text-muted-foreground">{m.subject}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;
