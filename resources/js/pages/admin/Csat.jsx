import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { csatApi } from '@/lib/api';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Star, Users, Percent, MessageSquare, Loader2, Trash2 } from 'lucide-react';

const Stars = ({ n }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`h-3.5 w-3.5 ${i <= n ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
    ))}
  </span>
);

const Csat = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [summary, setSummary] = useState({ data: [], overall: {} });
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const canDelete = hasPermission('delete csat');

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await csatApi.remove(deleteTarget.id);
      setRecent(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(l('تم حذف التقييم', 'Rating deleted'));
      // Refresh the aggregates since a rating was removed.
      csatApi.summary().then(s => setSummary(s.data ?? { data: [], overall: {} })).catch(() => {});
    } catch {
      toast.error(l('تعذّر حذف التقييم', 'Failed to delete rating'));
    } finally {
      setDeleting(false);
    }
  };

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
              <div key={r.id} className="p-4 group">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Stars n={r.stars} />
                    <span className="text-xs text-muted-foreground truncate">
                      {r.client_name || l('عميل', 'Client')} → {r.agent_name || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {r.responded_at ? new Date(r.responded_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(r)}
                        title={l('حذف', 'Delete')}
                        className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-foreground/90 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-card border border-red-500/20 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-lg mb-1">{l('حذف التقييم', 'Delete Rating')}</p>
            <p className="text-sm text-muted-foreground mb-5">
              {l('هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.',
                 'Delete this rating? This cannot be undone.')}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-4 py-2 text-sm rounded-xl border border-primary/20 hover:bg-primary/5 transition disabled:opacity-50">
                {l('إلغاء', 'Cancel')}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-semibold disabled:opacity-50">
                {deleting ? l('جارٍ...', 'Deleting…') : l('حذف', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Csat;
