import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { KPICard } from '@/components/KPICard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  NotebookPen, TrendingUp, TrendingDown, Target, Percent, ListChecks,
  Loader2, Trash2, Pencil, X,
} from 'lucide-react';

const TAGS = [
  { value: 'revenge_trade',  ar: 'صفقة انتقامية',  en: 'Revenge trade' },
  { value: 'fomo',           ar: 'تسرع / FOMO',     en: 'FOMO' },
  { value: 'followed_plan',  ar: 'التزام بالخطة',   en: 'Followed plan' },
  { value: 'broke_rules',    ar: 'خرق القواعد',      en: 'Broke rules' },
];

const OUTCOMES = [
  { value: 'open',          ar: 'مفتوحة',      en: 'Open' },
  { value: 'hit_tp',        ar: 'حققت الهدف',  en: 'Hit TP' },
  { value: 'hit_sl',        ar: 'ضربت الوقف',  en: 'Hit SL' },
  { value: 'manual_close',  ar: 'إغلاق يدوي',  en: 'Manual Close' },
];

const EMPTY_FORM = {
  symbol: '', direction: 'buy',
  entry_price: '', take_profit: '', stop_loss: '', exit_price: '', size: '',
  outcome: 'open', entry_reasoning: '', outcome_notes: '', tags: [],
};

