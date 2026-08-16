import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Star, Archive, Trash2, ArrowLeftRight, Loader2, X, Wallet as WalletIcon } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';

const selectCls =
  'h-11 w-full rounded border border-rule-strong bg-surface-raised px-3 text-sm text-foreground ' +
  'transition-colors duration-120 hover:border-fg-faint focus:border-primary focus:outline-none';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Named company wallets, each holding both currencies.
 *
 * A new wallet always starts empty and is funded with a top-up, so every
 * balance traces back to a ledger row. An "opening balance" field would be
 * money appearing from nowhere, which is precisely what the finance pages
 * exist to prevent.
 */
export function WalletsPanel() {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const {
    walletList, addWallet, updateWallet, deleteWallet, makeWalletMain, transferBetweenWallets,
  } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const canEdit = hasPermission('edit wallets');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name_ar: '', name_en: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transfer, setTransfer] = useState({ from_wallet_id: '', to_wallet_id: '', currency: 'USD', amount: '' });

  const wallets = walletList ?? [];
  const rate = wallets[0]?.rate ?? 14200;

  const submitNew = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name_ar.trim()) next.name_ar = l('الاسم بالعربية مطلوب.', 'The Arabic name is required.');
    if (!form.name_en.trim()) next.name_en = l('الاسم بالإنجليزية مطلوب.', 'The English name is required.');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await addWallet({ name_ar: form.name_ar.trim(), name_en: form.name_en.trim() });
      toast.success(l('تمت إضافة المحفظة.', 'Wallet added.'));
      setForm({ name_ar: '', name_en: '' });
      setCreating(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? l('تعذّر الإنشاء.', 'Could not create the wallet.'));
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    if (!transfer.from_wallet_id || !transfer.to_wallet_id || !transfer.amount) return;
    setBusy(true);
    try {
      await transferBetweenWallets({
        ...transfer,
        from_wallet_id: Number(transfer.from_wallet_id),
        to_wallet_id: Number(transfer.to_wallet_id),
        amount: Number(transfer.amount),
      });
      toast.success(l('تم التحويل.', 'Transferred.'));
      setTransfer({ from_wallet_id: '', to_wallet_id: '', currency: 'USD', amount: '' });
      setTransferOpen(false);
    } catch (err) {
      const messages = err?.response?.data?.errors;
      toast.error(
        (messages && Object.values(messages).flat()[0]) ??
        err?.response?.data?.message ??
        l('تعذّر التحويل.', 'Transfer failed.'),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleMakeMain = async (w) => {
    try {
      await makeWalletMain(w.id);
      toast.success(l(`${w.name_ar} صارت المحفظة الرئيسية.`, `${w.name_en} is now the main wallet.`));
    } catch {
      toast.error(l('تعذّر التغيير.', 'Could not change the main wallet.'));
    }
  };

  const handleDelete = async (w) => {
    if (!window.confirm(l(
      `حذف ${w.name_ar}؟ سيبقى سجلها المالي.`,
      `Delete ${w.name_en}? Its financial history is kept.`,
    ))) return;
    try {
      await deleteWallet(w.id);
      toast.success(l('تم الحذف.', 'Deleted.'));
    } catch (err) {
      const messages = err?.response?.data?.errors;
      toast.error(
        (messages && Object.values(messages).flat()[0]) ??
        l('تعذّر الحذف.', 'Could not delete the wallet.'),
      );
    }
  };

  const toggleArchive = async (w) => {
    try {
      await updateWallet({ id: w.id, is_archived: !w.is_archived });
    } catch (err) {
      const messages = err?.response?.data?.errors;
      toast.error((messages && Object.values(messages).flat()[0]) ?? l('تعذّر التحديث.', 'Update failed.'));
    }
  };

  return (
    <section className="border border-rule">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
          {l('المحافظ', 'Wallets')}
          <span className="ms-2 font-mono text-xs font-normal text-fg-faint" dir="ltr">{wallets.length}</span>
        </h2>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={() => setTransferOpen((o) => !o)} disabled={wallets.length < 2}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {l('تحويل', 'Transfer')}
            </Button>
            <Button variant="accent" size="xs" onClick={() => setCreating((o) => !o)}>
              {creating ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {creating ? l('إلغاء', 'Cancel') : l('محفظة جديدة', 'New wallet')}
            </Button>
          </div>
        )}
      </div>

      {/* Create */}
      {creating && canEdit && (
        <form onSubmit={submitNew} className="space-y-5 border-b border-rule bg-surface-sunken p-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={l('الاسم بالعربية', 'Arabic name')} error={errors.name_ar} required>
              {(props) => (
                <Input {...props} value={form.name_ar}
                  onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
              )}
            </Field>
            <Field label={l('الاسم بالإنجليزية', 'English name')} error={errors.name_en} required>
              {(props) => (
                <Input {...props} value={form.name_en} dir="ltr"
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
              )}
            </Field>
          </div>
          <p className="text-xs text-fg-faint">
            {l(
              'تبدأ المحفظة فارغة. موّلها بإيداع ليبقى كل رصيد مُفسَّراً في السجل.',
              'A new wallet starts empty. Fund it with a top-up so every balance is explained by the ledger.',
            )}
          </p>
          <Button type="submit" variant="accent" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {l('إنشاء', 'Create')}
          </Button>
        </form>
      )}

      {/* Transfer */}
      {transferOpen && canEdit && (
        <form onSubmit={submitTransfer} className="space-y-5 border-b border-rule bg-surface-sunken p-4">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={l('من', 'From')} required>
              {(props) => (
                <select {...props} className={selectCls} value={transfer.from_wallet_id}
                  onChange={(e) => setTransfer((t) => ({ ...t, from_wallet_id: e.target.value }))}>
                  <option value="">{l('اختر…', 'Choose…')}</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{l(w.name_ar, w.name_en)}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={l('إلى', 'To')} required>
              {(props) => (
                <select {...props} className={selectCls} value={transfer.to_wallet_id}
                  onChange={(e) => setTransfer((t) => ({ ...t, to_wallet_id: e.target.value }))}>
                  <option value="">{l('اختر…', 'Choose…')}</option>
                  {wallets.filter((w) => String(w.id) !== transfer.from_wallet_id).map((w) => (
                    <option key={w.id} value={w.id}>{l(w.name_ar, w.name_en)}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={l('العملة', 'Currency')} required>
              {(props) => (
                <select {...props} className={selectCls} value={transfer.currency}
                  onChange={(e) => setTransfer((t) => ({ ...t, currency: e.target.value }))}>
                  <option value="USD">USD</option>
                  <option value="SYP">SYP</option>
                </select>
              )}
            </Field>
            <Field label={l('المبلغ', 'Amount')} required>
              {(props) => (
                <Input {...props} type="number" step="any" min="0" dir="ltr" className="font-mono"
                  value={transfer.amount}
                  onChange={(e) => setTransfer((t) => ({ ...t, amount: e.target.value }))} />
              )}
            </Field>
          </div>
          <Button type="submit" variant="accent" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {l('تحويل', 'Transfer')}
          </Button>
        </form>
      )}

      {/* List */}
      {wallets.length === 0 ? (
        <EmptyState
          className="border-0"
          icon={WalletIcon}
          title={l('لا توجد محافظ', 'No wallets')}
          description={l('أنشئ محفظة لتبدأ.', 'Create one to get started.')}
        />
      ) : (
        <ul className="divide-y divide-rule">
          {wallets.map((w) => (
            <li key={w.id} className={`flex flex-wrap items-center gap-x-6 gap-y-3 p-4 ${w.is_archived ? 'opacity-55' : ''}`}>
              <div className="min-w-[10rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{l(w.name_ar, w.name_en)}</span>
                  {w.is_main && <Badge variant="accent">{l('رئيسية', 'Main')}</Badge>}
                  {w.is_archived && <Badge variant="secondary">{l('مؤرشفة', 'Archived')}</Badge>}
                </div>
                <p className="mt-0.5 font-mono text-xs text-fg-faint" dir="ltr">{w.key}</p>
              </div>

              {/* Both currencies, always, since every wallet holds both. */}
              <dl className="flex gap-6" dir="ltr">
                <div className="text-end">
                  <dt className="text-xs text-fg-faint">USD</dt>
                  <dd className="ledger-num text-sm text-foreground">${fmt(w.usd)}</dd>
                </div>
                <div className="text-end">
                  <dt className="text-xs text-fg-faint">SYP</dt>
                  <dd className="ledger-num text-sm text-foreground">{fmt(w.syp)}</dd>
                </div>
                <div className="text-end">
                  <dt className="text-xs text-fg-faint">{l('بالدولار', 'Total USD')}</dt>
                  <dd className="ledger-num text-sm font-semibold text-primary">
                    ${fmt(Number(w.usd || 0) + Number(w.syp || 0) / (rate || 14200))}
                  </dd>
                </div>
              </dl>

              {canEdit && (
                <div className="flex items-center gap-1">
                  {!w.is_main && (
                    <button
                      onClick={() => handleMakeMain(w)}
                      aria-label={l(`اجعل ${w.name_ar} رئيسية`, `Make ${w.name_en} main`)}
                      className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-primary"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleArchive(w)}
                    aria-label={w.is_archived
                      ? l(`إلغاء أرشفة ${w.name_ar}`, `Unarchive ${w.name_en}`)
                      : l(`أرشفة ${w.name_ar}`, `Archive ${w.name_en}`)}
                    className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  {!w.is_main && (
                    <button
                      onClick={() => handleDelete(w)}
                      aria-label={l(`حذف ${w.name_ar}`, `Delete ${w.name_en}`)}
                      className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-rule px-4 py-2.5 text-xs text-fg-faint">
        {l(
          `سعر الصرف على مستوى الشركة: 1 دولار = ${fmt(rate)} ليرة. يُستخدم لكل التحويلات والمجاميع.`,
          `Company exchange rate: $1 = ${fmt(rate)} SYP. Used for every conversion and total.`,
        )}
      </p>
    </section>
  );
}

export default WalletsPanel;
