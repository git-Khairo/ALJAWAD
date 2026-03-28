import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { mockCourses } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';

const Performance = () => {
  const { language } = useLanguage();
  const { applications } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const funnelData = [
    { name: l('مسودة', 'Draft'), value: applications.filter((a) => a.status === 'draft').length + 5, fill: '#94a3b8' },
    { name: l('مقدم', 'Submitted'), value: applications.filter((a) => a.status === 'submitted').length + 4, fill: '#3b82f6' },
    { name: l('قيد المراجعة', 'Under Review'), value: applications.filter((a) => a.status === 'under_review').length + 3, fill: '#eab308' },
    { name: l('مقبول', 'Approved'), value: applications.filter((a) => a.status === 'approved').length + 2, fill: '#22c55e' },
    { name: l('مكتمل', 'Completed'), value: applications.filter((a) => a.status === 'completed').length + 1, fill: '#10b981' },
  ];

  const courseStats = mockCourses.slice(0, 6).map(c => ({
    name: c[language === 'ar' ? 'title_ar' : 'title_en'].slice(0, 15),
    enrolled: c.enrolled,
    completed: Math.round(c.enrolled * 0.65),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('الأداء', 'Performance')}</h1>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Funnel */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{l('قمع التحويل', 'Conversion Funnel')}</h2>
          <div className="space-y-3">
            {funnelData.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-24 text-end text-muted-foreground">{item.name}</span>
                <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                  <div className="h-full rounded-full flex items-center px-3 text-xs font-medium text-primary-foreground" style={{ width: `${(item.value / funnelData[0].value) * 100}%`, backgroundColor: item.fill }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per Course Stats */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{l('إحصائيات الدورات', 'Course Stats')}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={courseStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="enrolled" fill="hsl(218 70% 18%)" radius={[0, 4, 4, 0]} name={l('مسجل', 'Enrolled')} />
              <Bar dataKey="completed" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} name={l('أكمل', 'Completed')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Performance;
