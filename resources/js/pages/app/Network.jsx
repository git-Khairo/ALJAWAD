import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { myApi, affiliateApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Network, Users, ChevronDown, ChevronRight, Loader2,
  Plus, Clock, Check, X, Trash2, Inbox,
} from 'lucide-react';

// ── Recursive IB sub-tree node ────────────────────────────────────────────────

const SubIbNode = ({ node, l, depth = 0 }) => {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.sub_ibs?.length ?? 0) > 0 || (node.clients?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group"
        style={{ paddingLeft: `${12 + depth * 18}px` }}
      >
        <button
          className="text-slate-500 w-4 flex-shrink-0"
          onClick={() => setOpen(o => !o)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)
            : <span className="w-4 inline-block" />}
        </button>
        <Network size={14} className="text-violet-400 flex-shrink-0" />
        <span className="text-sm text-white flex-1">{node.name}</span>
        <span className="text-xs text-slate-500">{node.broker_name}</span>
        <span className="text-xs text-slate-400 bg-white/5 rounded px-1.5 py-0.5">
          {l('عملاء', 'clients')}: {node.clients_count ?? 0}
        </span>
        <span className="text-xs text-slate-400 bg-white/5 rounded px-1.5 py-0.5">
          {l('وسطاء', 'IBs')}: {node.sub_ibs_count ?? 0}
        </span>
      </div>

      {open && hasChildren && (
        <div>
          {node.sub_ibs?.map(child => (
            <SubIbNode key={child.id} node={child} l={l} depth={depth + 1} />
          ))}
          {node.clients?.map(c => (
            <div
              key={c.user_id}
              className="flex items-center gap-2 text-xs text-slate-400 py-1 px-2 rounded"
              style={{ paddingLeft: `${30 + depth * 18}px` }}
            >
              <Users size={12} className="text-slate-500 flex-shrink-0" />
              <span>{c.name}</span>
              {c.stage && (
                <span className="bg-white/5 rounded px-1.5">{c.stage}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Client introduction form ──────────────────────────────────────────────────

const EMPTY_REQUEST = {
  name: '', phone: '', email: '', telegram_chat_id: '',
  broker_id: '', account_number: '', note: '',
};

const REQUEST_STATUS = {
  pending:  { ar: 'قيد المراجعة', en: 'Under review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   Icon: Clock },
  approved: { ar: 'مقبول',        en: 'Approved',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', Icon: Check },
  rejected: { ar: 'مرفوض',        en: 'Rejected',     cls: 'bg-red-500/10 text-red-400 border-red-500/25',         Icon: X },
};

/**
 * An IB proposes a client here; it reaches the CRM as a pending request that an
 * admin approves or rejects. Nothing is written into the CRM directly.
 */
const AddClientCard = ({ l }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_REQUEST);
  const [busy, setBusy] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ['my-client-requests'],
    queryFn: () => myApi.clientRequests().then(r => r.data.data ?? []),
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['affiliates-brokers'],
    queryFn: () => affiliateApi.brokers().then(r => r.data),
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

  const field = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(l('الاسم ورقم الهاتف مطلوبان', 'Name and phone are required'));
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
      toast.success(l('تم إرسال الطلب للمراجعة', 'Request sent for review'));
      setForm(EMPTY_REQUEST);
      setOpen(false);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      toast.error(first ?? err?.response?.data?.message ?? l('فشل الإرسال', 'Submission failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Inbox size={15} className="text-amber-400" />
          {l('طلبات إضافة عملاء', 'My Client Requests')}
          <span className="text-xs text-slate-500 font-normal">({requests.length})</span>
        </h2>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium hover:bg-sky-500/25 transition"
        >
          <Plus size={13} />
          {l('إضافة عميل', 'Add client')}
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        {l(
          'يُرسل العميل كطلب إلى الإدارة، ويُضاف إلى شبكتك بعد الموافقة.',
          'Clients are submitted for approval and join your network once accepted.'
        )}
      </p>

      {open && (
        <form onSubmit={submit} className="space-y-3 mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{l('الاسم', 'Name')} *</label>
              <input value={form.name} onChange={field('name')} required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{l('الهاتف', 'Phone')} *</label>
              <input value={form.phone} onChange={field('phone')} required inputMode="numeric" placeholder="09XXXXXXXX"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{l('البريد (اختياري)', 'Email (optional)')}</label>
              <input type="email" value={form.email} onChange={field('email')}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{l('معرّف تيليجرام (اختياري)', 'Telegram ID (optional)')}</label>
              <input value={form.telegram_chat_id} onChange={field('telegram_chat_id')}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{l('الوسيط (اختياري)', 'Broker (optional)')}</label>
              <select value={form.broker_id} onChange={field('broker_id')}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                <option value="">{l('غير محدّد', 'Not specified')}</option>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{l('رقم الحساب (اختياري)', 'Account number (optional)')}</label>
              <input value={form.account_number} onChange={field('account_number')}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{l('ملاحظة (اختياري)', 'Note (optional)')}</label>
            <textarea value={form.note} onChange={field('note')} rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setOpen(false); setForm(EMPTY_REQUEST); }}
              className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition">
              {l('إلغاء', 'Cancel')}
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 disabled:opacity-60 transition">
              {busy ? l('جارٍ...', 'Sending…') : l('إرسال الطلب', 'Submit request')}
            </button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">
          {l('لا توجد طلبات بعد', 'No requests yet')}
        </p>
      ) : (
        <div className="space-y-1">
          {requests.map(r => {
            const cfg = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pending;
            const StatusIcon = cfg.Icon;
            return (
              <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-sm">
                <Users size={14} className="text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{r.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{r.phone}</div>
                  {r.status === 'rejected' && r.review_note && (
                    <div className="text-xs text-red-400/80 mt-0.5">{r.review_note}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.cls}`}>
                  <StatusIcon size={11} />
                  {l(cfg.ar, cfg.en)}
                </span>
                {r.status === 'pending' && (
                  <button
                    onClick={() => withdrawMut.mutate(r.id)}
                    title={l('سحب الطلب', 'Withdraw')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const { data, isLoading } = useQuery({
    queryKey: ['my-network'],
    queryFn: () => myApi.network().then(r => r.data),
    enabled: !!currentUser?.affiliate_code,
  });

  if (!currentUser?.affiliate_code) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Network size={36} className="opacity-40" />
        <p>{l('لست وسيطاً مسجلاً', 'You are not a registered IB')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Network size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{l('شبكتي', 'My Network')}</h1>
          {data?.broker && (
            <p className="text-xs text-slate-500">
              {l('الوسيط:', 'Broker:')} {data.broker}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Introduce a client (goes to the CRM as a pending request) */}
          <AddClientCard l={l} />

          {/* Direct clients */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Users size={15} className="text-sky-400" />
              {l('العملاء المباشرون', 'Direct Clients')}
              <span className="text-xs text-slate-500 font-normal">({data?.clients?.length ?? 0})</span>
            </h2>

            {!data?.clients?.length ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                {l('لا يوجد عملاء بعد', 'No clients yet')}
              </p>
            ) : (
              <div className="space-y-1">
                {data.clients.map(c => (
                  <div key={c.user_id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-sm">
                    <Users size={14} className="text-slate-500 flex-shrink-0" />
                    <span className="text-white flex-1">{c.name}</span>
                    {c.email && <span className="text-xs text-slate-500 hidden sm:inline">{c.email}</span>}
                    {c.stage && (
                      <span className="text-xs bg-white/5 rounded px-1.5 py-0.5 text-slate-400">{c.stage}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-IBs (only shown when present) */}
          {(data?.sub_ibs?.length ?? 0) > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Network size={15} className="text-violet-400" />
                {l('الوسطاء الفرعيون', 'Sub-IBs')}
                <span className="text-xs text-slate-500 font-normal">({data.sub_ibs.length})</span>
              </h2>

              <div className="space-y-0.5">
                {data.sub_ibs.map(node => (
                  <SubIbNode key={node.id} node={node} l={l} depth={0} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
