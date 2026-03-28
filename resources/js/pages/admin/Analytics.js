import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart, TrendingUp, Users, Eye } from 'lucide-react';
import { KPICard } from '@/components/KPICard';

const Analytics = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('التحليلات', 'Analytics')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title={l('زوار الموقع', 'Website Visitors')} value="14,520" icon={<Eye className="h-5 w-5" />} change="+18%" />
        <KPICard title={l('مستخدمون جدد', 'New Users')} value="342" icon={<Users className="h-5 w-5" />} change="+8%" />
        <KPICard title={l('معدل التحويل', 'Conversion Rate')} value="3.2%" icon={<TrendingUp className="h-5 w-5" />} change="+0.5%" />
        <KPICard title={l('معدل الارتداد', 'Bounce Rate')} value="42%" icon={<BarChart className="h-5 w-5" />} change="-2%" />
      </div>
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">{l('أهم المصادر', 'Top Sources')}</h2>
        <div className="space-y-3">
          {[
            { source: 'Google Search', visits: 5420, pct: 37 },
            { source: 'Direct', visits: 3210, pct: 22 },
            { source: 'Social Media', visits: 2890, pct: 20 },
            { source: 'Referral', visits: 1800, pct: 12 },
            { source: 'Email', visits: 1200, pct: 9 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-sm font-medium w-32">{s.source}</span>
              <div className="flex-1 bg-muted/30 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-sm text-muted-foreground w-20 text-end">{s.visits.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
