import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { fmtDate } from '@/lib/format';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  UserPlus, Search, Phone, Mail, X,
  Calendar, Trash2, ArrowRightLeft,
} from 'lucide-react';

// ─── Lead statuses ─────────────────────────────────────────────────────────────
const LEAD_STATUSES = [
  { key: 'new',           label_en: 'New',           label_ar: 'جديد',            color: 'text-fg-muted',   bg: 'bg-fg-muted/15 border-fg-muted/30',       dot: 'hsl(var(--fg-muted))' },
  { key: 'contacted',     label_en: 'Contacted',     label_ar: 'تم التواصل',      color: 'text-primary',    bg: 'bg-primary/15 border-primary/30',         dot: 'hsl(var(--primary))' },
  { key: 'interested',    label_en: 'Interested',    label_ar: 'مهتم',            color: 'text-warn',       bg: 'bg-warn/15 border-warn/30',               dot: 'hsl(var(--warn))' },
  { key: 'qualified',     label_en: 'Qualified',     label_ar: 'مؤهل',            color: 'text-foreground', bg: 'bg-primary/30 border-primary/50',         dot: 'hsl(var(--brand-hover))' },
  { key: 'not_interested',label_en: 'Not Interested',label_ar: 'غير مهتم',        color: 'text-chart-down', bg: 'bg-chart-down/15 border-chart-down/30',   dot: 'hsl(var(--chart-down))' },
  { key: 'converted',     label_en: 'Converted',     label_ar: 'تم التحويل',      color: 'text-chart-up',   bg: 'bg-chart-up/15 border-chart-up/30',       dot: 'hsl(var(--chart-up))' },
];

const STATUS_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.key, s]));

const SOURCES = ['Website', 'Social Media', 'Referral', 'WhatsApp', 'Phone Call', 'Event', 'Other'];


const EMPTY_LEAD = { name: '', email: '', phone: '', telegram_chat_id: '', source: 'Website', status: 'new', notes: '' };

