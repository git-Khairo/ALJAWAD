import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeftRight, RefreshCw, TrendingDown, Edit3, Check, Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  salary:    { ar: 'رواتب',      en: 'Salaries' },
  rent:      { ar: 'إيجار',      en: 'Rent' },
  marketing: { ar: 'تسويق',      en: 'Marketing' },
  software:  { ar: 'برمجيات',    en: 'Software' },
  utilities: { ar: 'خدمات',      en: 'Utilities' },
  equipment: { ar: 'معدات',      en: 'Equipment' },
  travel:    { ar: 'سفر',        en: 'Travel' },
  other:     { ar: 'أخرى',       en: 'Other' },
};

const CATEGORY_COLORS = {
  salary: '#8b5cf6', rent: '#0ea5e9', marketing: '#f59e0b',
  software: '#10b981', utilities: '#64748b', equipment: '#f97316',
  travel: '#6366f1', other: '#94a3b8',
};

const fmt  = (n) => Number(n.toFixed(2)).toLocaleString();
const fmtI = (n) => Number(n.toFixed(0)).toLocaleString();

const CompanyWallets = () => {
  const { language } = useLanguage();
  const { wallets, expenses, topUpWallet, convertCurrency, updateConversionRate } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  // ── Conversion state ──────────────────────────────────────────────────────
  const [convAmount, setConvAmount]   = useState('');
  const [convFrom, setConvFrom]       = useState('USD');
  const [draftRate, setDraftRate]     = useState(String(wallets.rate));
  const [editingRate, setEditingRate] = useState(false);

  // ── Top-up modal state ────────────────────────────────────────────────────
  const [topUpOpen, setTopUpOpen]       = useState(false);
  const [topUpCurrency, setTopUpCurrency] = useState('USD');
  const [topUpAmount, setTopUpAmount]   = useState('');
  const [topUpNote, setTopUpNote]       = useState('');

  const convTo = convFrom === 'USD' ? 'SYP' : 'USD';

  const preview = (() => {
    const a = Number(convAmount);
    if (!a || isNaN(a)) return null;
    const r = Number(draftRate) || wallets.rate;
    return convFrom === 'USD'
      ? `${fmt(a)} USD  →  ${fmtI(a * r)} SYP`
      : `${fmtI(a)} SYP  →  ${fmt(a / r)} USD`;
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleConvert = () => {
    const amount = Number(convAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount')); return;
    }
    const r = Number(draftRate);
    if (!r || r <= 0) {
      toast.error(l('سعر الصرف غير صالح', 'Invalid exchange rate')); return;
    }
    if (convFrom === 'USD' && amount > wallets.usd) {
      toast.error(l('رصيد الدولار غير كافٍ', 'Insufficient USD balance')); return;
    }
    if (convFrom === 'SYP' && amount > wallets.syp) {
      toast.error(l('رصيد الليرة غير كافٍ', 'Insufficient SYP balance')); return;
    }
    convertCurrency({ amount, from: convFrom, rate: r });
    toast.success(l('تمت عملية التحويل بنجاح', 'Conversion completed'));
    setConvAmount('');
  };

  const handleSaveRate = () => {
    const r = Number(draftRate);
    if (!r || r <= 0) { toast.error(l('سعر غير صالح', 'Invalid rate')); return; }
    updateConversionRate(r);
    setEditingRate(false);
    toast.success(l('تم تحديث سعر الصرف', 'Exchange rate updated'));
  };

  const openTopUp = (currency) => {
    setTopUpCurrency(currency);
    setTopUpAmount('');
    setTopUpNote('');
    setTopUpOpen(true);
  };

  const handleTopUp = (ev) => {
    ev.preventDefault();
    const amt = Number(topUpAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount')); return;
    }
    topUpWallet({ currency: topUpCurrency, amount: amt });
    toast.success(
      topUpCurrency === 'SYP'
        ? l(`تمت إضافة ${fmtI(amt)} ليرة للمحفظة`, `Added ${fmtI(amt)} SYP to wallet`)
        : l(`تمت إضافة $${fmt(amt)} للمحفظة`, `Added $${fmt(amt)} to wallet`)
    );
    setTopUpOpen(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const recentExpenses = [...expenses].slice(0, 8);
  const sypExpenses = expenses.reduce((s, e) => e.currency === 'SYP' ? s + e.amount : s, 0);
  const usdExpenses = expenses.reduce((s, e) => e.currency === 'USD' ? s + e.amount : s, 0);

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">{l('محافظ الشركة', 'Company Wallets')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('إدارة رصيد الليرة السورية والدولار الأمريكي', 'Manage SYP and USD balances')}
        </p>
      </div>

      {/* ── Wallet Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* SYP */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                {l('محفظة الليرة السورية', 'Syrian Pound Wallet')} 🇸🇾
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight mt-3">
              {fmtI(wallets.syp)}
              <span className="text-base font-normal text-muted-foreground ms-2">SYP</span>
            </p>
            <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                <span>{l('مصاريف:', 'Expenses:')} {fmtI(sypExpenses)} SYP</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 h-7 text-xs gap-1"
                onClick={() => openTopUp('SYP')}
              >
                <Plus className="h-3 w-3" />{l('إيداع', 'Top Up')}
              </Button>
            </div>
          </div>
        </div>

        {/* USD */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                {l('محفظة الدولار', 'US Dollar Wallet')} 🇺🇸
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight mt-3">
              {fmt(wallets.usd)}
              <span className="text-base font-normal text-muted-foreground ms-2">USD</span>
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                <span>{l('مصاريف:', 'Expenses:')} {fmt(usdExpenses)} USD</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 h-7 text-xs gap-1"
                onClick={() => openTopUp('USD')}
              >
                <Plus className="h-3 w-3" />{l('إيداع', 'Top Up')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Currency Conversion ──────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          {l('تحويل بين المحافظ', 'Convert Between Wallets')}
        </h2>

        {/* Rate row */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/40 border">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {l('سعر الصرف الحالي: 1 USD =', 'Current rate: 1 USD =')}
          </span>
          {editingRate ? (
            <input
              type="number"
              min="1"
              value={draftRate}
              onChange={e => setDraftRate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border bg-background text-sm font-mono w-36"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveRate()}
            />
          ) : (
            <span className="font-bold font-mono text-primary text-lg">{fmtI(wallets.rate)}</span>
          )}
          <span className="text-sm text-muted-foreground">SYP</span>
          {editingRate ? (
            <Button size="sm" onClick={handleSaveRate} className="gap-1">
              <Check className="h-3.5 w-3.5" />{l('حفظ', 'Save')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { setDraftRate(String(wallets.rate)); setEditingRate(true); }} className="gap-1">
              <Edit3 className="h-3.5 w-3.5" />{l('تعديل السعر', 'Edit Rate')}
            </Button>
          )}
        </div>

        {/* Conversion widget */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {l('من', 'From')} — {convFrom}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={convAmount}
              onChange={e => setConvAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm font-mono"
            />
          </div>

          <button
            onClick={() => { setConvFrom(f => f === 'USD' ? 'SYP' : 'USD'); setConvAmount(''); }}
            className="h-10 w-10 rounded-xl border bg-muted/50 hover:bg-primary/10 hover:border-primary/40 flex items-center justify-center transition-colors self-end"
            title={l('عكس الاتجاه', 'Swap')}
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {l('إلى', 'To')} — {convTo}
            </label>
            <div className="w-full px-3 py-2.5 rounded-lg border bg-muted/30 text-sm font-mono min-h-[42px] flex items-center">
              {preview
                ? <span className="text-foreground">{preview.split('→')[1]?.trim()}</span>
                : <span className="text-muted-foreground/50">—</span>
              }
            </div>
          </div>

          <Button onClick={handleConvert} className="self-end gap-1.5 min-w-[110px]">
            <ArrowLeftRight className="h-4 w-4" />
            {l('تحويل', 'Convert')}
          </Button>
        </div>

        {preview && (
          <div className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
            <ArrowLeftRight className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">{l('معاينة:', 'Preview:')}</span>
            <span className="font-medium">{preview}</span>
          </div>
        )}
      </div>

      {/* ── Recent Expenses ──────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">{l('آخر المصاريف المؤثرة على المحافظ', 'Recent Expenses Affecting Wallets')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الفئة', 'Category')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الوصف', 'Description')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المحفظة', 'Wallet')}</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((e) => {
                const cat = CATEGORY_LABELS[e.category] ?? CATEGORY_LABELS.other;
                return (
                  <tr key={e.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 text-xs text-muted-foreground">{e.date}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[e.category] ?? '#94a3b8' }} />
                        {l(cat.ar, cat.en)}
                      </span>
                    </td>
                    <td className="p-3">{language === 'ar' ? e.description_ar : e.description_en}</td>
                    <td className="p-3 font-medium text-red-400">−{e.amount.toLocaleString()} {e.currency}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        e.currency === 'SYP'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}>
                        {e.currency === 'SYP' ? '🇸🇾 SYP' : '🇺🇸 USD'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top-Up Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              {topUpCurrency === 'SYP'
                ? l('إيداع في محفظة الليرة 🇸🇾', 'Top Up SYP Wallet 🇸🇾')
                : l('إيداع في محفظة الدولار 🇺🇸', 'Top Up USD Wallet 🇺🇸')
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTopUp} className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                {l('المبلغ', 'Amount')} ({topUpCurrency})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={topUpAmount}
                onChange={e => setTopUpAmount(e.target.value)}
                placeholder="0"
                autoFocus
                required
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm font-mono"
              />
              {topUpCurrency === 'SYP' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {l('الرصيد الحالي:', 'Current balance:')} {fmtI(wallets.syp)} SYP
                </p>
              )}
              {topUpCurrency === 'USD' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {l('الرصيد الحالي:', 'Current balance:')} {fmt(wallets.usd)} USD
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                {l('ملاحظة (اختياري)', 'Note (optional)')}
              </label>
              <input
                value={topUpNote}
                onChange={e => setTopUpNote(e.target.value)}
                placeholder={l('مصدر الإيداع...', 'Source of funds...')}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setTopUpOpen(false)}>
                {l('إلغاء', 'Cancel')}
              </Button>
              <Button type="submit" className={`flex-1 ${topUpCurrency === 'SYP' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {l('إيداع', 'Top Up')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CompanyWallets;
