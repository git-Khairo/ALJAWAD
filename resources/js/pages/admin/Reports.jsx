import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
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

const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const Reports = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { clients, leads, campaigns, expenses, clientTransactions, coursePlans, blogPosts, tickets } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const fmtUsd = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`;

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

  const today = new Date().toISOString().slice(0, 10);

  // ── Per-report data tables (for the PDF) ───────────────────────────────────
  const reportTable = (id) => {
    switch (id) {
      case 'revenue': return {
        columns: [l('التاريخ', 'Date'), l('العميل', 'Client'), l('النوع', 'Type'), l('المبلغ', 'Amount'), l('العملة', 'Currency')],
        rows: (clientTransactions ?? []).map(t => [String(t.date ?? '').slice(0, 10), t.client ?? '', t.direction ?? '', Math.round(Number(t.amount) || 0).toLocaleString(), t.currency ?? 'USD']),
      };
      case 'clients': return {
        columns: [l('الاسم', 'Name'), l('الهاتف', 'Phone'), l('الحالة', 'Status'), l('انضم', 'Joined')],
        rows: (clients ?? []).map(c => [c.name ?? '', c.phone ?? '', c.status ?? '', String(c.joined ?? '').slice(0, 10)]),
      };
      case 'campaigns': return {
        columns: [l('الحملة', 'Campaign'), l('الحالة', 'Status'), l('الميزانية', 'Budget'), l('الإنفاق', 'Spent'), l('محتملون', 'Leads'), l('تحويلات', 'Conv.')],
        rows: (campaigns ?? []).map(c => [language === 'ar' ? c.name_ar : c.name_en, c.status ?? '', fmtUsd(c.budget), fmtUsd(c.spent), c.leads ?? 0, c.conversions ?? 0]),
      };
      case 'courses': return {
        columns: [l('الباقة', 'Plan'), l('السعر', 'Price')],
        rows: (coursePlans ?? []).map(p => [language === 'ar' ? (p.name_ar ?? p.name) : (p.name_en ?? p.name), fmtUsd(p.price)]),
      };
      case 'support': return {
        columns: ['#', l('الموضوع', 'Subject'), l('الحالة', 'Status'), l('الأولوية', 'Priority')],
        rows: (tickets ?? []).map(t => [t.id, t.subject ?? '', t.status ?? '', t.priority ?? '']),
      };
      case 'blog': return {
        columns: [l('العنوان', 'Title'), l('الحالة', 'Status'), l('المشاهدات', 'Views')],
        rows: (blogPosts ?? []).map(b => [language === 'ar' ? (b.title_ar ?? b.title) : (b.title_en ?? b.title), b.status ?? '', b.views ?? 0]),
      };
      default: return { columns: [], rows: [] };
    }
  };

  // ── Export → open a print-ready document (Save as PDF) ─────────────────────
  const exportReport = (report) => {
    const { columns, rows } = reportTable(report.id);
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const title = l(report.name_ar, report.name_en);
    const summary = l(report.summary_ar, report.summary_en);
    const align = language === 'ar' ? 'right' : 'left';

    const head = columns.map(c => `<th>${escapeHtml(c)}</th>`).join('');
    const body = rows.length
      ? rows.map(r => `<tr>${r.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columns.length || 1}" class="empty">${l('لا توجد بيانات', 'No data')}</td></tr>`;

    const html = `<!doctype html><html dir="${dir}" lang="${language}"><head><meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: ${language === 'ar' ? "'Segoe UI', Tahoma, Arial" : "'Segoe UI', Arial"}, sans-serif; color: #111; margin: 32px; text-align: ${align}; }
        .brand { color: #b8860b; font-weight: 700; font-size: 13px; letter-spacing: .5px; }
        h1 { font-size: 20px; margin: 4px 0 2px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
        .summary { background: #faf6ec; border: 1px solid #e7dcbd; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 7px 9px; text-align: ${align}; }
        thead th { background: #f3f3f3; font-weight: 700; }
        tbody tr:nth-child(even) { background: #fafafa; }
        td.empty { text-align: center; color: #999; padding: 20px; }
        footer { margin-top: 18px; color: #999; font-size: 11px; }
        @media print { body { margin: 14mm; } }
      </style></head><body>
        <div class="brand">AlJawad Trading Academy</div>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">${l('تاريخ التقرير', 'Report date')}: ${today} · ${rows.length} ${l('سجل', 'records')}</div>
        <div class="summary">${escapeHtml(summary)}</div>
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        <footer>${l('تم الإنشاء بواسطة لوحة تحكم الجواد', 'Generated by the AlJawad dashboard')} — ${new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</footer>
        <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};window.onafterprint=function(){window.close();};</script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { toast.error(l('فعّل النوافذ المنبثقة للتصدير', 'Allow pop-ups to export')); return; }
    w.document.write(html);
    w.document.close();
  };

  // Each report is gated by the permission its data belongs to. Admin has all.
  const reports = [
    { id: 'revenue',   icon: DollarSign, type: 'financial', perm: 'view finance',
      name_ar: 'تقرير الإيرادات والمصاريف', name_en: 'Revenue & Expenses Report',
      summary_ar: `إجمالي الإيرادات $${Math.round(totalRevenue).toLocaleString()} — المصاريف $${Math.round(totalExpenses).toLocaleString()}`,
      summary_en: `Total revenue $${Math.round(totalRevenue).toLocaleString()} — Expenses $${Math.round(totalExpenses).toLocaleString()}`, date: today },
    { id: 'clients',   icon: Users, type: 'crm', perm: 'view clients',
      name_ar: 'تقرير العملاء والعملاء المحتملين', name_en: 'Clients & Leads Report',
      summary_ar: `${activeClients} عميل نشط — ${totalLeads} عميل محتمل`,
      summary_en: `${activeClients} active clients — ${totalLeads} leads`, date: today },
    { id: 'campaigns', icon: Target, type: 'marketing', perm: 'view campaigns',
      name_ar: 'تقرير أداء الحملات التسويقية', name_en: 'Campaign Performance Report',
      summary_ar: `${activeCampaigns} حملة نشطة من أصل ${totalCampaigns}`,
      summary_en: `${activeCampaigns} active campaigns out of ${totalCampaigns}`, date: today },
    { id: 'courses',   icon: BookOpen, type: 'courses', perm: 'view courses',
      name_ar: 'تقرير الباقات والطلاب', name_en: 'Plans & Students Report',
      summary_ar: `${(coursePlans ?? []).length} باقة — ${totalStudents.toLocaleString()} طالب نشط`,
      summary_en: `${(coursePlans ?? []).length} plans — ${totalStudents.toLocaleString()} active students`, date: today },
    { id: 'support',   icon: FileText, type: 'crm', perm: 'view support tickets',
      name_ar: 'تقرير تذاكر الدعم', name_en: 'Support Tickets Report',
      summary_ar: `${openTickets} مفتوحة — ${resolvedTickets} محلولة`,
      summary_en: `${openTickets} open — ${resolvedTickets} resolved`, date: today },
    { id: 'scheduling', icon: Calendar, type: 'scheduling', perm: 'view scheduling',
      name_ar: 'تقرير الجلسات والجدول', name_en: 'Sessions & Schedule Report',
      summary_ar: `${upcomingSessions} جلسة قادمة`,
      summary_en: `${upcomingSessions} upcoming sessions`, date: today },
    { id: 'blog',      icon: BarChart2, type: 'marketing', perm: 'view blog',
      name_ar: 'تقرير أداء المدونة', name_en: 'Blog Performance Report',
      summary_ar: `${(blogPosts ?? []).filter(b => b.status === 'published').length} منشور — ${(blogPosts ?? []).reduce((s, b) => s + (b.views || 0), 0).toLocaleString()} مشاهدة إجمالية`,
      summary_en: `${(blogPosts ?? []).filter(b => b.status === 'published').length} published — ${(blogPosts ?? []).reduce((s, b) => s + (b.views || 0), 0).toLocaleString()} total views`, date: today },
  ];

  const visibleReports = reports.filter(r => !r.perm || hasPermission(r.perm));

  const kpiCards = [
    { perm: 'view finance',        title: l('صافي الإيرادات', 'Net Revenue'), value: `$${Math.round(totalRevenue - totalExpenses).toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, change: '' },
    { perm: 'view clients',        title: l('العملاء النشطون', 'Active Clients'), value: activeClients, icon: <Users className="h-5 w-5" />, change: '' },
    { perm: 'view campaigns',      title: l('الحملات النشطة', 'Active Campaigns'), value: activeCampaigns, icon: <Target className="h-5 w-5" />, change: '' },
    { perm: 'view support tickets', title: l('التذاكر المفتوحة', 'Open Tickets'), value: openTickets, icon: <FileText className="h-5 w-5" />, change: '' },
  ].filter(k => !k.perm || hasPermission(k.perm));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{l('التقارير', 'Reports')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('تقارير حية محسوبة من البيانات الفعلية — حسب صلاحياتك', 'Live reports from real data — scoped to your permissions')}
        </p>
      </div>

      {/* Summary KPIs */}
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k, i) => (
            <KPICard key={i} title={k.title} value={k.value} icon={k.icon} change={k.change} />
          ))}
        </div>
      )}

      {/* Reports list */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">{l('التقارير المتاحة', 'Available Reports')}</h2>
        </div>
        <div className="divide-y">
          {visibleReports.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {l('لا توجد تقارير متاحة لصلاحياتك', 'No reports available for your permissions')}
            </div>
          )}
          {visibleReports.map((r) => {
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
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => exportReport(r)}>
                    <Download className="h-3.5 w-3.5" />
                    {l('تصدير PDF', 'Export PDF')}
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
