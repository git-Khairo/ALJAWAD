import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

const Appointments = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const appointments = [
    { client: l('أحمد الشمري', 'Ahmad Al-Shamri'), type: l('استشارة', 'Consultation'), date: '2026-03-17', time: '10:00 AM', status: 'confirmed' },
    { client: l('فاطمة القحطاني', 'Fatimah Al-Qahtani'), type: l('مراجعة محفظة', 'Portfolio Review'), date: '2026-03-17', time: '2:00 PM', status: 'pending' },
    { client: l('عبدالله العنزي', 'Abdullah Al-Enezi'), type: l('جلسة تدريبية', 'Training Session'), date: '2026-03-18', time: '11:00 AM', status: 'confirmed' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('المواعيد', 'Appointments')}</h1>
        <Button size="sm"><Plus className="h-4 w-4 me-1" />{l('موعد جديد', 'New Appointment')}</Button>
      </div>
      <div className="space-y-3">
        {appointments.map((a, i) => (
          <div key={i} className="bg-card rounded-xl border p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{a.client}</h3>
                <p className="text-xs text-muted-foreground">{a.type} · {a.date} · {a.time}</p>
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appointments;