const Journal = () => {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const { journalEntries, journalStats, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppData();

  const [form, setForm]         = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]     = useState(false);

  const entries = journalEntries ?? [];
  const stats   = journalStats ?? {};

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const toggleTag = (tag) => setForm(p => ({
    ...p,
    tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
  }));

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      symbol: entry.symbol ?? '',
      direction: entry.direction ?? 'buy',
      entry_price: entry.entry_price ?? '',
      take_profit: entry.take_profit ?? '',
      stop_loss: entry.stop_loss ?? '',
      exit_price: entry.exit_price ?? '',
      size: entry.size ?? '',
      outcome: entry.outcome ?? 'open',
      entry_reasoning: entry.entry_reasoning ?? '',
      outcome_notes: entry.outcome_notes ?? '',
      tags: entry.tags ?? [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symbol.trim() || !form.entry_price) {
      toast.error(l('أدخل الرمز وسعر الدخول على الأقل', 'Enter at least the symbol and entry price'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        take_profit: form.take_profit || null,
        stop_loss:   form.stop_loss   || null,
        exit_price:  form.exit_price  || null,
        size:        form.size        || null,
      };
      if (editingId) {
        await updateJournalEntry({ id: editingId, ...payload });
        toast.success(l('تم تحديث الصفقة', 'Trade updated'));
      } else {
        await addJournalEntry(payload);
        toast.success(l('تمت إضافة الصفقة', 'Trade added'));
      }
      resetForm();
    } catch {
      toast.error(l('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm(l('حذف هذه الصفقة نهائياً؟', 'Permanently delete this trade?'))) return;
    deleteJournalEntry(id);
    if (editingId === id) resetForm();
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-primary" />
          {l('دفتر التداول', 'My Journal')}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('سجّل صفقاتك وتتبّع أداءك وأخطاءك لتتعلم منها.', 'Log your trades and track your performance and mistakes to learn from them.')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <KPICard title={l('إجمالي الصفقات', 'Total Trades')} value={stats.total ?? 0} icon={<ListChecks className="h-5 w-5" />} />
        <KPICard title={l('نسبة الفوز', 'Win Rate')} value={stats.win_rate != null ? stats.win_rate : '—'} suffix={stats.win_rate != null ? '%' : ''} icon={<Percent className="h-5 w-5" />} />
        <KPICard title={l('صفقات مفتوحة', 'Open Trades')} value={stats.open ?? 0} icon={<Target className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {editingId ? l('تعديل الصفقة', 'Edit Trade') : l('إضافة صفقة جديدة', 'Add New Trade')}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <X className="h-3.5 w-3.5" />{l('إلغاء', 'Cancel')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('الرمز', 'Symbol')}</label>
              <input value={form.symbol} onChange={field('symbol')} placeholder="EURUSD" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('الاتجاه', 'Direction')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm(p => ({ ...p, direction: 'buy' }))}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${form.direction === 'buy' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-border text-muted-foreground'}`}>
                  <TrendingUp className="h-3.5 w-3.5" />{l('شراء', 'Buy')}
                </button>
                <button type="button" onClick={() => setForm(p => ({ ...p, direction: 'sell' }))}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${form.direction === 'sell' ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-border text-muted-foreground'}`}>
                  <TrendingDown className="h-3.5 w-3.5" />{l('بيع', 'Sell')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('سعر الدخول', 'Entry Price')}</label>
              <input type="number" step="any" value={form.entry_price} onChange={field('entry_price')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('الحجم', 'Size')}</label>
              <input type="number" step="any" value={form.size} onChange={field('size')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('الهدف (TP)', 'Take Profit')}</label>
              <input type="number" step="any" value={form.take_profit} onChange={field('take_profit')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('وقف الخسارة (SL)', 'Stop Loss')}</label>
              <input type="number" step="any" value={form.stop_loss} onChange={field('stop_loss')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('لماذا دخلت الصفقة؟', 'Why did you enter this trade?')}</label>
            <textarea value={form.entry_reasoning} onChange={field('entry_reasoning')} rows={3}
              className={`${inputCls} resize-none`} dir={language === 'ar' ? 'rtl' : 'ltr'} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">{l('وسوم', 'Tags')}</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${form.tags.includes(tag.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                  {l(tag.ar, tag.en)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('النتيجة', 'Outcome')}</label>
              <select value={form.outcome} onChange={field('outcome')} className={inputCls}>
                {OUTCOMES.map(o => <option key={o.value} value={o.value}>{l(o.ar, o.en)}</option>)}
              </select>
            </div>
            {form.outcome !== 'open' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('سعر الإغلاق', 'Exit Price')}</label>
                <input type="number" step="any" value={form.exit_price} onChange={field('exit_price')} className={inputCls} />
              </div>
            )}
          </div>

          {form.outcome !== 'open' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">
                {l('ماذا حدث ولماذا؟ (الدرس المستفاد)', 'What happened and why? (lesson learned)')}
              </label>
              <textarea value={form.outcome_notes} onChange={field('outcome_notes')} rows={3}
                className={`${inputCls} resize-none`} dir={language === 'ar' ? 'rtl' : 'ltr'} />
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? l('حفظ التعديلات', 'Save Changes') : l('إضافة الصفقة', 'Add Trade')}
          </Button>
        </form>

        {/* Entries list */}
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
              <NotebookPen className="h-8 w-8 opacity-30 mx-auto mb-3" />
              <p className="text-sm font-medium">{l('لا توجد صفقات مسجلة بعد', 'No trades logged yet')}</p>
            </div>
          ) : (
            entries.map(entry => {
              const isBuy = entry.direction === 'buy';
              return (
                <div key={entry.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{entry.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.entry_price} {entry.exit_price ? `→ ${entry.exit_price}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusBadge status={entry.outcome} />
                      <button onClick={() => startEdit(entry)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {(entry.take_profit || entry.stop_loss || entry.size) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                      {entry.take_profit && <span>TP: {entry.take_profit}</span>}
                      {entry.stop_loss && <span>SL: {entry.stop_loss}</span>}
                      {entry.size && <span>{l('الحجم', 'Size')}: {entry.size}</span>}
                    </div>
                  )}

                  {entry.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {entry.tags.map(tv => {
                        const tag = TAGS.find(t => t.value === tv);
                        return (
                          <span key={tv} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {tag ? l(tag.ar, tag.en) : tv}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {entry.entry_reasoning && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.entry_reasoning}</p>
                  )}
                  {entry.outcome_notes && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1 italic">{entry.outcome_notes}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;
