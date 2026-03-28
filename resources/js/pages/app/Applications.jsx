import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockCourses } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Applications = () => {
  const { t, language } = useLanguage();
  const { applications } = useAppData();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const userApps = applications.filter((a) => a.userId === (currentUser?.id || '1'));
  const filtered = filter === 'all' ? userApps : userApps.filter((a) => a.status === filter);

  const statuses = ['all', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'scheduled', 'completed'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.applications')}</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {s === 'all' ? t('common.viewAll') : <StatusBadge status={s} />}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">{t('common.noData')}</p>
        ) : (
          filtered.map((app) => {
            const course = mockCourses.find(c => c.id === app.courseId);
            return (
              <div key={app.id} className="bg-card rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelected(app)}>
                <div>
                  <p className="font-medium text-sm">{course ? course[language === 'ar' ? 'title_ar' : 'title_en'] : '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(app.appliedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('common.details')}</DialogTitle></DialogHeader>
          {selected && (() => {
            const course = mockCourses.find(c => c.id === selected.courseId);
            return (
              <div className="space-y-3 text-sm">
                <div><span className="font-medium">{t('nav.courses')}:</span> {course ? course[language === 'ar' ? 'title_ar' : 'title_en'] : '—'}</div>
                <div><span className="font-medium">{t('common.status')}:</span> <StatusBadge status={selected.status} /></div>
                <div><span className="font-medium">{t('common.date')}:</span> {new Date(selected.appliedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</div>
                {selected.notes && <div><span className="font-medium">{language === 'ar' ? 'ملاحظات' : 'Notes'}:</span> {selected.notes}</div>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Applications;
