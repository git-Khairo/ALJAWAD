import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { fmtDate } from '@/lib/format';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, UserCheck, TrendingUp, Search,
  Phone, Mail, Calendar, Copy,
} from 'lucide-react';

const copyText = (text, okMsg) => {
  if (!text) return;
  navigator.clipboard.writeText(String(text)).then(() => toast.success(okMsg));
};
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const TYPE_CFG = {
  client: { label_en: 'Client', label_ar: 'عميل',          color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
  lead:   { label_en: 'Lead',   label_ar: 'عميل محتمل',   color: 'text-violet-400',  bg: 'bg-violet-400/15 border-violet-400/30' },
};

const STATUS_COLORS = {
  active:     '#34d399', inactive: '#94a3b8',
  new:        '#a78bfa', contacted: '#60a5fa',
  interested: '#fbbf24', qualified: '#f97316',
};

// ─── Charts ───────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#c9a227', '#a78bfa', '#34d399', '#94a3b8'];

const monthlyData = [
  { month: 'Jan', clients: 2, leads: 3 },
  { month: 'Feb', clients: 1, leads: 5 },
  { month: 'Mar', clients: 3, leads: 4 },
  { month: 'Apr', clients: 2, leads: 6 },
  { month: 'May', clients: 4, leads: 7 },
  { month: 'Jun', clients: 2, leads: 5 },
];

const AdminUsers = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { clients: rawClients, leads: rawLeads, updateClient } = useAppData();

  const STAGE_OPTIONS = [
    { value: 'lead',            label: l('عميل محتمل', 'Lead') },
    { value: 'client_inactive', label: l('عميل غير نشط', 'Inactive') },
    { value: 'client_active',   label: l('عميل نشط', 'Active') },
  ];

  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');

  // Merge clients and leads into a unified list with a record_type tag
  const ALL_PEOPLE = useMemo(() => [
    ...rawClients.map(c => ({ ...c, record_type: 'client', joined: c.joined || '' })),
    ...rawLeads.map(l => ({ ...l, record_type: 'lead', joined: l.added || '', courses: 0 })),
  ], [rawClients, rawLeads]);

  const clients  = ALL_PEOPLE.filter(p => p.record_type === 'client');
  const leads    = ALL_PEOPLE.filter(p => p.record_type === 'lead');
  const active   = clients.filter(c => c.status === 'active').length;
  const inactive = clients.filter(c => c.status === 'inactive').length;

  const sourcePieData = Object.entries(
    ALL_PEOPLE.reduce((acc, p) => { acc[p.source || 'Unknown'] = (acc[p.source || 'Unknown'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const filtered = ALL_PEOPLE.filter(p => {
    if (filterType !== 'all' && p.record_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
    }
    return true;
  });
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(filtered, 15, search + filterType);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{l('المستخدمون', 'Users')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{l('نظرة شاملة على جميع العملاء والعملاء المحتملين', 'Complete overview of all clients and leads')}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label_en: 'Total People',  label_ar: 'إجمالي المستخدمين', value: ALL_PEOPLE.length, color: 'text-blue-400',    icon: Users },
          { label_en: 'Clients',       label_ar: 'عملاء',              value: clients.length,    color: 'text-emerald-400', icon: UserCheck },
          { label_en: 'Active',        label_ar: 'نشطون',              value: active,             color: 'text-emerald-400', icon: TrendingUp },
          { label_en: 'Leads',         label_ar: 'محتملون',            value: leads.length,       color: 'text-violet-400',  icon: UserCheck },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-primary/10 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-primary/8 ${s.color}`}><s.icon className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{l(s.label_ar, s.label_en)}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        {/* Monthly growth bar */}
        <div className="lg:col-span-2 bg-card border border-primary/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm">{l('النمو الشهري', 'Monthly Growth')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="clients" name={l('عملاء', 'Clients')} fill="#c9a227" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads"   name={l('محتملون', 'Leads')}   fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source pie */}
        <div className="bg-card border border-primary/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm">{l('مصدر الاستقطاب', 'Acquisition Source')}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sourcePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                {sourcePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: 12, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {sourcePieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Combined table */}
      <div className="bg-card border border-primary/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex flex-wrap gap-3 px-5 py-4 border-b border-primary/8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={l('ابحث...', 'Search...')}
              className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} />
          </div>
          <div className="flex gap-1.5">
            {['all', 'client', 'lead'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  filterType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                }`}>
                {t === 'all' ? l('الكل', 'All') : t === 'client' ? l('عملاء', 'Clients') : l('محتملون', 'Leads')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/8 text-xs text-muted-foreground bg-primary/3">
                <th className="text-start px-5 py-3 font-medium">{l('الاسم', 'Name')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('المرحلة', 'Stage')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('الحالة', 'Status')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('المصدر', 'Source')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('التواصل', 'Contact')}</th>
                <th className="text-start px-4 py-3 font-medium">{l('التاريخ', 'Date')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, i) => {
                const statusColor = STATUS_COLORS[p.status] || '#94a3b8';
                return (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-primary/6 hover:bg-primary/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold text-xs shadow-neon shrink-0">
                          {p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={p.stage}
                          onChange={e => updateClient({ id: p.id, stage: e.target.value })}
                          className="text-xs rounded-md border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                          title={l('غيّر مرحلة العميل يدوياً', 'Manually change the client stage')}
                        >
                          {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {p.isStudent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">{l('طالب', 'Student')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusColor }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => copyText(p.phone, l('تم نسخ الهاتف', 'Phone copied'))} title={l('نسخ الهاتف', 'Copy phone')} className="p-1 rounded-md bg-primary/5 hover:bg-primary/15 text-muted-foreground hover:text-primary transition"><Phone className="h-3 w-3" /></button>
                        <button onClick={() => copyText(p.email, l('تم نسخ البريد', 'Email copied'))} title={l('نسخ البريد', 'Copy email')} className="p-1 rounded-md bg-primary/5 hover:bg-primary/15 text-muted-foreground hover:text-primary transition"><Mail className="h-3 w-3" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(p.joined, language)}</div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-2">
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} labelAr="سجل" labelEn="record" language={language} />
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
