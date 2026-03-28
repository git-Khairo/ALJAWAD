import { useLanguage } from '@/contexts/LanguageContext';
import { Receipt, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

const Invoices = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const invoices = [
    { id: 'INV-2026-001', client: l('أحمد الشمري', 'Ahmad Al-Shamri'), amount: 2500, status: 'paid', date: '2026-03-01', due: '2026-03-15' },
    { id: 'INV-2026-002', client: l('فاطمة القحطاني', 'Fatimah Al-Qahtani'), amount: 4200, status: 'pending', date: '2026-03-05', due: '2026-03-20' },
    { id: 'INV-2026-003', client: l('عبدالله العنزي', 'Abdullah Al-Enezi'), amount: 1800, status: 'overdue', date: '2026-02-15', due: '2026-03-01' },
    { id: 'INV-2026-004', client: l('نورة الحربي', 'Noura Al-Harbi'), amount: 6500, status: 'paid', date: '2026-03-10', due: '2026-03-25' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('الفواتير', 'Invoices')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 me-1" />{l('تصدير', 'Export')}</Button>
          <Button size="sm"><Plus className="h-4 w-4 me-1" />{l('فاتورة جديدة', 'New Invoice')}</Button>
        </div>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3 font-medium">{l('رقم الفاتورة', 'Invoice #')}</th>
              <th className="text-start p-3 font-medium">{l('العميل', 'Client')}</th>
              <th className="text-start p-3 font-medium">{l('المبلغ', 'Amount')}</th>
              <th className="text-start p-3 font-medium">{l('الحالة', 'Status')}</th>
              <th className="text-start p-3 font-medium">{l('تاريخ الإصدار', 'Issue Date')}</th>
              <th className="text-start p-3 font-medium">{l('تاريخ الاستحقاق', 'Due Date')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{inv.id}</td>
                <td className="p-3">{inv.client}</td>
                <td className="p-3 font-medium">{inv.amount.toLocaleString()} {l('ر.س', 'SAR')}</td>
                <td className="p-3"><StatusBadge status={inv.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">{inv.date}</td>
                <td className="p-3 text-xs text-muted-foreground">{inv.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
