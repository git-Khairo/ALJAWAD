import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Phone, Mail, X,
  Tag, Check, UserCheck, UserX,
  Calendar, Clock,
} from 'lucide-react';

const STATUS_CFG = {
  active:   { label_en: 'Active',   label_ar: 'نشط',    color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
  inactive: { label_en: 'Inactive', label_ar: 'غير نشط', color: 'text-slate-400',  bg: 'bg-slate-400/15 border-slate-400/30' },
};

const TAG_COLORS = ['bg-violet-400/20 text-violet-400', 'bg-sky-400/20 text-sky-400', 'bg-amber-400/20 text-amber-400', 'bg-pink-400/20 text-pink-400', 'bg-emerald-400/20 text-emerald-400'];
const tagColor = (tag) => TAG_COLORS[tag.charCodeAt(0) % TAG_COLORS.length];

// ─── Detail drawer ────────────────────────────────────────────────────────────
const ClientDrawer = ({ client, language, onClose, onSave }) => {
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [notes, setNotes]  = useState(client.notes || '');
  const [tags, setTags]    = useState([...(client.tags || [])]);
  const [newTag, setNewTag] = useState('');
  const [saved, setSaved]  = useState(false);

  const addTag    = () => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags(t => [...t, newTag.trim()]); setNewTag(''); } };
  const removeTag = (t) => setTags(ts => ts.filter(x => x !== t));
  const handleSave = () => { onSave({ ...client, notes, tags }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const sc = STATUS_CFG[client.status] || STATUS_CFG.active;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-card border-s border-primary/15 shadow-2xl flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold shadow-neon">
              {client.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="font-bold">{client.name}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${sc.bg} ${sc.color}`}>
                {l(sc.label_ar, sc.label_en)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 transition"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Contact info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l('معلومات الاتصال', 'Contact Info')}</p>
            <div className="space-y-2">
              {[
                { icon: Mail,     value: client.email, href: `mailto:${client.email}` },
                { icon: Phone,    value: client.phone, href: `tel:${client.phone}` },
              ].map(({ icon: Icon, value, href }) => (
                <a key={value} href={href}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{value}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label_en: 'Courses',      label_ar: 'الدورات',       value: client.courses },
              { label_en: 'Joined',       label_ar: 'الانضمام',      value: client.joined?.slice(0, 7) },
              { label_en: 'Last contact', label_ar: 'آخر تواصل',    value: client.last_contact?.slice(5) },
            ].map((s, i) => (
              <div key={i} className="bg-primary/5 border border-primary/10 rounded-xl p-2.5">
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{l(s.label_ar, s.label_en)}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{l('التصنيفات', 'Tags')}</p>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {tags.length === 0 && <span className="text-xs text-muted-foreground/60 italic">{l('لا توجد تصنيفات', 'No tags yet')}</span>}
              {tags.map(tag => (
                <span key={tag} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${tagColor(tag)}`}>
                  {tag}
                  <button onClick={() => removeTag(tag)}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder={l('تصنيف جديد', 'New tag')}
                className="flex-1 h-8 px-3 text-sm rounded-lg border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={addTag} className="px-3 h-8 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition">
                <Tag className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{l('الملاحظات', 'Notes')}</p>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder={l('أضف ملاحظة...', 'Add a note...')}
              className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-primary/10 flex gap-2">
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
            {saved ? <><Check className="h-4 w-4" />{l('تم الحفظ', 'Saved!')}</> : <>{l('حفظ التغييرات', 'Save Changes')}</>}
          </button>
          <a href={`tel:${client.phone}`}
            className="px-4 py-2.5 rounded-xl border border-primary/20 hover:bg-primary/10 transition text-muted-foreground">
            <Phone className="h-4 w-4" />
          </a>
          <a href={`mailto:${client.email}`}
            className="px-4 py-2.5 rounded-xl border border-primary/20 hover:bg-primary/10 transition text-muted-foreground">
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </motion.aside>
    </div>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const CRM = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { clients, updateClient } = useAppData();
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = clients.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
    }
    return true;
  });

  const active   = clients.filter(c => c.status === 'active').length;
  const inactive = clients.filter(c => c.status === 'inactive').length;

  const handleSave = (updated) => {
    updateClient(updated);
    setSelected(updated);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{l('العملاء', 'Clients')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{l('متابعة جميع العملاء النشطين وغير النشطين', 'Follow up with all active and inactive clients')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label_en: 'Total Clients', label_ar: 'إجمالي العملاء', value: clients.length, color: 'text-blue-400',    icon: UserCheck },
          { label_en: 'Active',        label_ar: 'نشطون',          value: active,          color: 'text-emerald-400', icon: UserCheck },
          { label_en: 'Inactive',      label_ar: 'غير نشطين',       value: inactive,        color: 'text-slate-400',   icon: UserX },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-primary/10 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-primary/8 ${s.color}`}><s.icon className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{l(s.label_ar, s.label_en)}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="bg-card border border-primary/10 rounded-2xl p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={l('ابحث باسم أو بريد أو هاتف...', 'Search by name, email, phone...')}
            className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} />
        </div>
        <div className="flex gap-1.5">
          {['all', 'active', 'inactive'].map(s => {
            const cfg = s === 'all' ? null : STATUS_CFG[s];
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                }`}>
                {s === 'all' ? l('الكل', 'All') : l(cfg.label_ar, cfg.label_en)}
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
                <th className="text-start px-5 py-3 font-medium">{l('العميل', 'Client')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('التواصل', 'Contact')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الحالة', 'Status')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('التصنيفات', 'Tags')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('آخر تواصل', 'Last Contact')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الدورات', 'Courses')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => {
                const sc = STATUS_CFG[client.status] || STATUS_CFG.active;
                return (
                  <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-primary/6 hover:bg-primary/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-xs shadow-neon shrink-0">
                          {client.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{l('انضم', 'Joined')} {client.joined?.slice(0, 7)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <a href={`tel:${client.phone}`} className="p-1.5 rounded-lg bg-primary/5 hover:bg-primary/15 transition text-muted-foreground hover:text-primary"><Phone className="h-3.5 w-3.5" /></a>
                        <a href={`mailto:${client.email}`} className="p-1.5 rounded-lg bg-primary/5 hover:bg-primary/15 transition text-muted-foreground hover:text-primary"><Mail className="h-3.5 w-3.5" /></a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-md border ${sc.bg} ${sc.color}`}>
                        {l(sc.label_ar, sc.label_en)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {client.tags.length === 0
                          ? <span className="text-xs text-muted-foreground/50">—</span>
                          : client.tags.map(tag => (
                            <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(tag)}`}>{tag}</span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {client.last_contact}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{client.courses}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(client)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 hover:bg-primary/10 transition">
                        {l('تفاصيل', 'Details')}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-primary/8 text-xs text-muted-foreground bg-primary/2">
          {filtered.length} {l('عميل', 'client(s)')} {filterStatus !== 'all' || search ? `— ${l('نتائج مفلترة','filtered results')}` : ''}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <ClientDrawer
            client={selected}
            language={language}
            onClose={() => setSelected(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRM;