// ─── Add / Edit modal ─────────────────────────────────────────────────────────
const LeadModal = ({ lead, language, onClose, onSave }) => {
  const l  = (ar, en) => language === 'ar' ? ar : en;
  const isEdit = !!lead?.id;
  const [form, setForm] = useState(lead || { ...EMPTY_LEAD });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    onSave({ ...form, id: lead?.id || Date.now(), added: lead?.added || new Date().toISOString().slice(0, 10) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-primary/15 rounded shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <h2 className="font-bold text-lg">{isEdit ? l('تعديل العميل المحتمل', 'Edit Lead') : l('إضافة عميل محتمل', 'Add Lead')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 transition"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('الاسم الكامل', 'Full Name')} <span className="text-chart-down">*</span>
              </label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder={l('الاسم', 'Full name')}
                className="w-full h-9 px-3 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('رقم الهاتف', 'Phone')} <span className="text-chart-down">*</span>
              </label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="w-full h-9 px-3 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('البريد الإلكتروني', 'Email')}
              </label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full h-9 px-3 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('معرّف تليغرام', 'Telegram ID')}
              </label>
              <input value={form.telegram_chat_id ?? ''} onChange={e => set('telegram_chat_id', e.target.value)}
                inputMode="numeric" placeholder="123456789"
                className="w-full h-9 px-3 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('المصدر', 'Source')}
              </label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full h-9 px-3 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('الحالة', 'Status')}
              </label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full h-9 px-3 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {LEAD_STATUSES.map(s => (
                  <option key={s.key} value={s.key}>{l(s.label_ar, s.label_en)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('الملاحظات', 'Notes')}
              </label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                placeholder={l('أضف ملاحظة...', 'Add a note...')}
                className="w-full px-3 py-2 rounded border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded border border-primary/20 text-sm hover:bg-primary/5 transition">
              {l('إلغاء', 'Cancel')}
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
              {isEdit ? l('حفظ التعديلات', 'Save Changes') : l('إضافة', 'Add Lead')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Pipeline column ──────────────────────────────────────────────────────────
const PipelineBar = ({ leads, language }) => {
  const l = (ar, en) => language === 'ar' ? ar : en;
  const leadsTotal = leads.length || 1;
  return (
    <div className="bg-card border border-primary/10 rounded p-5 mb-6">
      <h3 className="font-semibold text-sm mb-4">{l('خط سير العملاء المحتملين', 'Lead Pipeline')}</h3>
      <div className="space-y-2">
        {LEAD_STATUSES.map(s => {
          const count = leads.filter(l => l.status === s.key).length;
          const pct   = Math.round((count / leadsTotal) * 100);
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className={`text-xs font-medium w-28 text-end shrink-0 ${s.color}`}>{l(s.label_ar, s.label_en)}</span>
              <div className="flex-1 h-6 bg-primary/5 rounded-lg overflow-hidden">
                <motion.div className="h-full rounded-lg flex items-center px-2"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ background: s.dot }}>
                  {count > 0 && <span className="text-[11px] font-bold">{count}</span>}
                </motion.div>
              </div>
              <span className="text-xs text-muted-foreground w-8 text-end shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const Leads = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { leads, addLead, updateLead, deleteLead, convertLead } = useAppData();

  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editLead, setEditLead]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);

  const filtered = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return lead.name.toLowerCase().includes(q) || (lead.email || '').toLowerCase().includes(q) || (lead.phone || '').includes(q);
    }
    return true;
  });
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(filtered, 15, search + filterStatus);

  const handleSave = (lead) => {
    if (leads.find(ex => ex.id === lead.id)) {
      updateLead(lead);
    } else {
      addLead(lead);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const lead = leads.find(l => l.id === id);
    if (lead) updateLead({ ...lead, status: newStatus });
  };

  const openAdd  = () => { setEditLead(null); setModalOpen(true); };
  const openEdit = (lead) => { setEditLead(lead); setModalOpen(true); };

  return (
    <div>
      <PageHeader
        title={l('العملاء المحتملون', 'Leads')}
        description={l(
          'إدارة العملاء المحتملين ومتابعة مرحلة كل منهم.',
          'Manage leads and track where each one sits in the pipeline.',
        )}
        actions={hasPermission('create leads') && (
          <Button variant="accent" size="sm" onClick={openAdd}>
            <UserPlus className="h-4 w-4" />
            {l('إضافة عميل محتمل', 'Add lead')}
          </Button>
        )}
      />

      {/* Pipeline visual */}
      <PipelineBar leads={leads} language={language} />

      {/* Search + filter */}
      <div className="mb-5 flex flex-wrap gap-3 border border-rule p-4">
        <div className="relative min-w-[200px] flex-1">
          {/* `start-3`, not a language ternary. */}
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={l('ابحث باسم أو هاتف أو بريد…', 'Search by name, phone or email…')}
            className="h-9 ps-9"
            aria-label={l('بحث', 'Search')}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label={l('تصفية بالحالة', 'Filter by status')}>
          {['all', ...LEAD_STATUSES.map((s) => s.key)].map((key) => {
            const sc = key === 'all' ? null : STATUS_MAP[key];
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                aria-pressed={filterStatus === key}
                className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors duration-120 ${
                  filterStatus === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-rule-strong text-fg-muted hover:border-fg-faint hover:text-foreground'
                }`}
              >
                {key === 'all' ? l('الكل', 'All') : l(sc.label_ar, sc.label_en)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="border border-rule">
        {filtered.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={UserPlus}
            title={l('لا توجد نتائج', 'No leads match')}
            description={l(
              'جرّب بحثاً آخر أو غيّر تصفية الحالة.',
              'Try a different search, or change the status filter.',
            )}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{l('الاسم', 'Name')}</TableHead>
                <TableHead>{l('التواصل', 'Contact')}</TableHead>
                <TableHead>{l('المصدر', 'Source')}</TableHead>
                <TableHead>{l('الحالة', 'Status')}</TableHead>
                <TableHead>{l('الملاحظات', 'Notes')}</TableHead>
                <TableHead>{l('تاريخ الإضافة', 'Added')}</TableHead>
                <TableHead><span className="sr-only">{l('إجراءات', 'Actions')}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((lead) => {
                const sc = STATUS_MAP[lead.status] || STATUS_MAP.new;
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {lead.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-semibold">{lead.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />{lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />{lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className=" text-xs text-muted-foreground">{lead.source}</TableCell>
                    <TableCell>
                      <select value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent cursor-pointer focus:outline-none ${sc.bg} ${sc.color}`}>
                        {LEAD_STATUSES.map(s => (
                          <option key={s.key} value={s.key} className="bg-card text-foreground">
                            {l(s.label_ar, s.label_en)}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className=" max-w-[180px]">
                      {lead.notes
                        ? <p className="text-xs text-muted-foreground truncate" title={lead.notes}>{lead.notes}</p>
                        : <span className="text-xs text-muted-foreground/40 italic">—</span>}
                    </TableCell>
                    <TableCell className=" text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(lead.added, language)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(lead)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 hover:bg-primary/10 transition">
                          {l('تعديل', 'Edit')}
                        </button>
                        {hasPermission('convert leads') && (
                          <button onClick={() => setConvertTarget(lead)} title={l('تحويل إلى عميل', 'Convert to Client')}
                            className="p-1.5 rounded-lg border border-chart-up/20 hover:bg-chart-up/10 text-chart-up transition">
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {hasPermission('delete leads') && (
                          <button onClick={() => setDeleteTarget(lead)} title={l('حذف', 'Delete')}
                            className="p-1.5 rounded-lg border border-chart-down/20 hover:bg-chart-down/10 text-chart-down transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {filtered.length > 0 && (
          <div className="px-4 pb-2">
            <TablePagination
              page={page} totalPages={totalPages} from={from} to={to} total={total}
              onPage={setPage} labelAr="عميل محتمل" labelEn="lead" language={language}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <LeadModal
            lead={editLead}
            language={language}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Convert confirm */}
      <AnimatePresence>
        {convertTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-chart-up/20 rounded shadow-2xl p-6 w-full max-w-sm">
              <p className="font-semibold text-lg mb-1">{l('تحويل إلى عميل', 'Convert to Client')}</p>
              <p className="text-sm text-muted-foreground mb-5">
                {l(`هل تريد تحويل ${convertTarget.name} من عميل محتمل إلى عميل فعلي؟`, `Convert ${convertTarget.name} from a lead to a full client?`)}
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConvertTarget(null)}
                  className="px-4 py-2 text-sm rounded border border-primary/20 hover:bg-primary/5 transition">
                  {l('إلغاء', 'Cancel')}
                </button>
                <button
                  onClick={() => { convertLead(convertTarget.id); setConvertTarget(null); }}
                  className="px-4 py-2 text-sm rounded bg-chart-up text-foreground hover:bg-chart-up transition font-semibold">
                  {l('تحويل', 'Convert')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-chart-down/20 rounded shadow-2xl p-6 w-full max-w-sm">
              <p className="font-semibold text-lg mb-1">{l('حذف العميل المحتمل', 'Delete Lead')}</p>
              <p className="text-sm text-muted-foreground mb-5">
                {l(`هل أنت متأكد من حذف ${deleteTarget.name}؟ لا يمكن التراجع.`, `Delete ${deleteTarget.name}? This cannot be undone.`)}
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm rounded border border-primary/20 hover:bg-primary/5 transition">
                  {l('إلغاء', 'Cancel')}
                </button>
                <button
                  onClick={() => { deleteLead(deleteTarget.id); toast.success(l('تم الحذف', 'Lead deleted')); setDeleteTarget(null); }}
                  className="px-4 py-2 text-sm rounded bg-chart-down text-foreground hover:bg-chart-down transition font-semibold">
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

export default Leads;
