import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockCourses } from '@/data/mockData';
import {
  Users, DollarSign, FileText, TrendingUp, Sparkles, ArrowUpRight,
  Activity, Calendar,
} from 'lucide-react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TEAL = 'hsl(195 65% 47%)';
const TEAL_LIGHT = 'hsl(195 85% 60%)';

const AdminOverview = () => {
  const { t, language } = useLanguage();
  const { users, applications, transactions } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const totalRevenue = transactions
    .filter((tx) => tx.type === 'payment' && tx.status === 'completed')
    .reduce((s, tx) => s + tx.amount, 0);
  const activeApps = applications.filter((a) => !['completed', 'rejected', 'draft'].includes(a.status)).length;

  const chartData = [
    { name: l('يناير', 'Jan'), value: 4500 }, { name: l('فبراير', 'Feb'), value: 7200 },
    { name: l('مارس', 'Mar'),  value: 3200 }, { name: l('أبريل',  'Apr'), value: 8500 },
    { name: l('مايو',  'May'), value: 6100 }, { name: l('يونيو',  'Jun'), value: 9200 },
    { name: l('يوليو', 'Jul'), value: 10450 },{ name: l('أغسطس', 'Aug'), value: 11320 },
  ];

  const pieData = [
    { name: l('مقبول',       'Approved'),     value: applications.filter((a) => a.status === 'approved').length,     fill: 'hsl(145 70% 55%)' },
    { name: l('قيد المراجعة', 'Under Review'), value: applications.filter((a) => a.status === 'under_review').length, fill: 'hsl(45 95% 55%)'  },
    { name: l('مقدم',         'Submitted'),    value: applications.filter((a) => a.status === 'submitted').length,    fill: TEAL               },
    { name: l('مرفوض',        'Rejected'),     value: applications.filter((a) => a.status === 'rejected').length,     fill: 'hsl(0 72% 55%)'   },
  ];

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
                'لمحة حيّة عن الإيرادات، الطلبات والنشاط عبر المنصة.',
                'A live pulse of revenue, applications and activity across the platform.'
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
        <KPICard title={t('admin.totalUsers')}           value={users.length}    icon={<Users className="h-5 w-5" />}      change="+12%" />
        <KPICard title={t('admin.totalRevenue')}         value={totalRevenue}    icon={<DollarSign className="h-5 w-5" />} change="+8%"  suffix={` ${t('common.sar')}`} />
        <KPICard title={t('admin.activeApplications')}   value={activeApps}      icon={<FileText className="h-5 w-5" />}    change="+3%" />
        <KPICard title={t('admin.completionRate')}       value="78%"              icon={<TrendingUp className="h-5 w-5" />} change="+5%" />
      </div>

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
              <h2 className="font-semibold">{l('الإيرادات الشهرية', 'Monthly revenue')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {l('آخر 8 أشهر', 'Last 8 months')}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-chart-up bg-chart-up/10 border border-chart-up/20 px-2 py-1 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              +18.4%
            </span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={TEAL_LIGHT} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={TEAL_LIGHT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(195 65% 47% / 0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(210 8% 65%)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(210 8% 65%)' }} tickLine={false} axisLine={false} />
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
              <Area
                type="monotone"
                dataKey="value"
                stroke={TEAL_LIGHT}
                strokeWidth={2.5}
                fill="url(#rev-area)"
                dot={{ fill: TEAL_LIGHT, r: 3 }}
                activeDot={{ r: 6, fill: TEAL_LIGHT, stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribution donut */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6"
        >
          <h2 className="font-semibold mb-1">{l('توزيع الطلبات', 'Application mix')}</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {l('حسب الحالة', 'By status')}
          </p>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
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
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                <span className="font-semibold tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ───────── Activity + latest users ───────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t('admin.recentActivity')}
            </h2>
            <Link to="/admin/activity-log" className="text-xs text-primary hover:underline">
              {l('عرض الكل', 'View all')}
            </Link>
          </div>

          <div className="space-y-2">
            {applications.slice(0, 6).map((app, idx) => {
              const course = mockCourses.find(c => c.id === app.courseId);
              const user = users.find((u) => u.id === app.userId);
              const uname = user ? user[language === 'ar' ? 'name_ar' : 'name_en'] : '—';
              const initials = uname.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: language === 'ar' ? 10 : -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-primary/10 hover:border-primary/30 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full gradient-gold text-primary-foreground flex items-center justify-center font-bold text-xs shadow-neon">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{uname}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {course ? course[language === 'ar' ? 'title_ar' : 'title_en'] : '—'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Snapshot */}
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
              {l('لمحة اليوم', 'Today\'s snapshot')}
            </h2>

            <div className="space-y-3">
              <StatRow
                label={l('مستخدمون جدد', 'New users')}
                value={Math.max(3, Math.round(users.length * 0.04))}
                trend="+14%"
              />
              <StatRow
                label={l('طلبات جديدة', 'New applications')}
                value={Math.max(1, Math.round(applications.length * 0.12))}
                trend="+8%"
              />
              <StatRow
                label={l('إيرادات اليوم', 'Today\'s revenue')}
                value={`${Math.round(totalRevenue * 0.08).toLocaleString()} ${t('common.sar')}`}
                trend="+6%"
              />
              <StatRow
                label={l('معدل التحويل', 'Conversion rate')}
                value="4.7%"
                trend="+0.3%"
              />
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

const StatRow = ({ label, value, trend }) => (
  <div className="flex items-center justify-between py-2 border-b border-primary/10 last:border-b-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold tabular-nums">{value}</span>
      {trend && (
        <span className="text-[0.65rem] text-chart-up bg-chart-up/10 px-1.5 py-0.5 rounded-full border border-chart-up/20">
          {trend}
        </span>
      )}
    </div>
  </div>
);

export default AdminOverview;
