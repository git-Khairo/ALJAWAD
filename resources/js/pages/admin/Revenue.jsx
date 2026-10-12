import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import WalletsPanel from '@/components/finance/WalletsPanel';
import TransfersLedger from '@/components/finance/TransfersLedger';
import TablePagination from '@/components/TablePagination';
import { usePagination } from '@/lib/usePagination';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { affiliateApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeftRight, RefreshCw, Edit3, Check, Plus, Wallet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';


const fmt  = (n) => { const num = Number(n); return isNaN(num) ? '0' : num.toFixed(2); };
const fmtI = (n) => { const num = Number(n); return isNaN(num) ? '0' : Math.round(num).toLocaleString(); };

const CompanyWallets = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { wallets, walletList, walletTopups, topUpWallet, updateTopUp, deleteTopUp, convertCurrency, updateConversionRate } = useAppData();
  const canManageWallets = hasPermission('edit wallets');
  const l = (ar, en) => language === 'ar' ? ar : en;

  // Brokers that fund the wallets (plus a free-text "Other").
  const { data: brokers = [] } = useQuery({
    queryKey: ['affiliates-brokers'],
    queryFn: () => affiliateApi.brokers().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  // ── Conversion state ──────────────────────────────────────────────────────
  const [convAmount, setConvAmount]   = useState('');
  const [convFrom, setConvFrom]       = useState('USD');
  const [draftRate, setDraftRate]     = useState(String(wallets.rate));
  const [editingRate, setEditingRate] = useState(false);

  // ── Top-up modal state (shared by "add" and "edit") ───────────────────────
  const [topUpOpen, setTopUpOpen]         = useState(false);
  const [topUpTarget, setTopUpTarget]     = useState(null); // null = adding
  const [topUpWalletId, setTopUpWalletId] = useState('');
  const [topUpCurrency, setTopUpCurrency] = useState('USD');
  const [topUpAmount, setTopUpAmount]     = useState('');
  const [topUpNote, setTopUpNote]         = useState('');
  const [topUpBroker, setTopUpBroker]     = useState('');   // '' | broker id | 'other'
  const [topUpBrokerOther, setTopUpBrokerOther] = useState('');
  const [topUpSubmitting, setTopUpSubmitting]   = useState(false);
  const [deleteTarget, setDeleteTarget]         = useState(null);
  const [deleting, setDeleting]                 = useState(false);
  const [topupWalletChoice, setTopupWalletFilter] = useState(''); // '' = every wallet

  const allWallets = walletList ?? [];
  // A filter on a since-deleted wallet falls back to "all wallets".
  const topupWalletFilter = allWallets.some(w => String(w.id) === topupWalletChoice) ? topupWalletChoice : '';
  const mainWalletId = String(allWallets.find(w => w.is_main)?.id ?? wallets.id ?? '');
  const walletName = (w) => (w ? l(w.name_ar, w.name_en) : '—');
  // The wallet the dialog is aimed at; its balance is the one worth showing.
  const dialogWallet = allWallets.find(w => String(w.id) === topUpWalletId) ?? wallets;

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

  const openTopUp = (currency, wallet = null) => {
    setTopUpTarget(null);
    setTopUpWalletId(wallet ? String(wallet.id) : mainWalletId);
    setTopUpCurrency(currency);
    setTopUpAmount('');
    setTopUpNote('');
    setTopUpBroker('');
    setTopUpBrokerOther('');
    setTopUpOpen(true);
  };

  const openEditTopUp = (t) => {
    setTopUpTarget(t);
    setTopUpWalletId(t.wallet_id ? String(t.wallet_id) : mainWalletId);
    setTopUpCurrency(t.currency);
    setTopUpAmount(String(t.amount ?? ''));
    setTopUpNote(t.note ?? '');
    setTopUpBroker(t.broker_id ? String(t.broker_id) : (t.broker_other ? 'other' : ''));
    setTopUpBrokerOther(t.broker_other ?? '');
    setTopUpOpen(true);
  };

  const handleTopUp = async (ev) => {
    ev.preventDefault();
    const amt = Number(topUpAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount')); return;
    }
    if (topUpBroker === 'other' && !topUpBrokerOther.trim()) {
      toast.error(l('أدخل اسم المصدر', 'Enter the source name')); return;
    }

    const payload = {
      wallet_id:    topUpWalletId ? Number(topUpWalletId) : null,
      currency:     topUpCurrency,
      amount:       amt,
      note:         topUpNote.trim() || null,
      broker_id:    topUpBroker !== '' && topUpBroker !== 'other' ? Number(topUpBroker) : null,
      broker_other: topUpBroker === 'other' ? topUpBrokerOther.trim() : null,
    };

    setTopUpSubmitting(true);
    try {
      if (topUpTarget) {
        await updateTopUp({ id: topUpTarget.id, ...payload });
        toast.success(l('تم تحديث الإيداع', 'Top-up updated'));
      } else {
        await topUpWallet(payload);
        toast.success(
          topUpCurrency === 'SYP'
            ? l(`تمت إضافة ${fmtI(amt)} ليرة إلى ${dialogWallet?.name_ar ?? 'المحفظة'}`, `Added ${fmtI(amt)} SYP to ${dialogWallet?.name_en ?? 'the wallet'}`)
            : l(`تمت إضافة $${fmt(amt)} إلى ${dialogWallet?.name_ar ?? 'المحفظة'}`, `Added $${fmt(amt)} to ${dialogWallet?.name_en ?? 'the wallet'}`)
        );
      }
      setTopUpOpen(false);
    } catch {
      // 422 (e.g. an edit that would overdraw the wallet) is surfaced globally.
    } finally {
      setTopUpSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredTopups = (walletTopups ?? []).filter(
    t => !topupWalletFilter || String(t.wallet_id) === topupWalletFilter,
  );
  const {
    page: topupPage, setPage: setTopupPage, paginated: pagedTopups,
    totalPages: topupPages, from: topupFrom, to: topupTo, total: topupTotal,
  } = usePagination(filteredTopups, 15, topupWalletFilter);

  return (
    <div className="space-y-6">

      <PageHeader
        title={l('محافظ الشركة', 'Company wallets')}
        description={l(
          'كل محفظة تحمل الليرة والدولار معاً. الأرقام أدناه للمحفظة الرئيسية.',
          'Every wallet holds both SYP and USD. The figures below are the main wallet.',
        )}
      />

      {/* All named wallets, with balances, transfers and the main-wallet flag. */}
      <WalletsPanel onTopUp={(w) => openTopUp('USD', w)} />

      {/* ── Wallet Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* SYP */}
        <div className="relative overflow-hidden rounded border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/15 hidden pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {l('محفظة الليرة السورية', 'Syrian Pound Wallet')} 🇸🇾
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight mt-3">
              {fmtI(wallets.syp)}
              <span className="text-base font-normal text-muted-foreground ms-2">SYP</span>
            </p>
            {canManageWallets && (
              <div className="mt-4 pt-4 border-t border-primary/20 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary h-7 text-xs gap-1"
                  onClick={() => openTopUp('SYP')}
                >
                  <Plus className="h-3 w-3" />{l('إيداع', 'Top Up')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* USD */}
        <div className="relative overflow-hidden rounded border border-chart-up/30 bg-gradient-to-br from-chart-up/10 to-chart-up/5 p-6">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-chart-up/15 hidden pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-chart-up">
                {l('محفظة الدولار', 'US Dollar Wallet')} 🇺🇸
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight mt-3">
              {fmt(wallets.usd)}
              <span className="text-base font-normal text-muted-foreground ms-2">USD</span>
            </p>
            {canManageWallets && (
              <div className="mt-4 pt-4 border-t border-chart-up/20 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-chart-up/40 text-chart-up hover:bg-chart-up/10 hover:text-chart-up h-7 text-xs gap-1"
                  onClick={() => openTopUp('USD')}
                >
                  <Plus className="h-3 w-3" />{l('إيداع', 'Top Up')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Currency Conversion (managers only) ─────────────────────────────── */}
      {canManageWallets && (
      <div className="bg-card rounded border p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          {l('تحويل العملة في المحفظة الرئيسية', 'Currency Conversion — Main Wallet')}
        </h2>

        {/* Rate row */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded bg-muted/40 border">
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
            className="h-10 w-10 rounded border bg-muted/50 hover:bg-primary/10 hover:border-primary/40 flex items-center justify-center transition-colors self-end"
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
      )}

      {/* ── Wallet Top-Ups ledger ────────────────────────────────────────────── */}
      <div className="bg-card rounded border overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">{l('سجل إيداعات المحافظ', 'Wallet Top-Ups')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{l('الأموال التي دخلت المحافظ من خارج الشركة', 'Money that entered the wallets from outside the company')}</p>
          </div>
          <select
            value={topupWalletFilter}
            onChange={e => setTopupWalletFilter(e.target.value)}
            aria-label={l('تصفية حسب المحفظة', 'Filter by wallet')}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm"
          >
            <option value="">{l('كل المحافظ', 'All wallets')}</option>
            {allWallets.map(w => <option key={w.id} value={String(w.id)}>{walletName(w)}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المحفظة', 'Wallet')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الوسيط', 'Broker')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('ملاحظة', 'Note')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {pagedTopups.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  {topupWalletFilter
                    ? l('لا توجد إيداعات في هذه المحفظة', 'No top-ups into this wallet')
                    : l('لا توجد إيداعات بعد', 'No top-ups yet')}
                </td></tr>
              )}
              {pagedTopups.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    <span dir="ltr">{(t.created_at || '').slice(0, 10)}</span>
                    {t.creator?.name && <span className="block text-[11px] text-muted-foreground/70">{t.creator.name}</span>}
                  </td>
                  <td className="p-3 text-xs font-medium">
                    {t.wallet_id
                      ? walletName(t.wallet)
                      : <span className="italic font-normal text-muted-foreground">{l('محفظة محذوفة', 'Deleted wallet')}</span>}
                  </td>
                  <td className="p-3 text-xs">{t.broker?.name || t.broker_other || '—'}</td>
                  <td className="p-3 font-medium text-chart-up whitespace-nowrap" dir="ltr">+{Number(t.amount).toLocaleString()} {t.currency}</td>
                  <td className="p-3 text-xs text-muted-foreground">{t.note || '—'}</td>
                  <td className="p-3">
                    {/* A top-up whose wallet was deleted is locked on the server. */}
                    {canManageWallets && t.wallet_id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditTopUp(t)}
                          className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                          title={l('تعديل', 'Edit')}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 rounded-lg border border-chart-down/20 hover:bg-chart-down/10 text-chart-down transition"
                          title={l('حذف', 'Delete')}
                        >
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
        <div className="px-3 pb-2">
          <TablePagination
            page={topupPage} totalPages={topupPages} from={topupFrom} to={topupTo} total={topupTotal}
            onPage={setTopupPage} labelAr="إيداع" labelEn="top-up" language={language}
          />
        </div>
      </div>

      {/* ── Wallet transfers ledger ──────────────────────────────────────────── */}
      <TransfersLedger />

      {/* ── Delete Top-Up confirm ────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('حذف الإيداع', 'Delete Top-Up')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget && l(
              `سيتم خصم ${Number(deleteTarget.amount).toLocaleString()} ${deleteTarget.currency} من ${deleteTarget.wallet?.name_ar ?? 'المحفظة'}. لا يمكن التراجع.`,
              `${Number(deleteTarget.amount).toLocaleString()} ${deleteTarget.currency} will be taken back out of ${deleteTarget.wallet?.name_en ?? 'the wallet'}. This cannot be undone.`
            )}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              {l('إلغاء', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await deleteTopUp(deleteTarget.id);
                  toast.success(l('تم حذف الإيداع', 'Top-up deleted'));
                  setDeleteTarget(null);
                } catch {
                  // 422 (the money is already spent) is surfaced globally.
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? l('جارٍ...', 'Deleting…') : l('حذف', 'Delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Top-Up Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              {topUpTarget ? l('تعديل الإيداع', 'Edit Top-Up') : l('إيداع في محفظة', 'Top Up a Wallet')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTopUp} className="space-y-4 mt-2">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label htmlFor="topup-wallet" className="text-xs text-muted-foreground mb-1.5 block font-medium">
                  {l('المحفظة', 'Wallet')}
                </label>
                <select
                  id="topup-wallet"
                  value={topUpWalletId}
                  onChange={e => setTopUpWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  {/* Archived wallets cannot receive money; keep the original one listed when editing. */}
                  {allWallets
                    .filter(w => !w.is_archived || String(w.id) === String(topUpTarget?.wallet_id ?? ''))
                    .map(w => (
                      <option key={w.id} value={String(w.id)}>
                        {walletName(w)}{w.is_main ? ` — ${l('رئيسية', 'main')}` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="topup-currency" className="text-xs text-muted-foreground mb-1.5 block font-medium">
                  {l('العملة', 'Currency')}
                </label>
                <select
                  id="topup-currency"
                  value={topUpCurrency}
                  onChange={e => setTopUpCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="SYP">SYP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                {l('المصدر / الوسيط', 'Source / Broker')}
              </label>
              <select
                value={topUpBroker}
                onChange={e => setTopUpBroker(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="">{l('غير محدّد', 'Not specified')}</option>
                {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                <option value="other">{l('أخرى', 'Other')}</option>
              </select>
              {topUpBroker === 'other' && (
                <input
                  value={topUpBrokerOther}
                  onChange={e => setTopUpBrokerOther(e.target.value)}
                  maxLength={120}
                  placeholder={l('اسم المصدر...', 'Source name...')}
                  className="w-full mt-2 px-3 py-2 rounded-lg border bg-background text-sm"
                />
              )}
            </div>
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
              <p className="text-xs text-muted-foreground mt-1">
                {l('الرصيد الحالي:', 'Current balance:')}{' '}
                <span dir="ltr">
                  {topUpCurrency === 'SYP'
                    ? `${fmtI(dialogWallet?.syp)} SYP`
                    : `${fmt(dialogWallet?.usd)} USD`}
                </span>
              </p>
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
              <Button
                type="submit"
                disabled={topUpSubmitting}
                className={`flex-1 ${topUpCurrency === 'SYP' ? 'bg-primary hover:bg-primary' : 'bg-chart-up hover:bg-chart-up'}`}
              >
                {topUpSubmitting
                  ? l('جارٍ...', 'Saving…')
                  : topUpTarget ? l('حفظ', 'Save') : l('إيداع', 'Top Up')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CompanyWallets;
