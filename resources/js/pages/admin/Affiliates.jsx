import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { affiliateApi } from '@/lib/api';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import {
  Network, ChevronRight, ChevronDown, Plus, Edit2, Trash2,
  Loader2, Search, Users, Building2, Shield, UsersRound, Layers,
  ChevronsDownUp, ChevronsUpDown, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ── Helpers ─────────────────────────────────────────────────────────────────

// Colour-code IBs by their broker so the network structure reads at a glance.
const BROKER_COLORS = [
  'text-sky-400 bg-sky-500/10 border-sky-500/25',
  'text-violet-400 bg-violet-500/10 border-violet-500/25',
  'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  'text-amber-400 bg-amber-500/10 border-amber-500/25',
  'text-pink-400 bg-pink-500/10 border-pink-500/25',
  'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
];
const brokerColor = (id) => BROKER_COLORS[Math.abs(Number(id) || 0) % BROKER_COLORS.length];

const initials = (name) =>
  (name ?? '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const collectIds = (nodes) => {
  const ids = [];
  const walk = (list) => (list ?? []).forEach(n => { ids.push(n.id); walk(n.sub_ibs); });
  walk(nodes);
  return ids;
};

// Highlight the matched substring inside a search result.
const Highlight = ({ text, q }) => {
  const s = String(text ?? '');
  if (!q) return s;
  const i = s.toLowerCase().indexOf(q);
  if (i === -1) return s;
  return (
    <>
      {s.slice(0, i)}
      <mark className="bg-primary/30 text-foreground rounded px-0.5">{s.slice(i, i + q.length)}</mark>
      {s.slice(i + q.length)}
    </>
  );
};

// ── Tree node ─────────────────────────────────────────────────────────────────

const IbNode = ({ node, depth, l, query, hasPermission, onEdit, onDemote, isOpen, onToggle }) => {
  const open = isOpen(node.id);
  const hasChildren = (node.sub_ibs?.length ?? 0) > 0 || (node.clients?.length ?? 0) > 0;
  const brokerCls = brokerColor(node.broker_id);

  return (
    <div className="select-none">
      <div className="group flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-primary/5 transition-colors">
        {/* Expand / collapse */}
        <button
          type="button"
          aria-label={open ? l('طي', 'Collapse') : l('توسيع', 'Expand')}
          aria-expanded={hasChildren ? open : undefined}
          onClick={() => hasChildren && onToggle(node.id)}
          disabled={!hasChildren}
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-25 shrink-0"
        >
          {hasChildren
            ? (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />)
            : <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />}
        </button>

        {/* Avatar */}
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${brokerCls}`}>
          {initials(node.name)}
        </div>

        {/* Name + broker */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate"><Highlight text={node.name} q={query} /></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
              L{depth + 1}
            </span>
          </div>
          {node.broker_name && (
            <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full border ${brokerCls}`}>
              {node.broker_name}
            </span>
          )}
        </div>

        {/* Counts — always visible, incl. mobile */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span title={l('العملاء', 'Clients')} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 tabular-nums">
            <Users size={12} />{node.clients_count ?? 0}
          </span>
          <span title={l('الوسطاء الفرعيون', 'Sub-IBs')} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 tabular-nums">
            <Network size={12} />{node.sub_ibs_count ?? 0}
          </span>
        </div>

        {/* Actions */}
        {hasPermission('manage affiliates') && (
          <div className="flex gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              title={l('تعديل', 'Edit')}
              aria-label={l('تعديل الوسيط', 'Edit IB')}
              onClick={() => onEdit(node)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              title={l('إلغاء الترقية', 'Demote')}
              aria-label={l('إلغاء ترقية الوسيط', 'Demote IB')}
              onClick={() => onDemote(node)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Children — nested with an RTL-safe guide line */}
      {open && hasChildren && (
        <div className="ms-4 ps-3 border-s border-primary/15 space-y-0.5">
          {node.sub_ibs?.map(child => (
            <IbNode
              key={child.id}
              node={child}
              depth={depth + 1}
              l={l}
              query={query}
              hasPermission={hasPermission}
              onEdit={onEdit}
              onDemote={onDemote}
              isOpen={isOpen}
              onToggle={onToggle}
            />
          ))}
          {node.clients?.map(c => (
            <div key={c.user_id} className="flex items-center gap-2 py-1.5 px-2 text-xs">
              <span className="h-6 w-6 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <Users size={11} />
              </span>
              <span className="text-foreground/80 truncate flex-1"><Highlight text={c.name} q={query} /></span>
              {c.stage && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 border border-border text-muted-foreground capitalize shrink-0">
                  {String(c.stage).replace(/_/g, ' ')}
                </span>
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
const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20';

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            {isEdit ? l('تعديل الوسيط', 'Edit IB') : l('ترقية مستخدم إلى وسيط', 'Promote User to IB')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{l('رقم الهاتف', 'Phone Number')}</label>
              <input
                type="tel"
                placeholder={l('أدخل رقم هاتف المستخدم', 'Enter user phone number')}
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                required
                className={inputCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {l('يجب أن يكون المستخدم مسجلاً بهذا الرقم', 'The user must be registered with this number')}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{l('الوسيط', 'Broker')}</label>
            <select value={form.broker_id} onChange={e => set('broker_id', e.target.value)} required className={inputCls}>
              <option value="" disabled>{l('اختر الوسيط', 'Select broker')}</option>
              {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{l('الوسيط الرئيسي', 'Parent IB')}</label>
            <select value={form.parent_ib_id} onChange={e => set('parent_ib_id', e.target.value)} className={inputCls}>
              {parentOptions.map(o => (
                <option key={String(o.id)} value={o.id ?? ''}>
                  {o.name}{o.broker_name ? ` (${o.broker_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {l('إلغاء', 'Cancel')}
            </Button>
            <Button type="submit" disabled={busy} className="gap-1">
              {busy && <Loader2 size={14} className="animate-spin" />}
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
  const [search, setSearch]             = useState('');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [demoteTarget, setDemoteTarget] = useState(null);
  const [expandedIds, setExpandedIds]   = useState(() => new Set());
  const [seeded, setSeeded]             = useState(false);

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

  // Seed the tree with its root nodes expanded once data arrives.
  useEffect(() => {
    if (!seeded && treeData?.length) {
      setExpandedIds(new Set(treeData.map(n => n.id)));
      setSeeded(true);
    }
  }, [treeData, seeded]);

  // Network-wide KPIs, computed from the tree.
  const stats = useMemo(() => {
    let ibs = 0, subIbs = 0, clients = 0;
    const walk = (list, depth) => (list ?? []).forEach(n => {
      ibs++;
      if (depth > 0) subIbs++;
      clients += n.clients_count ?? (n.clients?.length ?? 0);
      walk(n.sub_ibs, depth + 1);
    });
    walk(treeData, 0);
    return { ibs, subIbs, clients, brokers: brokersData.length };
  }, [treeData, brokersData]);

  const q = search.trim().toLowerCase();

  // Broker filter + search filter. When searching, matching branches are
  // returned pre-opened so results are always visible.
  const { roots, searchOpen } = useMemo(() => {
    const base = (treeData ?? []).filter(n => !filterBroker || String(n.broker_id) === filterBroker);
    if (!q) return { roots: base, searchOpen: null };

    const open = new Set();
    const rec = (list) => {
      const out = [];
      for (const n of list ?? []) {
        const kids = rec(n.sub_ibs);
        const selfMatch = (n.name ?? '').toLowerCase().includes(q)
          || String(n.affiliate_code ?? '').toLowerCase().includes(q);
        const clientMatch = (n.clients ?? []).some(c => (c.name ?? '').toLowerCase().includes(q));
        if (selfMatch || clientMatch || kids.length) {
          out.push({ ...n, sub_ibs: kids });
          open.add(n.id);
        }
      }
      return out;
    };
    return { roots: rec(base), searchOpen: open };
  }, [treeData, filterBroker, q]);

  const isOpen = (id) => (q ? !!searchOpen?.has(id) : expandedIds.has(id));
  const toggle = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const expandAll   = () => setExpandedIds(new Set(collectIds(treeData)));
  const collapseAll = () => setExpandedIds(new Set());

  const openPromote = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit    = (node) => { setEditTarget(node); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditTarget(null); };

  return (
    <div className="space-y-6">

      {/* ───────── Hero header ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-xl p-6 md:p-7"
      >
        <div className="absolute -top-16 -right-12 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.07] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl gradient-gold text-primary-foreground flex items-center justify-center shadow-neon shrink-0">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold"><span className="gradient-text">{l('الوسطاء الفرعيون', 'Sub-IBs')}</span></h1>
              <p className="text-sm text-muted-foreground mt-0.5">{l('شجرة الوسطاء متعددة المستويات', 'Multi-level IB network')}</p>
            </div>
          </div>

          {hasPermission('manage affiliates') && (
            <Button onClick={openPromote} className="gap-1.5 self-start sm:self-auto">
              <Plus size={15} />
              {l('ترقية وسيط', 'Promote IB')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* ───────── KPI row ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={l('إجمالي الوسطاء', 'Total IBs')}        value={stats.ibs}     icon={<Network size={18} />}    change="" />
        <KPICard title={l('الوسطاء الفرعيون', 'Sub-IBs')}         value={stats.subIbs}  icon={<Layers size={18} />}     change="" />
        <KPICard title={l('العملاء في الشبكة', 'Clients in network')} value={stats.clients} icon={<UsersRound size={18} />} change="" />
        <KPICard title={l('الوسطاء الرئيسيون', 'Brokers')}        value={stats.brokers} icon={<Building2 size={18} />}   change="" />
      </div>

      {/* ───────── Toolbar ───────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={l('ابحث بالاسم أو الكود…', 'Search by name or code…')}
            className="w-full ps-9 pe-8 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              aria-label={l('مسح', 'Clear')}
              onClick={() => setSearch('')}
              className="absolute top-1/2 -translate-y-1/2 end-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {brokersData.length > 0 && (
          <select
            value={filterBroker}
            onChange={e => setFilterBroker(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{l('كل الوسطاء', 'All brokers')}</option>
            {brokersData.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={expandAll} disabled={!!q}>
            <ChevronsUpDown size={14} />
            <span className="hidden sm:inline">{l('توسيع الكل', 'Expand all')}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={collapseAll} disabled={!!q}>
            <ChevronsDownUp size={14} />
            <span className="hidden sm:inline">{l('طي الكل', 'Collapse all')}</span>
          </Button>
        </div>
      </div>

      {/* ───────── Tree ───────── */}
      <div className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-4">
        {treeLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Network size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{q ? l('لا نتائج مطابقة', 'No matches') : l('لا يوجد وسطاء بعد', 'No IBs yet')}</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Company root label */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="h-8 w-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Building2 size={15} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-400 leading-tight">{l('الشركة (الوسيط الرئيسي)', 'Company (Head IB)')}</p>
                <p className="text-[11px] text-muted-foreground">{l('أعلى مستوى في الشبكة', 'Top of the network')}</p>
              </div>
            </div>

            {roots.map(node => (
              <IbNode
                key={node.id}
                node={node}
                depth={0}
                l={l}
                query={q}
                hasPermission={hasPermission}
                onEdit={openEdit}
                onDemote={setDemoteTarget}
                isOpen={isOpen}
                onToggle={toggle}
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('إلغاء ترقية الوسيط', 'Demote IB')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {l(
              `سيتم إلغاء ترقية "${demoteTarget?.name}" وسيتم نقل عملائه ووسطائه الفرعيين إلى الوسيط الأصلي.`,
              `"${demoteTarget?.name}" will be demoted and their downline reparented to the grandparent IB.`
            )}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDemoteTarget(null)}>
              {l('إلغاء', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => demoteMut.mutate(demoteTarget.id)}
              disabled={demoteMut.isPending}
              className="gap-1"
            >
              {demoteMut.isPending && <Loader2 size={14} className="animate-spin" />}
              {l('تأكيد الإلغاء', 'Confirm Demote')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
