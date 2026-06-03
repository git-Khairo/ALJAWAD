import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Target, TrendingUp, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = {
  instagram: { label: 'Instagram',       bg: 'bg-pink-500/10 text-pink-400 border-pink-500/25' },
  tiktok:    { label: 'TikTok',          bg: 'bg-slate-500/10 text-slate-300 border-slate-500/25' },
  youtube:   { label: 'YouTube',         bg: 'bg-red-500/10 text-red-400 border-red-500/25' },
  google:    { label: 'Google',          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
  linkedin:  { label: 'LinkedIn',        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
  multi:     { label: 'Multi-Platform',  bg: 'bg-violet-500/10 text-violet-400 border-violet-500/25' },
  other:     { label: 'Other',           bg: 'bg-muted text-muted-foreground border-border' },
};

const STATUS_STYLES = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  completed: 'bg-muted text-muted-foreground border-border',
  draft:     'bg-amber-500/10 text-amber-400 border-amber-500/25',
  paused:    'bg-orange-500/10 text-orange-400 border-orange-500/25',
};

const EMPTY_FORM = {
  name_ar: '', name_en: '', platform: 'instagram',
  budget: '', startDate: '', endDate: '', status: 'draft',
};

const fmt = (n) => Number(n).toLocaleString();

const Campaigns = () => {
  const { language } = useLanguage();
  const { campaigns, addCampaign, updateCampaignStatus } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const n = (c) => language === 'ar' ? c.name_ar : c.name_en;

  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('all');

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const totalLeads       = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalSpent       = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCount      = campaigns.filter(c => c.status === 'active').length;

  const filtered = filterStatus === 'all' ? campaigns : campaigns.filter(c => c.status === filterStatus);

  const handleAdd = (ev) => {
    ev.preventDefault();
    if (!form.name_ar.trim() || !form.name_en.trim() || !form.budget) {
      toast.error(l('أكمل الحقول المطلوبة', 'Fill required fields')); return;
    }
    addCampaign({ ...form, budget: Number(form.budget) });
    toast.success(l('تمت إضافة الحملة', 'Campaign created'));
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{l('الحملات التسويقية', 'Marketing Campaigns')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('إدارة وتتبع جميع الحملات التسويقية', 'Manage and track all marketing campaigns')}
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 me-1" />{l('حملة جديدة', 'New Campaign')}
        </Button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: l('حملات نشطة', 'Active Campaigns'), value: activeCount,         icon: <Target className="h-5 w-5" />,    color: 'text-emerald-400' },
          { label: l('إجمالي العملاء', 'Total Leads'),   value: fmt(totalLeads),    icon: <Users className="h-5 w-5" />,     color: 'text-blue-400' },
          { label: l('التحويلات', 'Conversions'),         value: fmt(totalConversions), icon: <TrendingUp className="h-5 w-5" />, color: 'text-violet-400' },
          { label: l('الإنفاق الكلي', 'Total Spent'),    value: `$${fmt(totalSpent)}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-amber-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-xl border p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 ${kpi.color}`}>{kpi.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="font-bold text-lg">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status filter tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'draft', 'completed', 'paused'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {s === 'all' ? l('الكل','All') : s === 'active' ? l('نشطة','Active') : s === 'draft' ? l('مسودة','Draft') : s === 'completed' ? l('منتهية','Completed') : l('موقوفة','Paused')}
            {s !== 'all' && <span className="ms-1.5 opacity-60">{campaigns.filter(c => c.status === s).length}</span>}
          </button>
        ))}
      </div>

      {/* ── Campaign cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4">
        {filtered.map((c) => {
          const platform = PLATFORMS[c.platform] ?? PLATFORMS.other;
          const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
          const cvr = c.leads > 0 ? ((c.conversions / c.leads) * 100).toFixed(1) : '0.0';
          return (
            <div key={c.id} className="bg-card rounded-xl border p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{n(c)}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}>
                      {c.status === 'active' ? l('نشطة','Active') : c.status === 'completed' ? l('منتهية','Completed') : c.status === 'paused' ? l('موقوفة','Paused') : l('مسودة','Draft')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${platform.bg}`}>
                      {platform.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.startDate} → {c.endDate}</p>
                </div>
                <select
                  value={c.status}
                  onChange={(e) => { updateCampaignStatus(c.id, e.target.value); toast.success(l('تم تحديث الحالة','Status updated')); }}
                  className="text-xs px-2 py-1.5 rounded-lg border bg-background shrink-0"
                >
                  <option value="draft">{l('مسودة','Draft')}</option>
                  <option value="active">{l('نشطة','Active')}</option>
                  <option value="paused">{l('موقوفة','Paused')}</option>
                  <option value="completed">{l('منتهية','Completed')}</option>
                </select>
              </div>

              {/* Budget bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{l('الإنفاق','Spent')}: ${fmt(c.spent)}</span>
                  <span>{l('الميزانية','Budget')}: ${fmt(c.budget)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981',
                  }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pct}% {l('مُنفق','spent')}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: l('عملاء محتملون','Leads'),   value: fmt(c.leads) },
                  { label: l('تحويلات','Conversions'),    value: fmt(c.conversions) },
                  { label: l('معدل التحويل','Conv. Rate'), value: `${cvr}%` },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/30 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                    <p className="font-semibold text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{l('لا توجد حملات', 'No campaigns found')}</p>
          </div>
        )}
      </div>

      {/* ── Add Modal ────────────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إنشاء حملة جديدة', 'Create New Campaign')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('اسم الحملة (عربي) *', 'Campaign Name (Arabic) *')}</label>
              <input value={form.name_ar} onChange={field('name_ar')} required dir="rtl" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('اسم الحملة (إنجليزي) *', 'Campaign Name (English) *')}</label>
              <input value={form.name_en} onChange={field('name_en')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المنصة', 'Platform')}</label>
                <select value={form.platform} onChange={field('platform')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الميزانية ($) *', 'Budget ($) *')}</label>
                <input type="number" min="0" value={form.budget} onChange={field('budget')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('تاريخ البدء', 'Start Date')}</label>
                <input type="date" value={form.startDate} onChange={field('startDate')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('تاريخ الانتهاء', 'End Date')}</label>
                <input type="date" value={form.endDate} onChange={field('endDate')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
              <select value={form.status} onChange={field('status')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="draft">{l('مسودة', 'Draft')}</option>
                <option value="active">{l('نشطة', 'Active')}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>{l('إلغاء','Cancel')}</Button>
              <Button type="submit" className="flex-1">{l('إنشاء','Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
