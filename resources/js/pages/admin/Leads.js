import { useLanguage } from '@/contexts/LanguageContext';
import { UserPlus, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

const Leads = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const leads = [
    { name: l('خالد المنصور', 'Khalid Al-Mansour'), email: 'khalid@example.com', phone: '+966 55 123 4567', source: 'Website', status: 'new' },
    { name: l('سارة العتيبي', 'Sara Al-Otaibi'), email: 'sara@example.com', phone: '+966 50 987 6543', source: 'Referral', status: 'contacted' },
    { name: l('فهد الدوسري', 'Fahad Al-Dosari'), email: 'fahad@example.com', phone: '+966 54 567 8901', source: 'Social Media', status: 'qualified' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('العملاء المحتملون', 'Leads')}</h1>
        <Button size="sm"><UserPlus className="h-4 w-4 me-1" />{l('إضافة', 'Add Lead')}</Button>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3 font-medium">{l('الاسم', 'Name')}</th>
              <th className="text-start p-3 font-medium">{l('البريد', 'Email')}</th>
              <th className="text-start p-3 font-medium">{l('الهاتف', 'Phone')}</th>
              <th className="text-start p-3 font-medium">{l('المصدر', 'Source')}</th>
              <th className="text-start p-3 font-medium">{l('الحالة', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{lead.name}</td>
                <td className="p-3 text-muted-foreground">{lead.email}</td>
                <td className="p-3 text-muted-foreground">{lead.phone}</td>
                <td className="p-3">{lead.source}</td>
                <td className="p-3"><StatusBadge status={lead.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leads;
