import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, Phone, Mail, X,
  Calendar,
} from 'lucide-react';

// ─── Lead statuses ─────────────────────────────────────────────────────────────
const LEAD_STATUSES = [
  { key: 'new',           label_en: 'New',           label_ar: 'جديد',            color: 'text-slate-400',   bg: 'bg-slate-400/15 border-slate-400/30' },
  { key: 'contacted',     label_en: 'Contacted',     label_ar: 'تم التواصل',      color: 'text-blue-400',    bg: 'bg-blue-400/15 border-blue-400/30' },
  { key: 'interested',    label_en: 'Interested',    label_ar: 'مهتم',            color: 'text-amber-400',   bg: 'bg-amber-400/15 border-amber-400/30' },
  { key: 'qualified',     label_en: 'Qualified',     label_ar: 'مؤهل',            color: 'text-violet-400',  bg: 'bg-violet-400/15 border-violet-400/30' },
  { key: 'not_interested',label_en: 'Not Interested',label_ar: 'غير مهتم',        color: 'text-red-400',     bg: 'bg-red-400/15 border-red-400/30' },
  { key: 'converted',     label_en: 'Converted',     label_ar: 'تم التحويل',      color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
];

const STATUS_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.key, s]));

const SOURCES = ['Website', 'Social Media', 'Referral', 'WhatsApp', 'Phone Call', 'Event', 'Other'];


const EMPTY_LEAD = { name: '', email: '', phone: '', source: 'Website', status: 'new', notes: '' };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-primary/15 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <h2 className="font-bold text-lg">{isEdit ? l('تعديل العميل المحتمل', 'Edit Lead') : l('إضافة عميل محتمل', 'Add Lead')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 transition"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('الاسم الكامل', 'Full Name')} <span className="text-red-400">*</span>
              </label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder={l('الاسم', 'Full name')}
                className="w-full h-9 px-3 rounded-xl border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('رقم الهاتف', 'Phone')} <span className="text-red-400">*</span>
              </label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="w-full h-9 px-3 rounded-xl border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('البريد الإلكتروني', 'Email')}
              </label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full h-9 px-3 rounded-xl border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('المصدر', 'Source')}
              </label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {l('الحالة', 'Status')}
              </label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
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
                className="w-full px-3 py-2 rounded-xl border border-primary/20 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-primary/20 text-sm hover:bg-primary/5 transition">
              {l('إلغاء', 'Cancel')}
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
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
  const total = leads.length || 1;
  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-5 mb-6">
      <h3 className="font-semibold text-sm mb-4">{l('خط سير العملاء المحتملين', 'Lead Pipeline')}</h3>
      <div className="space-y-2">
        {LEAD_STATUSES.map(s => {
          const count = leads.filter(l => l.status === s.key).length;
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className={`text-xs font-medium w-28 text-end shrink-0 ${s.color}`}>{l(s.label_ar, s.label_en)}</span>
              <div className="flex-1 h-6 bg-primary/5 rounded-lg overflow-hidden">
                <motion.div className="h-full rounded-lg flex items-center px-2"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ background: s.color.includes('emerald') ? '#34d39940' : s.color.includes('blue') ? '#60a5fa40' : s.color.includes('amber') ? '#fbbf2440' : s.color.includes('violet') ? '#a78bfa40' : s.color.includes('red') ? '#f8717140' : '#94a3b840' }}>
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
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { leads, addLead, updateLead } = useAppData();

  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editLead, setEditLead]     = useState(null);

  const filtered = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return lead.name.toLowerCase().includes(q) || lead.email.toLowerCase().includes(q) || lead.phone.includes(q);
    }
    return true;
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{l('العملاء المحتملون', 'Leads')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{l('إدارة العملاء المحتملين ومتابعة مرحلة كل منهم', 'Manage leads and track their pipeline stage')}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-neon shrink-0">
          <UserPlus className="h-4 w-4" />{l('إضافة عميل محتمل', 'Add Lead')}
        </button>
      </div>

      {/* Pipeline visual */}
      <PipelineBar leads={leads} language={language} />

      {/* Search + filter */}
      <div className="bg-card border border-primary/10 rounded-2xl p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={l('ابحث باسم أو هاتف أو بريد...', 'Search by name, phone, email...')}
            className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...LEAD_STATUSES.map(s => s.key)].map(key => {
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
      </div>

      {/* Table */}
      <div className="bg-card border border-primary/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/8 text-xs text-muted-foreground bg-primary/3">
                <th className="text-start px-5 py-3 font-medium">{l('الاسم', 'Name')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('التواصل', 'Contact')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('المصدر', 'Source')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الحالة', 'Status')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الملاحظات', 'Notes')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('تاريخ الإضافة', 'Added')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground text-sm">
                    {l('لا توجد نتائج', 'No leads found')}
                  </td>
                </tr>
              ) : filtered.map((lead, i) => {
                const sc = STATUS_MAP[lead.status] || STATUS_MAP.new;
                return (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-primary/6 hover:bg-primary/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {lead.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-semibold">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lead.source}</td>
                    <td className="px-4 py-3">
                      <select value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent cursor-pointer focus:outline-none ${sc.bg} ${sc.color}`}>
                        {LEAD_STATUSES.map(s => (
                          <option key={s.key} value={s.key} className="bg-card text-foreground">
                            {l(s.label_ar, s.label_en)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {lead.notes
                        ? <p className="text-xs text-muted-foreground truncate" title={lead.notes}>{lead.notes}</p>
                        : <span className="text-xs text-muted-foreground/40 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{lead.added}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(lead)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 hover:bg-primary/10 transition">
                        {l('تعديل', 'Edit')}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-primary/8 text-xs text-muted-foreground bg-primary/2">
          {filtered.length} {l('عميل محتمل', 'lead(s)')}
        </div>
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
    </div>
  );
};

export default Leads;
