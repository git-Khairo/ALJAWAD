import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  NotebookPen, TrendingUp, TrendingDown, Loader2, Trash2, Pencil, X, RefreshCw,
} from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { KPICard, KPIRow } from '@/components/KPICard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { journalApi } from '@/lib/api';

const TAGS = [
  { value: 'revenge_trade', ar: 'صفقة انتقامية', en: 'Revenge trade' },
  { value: 'fomo',          ar: 'تسرع / FOMO',   en: 'FOMO' },
  { value: 'followed_plan', ar: 'التزام بالخطة',  en: 'Followed plan' },
  { value: 'broke_rules',   ar: 'خرق القواعد',    en: 'Broke rules' },
];

const OUTCOMES = [
  { value: 'open',         ar: 'مفتوحة',     en: 'Open' },
  { value: 'hit_tp',       ar: 'حققت الهدف', en: 'Hit TP' },
  { value: 'hit_sl',       ar: 'ضربت الوقف', en: 'Hit SL' },
  { value: 'manual_close', ar: 'إغلاق يدوي', en: 'Manual close' },
];

const EMPTY_FORM = {
  symbol: '', direction: 'buy',
  entry_price: '', take_profit: '', stop_loss: '', exit_price: '', size: '',
  outcome: 'open', entry_reasoning: '', outcome_notes: '', tags: [],
};

const selectCls =
  'h-11 w-full rounded border border-rule-strong bg-surface-raised px-3 text-sm text-foreground ' +
  'transition-colors duration-120 hover:border-fg-faint focus:border-primary focus:outline-none';

/**
 * Trading journal.
 *
 * Buy and sell use the chart-up / chart-down tokens rather than stock
 * emerald-500 and rose-500, so direction reads the same here as it does on
 * the market tape and in the transactions ledger. Prices are tabular mono
 * throughout for the same reason.
 */
