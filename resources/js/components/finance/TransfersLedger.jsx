import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Edit3, Trash2, Undo2 } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TablePagination from '@/components/TablePagination';
import { usePagination } from '@/lib/usePagination';

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-background text-sm';
const amountText = (t) => `${Number(t.amount).toLocaleString()} ${t.currency}`;

/**
 * Every transfer between company wallets: from where, to where, how much, why,
 * and who moved it. This is what explains a balance that did not arrive as a
 * top-up.
 *
 * Filtered to one wallet, amounts are signed from that wallet's side (money
 * in is +, money out is −), so the list reads like that wallet's statement.
 *
 * Editing or deleting a transfer re-settles both balances on the server, which
 * refuses if the receiving wallet has already spent the money. A transfer
 * whose wallet was deleted is locked there too, so its actions are hidden.
 */
export function TransfersLedger() {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { walletTransfers, walletList, updateTransfer, deleteTransfer } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const canEdit = hasPermission('edit wallets');

  const wallets = walletList ?? [];
  const [walletFilterChoice, setWalletFilter] = useState('');
  // A filter on a wallet that has since been deleted falls back to "all",
  // so the list never stays filtered while the dropdown says otherwise.
  const walletFilter = wallets.some((w) => String(w.id) === walletFilterChoice) ? walletFilterChoice : '';

  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [undoTarget, setUndoTarget] = useState(null);
  const [undoing, setUndoing] = useState(false);

  const walletName = (w) => (w ? l(w.name_ar, w.name_en) : null);
  const deleted = <span className="italic text-muted-foreground">{l('محفظة محذوفة', 'Deleted wallet')}</span>;

  const rows = (walletTransfers ?? []).filter(
    (t) => !walletFilter
      || String(t.from_wallet_id) === walletFilter
      || String(t.to_wallet_id) === walletFilter,
  );
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(rows, 15, walletFilter);

  const openEdit = (t) => {
    setEditTarget(t);
    setForm({
      from_wallet_id: String(t.from_wallet_id),
      to_wallet_id:   String(t.to_wallet_id),
      currency:       t.currency,
      amount:         String(t.amount),
      note:           t.note ?? '',
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { toast.error(l('أدخل مبلغاً صحيحاً', 'Enter a valid amount')); return; }
    if (form.from_wallet_id === form.to_wallet_id) {
      toast.error(l('لا يمكن التحويل إلى المحفظة نفسها', 'A wallet cannot send to itself')); return;
    }
    if (!form.note.trim()) { toast.error(l('اكتب سبب التحويل', 'Say why the money moved')); return; }

    setSaving(true);
    try {
      await updateTransfer({
        id:             editTarget.id,
        from_wallet_id: Number(form.from_wallet_id),
        to_wallet_id:   Number(form.to_wallet_id),
        currency:       form.currency,
        amount,
        note:           form.note.trim(),
      });
      toast.success(l('تم تحديث التحويل', 'Transfer updated'));
      setEditTarget(null);
    } catch {
      // The server's reason (e.g. the money is already spent) is toasted globally.
    } finally {
      setSaving(false);
    }
  };

  const confirmUndo = async () => {
    setUndoing(true);
    try {
      await deleteTransfer(undoTarget.id);
      toast.success(l('أُلغي التحويل وأُعيد المبلغ', 'Transfer undone; the money is back'));
      setUndoTarget(null);
    } catch {
      // Toasted globally.
    } finally {
      setUndoing(false);
    }
  };

  // Sign and colour from the filtered wallet's side; neutral when unfiltered.
  const signed = (t) => {
    if (!walletFilter) return { text: amountText(t), cls: 'text-foreground' };
    return String(t.to_wallet_id) === walletFilter
      ? { text: `+${amountText(t)}`, cls: 'text-chart-up' }
      : { text: `−${amountText(t)}`, cls: 'text-chart-down' };
  };

  // Destinations exclude the source and archived wallets, except the one the
  // transfer already points at, so a reason-only edit stays possible.
  const destinationOptions = form
    ? wallets.filter((w) => String(w.id) !== form.from_wallet_id
      && (!w.is_archived || String(w.id) === String(editTarget?.to_wallet_id)))
    : [];

  return (
    <div className="bg-card rounded border overflow-hidden">
      <div className="p-4 border-b flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">{l('سجل التحويلات بين المحافظ', 'Wallet Transfers')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {l('الأموال التي انتقلت بين محافظ الشركة، ولماذا', 'Money moved between the company wallets, and why')}
          </p>
        </div>
        <select
          value={walletFilter}
          onChange={(e) => setWalletFilter(e.target.value)}
          aria-label={l('تصفية حسب المحفظة', 'Filter by wallet')}
          className="px-3 py-1.5 rounded-lg border bg-background text-sm"
        >
          <option value="">{l('كل المحافظ', 'All wallets')}</option>
          {wallets.map((w) => <option key={w.id} value={String(w.id)}>{walletName(w)}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
              <th className="text-start p-3 font-medium text-muted-foreground whitespace-nowrap">{l('من ← إلى', 'From → To')}</th>
              <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
              <th className="text-start p-3 font-medium text-muted-foreground">{l('السبب', 'Reason')}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {walletFilter
                    ? l('لا توجد تحويلات لهذه المحفظة', 'No transfers in or out of this wallet')
                    : l('لا توجد تحويلات بعد', 'No transfers yet')}
                </td>
              </tr>
            )}
            {paginated.map((t) => {
              const amount = signed(t);
              const locked = !t.from_wallet_id || !t.to_wallet_id;
              return (
                <tr key={t.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    <span dir="ltr">{(t.created_at || '').slice(0, 10)}</span>
                    {t.creator?.name && <span className="block text-[11px] text-muted-foreground/70">{t.creator.name}</span>}
                  </td>
                  <td className="p-3 text-xs">
                    <span className="inline-flex flex-wrap items-center gap-1.5 font-medium">
                      {walletName(t.from_wallet) ?? deleted}
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
                      {walletName(t.to_wallet) ?? deleted}
                    </span>
                  </td>
                  <td className={`p-3 font-medium whitespace-nowrap ${amount.cls}`} dir="ltr">{amount.text}</td>
                  <td className="p-3 text-xs text-muted-foreground min-w-[12rem] max-w-[22rem]">{t.note || '—'}</td>
                  <td className="p-3">
                    {canEdit && !locked ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                          title={l('تعديل', 'Edit')}
                          aria-label={l('تعديل التحويل', 'Edit transfer')}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setUndoTarget(t)}
                          className="p-1.5 rounded-lg border border-chart-down/20 hover:bg-chart-down/10 text-chart-down transition"
                          title={l('إلغاء التحويل', 'Undo transfer')}
                          aria-label={l('إلغاء التحويل', 'Undo transfer')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 pb-2">
        <TablePagination
          page={page} totalPages={totalPages} from={from} to={to} total={total}
          onPage={setPage} labelAr="تحويل" labelEn="transfer" language={language}
        />
      </div>

      {/* ── Undo confirm ─────────────────────────────────────────────────── */}
      <Dialog open={!!undoTarget} onOpenChange={(open) => !open && setUndoTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('إلغاء التحويل', 'Undo Transfer')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {undoTarget && l(
              `سيعود ${amountText(undoTarget)} من ${undoTarget.to_wallet?.name_ar} إلى ${undoTarget.from_wallet?.name_ar}، ويُحذف السطر من السجل.`,
              `${amountText(undoTarget)} goes back from ${undoTarget.to_wallet?.name_en} to ${undoTarget.from_wallet?.name_en}, and the row is removed from the ledger.`,
            )}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setUndoTarget(null)}>
              {l('رجوع', 'Keep it')}
            </Button>
            <Button variant="destructive" className="flex-1 gap-1.5" disabled={undoing} onClick={confirmUndo}>
              <Undo2 className="h-3.5 w-3.5" />
              {undoing ? l('جارٍ...', 'Undoing…') : l('إلغاء التحويل', 'Undo')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit ─────────────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('تعديل التحويل', 'Edit Transfer')}</DialogTitle>
          </DialogHeader>
          {form && (
            <form onSubmit={submitEdit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="xfer-from" className="text-xs text-muted-foreground mb-1.5 block font-medium">{l('من', 'From')}</label>
                  <select
                    id="xfer-from"
                    value={form.from_wallet_id}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      from_wallet_id: e.target.value,
                      to_wallet_id: f.to_wallet_id === e.target.value ? '' : f.to_wallet_id,
                    }))}
                    className={inputCls}
                  >
                    {wallets.map((w) => <option key={w.id} value={String(w.id)}>{walletName(w)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="xfer-to" className="text-xs text-muted-foreground mb-1.5 block font-medium">{l('إلى', 'To')}</label>
                  <select
                    id="xfer-to"
                    value={form.to_wallet_id}
                    onChange={(e) => setForm((f) => ({ ...f, to_wallet_id: e.target.value }))}
                    className={inputCls}
                    required
                  >
                    <option value="">{l('اختر…', 'Choose…')}</option>
                    {destinationOptions.map((w) => <option key={w.id} value={String(w.id)}>{walletName(w)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label htmlFor="xfer-amount" className="text-xs text-muted-foreground mb-1.5 block font-medium">{l('المبلغ', 'Amount')}</label>
                  <input
                    id="xfer-amount"
                    type="number" min="0.01" step="0.01" dir="ltr" required
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label htmlFor="xfer-currency" className="text-xs text-muted-foreground mb-1.5 block font-medium">{l('العملة', 'Currency')}</label>
                  <select
                    id="xfer-currency"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="USD">USD</option>
                    <option value="SYP">SYP</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="xfer-note" className="text-xs text-muted-foreground mb-1.5 block font-medium">{l('السبب', 'Reason')}</label>
                <input
                  id="xfer-note"
                  value={form.note}
                  maxLength={255}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>
                  {l('إلغاء', 'Cancel')}
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? l('جارٍ...', 'Saving…') : l('حفظ', 'Save')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TransfersLedger;
