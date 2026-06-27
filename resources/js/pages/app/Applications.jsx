import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import { FileText, BookOpen, ChevronRight, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Applications = () => {
  const { t, language } = useLanguage();
  const { myCourseRequests, myEnrollments } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const requests    = myCourseRequests ?? [];
  const enrollments = myEnrollments ?? [];
  const isEmpty = requests.length === 0 && enrollments.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.applications')}</h1>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 opacity-30" />
          </div>
          <p className="text-sm font-medium mb-1">
            {l('لا توجد طلبات بعد', 'No applications yet')}
          </p>
          <p className="text-xs opacity-60 max-w-xs mb-4">
            {l(
              'اطلب الانضمام إلى خطة من صفحة الدورات وتابع حالتها هنا.',
              'Request to join a plan from the Courses page and track its status here.'
            )}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {l('استكشف الدورات', 'Explore courses')}
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Course requests */}
          {requests.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                {l('طلباتي', 'My Requests')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {requests.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">
                        {(language === 'ar' ? r.plan_name_ar : r.plan_name_en) || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : ''}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Enrolled courses */}
          {enrollments.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {l('دوراتي', 'My Courses')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {enrollments.map((e, idx) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <p className="font-semibold text-sm leading-snug">
                          {(language === 'ar' ? e.title_ar : e.title_en) || '—'}
                        </p>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-primary/10 pt-3">
                      <span>
                        {e.registration_date
                          ? new Date(e.registration_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : ''}
                      </span>
                      {e.payment_status && <StatusBadge status={e.payment_status} withIcon={false} />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
