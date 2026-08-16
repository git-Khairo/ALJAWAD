import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Inbox, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Review queue for clients introduced by sub-IBs. Approving provisions the
 * client under the IB that submitted them; rejecting records a reason that the
 * IB sees on their own network page.
 */

const STATUS_STYLES = {
  pending:  'bg-warn/10 text-warn border-warn/25',
  approved: 'bg-chart-up/10 text-chart-up border-chart-up/25',
  rejected: 'bg-chart-down/10 text-chart-down border-chart-down/25',
};

const STAGE_OPTIONS = [
  { value: 'client_inactive', ar: 'عميل (غير نشط)', en: 'Client (inactive)' },
  { value: 'lead',            ar: 'عميل محتمل',      en: 'Lead' },
  { value: 'client_active',   ar: 'عميل نشط',        en: 'Client (active)' },
];

export const ClientRequestsPanel = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { clientRequests, reviewClientRequest } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const canReview = hasPermission('review client requests');

  const [showHistory, setShowHistory] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveStage, setApproveStage] = useState('client_inactive');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy] = useState(false);

  const pending = useMemo(
    () => (clientRequests ?? []).filter((r) => r.status === 'pending'),
    [clientRequests]
  );
  const reviewed = useMemo(
    () => (clientRequests ?? []).filter((r) => r.status !== 'pending'),
    [clientRequests]
  );

  const rows = showHistory ? reviewed : pending;

  const openApprove = (r) => {
    setApproveTarget(r);
    setApproveStage('client_inactive');
  };

  const submitApprove = async () => {
    setBusy(true);
    try {
      await reviewClientRequest({ id: approveTarget.id, status: 'approved', stage: approveStage });
      toast.success(l('تمت الموافقة وإضافة العميل', 'Approved — client added'));
      setApproveTarget(null);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      toast.error(first ?? l('فشلت العملية', 'Failed'));
    } finally {
      setBusy(false);
    }
  };

  const submitReject = async () => {
    setBusy(true);
    try {
      await reviewClientRequest({
        id: rejectTarget.id,
        status: 'rejected',
        review_note: rejectNote.trim() || undefined,
      });
      toast.success(l('تم رفض الطلب', 'Request rejected'));
      setRejectTarget(null);
      setRejectNote('');
    } catch {
      toast.error(l('فشلت العملية', 'Failed'));
    } finally {
      setBusy(false);
    }
  };

  // Nothing to review and no history worth surfacing — stay out of the way.
  if (pending.length === 0 && reviewed.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/10 rounded overflow-hidden mb-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-primary/8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-warn/10 text-warn">
            <Inbox className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">
              {l('طلبات إضافة عملاء من الوسطاء', 'Client requests from IBs')}
              {pending.length > 0 && (
                <span className="ms-2 text-xs px-2 py-0.5 rounded-full bg-warn/15 text-warn border border-warn/25">
                  {pending.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l(
                'عملاء اقترحهم الوسطاء الفرعيون — بانتظار الموافقة',
                'Clients introduced by sub-IBs — awaiting your decision'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHistory(false)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
              !showHistory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
            }`}
          >
            {l('قيد الانتظار', 'Pending')} ({pending.length})
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
              showHistory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
            }`}
          >
            {l('تمت المراجعة', 'Reviewed')} ({reviewed.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary/3">
            <tr className="text-xs text-muted-foreground border-b border-primary/8">
              <th className="text-start p-3 font-medium">{l('الاسم', 'Name')}</th>
              <th className="text-start p-3 font-medium">{l('الهاتف', 'Phone')}</th>
              <th className="text-start p-3 font-medium">{l('الوسيط المقدِّم', 'Submitted by')}</th>
              <th className="text-start p-3 font-medium">{l('حساب التداول', 'Trading account')}</th>
              <th className="text-start p-3 font-medium">{l('التاريخ', 'Date')}</th>
              <th className="text-start p-3 font-medium">{l('الحالة', 'Status')}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                  {showHistory
                    ? l('لا توجد طلبات مراجَعة', 'No reviewed requests')
                    : l('لا توجد طلبات قيد الانتظار', 'No pending requests')}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-primary/8 hover:bg-primary/3">
                <td className="p-3">
                  <div className="font-medium">{r.name}</div>
                  {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                </td>
                <td className="p-3 font-mono text-xs">{r.phone || '—'}</td>
                <td className="p-3 text-xs">{r.requested_by || '—'}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {r.broker_name
                    ? `${r.broker_name}${r.account_number ? ` · ${r.account_number}` : ''}`
                    : '—'}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {(r.created_at || '').slice(0, 10)}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status]}`}>
                    {r.status === 'pending'
                      ? l('قيد الانتظار', 'Pending')
                      : r.status === 'approved'
                        ? l('مقبول', 'Approved')
                        : l('مرفوض', 'Rejected')}
                  </span>
                  {r.review_note && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={r.review_note}>
                      {r.review_note}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {r.status === 'pending' && canReview ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openApprove(r)}
                        title={l('قبول', 'Approve')}
                        className="p-1.5 rounded-lg border border-chart-up/25 text-chart-up hover:bg-chart-up/10 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setRejectTarget(r); setRejectNote(''); }}
                        title={l('رفض', 'Reject')}
                        className="p-1.5 rounded-lg border border-chart-down/25 text-chart-down hover:bg-chart-down/10 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">
                      {r.reviewed_by ? `— ${r.reviewed_by}` : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approve dialog — picks the lifecycle stage the client enters at */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              {l('قبول الطلب', 'Approve request')}
            </DialogTitle>
          </DialogHeader>
          {approveTarget && (
            <div className="space-y-4 mt-1">
              <div className="rounded border border-primary/15 bg-primary/5 p-3 text-sm">
                <div className="font-medium">{approveTarget.name}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{approveTarget.phone}</div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {l('سيُضاف تحت:', 'Will be added under:')}{' '}
                  <span className="text-foreground">{approveTarget.requested_by}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{l('المرحلة', 'Stage')}</label>
                <select
                  value={approveStage}
                  onChange={(e) => setApproveStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{l(s.ar, s.en)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setApproveTarget(null)}>
                  {l('إلغاء', 'Cancel')}
                </Button>
                <Button className="flex-1" disabled={busy} onClick={submitApprove}>
                  {busy ? l('جارٍ...', 'Approving…') : l('قبول', 'Approve')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('رفض الطلب', 'Reject request')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <p className="text-sm text-muted-foreground">
              {l(
                'سيظهر السبب للوسيط الذي قدّم الطلب.',
                'The reason is shown to the IB who submitted the request.'
              )}
            </p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {l('السبب (اختياري)', 'Reason (optional)')}
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
                placeholder={l('مثال: رقم الهاتف غير صحيح', 'e.g. phone number is incorrect')}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectTarget(null)}>
                {l('إلغاء', 'Cancel')}
              </Button>
              <Button variant="destructive" className="flex-1" disabled={busy} onClick={submitReject}>
                {busy ? l('جارٍ...', 'Rejecting…') : l('رفض', 'Reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ClientRequestsPanel;
