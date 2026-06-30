import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, X, Clock, AlertTriangle,
  CheckCircle,
  BarChart3, ArrowUp, Trash2,
} from 'lucide-react';

// ─── Ticket statuses & priorities ─────────────────────────────────────────────
const TICKET_STATUSES = [
  { key: 'open',        label_en: 'Open',        label_ar: 'مفتوح',         color: 'text-blue-400',    bg: 'bg-blue-400/15 border-blue-400/30' },
  { key: 'in_progress', label_en: 'In Progress',  label_ar: 'قيد المعالجة', color: 'text-amber-400',   bg: 'bg-amber-400/15 border-amber-400/30' },
  { key: 'resolved',    label_en: 'Resolved',     label_ar: 'محلول',         color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
  { key: 'escalated',   label_en: 'Escalated',    label_ar: 'مصعَّد',        color: 'text-red-400',     bg: 'bg-red-400/15 border-red-400/30' },
  { key: 'closed',      label_en: 'Closed',       label_ar: 'مغلق',          color: 'text-slate-400',   bg: 'bg-slate-400/15 border-slate-400/30' },
];

const PRIORITIES = [
  { key: 'low',    label_en: 'Low',    label_ar: 'منخفض', color: 'text-slate-400',  bg: 'bg-slate-400/15 border-slate-400/30' },
  { key: 'medium', label_en: 'Medium', label_ar: 'متوسط', color: 'text-amber-400',  bg: 'bg-amber-400/15 border-amber-400/30' },
  { key: 'high',   label_en: 'High',   label_ar: 'عالٍ',  color: 'text-orange-400', bg: 'bg-orange-400/15 border-orange-400/30' },
  { key: 'urgent', label_en: 'Urgent', label_ar: 'عاجل',  color: 'text-red-400',    bg: 'bg-red-400/15 border-red-400/30' },
];

const STATUS_MAP   = Object.fromEntries(TICKET_STATUSES.map(s => [s.key, s]));
const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map(p => [p.key, p]));

const CATEGORIES = ['Payment Issue', 'Course Access', 'Technical Issue', 'Account Problem', 'Refund Request', 'General Inquiry', 'Other'];
const USER_TYPES  = ['client', 'lead'];

// ─── Mock tickets ─────────────────────────────────────────────────────────────

// ─── KPI calculations ─────────────────────────────────────────────────────────
function calcKPIs(tickets) {
  const resolved    = tickets.filter(t => ['resolved', 'closed'].includes(t.status));
  const resolutionRate = tickets.length ? Math.round((resolved.length / tickets.length) * 100) : 0;

  const responseTimes = tickets
    .filter(t => t.first_response)
    .map(t => (new Date(t.first_response) - new Date(t.opened)) / 3600000);
  const avgResponse = responseTimes.length
    ? Math.round((responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length) * 10) / 10 : 0;

  const escalations = tickets.filter(t => t.escalated).length;

  return { resolutionRate, avgResponse, escalations };
}

function tierFor(kpiSlug, value) {
  const cfg = {
    resolution_rate: { c: 95, b: 85, a: 70 },
    response_time:   { c: 1,  b: 4,  a: 6,  lower: true },
    escalations:     { c: 1,  b: 2,  a: 4,  lower: true },
    csat:            { c: 4.5,b: 4.0,a: 3.0 },
  }[kpiSlug];
  if (!cfg || value == null) return null;
  if (cfg.lower) {
    if (value <= cfg.c) return 'C';
    if (value <= cfg.b) return 'B';
    if (value <= cfg.a) return 'A';
    return 'F';
  }
  if (value >= cfg.c) return 'C';
  if (value >= cfg.b) return 'B';
  if (value >= cfg.a) return 'A';
  return 'F';
}

