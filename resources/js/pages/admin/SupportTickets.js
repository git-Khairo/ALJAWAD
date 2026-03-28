import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

const SupportTickets = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const tickets = [
    { id: 'TK-001', subject: l('مشكلة في الدفع', 'Payment issue'), user: l('أحمد', 'Ahmad'), priority: 'high', status: 'open', date: '2026-03-15' },
    { id: 'TK-002', subject: l('استفسار عن الدورة', 'Course inquiry'), user: l('سارة', 'Sara'), priority: 'medium', status: 'in_progress', date: '2026-03-14' },
    { id: 'TK-003', subject: l('تحديث البيانات', 'Update profile'), user: l('محمد', 'Mohammed'), priority: 'low', status: 'resolved', date: '2026-03-12' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('تذاكر الدعم', 'Support Tickets')}</h1>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3 font-medium">#</th>
              <th className="text-start p-3 font-medium">{l('الموضوع', 'Subject')}</th>
              <th className="text-start p-3 font-medium">{l('المستخدم', 'User')}</th>
              <th className="text-start p-3 font-medium">{l('الأولوية', 'Priority')}</th>
              <th className="text-start p-3 font-medium">{l('الحالة', 'Status')}</th>
              <th className="text-start p-3 font-medium">{l('التاريخ', 'Date')}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{t.id}</td>
                <td className="p-3">{t.subject}</td>
                <td className="p-3">{t.user}</td>
                <td className="p-3"><StatusBadge status={t.priority} /></td>
                <td className="p-3"><StatusBadge status={t.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportTickets;
