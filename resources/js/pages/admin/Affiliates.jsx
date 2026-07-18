import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { affiliateApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Network, ChevronRight, ChevronDown, Plus, Edit2, Trash2,
  Loader2, Search, Users, Building2, Shield,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ── Tree node ─────────────────────────────────────────────────────────────────

const IbNode = ({ node, depth = 0, l, hasPermission, onEdit, onDemote }) => {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.sub_ibs?.length ?? 0) > 0 || (node.clients?.length ?? 0) > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <button
          className="text-slate-500 w-4 flex-shrink-0"
          onClick={() => setOpen(o => !o)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
            : <span className="inline-block w-4" />}
        </button>

        <Network size={15} className="text-violet-400 flex-shrink-0" />

        <span className="font-medium text-sm text-white flex-1">{node.name}</span>

        <span className="text-xs text-slate-500 hidden md:inline">
          {node.broker_name ?? '—'}
        </span>

        <span className="text-xs text-slate-400 bg-white/5 rounded px-1.5 py-0.5 hidden sm:inline">
          {l('عملاء', 'clients')}: {node.clients_count ?? 0}
        </span>
        <span className="text-xs text-slate-400 bg-white/5 rounded px-1.5 py-0.5 hidden sm:inline">
          {l('وسطاء', 'IBs')}: {node.sub_ibs_count ?? 0}
        </span>

        {hasPermission('manage affiliates') && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <button
              onClick={() => onEdit(node)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDemote(node)}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-400/10"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {open && hasChildren && (
        <div>
          {node.sub_ibs?.map(child => (
            <IbNode
              key={child.id}
              node={child}
              depth={depth + 1}
              l={l}
              hasPermission={hasPermission}
              onEdit={onEdit}
              onDemote={onDemote}
            />
          ))}
          {node.clients?.map(c => (
            <div
              key={c.user_id}
              className="flex items-center gap-2 text-xs text-slate-400 rounded py-1 px-2"
              style={{ paddingLeft: `${32 + depth * 20}px` }}
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

// ── Promote / edit dialog ─────────────────────────────────────────────────────

const EMPTY_FORM = { phone: '', broker_id: '', parent_ib_id: '' };

const IbDialog = ({ open, onClose, editTarget, brokers, ibOptions, l, onSuccess }) => {
  const qc = useQueryClient();
  const isEdit = !!editTarget;

  const [form, setForm] = useState(
    editTarget
      ? { broker_id: editTarget.broker_id ?? '', parent_ib_id: editTarget.parent_id ?? '' }
      : EMPTY_FORM
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const promoteMut = useMutation({
    mutationFn: (data) => affiliateApi.promote(data),
    onSuccess: () => {
      toast.success(l('تمت ترقية المستخدم إلى وسيط', 'User promoted to IB'));
      qc.invalidateQueries({ queryKey: ['affiliates-tree'] });
      qc.invalidateQueries({ queryKey: ['affiliates'] });
      onSuccess();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? l('فشلت العملية', 'Operation failed')),
  });

  const updateMut = useMutation({
    mutationFn: (data) => affiliateApi.update(editTarget.id, data),
    onSuccess: () => {
      toast.success(l('تم تحديث الوسيط', 'IB updated'));
      qc.invalidateQueries({ queryKey: ['affiliates-tree'] });
      qc.invalidateQueries({ queryKey: ['affiliates'] });
      onSuccess();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? l('فشلت العملية', 'Operation failed')),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      broker_id:    parseInt(form.broker_id),
      parent_ib_id: form.parent_ib_id === '' ? null : parseInt(form.parent_ib_id),
    };
    if (isEdit) {
      updateMut.mutate(payload);
    } else {
      promoteMut.mutate({ ...payload, phone: form.phone.trim() });
    }
  };

  const busy = promoteMut.isPending || updateMut.isPending;

  // Filter ibOptions to exclude the user being edited (can't be its own parent)
  const parentOptions = isEdit
    ? ibOptions.filter(o => o.id !== editTarget.id)
    : ibOptions;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield size={16} className="text-violet-400" />
            {isEdit ? l('تعديل الوسيط', 'Edit IB') : l('ترقية مستخدم إلى وسيط', 'Promote User to IB')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isEdit && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">{l('رقم الهاتف', 'Phone Number')}</label>
              <input
                type="tel"
                placeholder={l('أدخل رقم هاتف المستخدم', 'Enter user phone number')}
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                {l('يجب أن يكون المستخدم مسجلاً بهذا الرقم', 'The user must be registered with this number')}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">{l('الوسيط', 'Broker')}</label>
            <select
              value={form.broker_id}
              onChange={e => set('broker_id', e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="" disabled>{l('اختر الوسيط', 'Select broker')}</option>
              {brokers.map(b => (
                <option key={b.id} value={b.id} className="bg-[#1a1f2e]">{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{l('الوسيط الرئيسي', 'Parent IB')}</label>
            <select
              value={form.parent_ib_id}
              onChange={e => set('parent_ib_id', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              {parentOptions.map(o => (
                <option key={String(o.id)} value={o.id ?? ''} className="bg-[#1a1f2e]">
                  {o.name}{o.broker_name ? ` (${o.broker_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
              {l('إلغاء', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {busy && <Loader2 size={14} className="animate-spin mr-1" />}
              {isEdit ? l('حفظ', 'Save') : l('ترقية', 'Promote')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Affiliates() {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const qc = useQueryClient();

  const [filterBroker, setFilterBroker] = useState('');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [demoteTarget, setDemoteTarget] = useState(null);

  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['affiliates-tree'],
    queryFn: () => affiliateApi.tree().then(r => r.data.data),
  });

  const { data: brokersData = [] } = useQuery({
    queryKey: ['affiliates-brokers'],
    queryFn: () => affiliateApi.brokers().then(r => r.data),
  });

  const { data: ibOptions = [] } = useQuery({
    queryKey: ['affiliates-options'],
    queryFn: () => affiliateApi.options().then(r => r.data),
    enabled: dialogOpen,
  });

  const demoteMut = useMutation({
    mutationFn: (id) => affiliateApi.demote(id),
    onSuccess: () => {
      toast.success(l('تم إلغاء ترقية الوسيط', 'IB demoted'));
      setDemoteTarget(null);
      qc.invalidateQueries({ queryKey: ['affiliates-tree'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? l('فشلت العملية', 'Failed')),
  });

  const roots = (treeData ?? []).filter(
    n => !filterBroker || String(n.broker_id) === filterBroker
  );

  const openPromote = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit    = (node) => { setEditTarget(node); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditTarget(null); };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0f1117]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Network size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{l('الوسطاء الفرعيون', 'Sub-IBs')}</h1>
            <p className="text-xs text-slate-500">{l('شجرة الوسطاء متعددة المستويات', 'Multi-level IB network')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {brokersData.length > 0 && (
            <select
              value={filterBroker}
              onChange={e => setFilterBroker(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="">{l('كل الوسطاء', 'All brokers')}</option>
              {brokersData.map(b => (
                <option key={b.id} value={b.id} className="bg-[#1a1f2e]">{b.name}</option>
              ))}
            </select>
          )}

          {hasPermission('manage affiliates') && (
            <Button
              onClick={openPromote}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm"
            >
              <Plus size={14} className="mr-1" />
              {l('ترقية وسيط', 'Promote IB')}
            </Button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        {treeLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-violet-400" />
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Network size={32} className="mx-auto mb-3 opacity-40" />
            <p>{l('لا يوجد وسطاء بعد', 'No IBs yet')}</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Company root label */}
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <Building2 size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {l('الشركة (الوسيط الرئيسي)', 'Company (Head IB)')}
              </span>
            </div>
            {roots.map(node => (
              <IbNode
                key={node.id}
                node={node}
                depth={0}
                l={l}
                hasPermission={hasPermission}
                onEdit={openEdit}
                onDemote={setDemoteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Promote / edit dialog */}
      {dialogOpen && (
        <IbDialog
          open={dialogOpen}
          onClose={closeDialog}
          editTarget={editTarget}
          brokers={brokersData}
          ibOptions={ibOptions}
          l={l}
          onSuccess={closeDialog}
        />
      )}

      {/* Demote confirm */}
      <Dialog open={!!demoteTarget} onOpenChange={v => !v && setDemoteTarget(null)}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              {l('إلغاء ترقية الوسيط', 'Demote IB')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300 py-2">
            {l(
              `سيتم إلغاء ترقية "${demoteTarget?.name}" وسيتم نقل عملاؤه ووسطاؤه الفرعيون إلى الوسيط الأصلي.`,
              `"${demoteTarget?.name}" will be demoted and their downline reparented to the grandparent IB.`
            )}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDemoteTarget(null)} className="text-slate-400">
              {l('إلغاء', 'Cancel')}
            </Button>
            <Button
              onClick={() => demoteMut.mutate(demoteTarget.id)}
              disabled={demoteMut.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {demoteMut.isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              {l('تأكيد الإلغاء', 'Confirm Demote')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
