import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kpiApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Award, Edit3, Check, X, Settings,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Static config (display-only, thresholds come from the DB) ────────────────
const ROLE_CONFIG = {
  marketer:         { label_en: 'Marketing',        label_ar: 'التسويق',      accent: '#8b5cf6' },
  customer_support: { label_en: 'Customer Support', label_ar: 'دعم العملاء', accent: '#0ea5e9' },
  analyst:          { label_en: 'Analysts',         label_ar: 'المحللون',     accent: '#f59e0b' },
};

const TIER = {
  C: { color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-400/15 border-blue-400/30' },
  A: { color: 'text-amber-400',   bg: 'bg-amber-400/15 border-amber-400/30' },
  F: { color: 'text-red-400',     bg: 'bg-red-400/15 border-red-400/30' },
};

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function computeTier(def, value) {
  const hi = def.direction === 'higher_is_better';
  if (hi) {
    if (value >= def.tier_c_min) return { tier: 'C', bonus_pct: def.tier_c_bonus, has_warning: false };
    if (value >= def.tier_b_min) return { tier: 'B', bonus_pct: def.tier_b_bonus, has_warning: false };
    if (value >= def.tier_a_min) return { tier: 'A', bonus_pct: def.tier_a_bonus, has_warning: false };
  } else {
    if (value <= def.tier_c_min) return { tier: 'C', bonus_pct: def.tier_c_bonus, has_warning: false };
    if (value <= def.tier_b_min) return { tier: 'B', bonus_pct: def.tier_b_bonus, has_warning: false };
    if (value <= def.tier_a_min) return { tier: 'A', bonus_pct: def.tier_a_bonus, has_warning: false };
  }
  return { tier: 'F', bonus_pct: 0, has_warning: true };
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────
const TierBadge = ({ tier }) => {
  const t = TIER[tier] || TIER.F;
  return <span className={`inline-flex font-bold text-xs px-2 py-0.5 rounded-md border ${t.bg} ${t.color}`}>{tier}</span>;
};

const BonusBar = ({ earned, max }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
        animate={{ width: `${max > 0 ? Math.min((earned / max) * 100, 100) : 0}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }} />
    </div>
    <span className="text-xs font-semibold text-primary w-14 text-end">{earned}% / {max}%</span>
  </div>
);

// ─── Single KPI row with inline value entry ───────────────────────────────────
const KpiRow = ({ def, entry, onSave, language, index, saving }) => {
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');

  const open = () => { setDraft(entry?.value ?? ''); setEditing(true); };
  const save = (e) => {
    e.preventDefault();
    const v = parseFloat(draft);
    if (!isNaN(v)) onSave(def, v);
    setEditing(false);
  };

  const tierCfg = entry ? (TIER[entry.tier] || TIER.F) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
        entry?.has_warning
          ? 'bg-red-400/5 border-red-400/20'
          : entry
          ? 'bg-primary/3 border-primary/10'
          : 'bg-card border-primary/8'
      }`}
    >
      <span className="text-xs font-bold text-muted-foreground/40 w-5 text-center shrink-0">{index + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{l(def.name_ar, def.name_en)}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
          <span>{l('الحد الأقصى:', 'Max bonus:')} <strong>{def.max_bonus_pct}%</strong></span>
          <span>{def.direction === 'lower_is_better' ? l('أقل = أفضل ↓', 'lower = better ↓') : l('أعلى = أفضل ↑', 'higher = better ↑')}</span>
        </div>
        {entry && <BonusBar earned={entry.bonus_pct} max={def.max_bonus_pct} />}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {entry && (
          <>
            <TierBadge tier={entry.tier} />
            <span className={`text-sm font-bold ${tierCfg.color}`}>{entry.bonus_pct}%</span>
          </>
        )}
        {entry?.has_warning && <AlertTriangle className="h-4 w-4 text-red-400" />}
      </div>

      <div className="w-40 shrink-0">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
        ) : editing ? (
          <form onSubmit={save} className="flex items-center gap-1">
            <input
              autoFocus type="number" step="0.01"
              value={draft} onChange={e => setDraft(e.target.value)}
              placeholder={def.unit}
              className="w-24 h-8 text-sm rounded-xl border border-primary/30 bg-primary/5 px-2.5 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            <button type="submit" className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition">
              <Check className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 transition">
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button onClick={open}
            className="group flex items-center gap-1.5 text-sm hover:text-primary transition w-full justify-end">
            {entry ? (
              <>
                <span className="font-bold text-base">{entry.value}</span>
                <span className="text-xs text-muted-foreground">{def.unit}</span>
                <Edit3 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition" />
              </>
            ) : (
              <span className="text-xs text-muted-foreground/60 italic hover:text-primary">
                {l('+ أدخل القيمة', '+ Enter value')}
              </span>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Thresholds modal ─────────────────────────────────────────────────────────
const ThresholdsModal = ({ defs, language, onClose, onSave }) => {
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [local, setLocal] = useState(defs.map(d => ({ ...d })));
  const upd = (id, field, v) => setLocal(p => p.map(d => d.id === id ? { ...d, [field]: v } : d));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-primary/15 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <h2 className="font-bold text-lg">{l('تعديل حدود الشرائح', 'Edit Tier Thresholds')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {local.map(def => (
            <div key={def.id} className="rounded-xl border border-primary/10 bg-primary/2 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">{l(def.name_ar, def.name_en)}</p>
                <span className="text-xs text-muted-foreground">{def.unit}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { tier: 'A', minF: 'tier_a_min', bonF: 'tier_a_bonus', color: 'amber' },
                  { tier: 'B', minF: 'tier_b_min', bonF: 'tier_b_bonus', color: 'blue' },
                  { tier: 'C', minF: 'tier_c_min', bonF: 'tier_c_bonus', color: 'emerald' },
                ].map(({ tier, minF, bonF, color }) => (
                  <div key={tier} className="rounded-lg p-3 border border-primary/10 bg-background">
                    <p className={`font-bold text-${color}-400 mb-2`}>{l('شريحة', 'Tier')} {tier}</p>
                    <label className="text-muted-foreground block mb-1">
                      {def.direction === 'lower_is_better' ? l('الحد الأقصى', 'Max') : l('الحد الأدنى', 'Min')} ({def.unit})
                    </label>
                    <input type="number" step="0.01" value={def[minF]}
                      onChange={e => upd(def.id, minF, parseFloat(e.target.value))}
                      className="w-full h-8 rounded-lg border border-primary/20 bg-card px-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <label className="text-muted-foreground block mb-1">{l('نسبة المكافأة %', 'Bonus %')}</label>
                    <input type="number" min="0" value={def[bonF]}
                      onChange={e => upd(def.id, bonF, parseInt(e.target.value))}
                      className="w-full h-8 rounded-lg border border-primary/20 bg-card px-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-primary/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-primary/20 hover:bg-primary/5 transition">
            {l('إلغاء', 'Cancel')}
          </button>
          <button onClick={() => { onSave(local); onClose(); }}
            className="px-4 py-2 text-sm rounded-xl gradient-gold text-primary-foreground font-semibold hover:opacity-90 transition">
            {l('حفظ التغييرات', 'Save Changes')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Coach scorecard (read own department's live data) ────────────────────────
const CoachScorecard = ({ language }) => {
  const l   = (ar, en) => language === 'ar' ? ar : en;
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: scorecard, isLoading } = useQuery({
    queryKey: ['kpiScorecard', year, month],
    queryFn: async () => {
      const res = await kpiApi.scorecard({ year, month });
      return res.data;
    },
  });

  const kpis        = scorecard?.kpis ?? [];
  const totalBonus  = kpis.reduce((s, k) => s + (k.recorded?.bonus_pct ?? 0), 0);
  const maxBonus    = kpis.reduce((s, k) => s + (k.max_bonus ?? 0), 0);
  const warnings    = kpis.filter(k => k.recorded?.has_warning).length;
  const bonusPct    = maxBonus > 0 ? Math.round((totalBonus / maxBonus) * 100) : 0;
  const deptRole    = scorecard?.role ?? '';
  const roleCfg     = ROLE_CONFIG[deptRole] ?? { label_en: deptRole, label_ar: deptRole };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{l('أداء قسمي', 'My Department KPIs')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{l('نتائج القسم المشتركة لهذا الشهر', 'Shared department results for this month')}</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-primary/15 rounded-xl px-3 py-2">
          <button onClick={prevMonth} className="p-1 hover:bg-primary/10 rounded-lg transition"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold min-w-[130px] text-center">
            {(language === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN)[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-primary/10 rounded-lg transition"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 mb-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {l('نتيجة القسم —', 'Department result —')} {l(roleCfg.label_ar, roleCfg.label_en)}
                </p>
                <h2 className="text-xl font-bold mb-2">
                  {bonusPct >= 80 ? l('أداء استثنائي! 🌟', 'Exceptional this month! 🌟')
                   : bonusPct >= 50 ? l('أداء جيد، استمر!', 'Good performance, keep it up!')
                   : l('هناك مجال للتحسين.', 'Room for improvement.')}
                </h2>
                <div className="flex items-center gap-3 max-w-sm">
                  <div className="flex-1 h-2.5 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
                      animate={{ width: `${bonusPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                  </div>
                  <span className="text-sm font-bold text-primary">{totalBonus}% / {maxBonus}%</span>
                  <span className="text-xs text-muted-foreground">{l('مكافأة', 'bonus')}</span>
                </div>
              </div>
              {warnings > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />{warnings} {l('إنذار', 'warning(s)')}
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-3">
            {kpis.map((kpi, i) => {
              const entry = kpi.recorded ?? null;
              const tierCfg = entry ? (TIER[entry.tier] || TIER.F) : null;
              const borderColor = !tierCfg ? undefined
                : tierCfg.color.includes('emerald') ? '#34d399'
                : tierCfg.color.includes('blue')    ? '#60a5fa'
                : tierCfg.color.includes('amber')   ? '#fbbf24' : '#f87171';

              return (
                <motion.div key={kpi.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-card border border-primary/10 rounded-2xl p-5"
                  style={borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : {}}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{l(kpi.name_ar, kpi.name_en)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l('الحد الأقصى:', 'Max bonus:')} {kpi.max_bonus}%
                      </p>
                    </div>
                    {entry && <TierBadge tier={entry.tier} />}
                  </div>
                  {entry ? (
                    <>
                      <div className="flex items-baseline gap-1.5 my-2">
                        <span className="text-3xl font-bold">{entry.value}</span>
                        <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                        {entry.has_warning && <AlertTriangle className="h-4 w-4 text-red-400 ms-2" />}
                      </div>
                      <BonusBar earned={entry.bonus_pct} max={kpi.max_bonus} />
                    </>
                  ) : (
                    <div className="py-4 text-xs text-muted-foreground/60 italic">
                      {l('لم يتم إدخال البيانات بعد', 'Not yet entered for this month')}
                    </div>
                  )}
                </motion.div>
              );
            })}
            {kpis.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                {l('لا توجد مؤشرات أداء مُعرَّفة لدورك', 'No KPI definitions found for your role')}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Admin view ───────────────────────────────────────────────────────────────
const AdminPerformance = ({ language }) => {
  const l   = (ar, en) => language === 'ar' ? ar : en;
  const qc  = useQueryClient();
  const now = new Date();
  const [year,           setYear]           = useState(now.getFullYear());
  const [month,          setMonth]          = useState(now.getMonth() + 1);
  const [activeDept,     setActiveDept]     = useState('marketer');
  const [thresholdsOpen, setThresholdsOpen] = useState(false);
  const [savingDef,      setSavingDef]      = useState(null); // def.id currently being saved

  // Fetch definitions (grouped by role)
  const { data: definitionsByRole = {}, isLoading: defsLoading } = useQuery({
    queryKey: ['kpiDefinitions'],
    queryFn: async () => {
      const res = await kpiApi.definitions();
      return res.data ?? {};
    },
    staleTime: 60_000,
  });

  // Fetch entries for current month/year
  const { data: entriesList = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['kpiEntries', year, month],
    queryFn: async () => {
      const res = await kpiApi.entries({ year, month });
      return res.data ?? [];
    },
    staleTime: 30_000,
  });

  // Build a lookup: { [defId]: entry }
  const entriesMap = {};
  entriesList.forEach(e => { entriesMap[e.kpi_definition_id] = e; });

  const deptDefs   = definitionsByRole[activeDept] ?? [];
  const totalBonus = deptDefs.reduce((s, d) => s + (entriesMap[d.id]?.bonus_pct ?? 0), 0);
  const maxBonus   = deptDefs.reduce((s, d) => s + d.max_bonus_pct, 0);
  const filled     = deptDefs.filter(d => entriesMap[d.id] != null).length;
  const warnings   = deptDefs.filter(d => entriesMap[d.id]?.has_warning).length;

  const addEntryMut = useMutation({
    mutationFn: (data) => kpiApi.addEntry(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpiEntries', year, month] }),
    onError: () => toast.error('Failed to save KPI entry'),
  });
  const updateEntryMut = useMutation({
    mutationFn: ({ id, ...d }) => kpiApi.updateEntry(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpiEntries', year, month] }),
    onError: () => toast.error('Failed to update KPI entry'),
  });
  const updateDefMut = useMutation({
    mutationFn: ({ id, ...d }) => kpiApi.updateDefinition(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kpiDefinitions'] }); toast.success(l('تم حفظ الحدود', 'Thresholds saved')); },
    onError: () => toast.error('Failed to save thresholds'),
  });

  const handleSave = async (def, value) => {
    setSavingDef(def.id);
    const result = computeTier(def, value);
    const existing = entriesMap[def.id];
    try {
      if (existing) {
        await updateEntryMut.mutateAsync({ id: existing.id, value, ...result });
      } else {
        await addEntryMut.mutateAsync({
          kpi_definition_id: def.id,
          role: activeDept,
          year, month, value,
          ...result,
        });
      }
      toast.success(l('تم حفظ القيمة', 'Value saved'));
    } finally {
      setSavingDef(null);
    }
  };

  const handleSaveThresholds = (updatedDefs) => {
    updatedDefs.forEach(def => {
      const { id, tier_a_min, tier_a_bonus, tier_b_min, tier_b_bonus, tier_c_min, tier_c_bonus, max_bonus_pct } = def;
      updateDefMut.mutate({ id, tier_a_min, tier_a_bonus, tier_b_min, tier_b_bonus, tier_c_min, tier_c_bonus, max_bonus_pct });
    });
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const isLoading = defsLoading || entriesLoading;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{l('الأداء والمؤشرات', 'Performance & KPIs')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {l('أدخل قيم مؤشرات كل قسم شهرياً — تُطبَّق على جميع موظفي القسم', 'Enter each department\'s KPI values monthly — applied to all staff in that department')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-primary/15 rounded-xl px-3 py-2 shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-primary/10 rounded-lg transition"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold min-w-[130px] text-center">
            {(language === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN)[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-primary/10 rounded-lg transition"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Department tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(ROLE_CONFIG).map(([key, rc]) => {
          const defs = definitionsByRole[key] ?? [];
          const warnCount = defs.filter(d => entriesMap[d.id]?.has_warning).length;
          return (
            <button key={key} onClick={() => setActiveDept(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeDept === key
                  ? 'bg-primary text-primary-foreground shadow-neon'
                  : 'bg-card border border-primary/15 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}>
              {l(rc.label_ar, rc.label_en)}
              {warnCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{warnCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label_en: 'KPIs',        label_ar: 'المؤشرات',         value: `${filled} / ${deptDefs.length}`, icon: Award,          color: 'text-blue-400' },
          { label_en: 'Total Bonus', label_ar: 'إجمالي المكافأة',  value: `${totalBonus}%`,                 icon: Award,          color: 'text-emerald-400' },
          { label_en: 'Warnings',    label_ar: 'إنذارات',          value: warnings,                         icon: AlertTriangle,  color: warnings > 0 ? 'text-red-400' : 'text-muted-foreground' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-primary/10 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-primary/8 ${s.color}`}><s.icon className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{l(s.label_ar, s.label_en)}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Threshold edit button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? l('جارٍ التحميل...', 'Loading…')
            : filled < deptDefs.length
            ? l(`${deptDefs.length - filled} مؤشرات لم تُدخل بعد`, `${deptDefs.length - filled} KPI(s) not yet entered`)
            : l('جميع المؤشرات مكتملة ✓', 'All KPIs entered ✓')}
        </p>
        <button onClick={() => setThresholdsOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 transition text-muted-foreground hover:text-foreground">
          <Settings className="h-3.5 w-3.5" />{l('تعديل حدود الشرائح', 'Edit Tier Thresholds')}
        </button>
      </div>

      {/* KPI rows */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {deptDefs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              {l('لا توجد مؤشرات أداء لهذا القسم', 'No KPI definitions for this department')}
            </p>
          ) : deptDefs.map((def, i) => {
            const rawEntry = entriesMap[def.id] ?? null;
            const entry = rawEntry ? {
              value:       rawEntry.value,
              tier:        rawEntry.tier,
              bonus_pct:   rawEntry.bonus_pct,
              has_warning: rawEntry.has_warning,
            } : null;
            return (
              <KpiRow
                key={def.id}
                def={def}
                entry={entry}
                onSave={handleSave}
                language={language}
                index={i}
                saving={savingDef === def.id}
              />
            );
          })}
        </div>
      )}

      {/* Tier legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground bg-card border border-primary/10 rounded-xl p-4">
        <span className="font-medium">{l('الشرائح:', 'Tiers:')}</span>
        {[['C','text-emerald-400',l('استثنائي','Exceptional')],['B','text-blue-400',l('جيد جداً','Good')],['A','text-amber-400',l('الحد الأدنى','Minimum')],['F','text-red-400',l('فشل + إنذار','Fail + warning')]].map(([tier, color, desc]) => (
          <span key={tier} className="flex items-center gap-1.5">
            <TierBadge tier={tier} />
            <span className={color}>{desc}</span>
          </span>
        ))}
      </div>

      <AnimatePresence>
        {thresholdsOpen && (
          <ThresholdsModal
            defs={deptDefs}
            language={language}
            onClose={() => setThresholdsOpen(false)}
            onSave={handleSaveThresholds}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const Performance = () => {
  const { language } = useLanguage();
  const { currentUser, role } = useAuth();

  // Derive isAdmin from the full roles array on currentUser (populated by the API)
  // rather than the role shortcut, which may be stale from an old localStorage cache.
  const roles   = currentUser?.roles ?? (role ? [role] : []);
  const isAdmin = roles.some(r => ['admin', 'super-admin'].includes(r));

  return isAdmin
    ? <AdminPerformance language={language} />
    : <CoachScorecard language={language} />;
};

export default Performance;
