import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { csatApi } from '@/lib/api';
import { KPICard } from '@/components/KPICard';
import { Star, Users, Percent, MessageSquare, Loader2 } from 'lucide-react';

const Stars = ({ n }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`h-3.5 w-3.5 ${i <= n ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
    ))}
  </span>
);

const Csat = () => {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [summary, setSummary] = useState({ data: [], overall: {} });
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([csatApi.summary(), csatApi.list()]);
      setSummary(s.data ?? { data: [], overall: {} });
      setRecent(r.data?.data ?? []);
    } catch {
      setSummary({ data: [], overall: {} });
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const agents  = summary.data ?? [];
  const overall = summary.overall ?? {};

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          {l('تقييم رضا العملاء (CSAT)', 'Customer Satisfaction (CSAT)')}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('تقييمات خدمة العملاء لكل موظف.', 'Per-agent customer-service ratings.')}
        </p>
      </div>

      {/* Overall KPIs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <KPICard title={l('نسبة الرضا الكلية', 'Overall CSAT')} value={overall.csat_percent ?? 0} suffix="%" icon={<Percent className="h-5 w-5" />} />
        <KPICard title={l('إجمالي التقييمات', 'Total Responses')} value={overall.responses ?? 0} icon={<MessageSquare className="h-5 w-5" />} />
        <KPICard title={l('عدد الموظفين المقيّمين', 'Rated Agents')} value={agents.length} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Per-agent leaderboard */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">{l('أداء الموظفين', 'Agent Leaderboard')}</h2>
        </div>
        {agents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{l('لا توجد تقييمات بعد', 'No ratings yet')}</div>
        ) : (
          <div className="divide-y">
            {agents.map(a => (
              <div key={a.agent_id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{a.agent_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.responses} {l('تقييم', 'responses')} · {l('متوسط', 'avg')} {a.avg_stars} ⭐
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                    <div
                      className={`h-full rounded-full ${a.csat_percent >= 80 ? 'bg-emerald-500' : a.csat_percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${a.csat_percent}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${a.csat_percent >= 80 ? 'text-emerald-400' : a.csat_percent >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {a.csat_percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent ratings + comments */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">{l('أحدث التقييمات', 'Recent Ratings')}</h2>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{l('لا توجد تقييمات بعد', 'No ratings yet')}</div>
        ) : (
          <div className="divide-y">
            {recent.map(r => (
              <div key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Stars n={r.stars} />
                    <span className="text-xs text-muted-foreground truncate">
                      {r.client_name || l('عميل', 'Client')} → {r.agent_name || '—'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {r.responded_at ? new Date(r.responded_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-foreground/90 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Csat;
