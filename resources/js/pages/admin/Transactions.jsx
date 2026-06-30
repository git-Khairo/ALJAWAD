import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData, normalizePhone } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Wallet, MapPin, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  TX_DIRECTIONS, TX_METHODS, TX_PLACES, TX_PHONE_REGEX,
  txDirectionLabel, txMethodLabel, txPlaceLabel,
} from '@/constants/transactions';

const DIR_STYLE = {
  deposit:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  withdrawal:    'bg-orange-500/10 text-orange-400 border-orange-500/25',
  wallet_charge: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  close_debt:    'bg-violet-500/10 text-violet-400 border-violet-500/25',
};
const METHOD_COLOR = { cash: '#10b981', usdt: '#f59e0b', sham_cash: '#0ea5e9' };

const TONE = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400' },
};

const money = (n) => `${n < 0 ? '-' : ''}$${Math.round(Math.abs(Number(n) || 0)).toLocaleString()}`;

const STATUS_STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/25',
  failed:    'bg-red-500/10 text-red-400 border-red-500/25',
};

const EMPTY_FORM = {
  phone: '', direction: 'deposit', method: 'cash', place: 'damascus',
  amount: '', commission: '', notes: '',
};

const ClientTransactions = () => {
  const { language } = useLanguage();
  const {
    clientTransactions, clients, canManageFinance,
    addClientTransaction, updateClientTransaction, deleteClientTransaction,
  } = useAppData();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDir, setFilterDir]       = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]             = useState('');

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // Live client match for the phone field.
  const matched = useMemo(() => {
    const q = normalizePhone(form.phone || '');
    return q ? (clients ?? []).find(c => normalizePhone(c.phone ?? '') === q) : null;
  }, [form.phone, clients]);

  // ── Summary cards — mirror the Google-Sheet formulas (completed rows, USD) ──
  const cards = useMemo(() => {
    const completed = clientTransactions.filter(tx => tx.status === 'completed');
    const now = new Date();
    const thisMonth = (d) => {
      const dt = new Date(d);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    };
    const sum = (rows) => rows.reduce((s, tx) => s + Number(tx.amount || 0), 0);
    const byDir = (dir) => completed.filter(tx => tx.direction === dir);
    const sumDir = (dir) => sum(byDir(dir));
    const sumDirPlace = (dir, place) => sum(completed.filter(tx => tx.direction === dir && tx.place === place));

    const depositThisMonth  = sum(byDir('deposit').filter(tx => thisMonth(tx.date)));
    const withdrawThisMonth = sum(byDir('withdrawal').filter(tx => thisMonth(tx.date)));

    // Wallet Charge − Deposit + Withdraw − Wallet Discharge
    const walletBalance = sumDir('wallet_charge') - sumDir('deposit') + sumDir('withdrawal') - sumDir('wallet_discharge');

    // Deposit(Dam) − Withdraw(Dam) − CloseDebt(Dam) + CloseDebt(Tartus)
    const netDamascus =
      sumDirPlace('deposit', 'damascus')
      - sumDirPlace('withdrawal', 'damascus')
      - sumDirPlace('close_debt', 'damascus')
      + sumDirPlace('close_debt', 'tartus');

    return [
      { key: 'depMonth', ar: 'إجمالي الإيداعات هذا الشهر', en: 'Total Deposit This Month', value: depositThisMonth,    icon: ArrowDownCircle, tone: 'emerald' },
      { key: 'depTotal', ar: 'إجمالي الإيداعات',           en: 'Total Deposits',           value: sumDir('deposit'),    icon: ArrowDownCircle, tone: 'emerald' },
      { key: 'wdMonth',  ar: 'إجمالي السحوبات هذا الشهر',  en: 'Total Withdraw This Month', value: withdrawThisMonth,    icon: ArrowUpCircle,   tone: 'orange' },
      { key: 'wdTotal',  ar: 'إجمالي السحوبات',            en: 'Total Withdraw',            value: sumDir('withdrawal'), icon: ArrowUpCircle,   tone: 'orange' },
      { key: 'wallet',   ar: 'الرصيد في محفظة Tickmill',   en: 'Total in Tickmill Wallet',  value: walletBalance,        icon: Wallet,          tone: 'blue' },
      { key: 'netDam',   ar: 'صافي دمشق',                  en: 'Net Damascus',              value: netDamascus,          icon: MapPin,          tone: 'violet' },
    ];
  }, [clientTransactions]);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clientTransactions.filter(tx =>
      (filterMethod === 'all' || tx.type      === filterMethod) &&
      (filterDir    === 'all' || tx.direction === filterDir) &&
      (filterStatus === 'all' || tx.status    === filterStatus) &&
      ((tx.client || '').toLowerCase().includes(q) || (tx.notes || '').toLowerCase().includes(q))
    );
  }, [clientTransactions, filterMethod, filterDir, filterStatus, search]);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    const amt = Number(form.amount);
    if (!TX_PHONE_REGEX.test(form.phone.trim())) {
      toast.error(l('رقم الهاتف يجب أن يبدأ بـ 0 ويتكوّن من 10 أرقام', 'Phone must start with 0 and be 10 digits'));
      return;
    }
    if (!form.amount || isNaN(amt) || amt <= 0) {
      toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await addClientTransaction({
        phone:      form.phone.trim(),
        direction:  form.direction,
        method:     form.method,
        place:      form.place,
        amount:     amt,
        commission: form.commission === '' ? undefined : Number(form.commission),
        notes:      form.notes || undefined,
      });
      const activated = res?.data?.activated;
      toast.success(activated
        ? l('تمت إضافة المعاملة وتفعيل العميل', 'Transaction added — client activated')
        : l('تمت إضافة المعاملة', 'Transaction added'));
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      // 422 "No client found with this phone number" is surfaced by the global handler.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{l('الإيداعات والسحوبات', 'Deposits & Withdrawals')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('معاملات العملاء — جميعها بالدولار', 'Client transactions — all in USD')}
          </p>
        </div>
        {canManageFinance && (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 me-1" />{l('معاملة جديدة', 'New Transaction')}
          </Button>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon; const t = TONE[c.tone];
          return (
            <div key={c.key} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${t.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${t.text}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{l(c.ar, c.en)}</p>
                <p className="font-bold text-lg">
                  {money(c.value)} <span className="text-xs font-normal text-muted-foreground">USD</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={l('بحث بالعميل...', 'Search by client...')}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-lg border bg-background"
          />
        </div>
        <select value={filterDir} onChange={e => setFilterDir(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل الأنواع', 'All Types')}</option>
          {TX_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{l(d.ar, d.en)}</option>)}
        </select>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل الطرق', 'All Methods')}</option>
          {TX_METHODS.map(m => <option key={m.value} value={m.value}>{l(m.ar, m.en)}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل الحالات', 'All Statuses')}</option>
          <option value="completed">{l('مكتمل', 'Completed')}</option>
          <option value="pending">{l('معلّق', 'Pending')}</option>
          <option value="failed">{l('فشل', 'Failed')}</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('العميل', 'Client')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('النوع', 'Type')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الطريقة', 'Method')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المكان', 'Place')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('العمولة', 'Commission')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الحالة', 'Status')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('ملاحظات', 'Notes')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">{l('لا توجد نتائج', 'No results')}</td></tr>
              )}
              {filtered.map((tx) => (
                <tr key={tx.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-medium">{tx.client}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${DIR_STYLE[tx.direction] ?? ''}`}>
                      {txDirectionLabel(tx.direction, language)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: METHOD_COLOR[tx.type] ?? '#94a3b8' }} />
                      {txMethodLabel(tx.type, language)}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{tx.place ? txPlaceLabel(tx.place, language) : '—'}</td>
                  <td className="p-3 font-semibold">${Number(tx.amount).toLocaleString()}</td>
                  <td className="p-3 text-xs text-muted-foreground">{tx.commission ? `$${Number(tx.commission).toLocaleString()}` : '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[tx.status] ?? STATUS_STYLES.pending}`}>
                      {tx.status === 'completed' ? l('مكتمل','Completed') :
                       tx.status === 'pending'   ? l('معلّق','Pending') : l('فشل','Failed')}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[150px] truncate">{tx.notes || '—'}</td>
                  <td className="p-3">
                    {canManageFinance ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={tx.status}
                          onChange={(e) => { updateClientTransaction({ id: tx.id, status: e.target.value }); toast.success(l('تم التحديث', 'Status updated')); }}
                          className="text-xs px-2 py-1 rounded-lg border bg-background"
                        >
                          <option value="completed">{l('مكتمل', 'Completed')}</option>
                          <option value="pending">{l('معلّق', 'Pending')}</option>
                          <option value="failed">{l('فشل', 'Failed')}</option>
                        </select>
                        <button onClick={() => setDeleteTarget(tx)}
                          className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal (same fields as the bot) ──────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إضافة معاملة جديدة', 'Add New Transaction')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('النوع', 'Type')}</label>
              <select value={form.direction} onChange={field('direction')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {TX_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{l(d.ar, d.en)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('رقم هاتف العميل', 'Client Phone')}</label>
              <input type="tel" inputMode="numeric" value={form.phone} onChange={field('phone')} required
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" placeholder="09XXXXXXXX" />
              {form.phone.trim() && (
                matched
                  ? <p className="text-xs text-emerald-400 mt-1">→ {matched.name}</p>
                  : <p className="text-xs text-amber-400 mt-1">{l('لا يوجد عميل بهذا الرقم', 'No client matches this phone')}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الطريقة', 'Method')}</label>
                <select value={form.method} onChange={field('method')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {TX_METHODS.map(m => <option key={m.value} value={m.value}>{l(m.ar, m.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المكان', 'Place')}</label>
                <select value={form.place} onChange={field('place')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {TX_PLACES.map(p => <option key={p.value} value={p.value}>{l(p.ar, p.en)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المبلغ (دولار)', 'Amount (USD)')}</label>
                <input type="number" min="0" step="any" value={form.amount} onChange={field('amount')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('العمولة (اختياري)', 'Commission (optional)')}</label>
                <input type="number" min="0" step="any" value={form.commission} onChange={field('commission')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('ملاحظات', 'Notes')}</label>
              <input value={form.notes} onChange={field('notes')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('اختياري...', 'Optional...')} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? l('جارٍ...', 'Adding…') : l('إضافة', 'Add')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-red-500/20 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <p className="font-semibold text-lg mb-1">{l('حذف المعاملة', 'Delete Transaction')}</p>
              <p className="text-sm text-muted-foreground mb-5">
                {l(`هل أنت متأكد من حذف معاملة ${deleteTarget.client}؟`, `Delete ${deleteTarget.client}'s transaction? This cannot be undone.`)}
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm rounded-xl border border-primary/20 hover:bg-primary/5 transition">
                  {l('إلغاء', 'Cancel')}
                </button>
                <button
                  onClick={() => { deleteClientTransaction(deleteTarget.id); toast.success(l('تم الحذف', 'Transaction deleted')); setDeleteTarget(null); }}
                  className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-semibold">
                  {l('حذف', 'Delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientTransactions;
