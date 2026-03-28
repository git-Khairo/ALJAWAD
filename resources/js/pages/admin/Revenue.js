import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { TrendingUp, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { KPICard } from '@/components/KPICard';

const Revenue = () => {
  const { language } = useLanguage();
  const { transactions } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const totalRevenue = transactions.filter((tx) => tx.type === 'payment' && tx.status === 'completed').reduce((s, tx) => s + tx.amount, 0);
  const totalRefunds = transactions.filter((tx) => tx.type === 'refund').reduce((s, tx) => s + tx.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('تحليلات الإيرادات', 'Revenue Analytics')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard title={l('إجمالي الإيرادات', 'Total Revenue')} value={`${totalRevenue.toLocaleString()} ${l('ر.س', 'SAR')}`} icon={<DollarSign className="h-5 w-5" />} change="+12%" />
        <KPICard title={l('المستردات', 'Refunds')} value={`${totalRefunds.toLocaleString()} ${l('ر.س', 'SAR')}`} icon={<ArrowDown className="h-5 w-5" />} change="-3%" />
        <KPICard title={l('صافي الإيرادات', 'Net Revenue')} value={`${(totalRevenue - totalRefunds).toLocaleString()} ${l('ر.س', 'SAR')}`} icon={<TrendingUp className="h-5 w-5" />} change="+9%" />
      </div>
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">{l('ملخص شهري', 'Monthly Summary')}</h2>
        <div className="space-y-3">
          {['Jan', 'Feb', 'Mar'].map((month, i) => (
            <div key={month} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">{l(['يناير', 'فبراير', 'مارس'][i], month)} 2026</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{(4500 + i * 2200).toLocaleString()} {l('ر.س', 'SAR')}</span>
                <ArrowUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Revenue;
