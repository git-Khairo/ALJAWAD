import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Network, Users, ChevronDown, ChevronRight, Loader2, Plus, Trash2, X,
} from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { myApi, affiliateApi } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * Introducing-broker network.
 *
 * This page was written against a different theme entirely: bg-white/5,
 * text-slate-300, bg-sky-500, bg-violet-500. Everything here now comes from
 * the brand tokens, and status uses the shared StatusBadge so "pending" looks
 * the same as it does on every other screen.
 *
 * Indentation uses `paddingInlineStart` rather than `paddingLeft`, so the tree
 * nests toward the correct side in Arabic.
 */

const selectCls =
  'h-11 w-full rounded border border-rule-strong bg-surface-raised px-3 text-sm text-foreground ' +
  'transition-colors duration-120 hover:border-fg-faint focus:border-primary focus:outline-none';

/* ── Recursive sub-IB node ─────────────────────────────────────────────── */

const SubIbNode = ({ node, l, depth = 0 }) => {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.sub_ibs?.length ?? 0) > 0 || (node.clients?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 pe-3 transition-colors duration-120 hover:bg-surface-sunken"
        style={{ paddingInlineStart: `${12 + depth * 18}px` }}
      >
        <button
          className="w-4 shrink-0 text-fg-faint disabled:opacity-40"
          onClick={() => setOpen((o) => !o)}
          disabled={!hasChildren}
          aria-expanded={hasChildren ? open : undefined}
          aria-label={open ? l('طي', 'Collapse') : l('توسيع', 'Expand')}
        >
          {hasChildren
            ? (open ? <ChevronDown size={13} /> : <ChevronRight size={13} className="rtl:rotate-180" />)
            : <span className="inline-block w-4" />}
        </button>

        <Network size={14} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="flex-1 truncate text-sm text-foreground">{node.name}</span>
        {node.broker_name && <span className="text-xs text-fg-faint">{node.broker_name}</span>}

        <span className="ledger-num rounded-sm bg-surface-sunken px-1.5 py-0.5 text-xs text-fg-muted">
          {l('عملاء', 'clients')} {node.clients_count ?? 0}
        </span>
        <span className="ledger-num rounded-sm bg-surface-sunken px-1.5 py-0.5 text-xs text-fg-muted">
          {l('وسطاء', 'IBs')} {node.sub_ibs_count ?? 0}
        </span>
      </div>

      {open && hasChildren && (
        <div>
          {node.sub_ibs?.map((child) => (
            <SubIbNode key={child.id} node={child} l={l} depth={depth + 1} />
          ))}
          {node.clients?.map((c) => (
            <div
              key={c.user_id}
              className="flex items-center gap-2 py-1 pe-2 text-xs text-fg-muted"
              style={{ paddingInlineStart: `${30 + depth * 18}px` }}
            >
              <Users size={12} className="shrink-0 text-fg-faint" aria-hidden="true" />
              <span>{c.name}</span>
              {c.stage && (
                <span className="rounded-sm bg-surface-sunken px-1.5">{c.stage}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Client introduction ───────────────────────────────────────────────── */

const EMPTY_REQUEST = {
  name: '', phone: '', email: '', telegram_chat_id: '',
  broker_id: '', account_number: '', note: '',
};

/**
 * An IB proposes a client here; it reaches the CRM as a pending request that
 * an admin approves or rejects. Nothing is written into the CRM directly.
 */
const IntroduceClient = ({ l }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_REQUEST);
  const [busy, setBusy] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ['my-client-requests'],
    queryFn: () => myApi.clientRequests().then((r) => r.data.data ?? []),
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['affiliates-brokers'],
    queryFn: () => affiliateApi.brokers().then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-client-requests'] });

  const submitMut = useMutation({
    mutationFn: (data) => myApi.submitClientRequest(data),
    onSuccess: invalidate,
  });
  const withdrawMut = useMutation({
    mutationFn: (id) => myApi.withdrawClientRequest(id),
    onSuccess: invalidate,
  });

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(l('الاسم ورقم الهاتف مطلوبان.', 'Name and phone are required.'));
      return;
    }
    setBusy(true);
    try {
      await submitMut.mutateAsync({
        ...form,
        broker_id: form.broker_id === '' ? null : Number(form.broker_id),
        email: form.email.trim() || null,
        telegram_chat_id: form.telegram_chat_id.trim() || null,
        account_number: form.account_number.trim() || null,
        note: form.note.trim() || null,
      });
      toast.success(l('تم إرسال الطلب للمراجعة.', 'Request sent for review.'));
      setForm(EMPTY_REQUEST);
      setOpen(false);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      toast.error(first ?? err?.response?.data?.message ?? l('فشل الإرسال.', 'Submission failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-rule p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-rule pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
          {l('ترشيح عميل', 'Introduce a client')}
        </h2>
        <Button variant={open ? 'ghost' : 'outline'} size="xs" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? l('إلغاء', 'Cancel') : l('ترشيح', 'Introduce')}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mb-6 space-y-5 border border-rule bg-surface-sunken p-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={l('الاسم', 'Name')} required>
              {(props) => <Input {...props} value={form.name} onChange={field('name')} />}
            </Field>
            <Field label={l('رقم الهاتف', 'Phone')} required>
              {(props) => (
                <Input {...props} value={form.phone} onChange={field('phone')} dir="ltr" className="font-mono" />
              )}
            </Field>
            <Field label={l('البريد الإلكتروني', 'Email')} hint={l('اختياري.', 'Optional.')}>
              {(props) => (
                <Input {...props} type="email" value={form.email} onChange={field('email')} dir="ltr" />
              )}
            </Field>
            <Field label={l('معرّف تيليجرام', 'Telegram chat ID')} hint={l('اختياري.', 'Optional.')}>
              {(props) => (
                <Input {...props} value={form.telegram_chat_id} onChange={field('telegram_chat_id')}
                  dir="ltr" className="font-mono" />
              )}
            </Field>
            <Field label={l('الوسيط', 'Broker')}>
              {(props) => (
                <select {...props} value={form.broker_id} onChange={field('broker_id')} className={selectCls}>
                  <option value="">{l('غير محدد', 'Not specified')}</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={l('رقم الحساب', 'Account number')} hint={l('اختياري.', 'Optional.')}>
              {(props) => (
                <Input {...props} value={form.account_number} onChange={field('account_number')}
                  dir="ltr" className="font-mono" />
              )}
            </Field>
          </div>

          <Field label={l('ملاحظة', 'Note')} hint={l('اختياري.', 'Optional.')}>
            {(props) => <Textarea {...props} rows={3} value={form.note} onChange={field('note')} />}
          </Field>

          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={busy} className="flex-1">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {l('إرسال للمراجعة', 'Send for review')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              {l('إلغاء', 'Cancel')}
            </Button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">
          {l('لا توجد طلبات بعد.', 'No requests yet.')}
        </p>
      ) : (
        <ul className="border-t border-rule">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-rule py-3">
              <Users size={14} className="shrink-0 text-fg-faint" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{r.name}</p>
                <p className="ledger-num text-xs text-fg-faint" dir="ltr">{r.phone}</p>
                {r.status === 'rejected' && r.review_note && (
                  <p className="mt-0.5 text-xs text-chart-down">{r.review_note}</p>
                )}
              </div>
              <StatusBadge status={r.status === 'pending' ? 'under_review' : r.status} />
              {r.status === 'pending' && (
                <button
                  onClick={() => withdrawMut.mutate(r.id)}
                  className="shrink-0 rounded-sm p-1.5 text-fg-faint transition-colors duration-120 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={l(`سحب طلب ${r.name}`, `Withdraw request for ${r.name}`)}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function NetworkPage() {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const { data, isLoading } = useQuery({
    queryKey: ['my-network'],
    queryFn: () => myApi.network().then((r) => r.data),
    enabled: !!currentUser?.affiliate_code,
  });

  if (!currentUser?.affiliate_code) {
    return (
      <EmptyState
        icon={Network}
        title={l('لست وسيطاً مسجلاً', 'You are not a registered IB')}
        description={l(
          'هذه الصفحة مخصصة للوسطاء المعتمدين. تواصل مع الفريق إن كنت تعتقد أن هذا خطأ.',
          'This page is for registered introducing brokers. Talk to the team if you think that is wrong.',
        )}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={l('شبكتي', 'My network')}
        description={
          data?.broker
            ? `${l('الوسيط:', 'Broker:')} ${data.broker}`
            : l('عملاؤك المباشرون والوسطاء تحتك.', 'Your direct clients and the IBs beneath you.')
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-primary" aria-label={l('جارٍ التحميل', 'Loading')} />
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          <IntroduceClient l={l} />

          {/* Direct clients */}
          <section className="border border-rule p-5">
            <h2 className="mb-4 flex items-baseline gap-2 border-b border-rule pb-3 text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {l('العملاء المباشرون', 'Direct clients')}
              <span className="ledger-num text-xs font-normal text-fg-faint" dir="ltr">
                {data?.clients?.length ?? 0}
              </span>
            </h2>

            {!data?.clients?.length ? (
              <p className="py-4 text-center text-sm text-fg-muted">
                {l('لا يوجد عملاء بعد.', 'No clients yet.')}
              </p>
            ) : (
              <ul>
                {data.clients.map((c) => (
                  <li
                    key={c.user_id}
                    className="flex items-center gap-3 border-b border-rule py-2.5 text-sm last:border-0"
                  >
                    <Users size={14} className="shrink-0 text-fg-faint" aria-hidden="true" />
                    <span className="flex-1 truncate text-foreground">{c.name}</span>
                    {c.email && (
                      <span className="hidden text-xs text-fg-faint sm:inline" dir="ltr">{c.email}</span>
                    )}
                    {c.stage && (
                      <span className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-xs text-fg-muted">
                        {c.stage}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Sub-IBs, only when present */}
          {(data?.sub_ibs?.length ?? 0) > 0 && (
            <section className="border border-rule p-5">
              <h2 className="mb-3 flex items-baseline gap-2 border-b border-rule pb-3 text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {l('الوسطاء الفرعيون', 'Sub-IBs')}
                <span className="ledger-num text-xs font-normal text-fg-faint" dir="ltr">
                  {data.sub_ibs.length}
                </span>
              </h2>

              <div className="-mx-2">
                {data.sub_ibs.map((node) => (
                  <SubIbNode key={node.id} node={node} l={l} depth={0} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
