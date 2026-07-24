import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { KPICard } from '@/components/KPICard';
import {
  Users, DollarSign, FileText, TrendingUp, Sparkles, ArrowUpRight,
  Activity, Calendar, Ticket, Megaphone, UserPlus, Link2, Network, Building2,
} from 'lucide-react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TEAL       = 'hsl(195 65% 47%)';
const TEAL_LIGHT = 'hsl(195 85% 60%)';

const fmt = (n) => Number(n ?? 0).toLocaleString();

const AdminOverview = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAuth();
  const { overviewData, leads, analyticsData } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const d = overviewData ?? {};

  // Monthly acquisition chart — new clients + new leads per month (non-financial).
  const chartData = useMemo(() => {
    const map = {};
    (analyticsData?.monthly_clients ?? []).forEach(r => {
      map[r.month] = { name: r.month, clients: r.clients ?? 0, leads: 0 };
    });
    (analyticsData?.monthly_leads ?? []).forEach(r => {
      if (!map[r.month]) map[r.month] = { name: r.month, clients: 0, leads: 0 };
      map[r.month].leads = r.leads ?? 0;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [analyticsData]);

  // Pie chart: clients vs leads
  const pieData = [
    { name: l('عملاء', 'Clients'), value: d.total_clients ?? 0,                     fill: TEAL },
    { name: l('محتملون', 'Leads'), value: d.total_leads ?? 0,                       fill: 'hsl(45 95% 55%)' },
    { name: l('نشطون', 'Active'),  value: d.active_clients ?? 0,                    fill: 'hsl(145 70% 55%)' },
  ].filter(s => s.value > 0);

  // Recent leads (latest 6) — actionable follow-up list for the team.
  const recentLeads = [...(leads ?? [])]
    .sort((a, b) => String(b.added ?? '').localeCompare(String(a.added ?? '')))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* ───────── Hero ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-xl p-6 md:p-8"
      >
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {l('لوحة الإدارة', 'Control tower')}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              <span className="gradient-text">{t('admin.overview')}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              {l(
                'لمحة حيّة عن الإيداعات والعملاء والنشاط عبر المنصة.',
                'A live pulse of deposits, clients, and activity across the platform.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm shadow-neon hover:scale-[1.03] transition-transform"
            >
              <FileText className="h-4 w-4" />
              {l('إنشاء تقرير', 'Generate report')}
            </Link>
            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 font-semibold text-sm transition"
            >
              <Activity className="h-4 w-4" />
              {l('التحليلات', 'Analytics')}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ───────── KPI grid ───────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={l('إجمالي العملاء', 'Total Clients')}
          value={fmt(d.total_clients)}
          icon={<Users className="h-5 w-5" />}
          change={d.total_clients > 0 ? '+' + d.total_clients : '—'}
        />
        <KPICard
          title={l('إجمالي الإيداعات', 'Total Deposits')}
          value={`$${fmt(d.total_revenue_usd)}`}
          icon={<DollarSign className="h-5 w-5" />}
          change=""
        />
        <KPICard
          title={l('تذاكر مفتوحة', 'Open Tickets')}
          value={fmt(d.open_tickets)}
          icon={<Ticket className="h-5 w-5" />}
          change=""
        />
        <KPICard
          title={l('معدل التحويل', 'Conversion Rate')}
          value={`${fmt(d.conversion_rate ?? 0)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          change={d.conversion_rate > 0 ? `+${d.conversion_rate}%` : '—'}
        />
      </div>

      {/* ───────── Secondary KPI row ───────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={l('عملاء محتملون', 'Total Leads')}          value={fmt(d.total_leads)}                  icon={<TrendingUp className="h-5 w-5" />}    change="" />
        <KPICard title={l('حملات نشطة', 'Active Campaigns')}        value={fmt(d.active_campaigns)}             icon={<Megaphone className="h-5 w-5" />}     change="" />
        <KPICard title={l('جدد هذا الشهر', 'New This Month')}         value={fmt(d.new_this_month ?? 0)}          icon={<UserPlus className="h-5 w-5" />}      change="" />
        <KPICard title={l('المسوقون النشطون', 'Active Affiliates')}   value={fmt(d.active_affiliates ?? 0)}       icon={<Link2 className="h-5 w-5" />}         change="" />
      </div>

      {/* ───────── Affiliate network panel ───────── */}
      {hasPermission('view affiliates') && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-violet-400" />
              <h2 className="font-semibold">{l('شبكة الوسطاء', 'Affiliate Network')}</h2>
            </div>
            <Link
              to="/admin/affiliates"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {l('إدارة الوسطاء', 'Manage IBs')}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 items-start">
            <div className="flex items-center gap-3 bg-violet-400/10 border border-violet-400/20 rounded-xl px-4 py-3">
              <Network className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-xl font-bold text-white">{fmt(d.active_affiliates)}</p>
                <p className="text-xs text-slate-400">{l('إجمالي الوسطاء', 'Total IBs')}</p>
              </div>
            </div>

            {(d.ibs_by_broker ?? []).map(b => (
              <div key={b.broker_id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <Building2 className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-lg font-bold text-white">{fmt(b.ib_count)}</p>
                  <p className="text-xs text-slate-400">{b.broker_name}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ───────── Charts row ───────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue area chart */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">{l('الاكتساب الشهري', 'Monthly Acquisition')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{l('آخر 6 أشهر', 'Last 6 months')}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TEAL_LIGHT }} />
                {l('عملاء', 'Clients')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(45 95% 55%)' }} />
                {l('محتملون', 'Leads')}
              </span>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="acq-clients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={TEAL_LIGHT} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={TEAL_LIGHT} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="acq-leads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="hsl(45 95% 55%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(45 95% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(195 65% 47% / 0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(210 8% 65%)' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(210 8% 65%)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(210 25% 11% / 0.9)',
                    border: '1px solid hsl(195 65% 47% / 0.3)',
                    borderRadius: 12,
                    backdropFilter: 'blur(10px)',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'hsl(195 85% 70%)', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="clients" name={l('عملاء', 'Clients')} stroke={TEAL_LIGHT} strokeWidth={2.5}
                  fill="url(#acq-clients)" dot={{ fill: TEAL_LIGHT, r: 3 }}
                  activeDot={{ r: 6, fill: TEAL_LIGHT, stroke: 'white', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="leads" name={l('محتملون', 'Leads')} stroke="hsl(45 95% 55%)" strokeWidth={2.5}
                  fill="url(#acq-leads)" dot={{ fill: 'hsl(45 95% 55%)', r: 3 }}
                  activeDot={{ r: 6, fill: 'hsl(45 95% 55%)', stroke: 'white', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
              {l('لا توجد بيانات اكتساب بعد', 'No acquisition data yet')}
            </div>
          )}
        </motion.div>

        {/* Clients / Leads donut */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6"
        >
          <h2 className="font-semibold mb-1">{l('توزيع العملاء', 'Client Mix')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{l('حسب النوع', 'By type')}</p>

          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(210 25% 11% / 0.9)',
                      border: '1px solid hsl(195 65% 47% / 0.3)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                    <span className="text-muted-foreground truncate flex-1">{s.name}</span>
                    <span className="font-semibold tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              {l('لا توجد بيانات', 'No data yet')}
            </div>
          )}
        </motion.div>
      </div>

      {/* ───────── Activity + Snapshot ───────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent leads */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              {l('أحدث العملاء المحتملين', 'Recent Leads')}
            </h2>
            <Link to="/admin/leads" className="text-xs text-primary hover:underline">
              {l('عرض الكل', 'View all')}
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {l('لا يوجد عملاء محتملون بعد', 'No leads yet')}
            </p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead, idx) => {
                const initials = (lead.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: language === 'ar' ? 10 : -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-primary/10 hover:border-primary/30 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full gradient-gold text-primary-foreground flex items-center justify-center font-bold text-xs shadow-neon shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{lead.name || l('بدون اسم', 'Unnamed')}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.source ? `${lead.source}` : l('مصدر غير معروف', 'Unknown source')}
                          {lead.added ? ` · ${lead.added}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium text-amber-400 bg-amber-400/10 border-amber-400/20 capitalize shrink-0">
                      {lead.status ?? 'new'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Live snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent backdrop-blur-xl p-6 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-10 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              {l('لمحة سريعة', 'Quick Snapshot')}
            </h2>

            <div className="space-y-3">
              <StatRow label={l('إجمالي العملاء النشطين', 'Active clients')}    value={fmt(d.active_clients)} />
              <StatRow label={l('عملاء محتملون', 'Total leads')}               value={fmt(d.total_leads)} />
              <StatRow label={l('الوسطاء الفرعيون', 'Sub-IBs')}               value={fmt(d.active_affiliates)} />
              <StatRow label={l('مقالات منشورة', 'Published posts')}           value={fmt(d.published_posts)} />
              <StatRow label={l('إجمالي الإيداعات ($)', 'Deposits (USD)')}    value={`$${fmt(d.total_revenue_usd)}`} />
            </div>

            <Link
              to="/admin/reports"
              className="mt-5 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-primary/30 text-primary font-semibold text-xs hover:bg-primary/10 transition"
            >
              {l('عرض التقرير الكامل', 'View full report')}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-primary/10 last:border-b-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-bold tabular-nums">{value}</span>
  </div>
);

export default AdminOverview;
