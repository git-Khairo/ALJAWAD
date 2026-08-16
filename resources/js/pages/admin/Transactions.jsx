import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, normalizePhone } from '@/contexts/AppDataContext';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Wallet, MapPin, Trash2, Edit3, Download, CalendarRange, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CHART_SERIES, NEUTRAL } from '@/lib/chartColors';
import {
  TX_DIRECTIONS, TX_METHODS, TX_PLACES, TX_PHONE_REGEX,
  txDirectionLabel, txMethodLabel, txPlaceLabel,
} from '@/constants/transactions';

const DIR_STYLE = {
  deposit:       'bg-chart-up/10 text-chart-up border-chart-up/25',
  withdrawal:    'bg-warn/10 text-warn border-warn/25',
  wallet_charge: 'bg-primary/10 text-primary border-primary/25',
  close_debt:    'bg-primary/10 text-primary border-primary/25',
};
const METHOD_COLOR = { cash: CHART_SERIES[3], usdt: CHART_SERIES[1], sham_cash: CHART_SERIES[5] };

const TONE = {
  emerald: { bg: 'bg-chart-up/10', text: 'text-chart-up' },
  orange:  { bg: 'bg-warn/10',  text: 'text-warn' },
  blue:    { bg: 'bg-primary/10',    text: 'text-primary' },
  violet:  { bg: 'bg-primary/10',  text: 'text-primary' },
};

const money = (n) => `${n < 0 ? '-' : ''}$${Math.round(Math.abs(Number(n) || 0)).toLocaleString()}`;

const STATUS_STYLES = {
  completed: 'bg-chart-up/10 text-chart-up border-chart-up/25',
  pending:   'bg-warn/10 text-warn border-warn/25',
  failed:    'bg-chart-down/10 text-chart-down border-chart-down/25',
};

const EMPTY_FORM = {
  phone: '', direction: 'deposit', method: 'cash', place: 'damascus',
  amount: '', commission: '', notes: '',
};

const EDIT_EMPTY = {
  direction: 'deposit', method: 'cash', place: 'damascus',
  amount: '', commission: '', notes: '', status: 'completed',
};

