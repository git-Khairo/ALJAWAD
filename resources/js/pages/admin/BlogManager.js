import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BlogManager = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const posts = [
    { title: l('أساسيات تداول الفوركس', 'Forex Trading Basics'), status: 'published', date: '2026-03-10', views: 1240 },
    { title: l('كيف تبدأ في العملات الرقمية', 'How to Start in Crypto'), status: 'draft', date: '2026-03-14', views: 0 },
    { title: l('استراتيجيات إدارة المخاطر', 'Risk Management Strategies'), status: 'published', date: '2026-03-08', views: 890 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('إدارة المدونة', 'Blog Manager')}</h1>
        <Button size="sm"><Plus className="h-4 w-4 me-1" />{l('مقال جديد', 'New Post')}</Button>
      </div>
      <div className="space-y-3">
        {posts.map((p, i) => (
          <div key={i} className="bg-card rounded-xl border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.date} · {p.views} {l('مشاهدة', 'views')} · <span className={p.status === 'published' ? 'text-green-500' : 'text-yellow-500'}>{p.status === 'published' ? l('منشور', 'Published') : l('مسودة', 'Draft')}</span></p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogManager;
