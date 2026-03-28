import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Reports = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const reports = [
    { name: l('تقرير الإيرادات الشهري', 'Monthly Revenue Report'), date: '2026-03-01', type: l('مالي', 'Financial') },
    { name: l('تقرير أداء الحملات', 'Campaign Performance Report'), date: '2026-03-05', type: l('تسويق', 'Marketing') },
    { name: l('تقرير العملاء الجدد', 'New Clients Report'), date: '2026-03-10', type: l('عملاء', 'CRM') },
    { name: l('تقرير الجلسات', 'Sessions Report'), date: '2026-03-12', type: l('جدولة', 'Scheduling') },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('التقارير', 'Reports')}</h1>
        <Button variant="outline" size="sm"><Filter className="h-4 w-4 me-1" />{l('تصفية', 'Filter')}</Button>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3 font-medium">{l('اسم التقرير', 'Report Name')}</th>
              <th className="text-start p-3 font-medium">{l('النوع', 'Type')}</th>
              <th className="text-start p-3 font-medium">{l('التاريخ', 'Date')}</th>
              <th className="text-start p-3 font-medium">{l('إجراء', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{r.name}</td>
                <td className="p-3 text-muted-foreground">{r.type}</td>
                <td className="p-3 text-muted-foreground text-xs">{r.date}</td>
                <td className="p-3"><Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
