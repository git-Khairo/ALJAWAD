import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = {
  salary:    { ar: 'رواتب',        en: 'Salaries',   color: '#8b5cf6' },
  rent:      { ar: 'إيجار',        en: 'Rent',        color: '#0ea5e9' },
  marketing: { ar: 'تسويق',        en: 'Marketing',   color: '#f59e0b' },
  software:  { ar: 'برمجيات',      en: 'Software',    color: '#10b981' },
  utilities: { ar: 'خدمات',        en: 'Utilities',   color: '#64748b' },
  equipment: { ar: 'معدات',        en: 'Equipment',   color: '#f97316' },
  travel:    { ar: 'سفر',          en: 'Travel',      color: '#6366f1' },
  other:     { ar: 'أخرى',         en: 'Other',       color: '#94a3b8' },
};

const EMPTY_FORM = {
  category: 'salary',
  description_ar: '',
  description_en: '',
  amount: '',
  currency: 'SYP',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

const fmt = (n) => { const num = Number(n); return isNaN(num) ? '0' : Math.round(num).toLocaleString(); };

const Expenses = () => {
  const { language } = useLanguage();
  const { expenses, addExpense, deleteExpense, wallets } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteId, setDeleteId]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [filterCat, setFilterCat]       = useState('all');
  const [filterCur, setFilterCur]       = useState('all');
  const [search, setSearch]             = useState('');

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalSYP = expenses.filter(e => e.currency === 'SYP').reduce((s, e) => s + Number(e.amount), 0);
  const totalUSD = expenses.filter(e => e.currency === 'USD').reduce((s, e) => s + Number(e.amount), 0);
  const thisMonth = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount) / (Number(wallets.rate) || 14200)), 0);
  }, [expenses, wallets.rate]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(e =>
      (filterCat === 'all' || e.category === filterCat) &&
      (filterCur === 'all' || e.currency === filterCur) &&
      (e.description_ar.toLowerCase().includes(q) || e.description_en.toLowerCase().includes(q))
    );
  }, [expenses, filterCat, filterCur, search]);

  const handleAdd = (ev) => {
    ev.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) return;
    addExpense({ ...form, amount: Number(form.amount) });
    toast.success(l('تمت إضافة المصروف وخصمه من المحفظة', 'Expense added and deducted from wallet'));
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleDelete = () => {
    deleteExpense(deleteId);
    toast.success(l('تم الحذف واسترداد المبلغ للمحفظة', 'Deleted and amount refunded to wallet'));
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{l('مصاريف الشركة', 'Company Expenses')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('جميع نفقات الشركة مرتبطة بالمحافظ', 'All company costs linked to wallets')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info(l('تصدير قريباً','Export coming soon'))}>
            <Download className="h-4 w-4 me-1" />{l('تصدير', 'Export')}
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 me-1" />{l('مصروف جديد', 'New Expense')}
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{l('إجمالي بالليرة', 'Total in SYP')}</p>
          <p className="text-xl font-bold">{fmt(totalSYP)} <span className="text-sm font-normal text-muted-foreground">SYP</span></p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{l('إجمالي بالدولار', 'Total in USD')}</p>
          <p className="text-xl font-bold">{fmt(totalUSD)} <span className="text-sm font-normal text-muted-foreground">USD</span></p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{l('هذا الشهر (دولار)', 'This Month (USD equiv)')}</p>
          <p className="text-xl font-bold">${fmt(thisMonth)}</p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={l('بحث...', 'Search...')}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-lg border bg-background"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل الفئات', 'All Categories')}</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{l(v.ar, v.en)}</option>
          ))}
        </select>
        <select value={filterCur} onChange={e => setFilterCur(e.target.value)} className="px-3 py-2 text-sm rounded-lg border bg-background">
          <option value="all">{l('كل العملات', 'All Currencies')}</option>
          <option value="SYP">SYP</option>
          <option value="USD">USD</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الفئة', 'Category')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الوصف', 'Description')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('العملة', 'Currency')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('ملاحظات', 'Notes')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{l('لا توجد نتائج', 'No results')}</td></tr>
              )}
              {filtered.map((e) => {
                const cat = CATEGORIES[e.category] ?? CATEGORIES.other;
                return (
                  <tr key={e.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 text-xs text-muted-foreground">{e.date}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                        {l(cat.ar, cat.en)}
                      </span>
                    </td>
                    <td className="p-3">{language === 'ar' ? e.description_ar : e.description_en}</td>
                    <td className="p-3 font-medium">{Number(e.amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        e.currency === 'USD'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                      }`}>
                        {e.currency}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{e.notes || '—'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setDeleteId(e.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Expense Modal ───────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إضافة مصروف جديد', 'Add New Expense')}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {l('سيتم خصم المبلغ تلقائياً من المحفظة المناسبة', 'Amount will be automatically deducted from the matching wallet')}
            </p>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الفئة', 'Category')}</label>
                <select value={form.category} onChange={field('category')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{l(v.ar, v.en)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('العملة', 'Currency')}</label>
                <select value={form.currency} onChange={field('currency')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="SYP">SYP — {l('ليرة سورية', 'Syrian Pound')}</option>
                  <option value="USD">USD — {l('دولار', 'US Dollar')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الوصف (عربي)', 'Description (Arabic)')}</label>
              <input value={form.description_ar} onChange={field('description_ar')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الوصف (إنجليزي)', 'Description (English)')}</label>
              <input value={form.description_en} onChange={field('description_en')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المبلغ', 'Amount')}</label>
                <input type="number" min="0" step="any" value={form.amount} onChange={field('amount')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('التاريخ', 'Date')}</label>
                <input type="date" value={form.date} onChange={field('date')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('ملاحظات', 'Notes')}</label>
              <input value={form.notes} onChange={field('notes')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button type="submit" className="flex-1">{l('إضافة', 'Add Expense')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm modal ─────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('تأكيد الحذف', 'Confirm Delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {l('سيتم حذف المصروف واسترداد المبلغ للمحفظة تلقائياً.', 'The expense will be deleted and the amount returned to the wallet automatically.')}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>{l('إلغاء', 'Cancel')}</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>{l('حذف', 'Delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
