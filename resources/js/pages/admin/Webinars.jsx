import { useLanguage } from '@/contexts/LanguageContext';
import { Video, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Webinars = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const webinars = [
    { title: l('مقدمة في التداول', 'Intro to Trading'), date: '2026-03-20', time: '7:00 PM', attendees: 45, status: 'upcoming' },
    { title: l('تحليل فني متقدم', 'Advanced Technical Analysis'), date: '2026-03-25', time: '8:00 PM', attendees: 32, status: 'upcoming' },
    { title: l('إدارة المخاطر', 'Risk Management'), date: '2026-03-10', time: '7:00 PM', attendees: 78, status: 'completed' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('الندوات', 'Webinars')}</h1>
        <Button size="sm"><Plus className="h-4 w-4 me-1" />{l('ندوة جديدة', 'New Webinar')}</Button>
      </div>
      <div className="grid gap-4">
        {webinars.map((w, i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{w.title}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${w.status === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {w.status === 'upcoming' ? l('قادمة', 'Upcoming') : l('مكتملة', 'Completed')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{w.date} · {w.time}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {w.attendees} {l('مشارك', 'attendees')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Webinars;
