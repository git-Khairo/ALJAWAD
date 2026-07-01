import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Send, Clock, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Applications = () => {
  const { t, language } = useLanguage();
  const { myCourseRequests } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const requests = myCourseRequests ?? [];
  const isEmpty  = requests.length === 0;

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
                {requests.map((r, idx) => {
                  const subtitle = language === 'ar' ? r.plan_subtitle_ar : r.plan_subtitle_en;
                  const access   = language === 'ar' ? r.plan_access_ar   : r.plan_access_en;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-sm leading-snug">
                          {(language === 'ar' ? r.plan_name_ar : r.plan_name_en) || '—'}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>

                      {subtitle && (
                        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
                      )}

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {r.plan_price != null && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-primary shrink-0" />
                            <span>
                              {r.plan_price} {r.plan_currency || ''}
                            </span>
                          </div>
                        )}
                        {access && (
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{access}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-primary shrink-0" />
                          <span>
                            {l('تاريخ التقديم', 'Submitted')}: {r.created_at
                              ? new Date(r.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                              : '—'}
                          </span>
                        </div>
                        {r.reviewed_at && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                            <span>
                              {l('تاريخ المراجعة', 'Reviewed')}: {new Date(r.reviewed_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