const ClientTransactions = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const {
    clientTransactions, clients,
    addClientTransaction, updateClientTransaction, deleteClientTransaction,
  } = useAppData();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [editForm, setEditForm]         = useState(EDIT_EMPTY);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const l = (ar, en) => language === 'ar' ? ar : en;

  const openEdit = (tx) => {
    setEditTarget(tx);
    setEditForm({
      direction:  tx.direction  ?? 'deposit',
      method:     tx.type       ?? 'cash',
      place:      tx.place      ?? 'damascus',
      amount:     String(tx.amount ?? ''),
      commission: tx.commission ? String(tx.commission) : '',
      notes:      tx.notes      ?? '',
      status:     tx.status     ?? 'completed',
    });
  };

  const editField = (f) => (e) => setEditForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEditSubmit = async (ev) => {
    ev.preventDefault();
    const amt = Number(editForm.amount);
    if (!editForm.amount || isNaN(amt) || amt <= 0) {
      toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount'));
      return;
    }
    setEditSubmitting(true);
    try {
      await updateClientTransaction({
        id:         editTarget.id,
        direction:  editForm.direction,
        method:     editForm.method,
        place:      editForm.place,
        amount:     amt,
        commission: editForm.commission === '' ? undefined : Number(editForm.commission),
        notes:      editForm.notes || undefined,
        status:     editForm.status,
      });
      toast.success(l('تم تحديث المعاملة', 'Transaction updated'));
      setEditTarget(null);
    } catch {
      // errors surfaced by global handler
    } finally {
      setEditSubmitting(false);
    }
  };

  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDir, setFilterDir]       = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]             = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // Live client match for the phone field.
  const matched = useMemo(() => {
    const q = normalizePhone(form.phone || '');
    return q ? (clients ?? []).find(c => normalizePhone(c.phone ?? '') === q) : null;
  }, [form.phone, clients]);

  const dateActive   = dateFrom !== '' || dateTo !== '';
  const filtersActive = dateActive || search !== '' ||
    filterMethod !== 'all' || filterDir !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setSearch(''); setFilterDir('all'); setFilterMethod('all');
    setFilterStatus('all'); setDateFrom(''); setDateTo('');
  };

  // The cards follow the date range only — the sheet formulas they mirror are
  // defined over completed rows of every type, so the other filters can't apply.
  const dateScoped = useMemo(() => clientTransactions.filter(tx => {
    const d = (tx.date ?? '').slice(0, 10);
    return (dateFrom === '' || d >= dateFrom) && (dateTo === '' || d <= dateTo);
  }), [clientTransactions, dateFrom, dateTo]);

  // ── Summary cards — mirror the Google-Sheet formulas (completed rows, USD) ──
  const cards = useMemo(() => {
    const completed = dateScoped.filter(tx => tx.status === 'completed');
    const now = new Date();
    const thisMonth = (d) => {
      const dt = new Date(d);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    };
    const sum = (rows) => rows.reduce((s, tx) => s + Number(tx.amount || 0), 0);
    const byDir = (dir) => completed.filter(tx => tx.direction === dir);
    const sumDir = (dir) => sum(byDir(dir));
    const sumDirPlace = (dir, place) => sum(completed.filter(tx => tx.direction === dir && tx.place === place));

    // With a date range chosen, the "this month" cards become "in the selected range".
    const depositPeriod  = dateActive ? sumDir('deposit')    : sum(byDir('deposit').filter(tx => thisMonth(tx.date)));
    const withdrawPeriod = dateActive ? sumDir('withdrawal') : sum(byDir('withdrawal').filter(tx => thisMonth(tx.date)));

    // Wallet Charge − Deposit + Withdraw − Wallet Discharge
    const walletBalance = sumDir('wallet_charge') - sumDir('deposit') + sumDir('withdrawal') - sumDir('wallet_discharge');

    // Deposit(Dam) − Withdraw(Dam) − CloseDebt(Dam) + CloseDebt(Tartus)
    const netDamascus =
      sumDirPlace('deposit', 'damascus')
      - sumDirPlace('withdrawal', 'damascus')
      - sumDirPlace('close_debt', 'damascus')
      + sumDirPlace('close_debt', 'tartus');

    const totalAr = dateActive ? 'إجمالي الإيداعات في الفترة' : 'إجمالي الإيداعات هذا الشهر';
    const totalEn = dateActive ? 'Deposits in Selected Range' : 'Total Deposit This Month';
    const wdAr    = dateActive ? 'إجمالي السحوبات في الفترة'  : 'إجمالي السحوبات هذا الشهر';
    const wdEn    = dateActive ? 'Withdrawals in Selected Range' : 'Total Withdraw This Month';

    return [
      { key: 'depMonth', ar: totalAr,                     en: totalEn,                    value: depositPeriod,        icon: ArrowDownCircle, tone: 'emerald' },
      { key: 'depTotal', ar: 'إجمالي الإيداعات',           en: 'Total Deposits',           value: sumDir('deposit'),    icon: ArrowDownCircle, tone: 'emerald' },
      { key: 'wdMonth',  ar: wdAr,                        en: wdEn,                       value: withdrawPeriod,       icon: ArrowUpCircle,   tone: 'orange' },
      { key: 'wdTotal',  ar: 'إجمالي السحوبات',            en: 'Total Withdraw',            value: sumDir('withdrawal'), icon: ArrowUpCircle,   tone: 'orange' },
      { key: 'wallet',   ar: 'الرصيد في محفظة Tickmill',   en: 'Total in Tickmill Wallet',  value: walletBalance,        icon: Wallet,          tone: 'blue' },
      { key: 'netDam',   ar: 'صافي دمشق',                  en: 'Net Damascus',              value: netDamascus,          icon: MapPin,          tone: 'violet' },
    ];
  }, [dateScoped, dateActive]);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dateScoped.filter(tx => (
      (filterMethod === 'all' || tx.type      === filterMethod) &&
      (filterDir    === 'all' || tx.direction === filterDir) &&
      (filterStatus === 'all' || tx.status    === filterStatus) &&
      ((tx.client || '').toLowerCase().includes(q) || (tx.notes || '').toLowerCase().includes(q))
    ));
  }, [dateScoped, filterMethod, filterDir, filterStatus, search]);
  const { page, setPage, paginated: pagedTx, totalPages, from, to, total } = usePagination(filtered, 15, search + filterMethod + filterDir + filterStatus + dateFrom + dateTo);

  const exportCsv = () => {
    const headers = [
      l('العميل','Client'), l('النوع','Type'), l('الطريقة','Method'),
      l('المكان','Place'), l('المبلغ','Amount'), l('العمولة','Commission'),
      l('الحالة','Status'), l('التاريخ','Date'), l('ملاحظات','Notes'),
    ];
    const rows = filtered.map(tx => [
      tx.client ?? '',
      txDirectionLabel(tx.direction, language),
      txMethodLabel(tx.type, language),
      tx.place ? txPlaceLabel(tx.place, language) : '',
      tx.amount ?? '',
      tx.commission ?? '',
      tx.status ?? '',
      (tx.date ?? '').slice(0, 10),
      tx.notes ?? '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 me-1" />{l('تصدير CSV', 'Export CSV')}
          </Button>
          {hasPermission('create transactions') && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 me-1" />{l('معاملة جديدة', 'New Transaction')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      {dateActive && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <CalendarRange className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            {l('الأرقام أدناه محسوبة على الفترة', 'Totals below cover')}{' '}
            <span className="font-medium text-foreground">
              {dateFrom || l('البداية', 'the start')} → {dateTo || l('اليوم', 'today')}
            </span>
          </span>
        </div>
      )}
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
        <div className="flex items-center gap-1.5">
          <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-2 text-sm rounded-lg border bg-background"
            title={l('من تاريخ', 'From date')}
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-2 py-2 text-sm rounded-lg border bg-background"
            title={l('إلى تاريخ', 'To date')}
          />
        </div>
        {filtersActive && (
          <Button size="sm" variant="outline" onClick={clearFilters} className="h-[38px] gap-1">
            <X className="h-3.5 w-3.5" />{l('مسح الفلاتر', 'Clear Filters')}
          </Button>
        )}
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
              {pagedTx.map((tx) => (
                <tr key={tx.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-medium">{tx.client}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${DIR_STYLE[tx.direction] ?? ''}`}>
                      {txDirectionLabel(tx.direction, language)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: METHOD_COLOR[tx.type] ?? NEUTRAL }} />
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
                    {(hasPermission('edit transactions') || hasPermission('delete transactions')) ? (
                      <div className="flex items-center gap-1">
                        {hasPermission('edit transactions') && (
                          <button onClick={() => openEdit(tx)}
                            className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 text-muted-foreground hover:text-primary transition">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {hasPermission('delete transactions') && (
                          <button onClick={() => setDeleteTarget(tx)}
                            className="p-1.5 rounded-lg border border-chart-down/20 hover:bg-chart-down/10 text-chart-down transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-2">
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} labelAr="معاملة" labelEn="transaction" language={language} />
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
                  ? <p className="text-xs text-chart-up mt-1">→ {matched.name}</p>
                  : <p className="text-xs text-warn mt-1">{l('لا يوجد عميل بهذا الرقم', 'No client matches this phone')}</p>
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

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {l('تعديل معاملة', 'Edit Transaction')}
              {editTarget && <span className="text-muted-foreground font-normal text-sm ms-2">— {editTarget.client}</span>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('النوع', 'Type')}</label>
              <select value={editForm.direction} onChange={editField('direction')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {TX_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{l(d.ar, d.en)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الطريقة', 'Method')}</label>
                <select value={editForm.method} onChange={editField('method')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {TX_METHODS.map(m => <option key={m.value} value={m.value}>{l(m.ar, m.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المكان', 'Place')}</label>
                <select value={editForm.place} onChange={editField('place')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {TX_PLACES.map(p => <option key={p.value} value={p.value}>{l(p.ar, p.en)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المبلغ (دولار)', 'Amount (USD)')}</label>
                <input type="number" min="0" step="any" value={editForm.amount} onChange={editField('amount')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('العمولة (اختياري)', 'Commission (optional)')}</label>
                <input type="number" min="0" step="any" value={editForm.commission} onChange={editField('commission')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
              <select value={editForm.status} onChange={editField('status')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="completed">{l('مكتمل', 'Completed')}</option>
                <option value="pending">{l('معلّق', 'Pending')}</option>
                <option value="failed">{l('فشل', 'Failed')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('ملاحظات', 'Notes')}</label>
              <input value={editForm.notes} onChange={editField('notes')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('اختياري...', 'Optional...')} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>{l('إلغاء', 'Cancel')}</Button>
              <Button type="submit" className="flex-1" disabled={editSubmitting}>{editSubmitting ? l('جارٍ...', 'Saving…') : l('حفظ', 'Save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-chart-down/20 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
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
                  className="px-4 py-2 text-sm rounded-xl bg-chart-down text-foreground hover:bg-chart-down transition font-semibold">
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