const Journal = () => {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const {
    journalEntries, journalStats, addJournalEntry, updateJournalEntry, deleteJournalEntry,
  } = useAppData();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const entries = journalEntries ?? [];
  const stats = journalStats ?? {};

  /* ── AI insights ─────────────────────────────────────────────────────── */
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  // Stable reference (no deps on `l`/`language`, which are recreated every
  // render) — otherwise the mount effect below refires on every render.
  const loadInsights = useCallback(async (refresh = false) => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await journalApi.insights(refresh);
      setInsights(res.data);
    } catch (err) {
      setInsightsError(err?.response?.data?.message ?? 'load_failed');
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Runs once on mount. Cached server-side, so this costs nothing after the
  // first generation.
  useEffect(() => { loadInsights(false); }, [loadInsights]);

  /* ── Form ────────────────────────────────────────────────────────────── */
  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const toggleTag = (tag) => setForm((p) => ({
    ...p,
    tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
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
      toast.error(l('أدخل الرمز وسعر الدخول على الأقل.', 'Enter at least the symbol and entry price.'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        take_profit: form.take_profit || null,
        stop_loss: form.stop_loss || null,
        exit_price: form.exit_price || null,
        size: form.size || null,
      };
      if (editingId) {
        await updateJournalEntry({ id: editingId, ...payload });
        toast.success(l('تم تحديث الصفقة.', 'Trade updated.'));
      } else {
        await addJournalEntry(payload);
        toast.success(l('تمت إضافة الصفقة.', 'Trade added.'));
      }
      resetForm();
    } catch {
      toast.error(l('فشل الحفظ.', 'Save failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm(l('حذف هذه الصفقة نهائياً؟', 'Permanently delete this trade?'))) return;
    deleteJournalEntry(id);
    if (editingId === id) resetForm();
  };

  return (
    <>
      <PageHeader
        title={l('دفتر التداول', 'My journal')}
        description={l(
          'سجّل صفقاتك وتتبّع أداءك وأخطاءك لتتعلم منها.',
          'Log your trades and track your performance, and your mistakes, to learn from them.',
        )}
      />

      <div className="space-y-8">
        {/* ───────── Stats ───────── */}
        <KPIRow className="lg:grid-cols-3">
          <KPICard title={l('إجمالي الصفقات', 'Total trades')} value={stats.total ?? 0} />
          <KPICard
            title={l('نسبة الفوز', 'Win rate')}
            value={stats.win_rate != null ? stats.win_rate : '—'}
            suffix={stats.win_rate != null ? '%' : ''}
          />
          <KPICard title={l('صفقات مفتوحة', 'Open trades')} value={stats.open ?? 0} />
        </KPIRow>

        {/* ───────── AI insights ───────── */}
        <section className="border border-rule p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {l('تحليل الذكاء الاصطناعي', 'AI insights')}
            </h2>
            {insights?.insights_ar != null && (
              <button
                onClick={() => loadInsights(true)}
                disabled={insightsLoading}
                className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${insightsLoading ? 'animate-spin' : ''}`} />
                {l('تحديث التحليل', 'Refresh')}
              </button>
            )}
          </div>

          {insightsLoading && !insights ? (
            <p className="flex items-center gap-2 py-1 text-sm text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {l('جارٍ تحليل صفقاتك…', 'Analysing your trades…')}
            </p>
          ) : insightsError ? (
            <p className="text-sm text-fg-muted">
              {l(
                'لم يتم إعداد التحليل بعد. تحقق من إعداد مفتاح OpenAI API.',
                'Insights are not set up yet. Check the OpenAI API key configuration.',
              )}
            </p>
          ) : insights?.message === 'not_enough_data' ? (
            <p className="text-sm text-fg-muted">
              {l(
                `سجّل ${insights.needed - insights.have} صفقة مغلقة إضافية على الأقل (لديك ${insights.have}/${insights.needed}) ليتمكن التحليل من قراءة نمط تداولك.`,
                `Log at least ${insights.needed - insights.have} more closed trade(s) — you have ${insights.have}/${insights.needed} — so the analysis has a pattern to read.`,
              )}
            </p>
          ) : insights?.insights_ar || insights?.insights_en ? (
            <div>
              <div className="measure whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {language === 'ar' ? insights.insights_ar : insights.insights_en}
              </div>
              {insights.generated_at && (
                <p className="mt-3 text-xs text-fg-faint">
                  {l('آخر تحليل', 'Last analysed')}:{' '}
                  {new Date(insights.generated_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  {' · '}
                  {l(`استناداً إلى ${insights.based_on} صفقة`, `based on ${insights.based_on} trades`)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">
              {l(
                'سجّل صفقاتك لتحصل على تحليل شخصي لأدائك.',
                'Log some trades to get a personal read on how you are performing.',
              )}
            </p>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ───────── Form ───────── */}
          <form onSubmit={handleSubmit} className="h-fit border border-rule p-5">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-rule pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {editingId ? l('تعديل الصفقة', 'Edit trade') : l('إضافة صفقة', 'Add a trade')}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  {l('إلغاء', 'Cancel')}
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={l('الرمز', 'Symbol')} required>
                  {(props) => (
                    <Input
                      {...props}
                      value={form.symbol}
                      onChange={field('symbol')}
                      placeholder="EURUSD"
                      dir="ltr"
                      className="font-mono uppercase"
                    />
                  )}
                </Field>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    {l('الاتجاه', 'Direction')}
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'buy',  label: l('شراء', 'Buy'),  Icon: TrendingUp,   tone: 'chart-up' },
                      { key: 'sell', label: l('بيع', 'Sell'),  Icon: TrendingDown, tone: 'chart-down' },
                    ].map(({ key, label, Icon, tone }) => {
                      const active = form.direction === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setForm((p) => ({ ...p, direction: key }))}
                          className={`flex h-11 items-center justify-center gap-1.5 rounded border text-sm font-medium transition-colors duration-120 ${
                            active
                              ? tone === 'chart-up'
                                ? 'border-chart-up bg-chart-up/10 text-chart-up'
                                : 'border-chart-down bg-chart-down/10 text-chart-down'
                              : 'border-rule-strong text-fg-muted hover:border-fg-faint'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={l('سعر الدخول', 'Entry price')} required>
                  {(props) => (
                    <Input {...props} type="number" step="any" value={form.entry_price}
                      onChange={field('entry_price')} dir="ltr" className="font-mono" />
                  )}
                </Field>
                <Field label={l('الحجم', 'Size')}>
                  {(props) => (
                    <Input {...props} type="number" step="any" value={form.size}
                      onChange={field('size')} dir="ltr" className="font-mono" />
                  )}
                </Field>
                <Field label={l('الهدف (TP)', 'Take profit')}>
                  {(props) => (
                    <Input {...props} type="number" step="any" value={form.take_profit}
                      onChange={field('take_profit')} dir="ltr" className="font-mono" />
                  )}
                </Field>
                <Field label={l('وقف الخسارة (SL)', 'Stop loss')}>
                  {(props) => (
                    <Input {...props} type="number" step="any" value={form.stop_loss}
                      onChange={field('stop_loss')} dir="ltr" className="font-mono" />
                  )}
                </Field>
              </div>

              <Field
                label={l('لماذا دخلت الصفقة؟', 'Why did you enter this trade?')}
                hint={l('اكتبه الآن، قبل أن تعرف النتيجة.', 'Write it now, before you know the outcome.')}
              >
                {(props) => (
                  <Textarea {...props} rows={3} value={form.entry_reasoning}
                    onChange={field('entry_reasoning')} />
                )}
              </Field>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">{l('وسوم', 'Tags')}</legend>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => {
                    const active = form.tags.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleTag(tag.value)}
                        className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors duration-120 ${
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-rule-strong text-fg-muted hover:border-fg-faint hover:text-foreground'
                        }`}
                      >
                        {l(tag.ar, tag.en)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={l('النتيجة', 'Outcome')}>
                  {(props) => (
                    <select {...props} value={form.outcome} onChange={field('outcome')} className={selectCls}>
                      {OUTCOMES.map((o) => (
                        <option key={o.value} value={o.value}>{l(o.ar, o.en)}</option>
                      ))}
                    </select>
                  )}
                </Field>
                {form.outcome !== 'open' && (
                  <Field label={l('سعر الإغلاق', 'Exit price')}>
                    {(props) => (
                      <Input {...props} type="number" step="any" value={form.exit_price}
                        onChange={field('exit_price')} dir="ltr" className="font-mono" />
                    )}
                  </Field>
                )}
              </div>

              {form.outcome !== 'open' && (
                <Field label={l('ماذا حدث ولماذا؟', 'What happened, and why?')}
                  hint={l('الدرس المستفاد.', 'The lesson.')}>
                  {(props) => (
                    <Textarea {...props} rows={3} value={form.outcome_notes}
                      onChange={field('outcome_notes')} />
                  )}
                </Field>
              )}

              <Button type="submit" variant="accent" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? l('حفظ التعديلات', 'Save changes') : l('إضافة الصفقة', 'Add trade')}
              </Button>
            </div>
          </form>

          {/* ───────── Entries ───────── */}
          <div>
            {entries.length === 0 ? (
              <EmptyState
                icon={NotebookPen}
                title={l('لا توجد صفقات مسجلة', 'No trades logged yet')}
                description={l(
                  'أضف صفقتك الأولى من النموذج المجاور.',
                  'Add your first trade with the form alongside.',
                )}
              />
            ) : (
              <ul className="border-t border-rule-strong">
                {entries.map((entry) => {
                  const isBuy = entry.direction === 'buy';
                  return (
                    <li key={entry.id} className="border-b border-rule py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2">
                            <span className={isBuy ? 'text-chart-up' : 'text-chart-down'} aria-hidden="true">
                              {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            </span>
                            <span className="font-mono text-sm font-semibold uppercase text-foreground" dir="ltr">
                              {entry.symbol}
                            </span>
                            <span className="sr-only">{isBuy ? l('شراء', 'Buy') : l('بيع', 'Sell')}</span>
                          </p>
                          <p className="ledger-num mt-1 text-xs text-fg-muted" dir="ltr">
                            {entry.entry_price}
                            {entry.exit_price ? ` → ${entry.exit_price}` : ''}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <StatusBadge status={entry.outcome} />
                          <button
                            onClick={() => startEdit(entry)}
                            className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-primary"
                            aria-label={l(`تعديل ${entry.symbol}`, `Edit ${entry.symbol}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={l(`حذف ${entry.symbol}`, `Delete ${entry.symbol}`)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {(entry.take_profit || entry.stop_loss || entry.size) && (
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted" dir="ltr">
                          {entry.take_profit && (
                            <div className="flex gap-1"><dt className="text-fg-faint">TP</dt><dd className="ledger-num">{entry.take_profit}</dd></div>
                          )}
                          {entry.stop_loss && (
                            <div className="flex gap-1"><dt className="text-fg-faint">SL</dt><dd className="ledger-num">{entry.stop_loss}</dd></div>
                          )}
                          {entry.size && (
                            <div className="flex gap-1"><dt className="text-fg-faint">Size</dt><dd className="ledger-num">{entry.size}</dd></div>
                          )}
                        </dl>
                      )}

                      {entry.tags?.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {entry.tags.map((tv) => {
                            const tag = TAGS.find((t) => t.value === tv);
                            return (
                              <li
                                key={tv}
                                className="rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[0.6875rem] text-primary"
                              >
                                {tag ? l(tag.ar, tag.en) : tv}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {entry.entry_reasoning && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fg-muted">
                          {entry.entry_reasoning}
                        </p>
                      )}
                      {entry.outcome_notes && (
                        <p className="mt-1 line-clamp-2 border-s-0 text-xs italic leading-relaxed text-fg-faint">
                          {entry.outcome_notes}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Journal;
