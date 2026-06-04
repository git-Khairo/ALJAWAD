import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import { BarChart, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

const fmt  = (n) => Number(n ?? 0).toLocaleString();
const fmtP = (n) => `${Number(n ?? 0).toFixed(1)}%`;

const Analytics = () => {
  const { language } = useLanguage();
  const { analyticsData } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const s = analyticsData.summary ?? {};

  // Merge monthly revenue + clients + leads into one bar chart dataset
  const monthSet = {};
  (analyticsData.monthly_revenue ?? []).forEach(r => {
    monthSet[r.month] = { ...monthSet[r.month], month: r.month, revenue: r.revenue };
  });
  (analyticsData.monthly_clients ?? []).forEach(r => {
    monthSet[r.month] = { ...monthSet[r.month], month: r.month, clients: r.clients };
  });
  (analyticsData.monthly_leads ?? []).forEach(r => {
    monthSet[r.month] = { ...monthSet[r.month], month: r.month, leads: r.leads };
  });
  const chartData = Object.values(monthSet).sort((a, b) => a.month.localeCompare(b.month));

  const sources     = analyticsData.source_breakdown ?? [];
  const totalSource = sources.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{l('التحليلات', 'Analytics')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('بيانات مباشرة من قاعدة البيانات', 'Live data from the database')}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title={l('إجمالي الإيرادات (USD)', 'Total Revenue (USD)')}
          value={`$${fmt(s.total_revenue_usd)}`}
          icon={<DollarSign className="h-5 w-5" />}
          change=""
        />
        <KPICard
          title={l('إجمالي المصروفات', 'Total Expenses')}
          value={fmt(s.total_expenses)}
          icon={<BarChart className="h-5 w-5" />}
          change=""
        />
        <KPICard
          title={l('معدل التحويل', 'Conversion Rate')}
          value={fmtP(s.conversion_rate)}
          icon={<TrendingUp className="h-5 w-5" />}
          change=""
        />
        <KPICard
          title={l('إجمالي العملاء والمحتملون', 'Clients + Leads')}
          value={fmt((s.total_clients ?? 0) + (s.total_leads ?? 0))}
          icon={<Users className="h-5 w-5" />}
          change=""
        />
      </div>

      {/* Monthly bar chart */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">{l('الأداء الشهري', 'Monthly Performance')}</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {l('لا توجد بيانات شهرية بعد', 'No monthly data yet')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <RBarChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210 8% 25%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(210 8% 65%)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(210 8% 65%)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(210 25% 11% / 0.95)',
                  border: '1px solid hsl(195 65% 47% / 0.3)',
                  borderRadius: 10, fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name={l('الإيرادات ($)', 'Revenue ($)')} fill="hsl(195 65% 47%)" radius={[4,4,0,0]} />
              <Bar dataKey="clients" name={l('عملاء جدد', 'New Clients')}     fill="hsl(145 70% 55%)" radius={[4,4,0,0]} />
              <Bar dataKey="leads"   name={l('محتملون', 'Leads')}             fill="hsl(45 95% 55%)"  radius={[4,4,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Source breakdown + ticket breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{l('أهم مصادر العملاء', 'Top Client Sources')}</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {l('لا توجد بيانات مصادر', 'No source data yet')}
            </p>
          ) : (
            <div className="space-y-3">
              {sources.map((row) => {
                const pct = totalSource > 0 ? Math.round((row.count / totalSource) * 100) : 0;
                return (
                  <div key={row.source} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-28 truncate">{row.source}</span>
                    <div className="flex-1 bg-muted/30 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-20 text-end tabular-nums">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{l('توزيع تذاكر الدعم', 'Support Ticket Breakdown')}</h2>
          {(analyticsData.ticket_breakdown ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {l('لا توجد تذاكر', 'No tickets yet')}
            </p>
          ) : (
            <div className="space-y-3">
              {(analyticsData.ticket_breakdown ?? []).map(t => {
                const dotColor =
                  t.status === 'resolved'    ? 'bg-emerald-400' :
                  t.status === 'open'        ? 'bg-blue-400' :
                  t.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-400';
                return (
                  <div key={t.status} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                      <span className="text-sm capitalize">{t.status.replace('_', ' ')}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{t.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
