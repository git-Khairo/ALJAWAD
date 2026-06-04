import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, Clock, ArrowUpRight,
  Wallet, BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const MONTH_LABELS = {
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو'],
  en: ['Jan','Feb','Mar','Apr','May','Jun'],
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

const TX_TYPE_LABELS = {
  cash:      { ar: 'نقد',         en: 'Cash' },
  crypto:    { ar: 'كريبتو',      en: 'Crypto' },
  sham_cash: { ar: 'شام كاش',     en: 'Sham Cash' },
  bank:      { ar: 'تحويل بنكي',  en: 'Bank Transfer' },
  wise:      { ar: 'وايز',        en: 'Wise' },
  other:     { ar: 'أخرى',        en: 'Other' },
};

const fmt = (n) => {
  const num = Number(n);
  return isNaN(num) ? '0' : Math.round(num).toLocaleString();
};

const Financing = () => {
  const { language } = useLanguage();
  const { clientTransactions, expenses, wallets } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const rate = wallets.rate;

  // ── Convert any amount to USD equivalent ──────────────────────────────────
  const toUSD = (amount, currency) => {
    const num = Number(amount) || 0;
    const r   = Number(rate)   || 14200;
    return currency === 'USD' ? num : num / r;
  };

  // ── Monthly chart data (Jan–Jun 2026) ────────────────────────────────────
  const chartData = useMemo(() => {
    return MONTH_LABELS.en.map((en, i) => {
      const m = i + 1;
      const inMonth = (dateStr) => {
        const d = new Date(dateStr);
        return d.getFullYear() === 2026 && d.getMonth() + 1 === m;
      };

      const deposits = clientTransactions
        .filter(tx => tx.direction === 'deposit' && tx.status === 'completed' && inMonth(tx.date))
        .reduce((s, tx) => s + toUSD(Number(tx.amount), tx.currency), 0);

      const exp = expenses
        .filter(e => inMonth(e.date))
        .reduce((s, e) => s + toUSD(Number(e.amount), e.currency), 0);

      return {
        month: language === 'ar' ? MONTH_LABELS.ar[i] : en,
        [l('إيداعات', 'Deposits')]: Math.round(deposits),
        [l('مصاريف', 'Expenses')]: Math.round(exp),
      };
    });
  }, [clientTransactions, expenses, wallets, language]);

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
  const totalDeposits = clientTransactions
    .filter(tx => tx.direction === 'deposit' && tx.status === 'completed')
    .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);

  const totalExpenses = expenses
    .reduce((s, e) => s + toUSD(e.amount, e.currency), 0);

  const pendingAmount = clientTransactions
    .filter(tx => tx.status === 'pending')
    .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);

  const recentTx = [...clientTransactions].slice(0, 6);

  const depositKey = l('إيداعات', 'Deposits');
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
              {l('تحليلات الإيرادات والمصاريف لعام 2026', 'Revenue & expense analytics for 2026')}
            </p>
          </div>
          <BarChart2 className="h-10 w-10 text-primary/40" />
        </div>
      </motion.div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={l('إجمالي الإيداعات', 'Total Deposits')}
          value={`$${fmt(totalDeposits)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          change="+18%"
        />
        <KPICard
          title={l('إجمالي المصاريف', 'Total Expenses')}
          value={`$${fmt(totalExpenses)}`}
          icon={<TrendingDown className="h-5 w-5" />}
          change="+5%"
        />
        <KPICard
          title={l('صافي الربح', 'Net Profit')}
          value={`$${fmt(totalDeposits - totalExpenses)}`}
          icon={<DollarSign className="h-5 w-5" />}
          change="+12%"
        />
        <KPICard
          title={l('معلّق', 'Pending')}
          value={`$${fmt(pendingAmount)}`}
          icon={<Clock className="h-5 w-5" />}
          change=""
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-5">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            {l('الإيداعات مقابل المصاريف (2026)', 'Deposits vs Expenses (2026)')}
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
              <Bar dataKey={depositKey} fill="#10b981" radius={[4, 4, 0, 0]} />
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

      {/* ── Wallets summary ────────────────────────────────────────────────── */}
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

      {/* ── Recent Transactions ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{l('آخر المعاملات', 'Recent Transactions')}</h2>
          <Link to="/admin/transactions" className="text-xs text-primary hover:underline">
            {l('عرض الكل', 'View all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('العميل', 'Client')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('النوع', 'Type')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الاتجاه', 'Direction')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('المبلغ', 'Amount')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('الحالة', 'Status')}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{l('التاريخ', 'Date')}</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => (
                <tr key={tx.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-medium">{tx.client}</td>
                  <td className="p-3 text-muted-foreground capitalize">
                    {l(TX_TYPE_LABELS[tx.type]?.ar, TX_TYPE_LABELS[tx.type]?.en) ?? tx.type}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      tx.direction === 'deposit'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                    }`}>
                      {tx.direction === 'deposit' ? l('إيداع', 'Deposit') : l('سحب', 'Withdrawal')}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{tx.amount.toLocaleString()} {tx.currency}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                      tx.status === 'pending'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                                                  'bg-red-500/10 text-red-400 border-red-500/25'
                    }`}>
                      {tx.status === 'completed' ? l('مكتمل','Completed') :
                       tx.status === 'pending'   ? l('معلّق','Pending') : l('فشل','Failed')}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
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
