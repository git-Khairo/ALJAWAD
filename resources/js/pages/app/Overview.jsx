import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { mockCourses, mockNotifications } from '@/data/mockData';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  FileText, Calendar, Bell, Clock, ChevronRight, Sparkles, BookOpen,
  TrendingUp, GraduationCap, Target, Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';

const AppOverview = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { applications, sessions } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const userApps = applications.filter((a) => a.userId === (currentUser?.id || '1'));
  const latestApp = userApps[userApps.length - 1];
  const latestCourse = latestApp ? mockCourses.find(c => c.id === latestApp.courseId) : null;
  const nextSession = sessions[0];
  const unreadNotifs = mockNotifications.filter(n => !n.read);

  const userName = currentUser?.[language === 'ar' ? 'name_ar' : 'name_en'] || l('أحمد', 'Ahmed');

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? l('صباح الخير', 'Good morning')
    : hour < 18 ? l('مساء الخير', 'Good afternoon')
    : l('مساء النور', 'Good evening');

  const completedApps = userApps.filter(a => a.status === 'completed' || a.status === 'approved').length;
  const totalApps = userApps.length || 1;
  const progressPct = Math.round((completedApps / totalApps) * 100);

  const journey = [
    { icon: FileText,    label: l('التسجيل', 'Registered'),  done: true },
    { icon: BookOpen,    label: l('قيد التعلم', 'Learning'),  done: userApps.length > 0 },
    { icon: Target,      label: l('تدريب عملي', 'Practice'),   done: completedApps > 0 },
    { icon: Trophy,      label: l('معتمد', 'Certified'),        done: completedApps >= 2 },
  ];

  return (
    <div className="space-y-6">
      {/* ───────── Hero greeting ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-xl p-6 md:p-8"
      >
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none" />

        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {greet}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
              <span className="gradient-text">{userName}</span>
              <span className="text-foreground/70">، </span>
              {l('استعد لخطوتك القادمة', 'ready for the next stride')}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              {l(
                'تابع تقدمك، راجع جلساتك القادمة واكتشف فرصًا جديدة في السوق.',
                'Track your progress, review upcoming sessions and discover new opportunities in the market.'
              )}
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm shadow-neon hover:scale-[1.03] transition-transform"
              >
                <GraduationCap className="h-4 w-4" />
                {l('استكشف الدورات', 'Explore courses')}
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
              <Link
                to="/app/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 font-semibold text-sm transition"
              >
                {l('طلباتي', 'My applications')}
              </Link>
            </div>
          </div>

          {/* Progress ring */}
          <ProgressRing value={progressPct} label={l('اكتمال', 'Complete')} />
        </div>
      </motion.div>

      {/* ───────── KPI grid ───────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('app.appStatus')}
          value={userApps.length}
          icon={<FileText className="h-5 w-5" />}
        />
        <KPICard
          title={l('الدورات المكتملة', 'Completed')}
          value={completedApps}
          icon={<Trophy className="h-5 w-5" />}
          change={completedApps > 0 ? `+${completedApps}` : undefined}
        />
        <KPICard
          title={t('app.nextSession')}
          value={nextSession ? nextSession.date : '—'}
          icon={<Calendar className="h-5 w-5" />}
          hint={nextSession?.time}
        />
        <KPICard
          title={t('app.notifications')}
          value={unreadNotifs.length}
          icon={<Bell className="h-5 w-5" />}
          hint={unreadNotifs.length > 0 ? l('جديد', 'new') : l('الكل محدث', 'all caught up')}
        />
      </div>

      {/* ───────── Journey timeline ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {l('رحلتك', 'Your journey')}
          </h2>
          <span className="text-xs text-muted-foreground">{progressPct}%</span>
        </div>

        <div className="relative">
          <div className="absolute top-5 inset-x-5 h-0.5 bg-primary/10 rounded-full">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progressPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/80 shadow-[0_0_12px_hsl(195_65%_55%/0.8)]"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {journey.map((j, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 ${
                    j.done
                      ? 'bg-primary text-primary-foreground border-primary shadow-neon'
                      : 'bg-background border-primary/20 text-muted-foreground'
                  }`}
                >
                  <j.icon className="h-4 w-4" />
                </motion.div>
                <span className="text-xs font-medium">{j.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ───────── Recent + next session ───────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Applications */}
        <div className="lg:col-span-2 rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t('app.applications')}</h2>
            <Link to="/app/applications" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              {l('عرض الكل', 'View all')}
              <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>

          {userApps.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              <Link
                to="/courses"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                {l('ابدأ رحلتك', 'Start your journey')}
                <ChevronRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {userApps.slice(0, 4).map((app, idx) => {
                const course = mockCourses.find(c => c.id === app.courseId);
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: language === 'ar' ? 10 : -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    whileHover={{ x: language === 'ar' ? -4 : 4 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {course ? course[language === 'ar' ? 'title_ar' : 'title_en'] : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.appliedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming session */}
        <div className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {t('app.nextSession')}
            </h2>

            {nextSession ? (
              <div>
                <p className="text-sm font-semibold mb-1 leading-snug">
                  {nextSession[language === 'ar' ? 'title_ar' : 'title_en']}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextSession[language === 'ar' ? 'instructor_ar' : 'instructor_en']}
                </p>

                <div className="mt-4 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      {l('الموعد', 'Scheduled')}
                    </p>
                    <p className="text-sm font-bold text-primary">{nextSession.date}</p>
                  </div>
                  <div className="h-10 w-px bg-primary/20" />
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      {l('الوقت', 'Time')}
                    </p>
                    <p className="text-sm font-bold text-primary">{nextSession.time}</p>
                  </div>
                </div>

                <Link
                  to="/app/applications"
                  className="mt-4 flex items-center justify-center gap-1 py-2 rounded-xl border border-primary/30 text-primary font-semibold text-xs hover:bg-primary/10 transition"
                >
                  {l('عرض التفاصيل', 'View details')}
                  <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{l('لا توجد جلسات قادمة.', 'No upcoming sessions.')}</p>
            )}

            {latestCourse && (
              <div className="mt-6 pt-4 border-t border-primary/10">
                <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground mb-1">
                  {l('آخر نشاط', 'Latest activity')}
                </p>
                <p className="text-sm font-medium">{latestCourse[language === 'ar' ? 'title_ar' : 'title_en']}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressRing = ({ value, label }) => {
  const R = 46;
  const C = 2 * Math.PI * R;
  const offset = C - (Math.max(0, Math.min(100, value)) / 100) * C;
  return (
    <div className="relative w-32 h-32 shrink-0 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="progress-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(195 85% 70%)" />
            <stop offset="100%" stopColor="hsl(195 65% 47%)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={R} stroke="hsl(195 65% 47% / 0.15)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="60" cy="60" r={R}
          stroke="url(#progress-g)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 0 6px hsl(195 65% 55% / 0.7))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums">{value}%</span>
        <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

export default AppOverview;
