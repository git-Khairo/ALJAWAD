import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const TX_TYPES = {
  cash:      { ar: 'نقد',           en: 'Cash',           color: '#10b981' },
  crypto:    { ar: 'كريبتو',        en: 'Crypto',          color: '#f59e0b' },
  sham_cash: { ar: 'شام كاش',       en: 'Sham Cash',       color: '#0ea5e9' },
  bank:      { ar: 'تحويل بنكي',    en: 'Bank Transfer',   color: '#8b5cf6' },
  wise:      { ar: 'وايز',          en: 'Wise',            color: '#6366f1' },
  other:     { ar: 'أخرى',          en: 'Other',           color: '#94a3b8' },
};

const STATUS_STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/25',
  failed:    'bg-red-500/10 text-red-400 border-red-500/25',
};

const EMPTY_FORM = {
  client: '', type: 'cash', direction: 'deposit',
  amount: '', currency: 'USD', status: 'completed', notes: '',
};

const fmt = (n) => { const num = Number(n); return isNaN(num) ? '0' : Math.round(num).toLocaleString(); };

const ClientTransactions = () => {
  const { language } = useLanguage();
  const { clientTransactions, addClientTransaction, updateClientTransaction, deleteClientTransaction } = useAppData();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [filterType, setFilterType]       = useState('all');
  const [filterDir, setFilterDir]         = useState('all');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterCur, setFilterCur]         = useState('all');
  const [search, setSearch]               = useState('');

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const completedTx = clientTransactions.filter(tx => tx.status === 'completed');
  const totalDeposits    = completedTx.filter(tx => tx.direction === 'deposit').reduce((s, tx) => s + Number(tx.amount), 0);
  const totalWithdrawals = completedTx.filter(tx => tx.direction === 'withdrawal').reduce((s, tx) => s + Number(tx.amount), 0);
  const pendingCount    = clientTransactions.filter(tx => tx.status === 'pending').length;

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clientTransactions.filter(tx =>
      (filterType   === 'all' || tx.type      === filterType) &&
      (filterDir    === 'all' || tx.direction === filterDir) &&
      (filterStatus === 'all' || tx.status    === filterStatus) &&
      (filterCur    === 'all' || tx.currency  === filterCur) &&
      (tx.client.toLowerCase().includes(q) || (tx.notes || '').toLowerCase().includes(q))
    );
  }, [clientTransactions, filterType, filterDir, filterStatus, filterCur, search]);

  const handleAdd = (ev) => {
    ev.preventDefault();
    const amt = Number(form.amount);
    if (!form.client.trim()) {
      toast.error(l('أدخل اسم العميل', 'Enter client name'));
      return;
    }
    if (!form.amount || isNaN(amt) || amt <= 0) {
      toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount'));
      return;
    }
    addClientTransaction({ ...form, amount: amt });
    toast.success(l('تمت إضافة المعاملة', 'Transaction added'));
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{l('معاملات العملاء', 'Client Transactions')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('إيداعات وسحوبات العملاء بجميع أنواع الدفع', 'Client deposits & withdrawals across all payment types')}
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 me-1" />{l('معاملة جديدة', 'New Transaction')}
        </Button>
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{l('إجمالي الإيداعات (مكتملة)', 'Total Deposits (completed)')}</p>
            <p className="font-bold text-lg">{fmt(totalDeposits)}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{l('إجمالي السحوبات (مكتملة)', 'Total Withdrawals (completed)')}</p>
            <p className="font-bold text-lg">{fmt(totalWithdrawals)}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{l('معلّق', 'Pending')}</p>
            <p className="font-bold text-lg">{pendingCount} {l('معاملات', 'transactions')}</p>
          </div>
        </div>
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
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل الأنواع', 'All Types')}</option>
          {Object.entries(TX_TYPES).map(([k, v]) => <option key={k} value={k}>{l(v.ar, v.en)}</option>)}
        </select>
        <select value={filterDir} onChange={e => setFilterDir(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('الاتجاهان', 'Both Directions')}</option>
          <option value="deposit">{l('إيداع', 'Deposit')}</option>
          <option value="withdrawal">{l('سحب', 'Withdrawal')}</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل الحالات', 'All Statuses')}</option>
          <option value="completed">{l('مكتمل', 'Completed')}</option>
          <option value="pending">{l('معلّق', 'Pending')}</option>
          <option value="failed">{l('فشل', 'Failed')}</option>
        </select>
        <select value={filterCur} onChange={e => setFilterCur(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل العملات', 'All Currencies')}</option>
          <option value="USD">USD</option>
          <option value="SYP">SYP</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('العميل', 'Client')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('نوع الدفع', 'Payment Type')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الاتجاه', 'Direction')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('العملة', 'Currency')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الحالة', 'Status')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('ملاحظات', 'Notes')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{l('لا توجد نتائج', 'No results')}</td></tr>
              )}
              {filtered.map((tx) => {
                const typeInfo = TX_TYPES[tx.type] ?? TX_TYPES.other;
                return (
                  <tr key={tx.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{tx.client}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: typeInfo.color }} />
                        {l(typeInfo.ar, typeInfo.en)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                        tx.direction === 'deposit'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                      }`}>
                        {tx.direction === 'deposit'
                          ? <><ArrowDownCircle className="h-3 w-3" />{l('إيداع','Deposit')}</>
                          : <><ArrowUpCircle className="h-3 w-3" />{l('سحب','Withdrawal')}</>
                        }
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{Number(tx.amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        tx.currency === 'USD'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                      }`}>
                        {tx.currency}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[tx.status] ?? STATUS_STYLES.pending}`}>
                        {tx.status === 'completed' ? l('مكتمل','Completed') :
                         tx.status === 'pending'   ? l('معلّق','Pending') : l('فشل','Failed')}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[150px] truncate">
                      {tx.notes || '—'}
                    </td>
                    <td className="p-3">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal ────────────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إضافة معاملة جديدة', 'Add New Transaction')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('اسم العميل', 'Client Name')}</label>
              <input value={form.client} onChange={field('client')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('أدخل اسم العميل', 'Enter client name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('نوع الدفع', 'Payment Type')}</label>
                <select value={form.type} onChange={field('type')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(TX_TYPES).map(([k, v]) => <option key={k} value={k}>{l(v.ar, v.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الاتجاه', 'Direction')}</label>
                <select value={form.direction} onChange={field('direction')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="deposit">{l('إيداع', 'Deposit')}</option>
                  <option value="withdrawal">{l('سحب', 'Withdrawal')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المبلغ', 'Amount')}</label>
                <input type="number" min="0" step="any" value={form.amount} onChange={field('amount')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('العملة', 'Currency')}</label>
                <select value={form.currency} onChange={field('currency')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="USD">USD</option>
                  <option value="SYP">SYP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
              <select value={form.status} onChange={field('status')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="completed">{l('مكتمل', 'Completed')}</option>
                <option value="pending">{l('معلّق', 'Pending')}</option>
                <option value="failed">{l('فشل', 'Failed')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('ملاحظات', 'Notes')}</label>
              <input value={form.notes} onChange={field('notes')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('اختياري...', 'Optional...')} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button type="submit" className="flex-1">{l('إضافة', 'Add')}</Button>
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
