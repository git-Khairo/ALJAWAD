import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockCourses } from '@/data/mockData';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminOverview = () => {
  const { t, language } = useLanguage();
  const { users, applications, transactions } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const totalRevenue = transactions.filter((tx) => tx.type === 'payment' && tx.status === 'completed').reduce((s, tx) => s + tx.amount, 0);
  const activeApps = applications.filter((a) => !['completed', 'rejected', 'draft'].includes(a.status)).length;

  const chartData = [
    { name: l('يناير', 'Jan'), value: 4500 }, { name: l('فبراير', 'Feb'), value: 7200 },
    { name: l('مارس', 'Mar'), value: 3200 }, { name: l('أبريل', 'Apr'), value: 8500 },
    { name: l('مايو', 'May'), value: 6100 }, { name: l('يونيو', 'Jun'), value: 9200 },
  ];

  const pieData = [
    { name: l('مقبول', 'Approved'), value: applications.filter((a) => a.status === 'approved').length },
    { name: l('قيد المراجعة', 'Under Review'), value: applications.filter((a) => a.status === 'under_review').length },
    { name: l('مقدم', 'Submitted'), value: applications.filter((a) => a.status === 'submitted').length },
    { name: l('مرفوض', 'Rejected'), value: applications.filter((a) => a.status === 'rejected').length },
  ];
  const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#ef4444'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.overview')}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title={t('admin.totalUsers')} value={users.length} icon={<Users className="h-5 w-5" />} change="+12%" />
        <KPICard title={t('admin.totalRevenue')} value={`${totalRevenue.toLocaleString()} ${t('common.sar')}`} icon={<DollarSign className="h-5 w-5" />} change="+8%" />
        <KPICard title={t('admin.activeApplications')} value={activeApps} icon={<FileText className="h-5 w-5" />} />
        <KPICard title={t('admin.completionRate')} value="78%" icon={<TrendingUp className="h-5 w-5" />} change="+5%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{l('الإيرادات الشهرية', 'Monthly Revenue')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(218 70% 18%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{l('توزيع الطلبات', 'Application Distribution')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold mb-4">{t('admin.recentActivity')}</h2>
        <div className="space-y-3">
          {applications.slice(0, 5).map((app) => {
            const course = mockCourses.find(c => c.id === app.courseId);
            const user = users.find((u) => u.id === app.userId);
            return (
              <div key={app.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{user ? user[language === 'ar' ? 'name_ar' : 'name_en'] : '—'}</p>
                  <p className="text-xs text-muted-foreground">{course ? course[language === 'ar' ? 'title_ar' : 'title_en'] : '—'}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
