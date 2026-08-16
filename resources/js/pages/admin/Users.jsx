import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { fmtDate } from '@/lib/format';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { KPICard, KPIRow } from '@/components/KPICard';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CHART_SERIES, NEUTRAL, UP } from '@/lib/chartColors';
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
  client: { label_en: 'Client', label_ar: 'عميل',          color: 'text-chart-up', bg: 'bg-chart-up/15 border-chart-up/30' },
  lead:   { label_en: 'Lead',   label_ar: 'عميل محتمل',   color: 'text-primary',  bg: 'bg-primary/15 border-primary/30' },
};

const STATUS_COLORS = {
  // 'active' and 'inactive' are states; the lead stages are categories.
  active:     UP,              inactive:  NEUTRAL,
  new:        CHART_SERIES[5], contacted: CHART_SERIES[0],
  interested: CHART_SERIES[1], qualified: CHART_SERIES[6],
};

// ─── Charts ───────────────────────────────────────────────────────────────────
const PIE_COLORS = [CHART_SERIES[0], CHART_SERIES[2], CHART_SERIES[3], NEUTRAL];

const AdminUsers = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { clients: rawClients, leads: rawLeads, updateClient } = useAppData();

  // Build last-6-months growth chart from real join dates
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key:     `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month:   d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' }),
        clients: 0,
        leads:   0,
      };
    });
    rawClients.forEach(c => {
      const key = (c.joined || '').slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.clients++;
    });
    rawLeads.forEach(lead => {
      const key = (lead.added || '').slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.leads++;
    });
    return months;
  }, [rawClients, rawLeads, language]);

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
      <PageHeader
        title={l('المستخدمون', 'Users')}
        description={l(
          'نظرة شاملة على جميع العملاء والعملاء المحتملين.',
          'Every client and lead in one place.',
        )}
      />

      <div className="mb-8">
        <KPIRow>
          <KPICard title={l('إجمالي المستخدمين', 'Total people')} value={ALL_PEOPLE.length} icon={<Users strokeWidth={1.75} />} />
          <KPICard title={l('عملاء', 'Clients')}                  value={clients.length}    icon={<UserCheck strokeWidth={1.75} />} />
          <KPICard title={l('نشطون', 'Active')}                   value={active}            icon={<TrendingUp strokeWidth={1.75} />} />
          <KPICard title={l('محتملون', 'Leads')}                  value={leads.length}      icon={<UserCheck strokeWidth={1.75} />} />
        </KPIRow>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        {/* Monthly growth bar */}
        <div className="lg:col-span-2 bg-card border border-primary/10 rounded p-5">
          <h3 className="font-semibold mb-4 text-sm">{l('النمو الشهري', 'Monthly Growth')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="clients" name={l('عملاء', 'Clients')} fill={CHART_SERIES[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads"   name={l('محتملون', 'Leads')}   fill={CHART_SERIES[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source pie */}
        <div className="bg-card border border-primary/10 rounded p-5">
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
      <div className="border border-rule">
        <div className="flex flex-wrap gap-3 border-b border-rule p-4">
          <div className="relative min-w-[200px] flex-1">
            {/* `start-3`, not a language ternary: the icon follows the reading
                direction on its own. */}
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={l('ابحث بالاسم أو البريد…', 'Search by name or email…')}
              className="h-9 ps-9"
              aria-label={l('بحث', 'Search')}
            />
          </div>
          <div className="flex gap-1" role="group" aria-label={l('تصفية', 'Filter')}>
            {['all', 'client', 'lead'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                aria-pressed={filterType === t}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors duration-120 ${
                  filterType === t
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-rule-strong text-fg-muted hover:border-fg-faint hover:text-foreground'
                }`}
              >
                {t === 'all' ? l('الكل', 'All') : t === 'client' ? l('عملاء', 'Clients') : l('محتملون', 'Leads')}
              </button>
            ))}
          </div>
        </div>

        {total === 0 ? (
          <EmptyState
            className="border-0"
            icon={Users}
            title={l('لا توجد نتائج', 'Nothing matches')}
            description={l(
              'جرّب بحثاً آخر أو غيّر التصفية.',
              'Try a different search, or change the filter.',
            )}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{l('الاسم', 'Name')}</TableHead>
                  <TableHead>{l('المرحلة', 'Stage')}</TableHead>
                  <TableHead>{l('الحالة', 'Status')}</TableHead>
                  <TableHead>{l('المصدر', 'Source')}</TableHead>
                  <TableHead>{l('التواصل', 'Contact')}</TableHead>
                  <TableHead>{l('التاريخ', 'Date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* No per-row entry animation. Fading eighty rows in one by one
                    delays the moment the table can actually be read. */}
                {paginated.map((p) => {
                  const statusColor = STATUS_COLORS[p.status] || NEUTRAL;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded bg-primary text-xs font-bold text-primary-foreground"
                            aria-hidden="true"
                          >
                            {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium leading-tight text-foreground">{p.name}</span>
                            <span className="block max-w-[160px] truncate text-xs text-fg-faint" dir="ltr">
                              {p.email}
                            </span>
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            value={p.stage}
                            onChange={(e) => updateClient({ id: p.id, stage: e.target.value })}
                            aria-label={l(`مرحلة ${p.name}`, `Stage for ${p.name}`)}
                            className="rounded-sm border border-rule-strong bg-surface-raised px-2 py-1 text-xs text-foreground transition-colors duration-120 hover:border-fg-faint focus:border-primary focus:outline-none"
                          >
                            {STAGE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          {p.isStudent && (
                            <Badge variant="accent">{l('طالب', 'Student')}</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: statusColor }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} aria-hidden="true" />
                          {p.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-fg-muted">{p.source}</TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            onClick={() => copyText(p.phone, l('تم نسخ الهاتف', 'Phone copied'))}
                            aria-label={l(`نسخ هاتف ${p.name}`, `Copy phone for ${p.name}`)}
                            className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-primary"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => copyText(p.email, l('تم نسخ البريد', 'Email copied'))}
                            aria-label={l(`نسخ بريد ${p.name}`, `Copy email for ${p.name}`)}
                            className="rounded-sm p-1.5 text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-primary"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-fg-muted">
                        {fmtDate(p.joined, language)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="px-4 pb-2">
              <TablePagination
                page={page} totalPages={totalPages} from={from} to={to} total={total}
                onPage={setPage} labelAr="سجل" labelEn="record" language={language}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