const TIER_CFG = {
  C: { color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-400/15 border-blue-400/30' },
  A: { color: 'text-amber-400',   bg: 'bg-amber-400/15 border-amber-400/30' },
  F: { color: 'text-red-400',     bg: 'bg-red-400/15 border-red-400/30' },
};

const TierBadge = ({ tier }) => {
  if (!tier) return null;
  const t = TIER_CFG[tier];
  return <span className={`inline-flex font-bold text-xs px-1.5 py-0.5 rounded border ${t.bg} ${t.color}`}>{tier}</span>;
};

// ─── Ticket detail drawer ─────────────────────────────────────────────────────
const TicketDrawer = ({ ticket, language, onClose, onUpdate }) => {
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [status, setStatus] = useState(ticket.status);
  const [notes,  setNotes]  = useState(ticket.notes || '');

  const sc = STATUS_MAP[ticket.status]    || STATUS_MAP.open;
  const pc = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.low;

  const responseHrs = ticket.first_response
    ? Math.round(((new Date(ticket.first_response) - new Date(ticket.opened)) / 3600000) * 10) / 10
    : null;

  const handleSave = () => {
    onUpdate({ ...ticket, status, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-card border-s border-primary/15 shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{ticket.id}</p>
            <p className="font-bold mt-0.5">{ticket.subject}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 transition"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label_en: 'Opened by',    label_ar: 'بواسطة',       value: `${ticket.user} (${ticket.user_type})` },
              { label_en: 'Category',     label_ar: 'التصنيف',      value: ticket.category },
              { label_en: 'Assigned to',  label_ar: 'المسؤول',      value: ticket.agent },
              { label_en: 'Opened at',    label_ar: 'وقت الفتح',    value: new Date(ticket.opened).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
            ].map((m, i) => (
              <div key={i} className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l(m.label_ar, m.label_en)}</p>
                <p className="text-xs font-semibold mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Priority + Escalation */}
          <div className="flex gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${pc.bg} ${pc.color}`}>
              {l(pc.label_ar, pc.label_en)}
            </span>
            {ticket.escalated && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-md border bg-red-400/10 border-red-400/30 text-red-400 flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />{l('مصعَّد', 'Escalated')}
              </span>
            )}
            {responseHrs != null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />{l('أول رد:', 'First response:')} {responseHrs}h
              </span>
            )}
          </div>

          {/* Status change */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{l('الحالة', 'Status')}</p>
            <div className="flex flex-wrap gap-1.5">
              {TICKET_STATUSES.map(s => (
                <button key={s.key} onClick={() => setStatus(s.key)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                    status === s.key ? `${s.bg} ${s.color}` : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                  }`}>
                  {l(s.label_ar, s.label_en)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{l('ملاحظات داخلية', 'Internal Notes')}</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder={l('أضف ملاحظة...', 'Add a note...')}
              className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>

        <div className="p-5 border-t border-primary/10">
          <button onClick={handleSave}
            className="w-full py-2.5 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
            {l('حفظ التغييرات', 'Save Changes')}
          </button>
        </div>
      </motion.aside>
    </div>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const SupportTickets = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { tickets, updateTicket, deleteTicket } = useAppData();

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selected, setSelected]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const kpis = calcKPIs(tickets);

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all'   && t.status !== filterStatus)     return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleUpdate = (updated) => {
    updateTicket(updated);
  };

  const kpiCards = [
    {
      slug: 'resolution_rate',
      label_en: 'Resolution Rate',   label_ar: 'معدل الحل',
      value: `${kpis.resolutionRate}%`,
      raw: kpis.resolutionRate,
      icon: CheckCircle,
      hint_en: '≥95% = Tier C (best)',  hint_ar: '≥95% = شريحة C (أفضل)',
      color: 'text-emerald-400',
    },
    {
      slug: 'response_time',
      label_en: 'Avg Response Time',  label_ar: 'متوسط وقت الرد',
      value: `${kpis.avgResponse}h`,
      raw: kpis.avgResponse,
      icon: Clock,
      hint_en: '<1h = Tier C (best)',   hint_ar: '<1 ساعة = شريحة C (أفضل)',
      color: 'text-blue-400',
    },
    {
      slug: 'escalations',
      label_en: 'Escalations',         label_ar: 'التصعيدات',
      value: kpis.escalations,
      raw: kpis.escalations,
      icon: AlertTriangle,
      hint_en: '≤1 = Tier C (best)',   hint_ar: '≤1 = شريحة C (أفضل)',
      color: kpis.escalations > 3 ? 'text-red-400' : 'text-amber-400',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{l('تذاكر الدعم', 'Support Tickets')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {l('تتبع المشكلات وقياس أداء فريق دعم العملاء', 'Track issues and measure customer support team performance')}
          </p>
        </div>
      </div>

      {/* KPI cards — feed directly to CS department KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((k, i) => {
          const tier = tierFor(k.slug, k.raw);
          const tc   = tier ? TIER_CFG[tier] : null;
          return (
            <motion.div key={k.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-primary/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-primary/8 ${k.color}`}><k.icon className="h-4 w-4" /></div>
                {tc && <TierBadge tier={tier} />}
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{l(k.label_ar, k.label_en)}</p>
              <p className={`text-[10px] mt-1.5 ${tc ? tc.color : 'text-muted-foreground/60'}`}>
                {l(k.hint_ar, k.hint_en)}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* CS KPI note */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
        <BarChart3 className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          {l(
            'هذه المؤشرات تُغذي مباشرةً شرائح الأداء لقسم دعم العملاء في لوحة الأداء.',
            'These metrics directly feed the Customer Support department\'s KPI tiers in the Performance tab.'
          )}
        </p>
      </div>

      {/* Search + filters */}
      <div className="bg-card border border-primary/10 rounded-2xl p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={l('ابحث برقم التذكرة أو الاسم أو الموضوع...', 'Search by ticket ID, name, subject...')}
            className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...TICKET_STATUSES.map(s => s.key)].map(key => {
            const sc = key === 'all' ? null : STATUS_MAP[key];
            return (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                  filterStatus === key ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                }`}>
                {key === 'all' ? l('الكل', 'All') : l(sc.label_ar, sc.label_en)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...PRIORITIES.map(p => p.key)].map(key => {
            const pc = key === 'all' ? null : PRIORITY_MAP[key];
            return (
              <button key={key} onClick={() => setFilterPriority(key)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                  filterPriority === key ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                }`}>
                {key === 'all' ? l('كل الأولويات', 'All priorities') : l(pc.label_ar, pc.label_en)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-primary/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/8 text-xs text-muted-foreground bg-primary/3">
                <th className="text-start px-4 py-3 font-medium">#</th>
                <th className="text-start px-4 py-3 font-medium">{l('الموضوع', 'Subject')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('المستخدم', 'User')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الأولوية', 'Priority')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الحالة', 'Status')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('وقت الرد', 'Response')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground text-sm">{l('لا توجد تذاكر', 'No tickets found')}</td></tr>
              ) : filtered.map((ticket, i) => {
                const sc = STATUS_MAP[ticket.status]    || STATUS_MAP.open;
                const pc = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.low;
                const responseHrs = ticket.first_response
                  ? Math.round(((new Date(ticket.first_response) - new Date(ticket.opened)) / 3600000) * 10) / 10
                  : null;
                return (
                  <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-primary/6 hover:bg-primary/3 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                      {ticket.escalated && <ArrowUp className="h-3 w-3 text-red-400 inline ms-1" />}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{ticket.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{ticket.user}</p>
                      <p className="text-xs text-muted-foreground capitalize">{ticket.user_type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${pc.bg} ${pc.color}`}>
                        {l(pc.label_ar, pc.label_en)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${sc.bg} ${sc.color}`}>
                        {l(sc.label_ar, sc.label_en)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {responseHrs != null
                        ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{responseHrs}h</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(ticket)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 hover:bg-primary/10 transition">
                          {l('فتح', 'Open')}
                        </button>
                        <button onClick={() => setDeleteTarget(ticket)}
                          className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-primary/8 text-xs text-muted-foreground bg-primary/2">
          {filtered.length} {l('تذكرة', 'ticket(s)')} · {tickets.filter(t => t.status === 'open').length} {l('مفتوحة', 'open')} · {tickets.filter(t => t.escalated).length} {l('مصعَّدة', 'escalated')}
        </div>
      </div>

      {/* Ticket drawer */}
      <AnimatePresence>
        {selected && (
          <TicketDrawer
            ticket={selected}
            language={language}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-red-500/20 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <p className="font-semibold text-lg mb-1">{l('حذف التذكرة', 'Delete Ticket')}</p>
              <p className="text-sm text-muted-foreground mb-5">
                {l(`هل أنت متأكد من حذف التذكرة ${deleteTarget.id}؟`, `Delete ticket ${deleteTarget.id}? This cannot be undone.`)}
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm rounded-xl border border-primary/20 hover:bg-primary/5 transition">
                  {l('إلغاء', 'Cancel')}
                </button>
                <button
                  onClick={() => {
                    deleteTicket(deleteTarget.db_id ?? deleteTarget.id);
                    toast.success(l('تم حذف التذكرة', 'Ticket deleted'));
                    setDeleteTarget(null);
                    if (selected?.id === deleteTarget.id) setSelected(null);
                  }}
                  className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-semibold">
                  {l('حذف', 'Delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTickets;
