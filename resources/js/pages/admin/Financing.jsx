import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight,
  Wallet, BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const MONTHS_FULL = {
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

const CATEGORY_COLORS = {
  salary:    '#8b5cf6',
  rent:      '#0ea5e9',
  marketing: '#f59e0b',
  software:  '#10b981',
  utilities: '#64748b',
  equipment: '#f97316',
  travel:    '#6366f1',
  other:     '#94a3b8',
};

const CATEGORY_LABELS = {
  salary:    { ar: 'رواتب',        en: 'Salaries' },
  rent:      { ar: 'إيجار',        en: 'Rent' },
  marketing: { ar: 'تسويق',        en: 'Marketing' },
  software:  { ar: 'برمجيات',      en: 'Software' },
  utilities: { ar: 'خدمات',        en: 'Utilities' },
  equipment: { ar: 'معدات',        en: 'Equipment' },
  travel:    { ar: 'سفر',          en: 'Travel' },
  other:     { ar: 'أخرى',         en: 'Other' },
};

const fmt = (n) => {
  const num = Number(n);
  return isNaN(num) ? '0' : Math.round(num).toLocaleString();
};

const Financing = () => {
  const { language } = useLanguage();
  const { expenses, wallets, walletTopups } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const rate = wallets.rate;

  // ── Convert any amount to USD equivalent ──────────────────────────────────
  const toUSD = (amount, currency) => {
    const num = Number(amount) || 0;
    const r   = Number(rate)   || 14200;
    return currency === 'USD' ? num : num / r;
  };

  // ── Rolling last 6 months (ending this month) ────────────────────────────
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1, idx: d.getMonth() };
    });
  }, []);

  const inMonth = (dateStr, { y, m }) => {
    const d = new Date(dateStr);
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  };
  // Revenue = money injected into the company wallets (top-ups).
  const revenueIn = (mm) => (walletTopups ?? [])
    .filter(t => inMonth(t.created_at ?? t.date, mm))
    .reduce((s, t) => s + toUSD(t.amount, t.currency), 0);
  const expensesIn = (mm) => expenses
    .filter(e => inMonth(e.date, mm))
    .reduce((s, e) => s + toUSD(e.amount, e.currency), 0);

  const chartData = useMemo(() => months.map(mm => ({
    month: (language === 'ar' ? MONTHS_FULL.ar : MONTHS_FULL.en)[mm.idx],
    [l('الإيرادات', 'Revenue')]: Math.round(revenueIn(mm)),
    [l('مصاريف', 'Expenses')]: Math.round(expensesIn(mm)),
  })), [walletTopups, expenses, wallets, language, months]);

  // ── Expense pie by category ───────────────────────────────────────────────
  const pieData = useMemo(() => {
    const totals = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      totals[cat] = (totals[cat] || 0) + toUSD(e.amount, e.currency);
    });
    return Object.entries(totals).map(([cat, value]) => ({
      name: l(CATEGORY_LABELS[cat]?.ar ?? cat, CATEGORY_LABELS[cat]?.en ?? cat),
      value: Math.round(value),
      color: CATEGORY_COLORS[cat] ?? '#94a3b8',
    }));
  }, [expenses, wallets, language]);

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const totalRevenue = (walletTopups ?? [])
    .reduce((s, t) => s + toUSD(t.amount, t.currency), 0);

  const totalExpenses = expenses
    .reduce((s, e) => s + toUSD(e.amount, e.currency), 0);

  // Current company balance straight from the wallet record (database).
  const currentBalance = toUSD(wallets.usd, 'USD') + toUSD(wallets.syp, 'SYP');

  // ── Month-over-month deltas for the KPI badges ────────────────────────────
  const cur = months[5], prev = months[4];
  const pct = (c, p) => (p > 0 ? Math.round(((c - p) / p) * 100) : (c > 0 ? 100 : 0));
  const revDelta = pct(revenueIn(cur), revenueIn(prev));
  const expDelta = pct(expensesIn(cur), expensesIn(prev));
  const profCur  = revenueIn(cur) - expensesIn(cur);
  const profPrev = revenueIn(prev) - expensesIn(prev);
  const profDelta = profPrev !== 0
    ? Math.round(((profCur - profPrev) / Math.abs(profPrev)) * 100)
    : (profCur > 0 ? 100 : 0);
  const fmtPct = (d) => `${d >= 0 ? '+' : ''}${d}%`;

  const recentTopups = [...(walletTopups ?? [])].slice(0, 6);

  const revenueKey = l('الإيرادات', 'Revenue');
  const expenseKey = l('مصاريف', 'Expenses');

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl p-6"
      >
        <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
              {l('المالية', 'Finance')}
            </p>
            <h1 className="text-2xl font-bold">{l('نظرة عامة مالية', 'Financial Overview')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {l('تحليلات الإيرادات والمصاريف والأرباح', 'Revenue, expense & profit analytics')}
            </p>
          </div>
          <BarChart2 className="h-10 w-10 text-primary/40" />
        </div>
      </motion.div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={l('إجمالي الإيرادات', 'Gross Revenue')}
          value={`$${fmt(totalRevenue)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          change={fmtPct(revDelta)}
        />
        <KPICard
          title={l('إجمالي المصاريف', 'Total Expenses')}
          value={`$${fmt(totalExpenses)}`}
          icon={<TrendingDown className="h-5 w-5" />}
          change={fmtPct(expDelta)}
        />
        <KPICard
          title={l('صافي الربح', 'Net Profit')}
          value={`$${fmt(totalRevenue - totalExpenses)}`}
          icon={<DollarSign className="h-5 w-5" />}
          change={fmtPct(profDelta)}
        />
        <KPICard
          title={l('الرصيد الحالي', 'Current Balance')}
          value={`$${fmt(currentBalance)}`}
          icon={<Wallet className="h-5 w-5" />}
          change=""
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-5">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            {l('الإيرادات مقابل المصاريف', 'Revenue vs Expenses')}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${v}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={revenueKey} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={expenseKey} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            {l('المصاريف حسب الفئة', 'Expenses by Category')}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="45%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${v}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Wallets summary (live balances from the database) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/revenue">
          <div className="bg-card rounded-xl border p-5 hover:border-primary/40 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {l('محفظة الليرة السورية', 'SYP Wallet')}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold">{fmt(wallets.syp)} <span className="text-sm font-normal text-muted-foreground">SYP</span></p>
            <p className="text-xs text-muted-foreground mt-1">{l('الليرة السورية', 'Syrian Pound')}</p>
          </div>
        </Link>
        <Link to="/admin/revenue">
          <div className="bg-card rounded-xl border p-5 hover:border-primary/40 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {l('محفظة الدولار', 'USD Wallet')}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold">{fmt(wallets.usd)} <span className="text-sm font-normal text-muted-foreground">USD</span></p>
            <p className="text-xs text-muted-foreground mt-1">{l('الدولار الأمريكي', 'US Dollar')}</p>
          </div>
        </Link>
      </div>

      {/* ── Recent Revenue (wallet top-ups) ─────────────────────────────────── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold">{l('آخر الإيرادات', 'Recent Revenue')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{l('الإيداعات التي تموّل محافظ الشركة', 'Funds added to the company wallets')}</p>
          </div>
          <Link to="/admin/revenue" className="text-xs text-primary hover:underline">
            {l('عرض الكل', 'View all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المحفظة', 'Wallet')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('ملاحظة', 'Note')}</th>
              </tr>
            </thead>
            <tbody>
              {recentTopups.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{l('لا توجد إيرادات بعد', 'No revenue yet')}</td></tr>
              )}
              {recentTopups.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 text-xs text-muted-foreground">
                    {(t.created_at || t.date || '').slice(0, 10)}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      t.currency === 'SYP'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}>
                      {t.currency === 'SYP' ? '🇸🇾 SYP' : '🇺🇸 USD'}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-emerald-400">+{Number(t.amount).toLocaleString()} {t.currency}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[220px] truncate">{t.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Financing;
