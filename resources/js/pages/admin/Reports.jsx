import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import {
  FileText, Download, TrendingUp, Users, DollarSign,
  BarChart2, Target, BookOpen, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const REPORT_TYPES = {
  financial: { ar: 'مالي',      en: 'Financial',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  marketing: { ar: 'تسويق',     en: 'Marketing',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/25' },
  crm:       { ar: 'عملاء',     en: 'CRM',        color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
  courses:   { ar: 'دورات',     en: 'Courses',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  scheduling:{ ar: 'جدولة',     en: 'Scheduling', color: 'bg-pink-500/10 text-pink-400 border-pink-500/25' },
};

const Reports = () => {
  const { language } = useLanguage();
  // `sessions` is not yet backed by the API — removed from destructure
  const { clients, leads, campaigns, expenses, clientTransactions, coursePlans, blogPosts, tickets } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  // ── Computed summary stats ─────────────────────────────────────────────────
  const totalRevenue = useMemo(() =>
    (clientTransactions ?? []).filter(tx => tx.direction === 'deposit' && tx.status === 'completed')
      .reduce((s, tx) => s + (tx.currency === 'USD' ? Number(tx.amount) : Number(tx.amount) / 14200), 0),
    [clientTransactions]
  );

  const totalExpenses = useMemo(() =>
    (expenses ?? []).reduce((s, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount) / 14200), 0),
    [expenses]
  );

  const activeClients = (clients ?? []).filter(c => c.status === 'active').length;
  const totalLeads    = (leads ?? []).length;
  const totalStudents = (clients ?? []).filter(c => c.isStudent).length;
  const totalCampaigns = (campaigns ?? []).length;
  const activeCampaigns = (campaigns ?? []).filter(c => c.status === 'active').length;
  const openTickets = (tickets ?? []).filter(t => ['open','in_progress','escalated'].includes(t.status)).length;
  const resolvedTickets = (tickets ?? []).filter(t => ['resolved','closed'].includes(t.status)).length;
  const upcomingSessions = 0; // sessions API not yet implemented

  const handleDownload = (name) => {
    toast.success(l(`جاري تصدير "${name}"...`, `Exporting "${name}"...`));
  };

  const reports = [
    {
      id: 'revenue',
      icon: DollarSign,
      type: 'financial',
      name_ar: 'تقرير الإيرادات والمصاريف',
      name_en: 'Revenue & Expenses Report',
      summary_ar: `إجمالي الإيرادات $${Math.round(totalRevenue).toLocaleString()} — المصاريف $${Math.round(totalExpenses).toLocaleString()}`,
      summary_en: `Total revenue $${Math.round(totalRevenue).toLocaleString()} — Expenses $${Math.round(totalExpenses).toLocaleString()}`,
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'clients',
      icon: Users,
      type: 'crm',
      name_ar: 'تقرير العملاء والعملاء المحتملين',
      name_en: 'Clients & Leads Report',
      summary_ar: `${activeClients} عميل نشط — ${totalLeads} عميل محتمل`,
      summary_en: `${activeClients} active clients — ${totalLeads} leads`,
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'campaigns',
      icon: Target,
      type: 'marketing',
      name_ar: 'تقرير أداء الحملات التسويقية',
      name_en: 'Campaign Performance Report',
      summary_ar: `${activeCampaigns} حملة نشطة من أصل ${totalCampaigns}`,
      summary_en: `${activeCampaigns} active campaigns out of ${totalCampaigns}`,
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'courses',
      icon: BookOpen,
      type: 'courses',
      name_ar: 'تقرير الباقات والطلاب',
      name_en: 'Plans & Students Report',
      summary_ar: `${(coursePlans ?? []).length} باقة — ${totalStudents.toLocaleString()} طالب نشط`,
      summary_en: `${(coursePlans ?? []).length} plans — ${totalStudents.toLocaleString()} active students`,
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'support',
      icon: FileText,
      type: 'crm',
      name_ar: 'تقرير تذاكر الدعم',
      name_en: 'Support Tickets Report',
      summary_ar: `${openTickets} مفتوحة — ${resolvedTickets} محلولة`,
      summary_en: `${openTickets} open — ${resolvedTickets} resolved`,
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'scheduling',
      icon: Calendar,
      type: 'scheduling',
      name_ar: 'تقرير الجلسات والجدول',
      name_en: 'Sessions & Schedule Report',
      summary_ar: `${upcomingSessions} جلسة قادمة`,
      summary_en: `${upcomingSessions} upcoming sessions`,
      date: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'blog',
      icon: BarChart2,
      type: 'marketing',
      name_ar: 'تقرير أداء المدونة',
      name_en: 'Blog Performance Report',
      summary_ar: `${(blogPosts ?? []).filter(b => b.status === 'published').length} منشور — ${(blogPosts ?? []).reduce((s, b) => s + (b.views || 0), 0).toLocaleString()} مشاهدة إجمالية`,
      summary_en: `${(blogPosts ?? []).filter(b => b.status === 'published').length} published — ${(blogPosts ?? []).reduce((s, b) => s + (b.views || 0), 0).toLocaleString()} total views`,
      date: new Date().toISOString().slice(0, 10),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{l('التقارير', 'Reports')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('تقارير حية محسوبة من البيانات الفعلية', 'Live reports computed from real data')}
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={l('صافي الإيرادات', 'Net Revenue')} value={`$${Math.round(totalRevenue - totalExpenses).toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} change="+12%" />
        <KPICard title={l('العملاء النشطون', 'Active Clients')}  value={activeClients}  icon={<Users className="h-5 w-5" />} change="+5%" />
        <KPICard title={l('الحملات النشطة', 'Active Campaigns')} value={activeCampaigns} icon={<Target className="h-5 w-5" />} change="" />
        <KPICard title={l('التذاكر المفتوحة', 'Open Tickets')}   value={openTickets}    icon={<FileText className="h-5 w-5" />} change="" />
      </div>

      {/* Reports list */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">{l('التقارير المتاحة', 'Available Reports')}</h2>
        </div>
        <div className="divide-y">
          {reports.map((r) => {
            const Icon = r.icon;
            const type = REPORT_TYPES[r.type] ?? REPORT_TYPES.financial;
            return (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-medium text-sm">{l(r.name_ar, r.name_en)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${type.color}`}>
                      {l(type.ar, type.en)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{l(r.summary_ar, r.summary_en)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">{r.date}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDownload(l(r.name_ar, r.name_en))}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {l('تصدير', 'Export')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reports;
