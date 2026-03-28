import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { Target, Users, TrendingUp, DollarSign } from 'lucide-react';

const Marketing = () => {
  const { t, language } = useLanguage();
  const { campaigns } = useAppData();
  const l = (key) => language === 'ar' ? key + '_ar' : key + '_en';

  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.marketing')}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title={language === 'ar' ? 'إجمالي الحملات' : 'Total Campaigns'} value={campaigns.length} icon={<Target className="h-5 w-5" />} />
        <KPICard title={language === 'ar' ? 'إجمالي العملاء المحتملين' : 'Total Leads'} value={totalLeads} icon={<Users className="h-5 w-5" />} />
        <KPICard title={language === 'ar' ? 'التحويلات' : 'Conversions'} value={totalConversions} icon={<TrendingUp className="h-5 w-5" />} />
        <KPICard title={language === 'ar' ? 'إجمالي الإنفاق' : 'Total Spend'} value={`${totalSpent.toLocaleString()} ${t('common.sar')}`} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'الحملة' : 'Campaign'}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'الميزانية' : 'Budget'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'الإنفاق' : 'Spent'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'العملاء' : 'Leads'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'التحويلات' : 'Conversions'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'الفترة' : 'Period'}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{c[l('name')]}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3">{c.budget.toLocaleString()} {t('common.sar')}</td>
                  <td className="p-3">{c.spent.toLocaleString()} {t('common.sar')}</td>
                  <td className="p-3">{c.leads}</td>
                  <td className="p-3">{c.conversions}</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.startDate} → {c.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
