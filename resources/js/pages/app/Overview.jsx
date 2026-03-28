import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { mockCourses, mockNotifications } from '@/data/mockData';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { FileText, Calendar, Bell, Clock } from 'lucide-react';

const AppOverview = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { applications, sessions } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const userApps = applications.filter((a) => a.userId === (currentUser?.id || '1'));
  const latestApp = userApps[userApps.length - 1];
  const latestCourse = latestApp ? mockCourses.find(c => c.id === latestApp.courseId) : null;
  const nextSession = sessions[0];
  const nextSessionCourse = nextSession ? mockCourses.find(c => c.id === nextSession.courseId) : null;
  const unreadNotifs = mockNotifications.filter(n => !n.read);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.welcome')}، {currentUser?.[language === 'ar' ? 'name_ar' : 'name_en'] || l('أحمد', 'Ahmed')}</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <KPICard title={t('app.appStatus')} value={userApps.length} icon={<FileText className="h-5 w-5" />} />
        <KPICard title={t('app.nextSession')} value={nextSession ? nextSession.date : '—'} icon={<Calendar className="h-5 w-5" />} />
        <KPICard title={t('app.notifications')} value={unreadNotifs.length} icon={<Bell className="h-5 w-5" />} />
      </div>

      {/* Recent Applications */}
      <div className="bg-card rounded-xl border p-5 mb-6">
        <h2 className="font-semibold mb-4">{t('app.applications')}</h2>
        {userApps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="space-y-3">
            {userApps.slice(0, 4).map((app) => {
              const course = mockCourses.find(c => c.id === app.courseId);
              return (
                <div key={app.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{course ? course[language === 'ar' ? 'title_ar' : 'title_en'] : '—'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(app.appliedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Session */}
      {nextSession && (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{t('app.nextSession')}</h2>
          <div className="flex items-start gap-4 p-3 bg-background rounded-lg border">
            <div className="p-2 rounded-lg bg-accent/10"><Clock className="h-5 w-5 text-accent" /></div>
            <div>
              <p className="font-medium text-sm">{nextSession[language === 'ar' ? 'title_ar' : 'title_en']}</p>
              <p className="text-xs text-muted-foreground mt-1">{nextSession.date} — {nextSession.time}</p>
              <p className="text-xs text-muted-foreground">{nextSession[language === 'ar' ? 'instructor_ar' : 'instructor_en']}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppOverview;
