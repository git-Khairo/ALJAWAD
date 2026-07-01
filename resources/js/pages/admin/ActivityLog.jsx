import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Search, Filter, Download, RefreshCw,
  UserPlus, UserCheck, UserX, LogIn, LogOut,
  Edit3, Trash2, Plus, Settings, Shield, CreditCard,
  FileText, Mail, Bell, Key, AlertTriangle, Eye,
  BarChart3, ChevronDown, ChevronRight, Calendar,
} from 'lucide-react';

// Data comes from AppDataContext → activityLogApi → GET /api/admin/activity-logs

// ─── Config maps ──────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  auth:     { label_en: 'Auth',     label_ar: 'تسجيل الدخول', color: 'text-sky-400',     bg: 'bg-sky-400/10 border-sky-400/20',     icon: Key },
  clients:  { label_en: 'Clients',  label_ar: 'العملاء',      color: 'text-violet-400',  bg: 'bg-violet-400/10 border-violet-400/20', icon: UserCheck },
  coaches:  { label_en: 'Coaches',  label_ar: 'المدربون',     color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: UserPlus },
  kpi:      { label_en: 'KPIs',     label_ar: 'مؤشرات الأداء', color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/20',  icon: BarChart3 },
  finance:  { label_en: 'Finance',  label_ar: 'المالية',      color: 'text-green-400',   bg: 'bg-green-400/10 border-green-400/20',  icon: CreditCard },
  roles:    { label_en: 'Roles',    label_ar: 'الأدوار',      color: 'text-pink-400',    bg: 'bg-pink-400/10 border-pink-400/20',    icon: Shield },
  settings: { label_en: 'Settings', label_ar: 'الإعدادات',    color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/20', icon: Settings },
  security: { label_en: 'Security', label_ar: 'الأمان',       color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20',      icon: AlertTriangle },
};

const ACTION_LABELS = {
  login:              { en: 'Logged in',             ar: 'تسجيل دخول' },
  login_failed:       { en: 'Failed login attempt',  ar: 'محاولة دخول فاشلة' },
  logout:             { en: 'Logged out',             ar: 'تسجيل خروج' },
  create:             { en: 'Created',                ar: 'تم الإنشاء' },
  update:             { en: 'Updated',                ar: 'تم التعديل' },
  delete:             { en: 'Deleted',                ar: 'تم الحذف' },
  convert_lead:       { en: 'Lead converted',         ar: 'تحويل عميل محتمل' },
  invoice_created:    { en: 'Invoice created',        ar: 'فاتورة جديدة' },
  role_assigned:      { en: 'Role assigned',          ar: 'تم تعيين دور' },
  entry_added:        { en: 'KPI entry added',        ar: 'إدخال مؤشر أداء' },
  thresholds_updated: { en: 'Thresholds updated',     ar: 'تعديل حدود الشرائح' },
  permission_changed: { en: 'Permission changed',     ar: 'تغيير صلاحية' },
};

const ACTION_ICONS = {
  login: LogIn, logout: LogOut, login_failed: AlertTriangle,
  create: Plus, update: Edit3, delete: Trash2,
  convert_lead: UserCheck, invoice_created: CreditCard,
  role_assigned: Shield, entry_added: BarChart3,
  thresholds_updated: Settings, permission_changed: Key,
};

const ROLE_LABEL = {
  admin: { en: 'Admin', ar: 'مسؤول' },
  account_manager: { en: 'Account Manager', ar: 'مدير حسابات' },
  marketer: { en: 'Marketer', ar: 'مسوّق' },
  customer_support: { en: 'Support', ar: 'دعم' },
  analyst: { en: 'Analyst', ar: 'محلل' },
};

function relativeTime(iso, language) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return language === 'ar' ? `${diff} ث` : `${diff}s ago`;
  if (diff < 3600) { const m = Math.floor(diff / 60); return language === 'ar' ? `${m} د` : `${m}m ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return language === 'ar' ? `${h} س` : `${h}h ago`; }
  const d = Math.floor(diff / 86400);
  return language === 'ar' ? `${d} ي` : `${d}d ago`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Meta detail renderer ─────────────────────────────────────────────────────
const MetaDetails = ({ meta, language }) => {
  const l = (ar, en) => language === 'ar' ? ar : en;
  const entries = Object.entries(meta);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {entries.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 text-[11px] bg-primary/8 border border-primary/15 rounded-md px-2 py-0.5">
          <span className="text-muted-foreground">{k}:</span>
          <span className="font-semibold">{String(v)}</span>
        </span>
      ))}
    </div>
  );
};

// ─── Single log row ───────────────────────────────────────────────────────────
const LogRow = ({ log, language, expanded, onToggle }) => {
  const l   = (ar, en) => language === 'ar' ? ar : en;
  const ts  = log.created_at ?? log.timestamp ?? '';
  const cat = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.settings;
  const Icon = ACTION_ICONS[log.action] || Clock;
  const actionLabel = ACTION_LABELS[log.action] || { en: log.action, ar: log.action };
  const meta    = log.meta ?? {};
  const hasMeta = Object.keys(meta).length > 0;
  const isFailure = log.status === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-colors ${
        isFailure ? 'border-red-400/30 bg-red-400/5' : 'border-primary/10 bg-card'
      }`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-start"
        onClick={() => hasMeta && onToggle(log.id)}
      >
        {/* Category icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${cat.bg}`}>
          <Icon className={`h-4 w-4 ${cat.color}`} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{l(actionLabel.ar, actionLabel.en)}</span>
            {log.target && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="text-sm text-primary font-medium truncate">{log.target}</span>
              </>
            )}
            {isFailure && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-400/20">
                {l('فشل', 'FAILED')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{log.actor}</span>
            {log.actor_role && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${cat.bg} ${cat.color}`}>
                {l(ROLE_LABEL[log.actor_role]?.ar ?? log.actor_role, ROLE_LABEL[log.actor_role]?.en ?? log.actor_role)}
              </span>
            )}
            <span>·</span>
            <span>{log.ip}</span>
            <span>·</span>
            <span>{log.device}</span>
          </div>
        </div>

        {/* Right side: time + expand toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-end">
            <p className="text-xs font-semibold text-muted-foreground">{relativeTime(ts, language)}</p>
            <p className="text-[10px] text-muted-foreground/60">{formatTime(ts)}</p>
          </div>
          {hasMeta && (
            <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && hasMeta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-primary/8 pt-2.5">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(ts)} {formatTime(ts)}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />IP: {log.ip}</span>
                <span className="flex items-center gap-1"><Settings className="h-3 w-3" />{log.device}</span>
              </div>
              <MetaDetails meta={meta} language={language} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ActivityLog = () => {
  const { language } = useLanguage();
  const { activityLogs, refreshActivityLogs } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expanded, setExpanded]         = useState(null);
  const [showFilters, setShowFilters]   = useState(false);

  const LOGS = activityLogs;  // alias so display logic below works unchanged

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  const filtered = LOGS.filter(log => {
    if (filterCat !== 'all' && log.category !== filterCat) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        (log.target || '').toLowerCase().includes(q) ||
        (ACTION_LABELS[log.action]?.en || '').toLowerCase().includes(q) ||
        log.category.includes(q)
      );
    }
    return true;
  });

  // Summary counts
  const logTotal   = LOGS.length;
  const failures   = LOGS.filter(l => l.status === 'failed').length;
  const today      = LOGS.filter(l => new Date(l.created_at ?? l.timestamp ?? '').toDateString() === new Date().toDateString()).length;

  // Pagination (20 events per page)
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(filtered, 20, search + filterCat + filterStatus);

  // Group the *paginated* slice by date
  const groups = paginated.reduce((acc, log) => {
    const key = formatDate(log.created_at ?? log.timestamp ?? '');
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{l('سجل النشاط', 'Activity Log')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{l('مراقبة جميع الأحداث والإجراءات في النظام', 'Monitor all system events and actions')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-primary/20 hover:bg-primary/10 transition text-muted-foreground">
            <Download className="h-3.5 w-3.5" />{l('تصدير', 'Export')}
          </button>
          <button onClick={refreshActivityLogs} className="p-2 rounded-xl border border-primary/20 hover:bg-primary/10 transition text-muted-foreground" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label_en: 'Total Events',  label_ar: 'إجمالي الأحداث', value: logTotal, color: 'text-blue-400',  icon: Clock },
          { label_en: 'Today',         label_ar: 'اليوم',          value: today,    color: 'text-emerald-400', icon: Calendar },
          { label_en: 'Failed Attempts', label_ar: 'محاولات فاشلة', value: failures, color: failures > 0 ? 'text-red-400' : 'text-muted-foreground', icon: AlertTriangle },
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

      {/* Search + filters */}
      <div className="bg-card border border-primary/10 rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={l('ابحث عن حدث، مستخدم، عنوان IP...', 'Search by event, user, IP...')}
              className={`w-full h-9 rounded-xl bg-primary/5 border border-primary/15 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/20 text-muted-foreground hover:bg-primary/10'}`}
          >
            <Filter className="h-3.5 w-3.5" />{l('فلاتر', 'Filters')}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="flex flex-wrap gap-3 pt-1">
                {/* Category filter */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">{l('الفئة', 'Category')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', ...Object.keys(CATEGORY_CONFIG)].map(cat => {
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <button key={cat} onClick={() => setFilterCat(cat)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                            filterCat === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                          }`}>
                          {cat === 'all' ? l('الكل', 'All') : l(cfg.label_ar, cfg.label_en)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Status filter */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">{l('الحالة', 'Status')}</p>
                  <div className="flex gap-1.5">
                    {['all', 'success', 'failed'].map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                          filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                        }`}>
                        {s === 'all' ? l('الكل', 'All') : s === 'success' ? l('ناجح', 'Success') : l('فشل', 'Failed')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {l(`${filtered.length} حدث`, `${filtered.length} event(s)`)}
        {(filterCat !== 'all' || filterStatus !== 'all' || search) && (
          <button onClick={() => { setFilterCat('all'); setFilterStatus('all'); setSearch(''); }}
            className="ms-2 text-primary hover:underline">{l('مسح الفلاتر', 'Clear filters')}</button>
        )}
      </p>


      {/* Log groups by date */}
      {Object.keys(groups).length === 0 ? (
        <div className="bg-card border border-primary/10 rounded-2xl p-16 text-center text-muted-foreground text-sm">
          {l('لا توجد أحداث تطابق البحث', 'No events match your search')}
        </div>
      ) : (
        Object.entries(groups).map(([date, logs]) => (
          <div key={date} className="mb-6">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-lg px-3 py-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{date}</span>
              </div>
              <div className="flex-1 h-px bg-primary/8" />
              <span className="text-xs text-muted-foreground">{logs.length} {l('حدث', 'events')}</span>
            </div>

            <div className="space-y-2">
              {logs.map(log => (
                <LogRow
                  key={log.id}
                  log={log}
                  language={language}
                  expanded={expanded === log.id}
                  onToggle={toggleExpand}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} labelAr="حدث" labelEn="event" language={language} />
      )}

      {/* Category legend */}
      <div className="mt-6 bg-card border border-primary/10 rounded-xl p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">{l('أنواع الأحداث:', 'Event categories:')}</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <span key={key} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
              <cfg.icon className="h-3 w-3" />
              {l(cfg.label_ar, cfg.label_en)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
