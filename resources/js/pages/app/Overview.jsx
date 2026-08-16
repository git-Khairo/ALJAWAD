import { Link } from 'react-router-dom';
import { FileText, Calendar, Bell, ChevronRight, Check, BookOpen } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { KPICard, KPIRow } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/lib/format';

const STAGE_STEPS = ['lead', 'client_inactive', 'client_active'];

/**
 * The client's landing page.
 *
 * The previous version opened with a glowing gradient hero, an animated
 * progress ring and a neon timeline, and only got to the actual data below
 * the fold. This one leads with the four figures and the two lists someone
 * signs in to check.
 */
const AppOverview = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { myCourseRequests, myAppointments, notifications } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const requests = myCourseRequests ?? [];
  const appointments = myAppointments ?? [];
  const nextSession = appointments[0] ?? null;
  const unread = (notifications ?? []).filter((n) => !n.read);

  const userName = currentUser?.name || l('مرحباً', 'Hello');
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? l('صباح الخير', 'Good morning')
    : hour < 18 ? l('مساء الخير', 'Good afternoon')
    : l('مساء النور', 'Good evening');

  const approved = requests.filter((r) => r.status === 'approved').length;

  // Journey follows the client's real CRM stage. Coaches have no
  // profile.stage, so they fall back to progress through their requests.
  const stage = currentUser?.profile?.stage;
  const stageIdx = STAGE_STEPS.indexOf(stage);

  const journey =
    stageIdx >= 0
      ? [
          { label: l('عميل محتمل', 'Lead'), done: stageIdx >= 0 },
          { label: l('حساب جاهز', 'Account ready'), done: stageIdx >= 1 },
          { label: l('عميل نشط', 'Active client'), done: stageIdx >= 2 },
        ]
      : [
          { label: l('التسجيل', 'Registered'), done: true },
          { label: l('قيد التعلم', 'Learning'), done: requests.length > 0 },
          { label: l('تدريب عملي', 'Practice'), done: approved > 0 },
          { label: l('معتمد', 'Certified'), done: approved >= 2 },
        ];

  const doneCount = journey.filter((j) => j.done).length;

  return (
    <>
      <PageHeader
        title={`${greeting}، ${userName}`}
        description={l(
          'ملخّص حسابك: طلباتك، جلستك القادمة، وما يحتاج انتباهك.',
          'Your account at a glance: requests, next session, and anything needing attention.',
        )}
        actions={
          <Link to="/courses">
            <Button variant="accent" size="sm">
              {l('استكشف الخطط', 'Browse plans')}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        }
      />

      <div className="space-y-8">
        {/* ───────── Figures ───────── */}
        <KPIRow>
          <KPICard
            title={t('app.appStatus')}
            value={requests.length}
            icon={<FileText strokeWidth={1.75} />}
          />
          <KPICard
            title={l('الطلبات المقبولة', 'Approved')}
            value={approved}
            icon={<Check strokeWidth={1.75} />}
          />
          <KPICard
            title={t('app.nextSession')}
            value={nextSession?.date ? fmtDate(nextSession.date, language) : '—'}
            icon={<Calendar strokeWidth={1.75} />}
            hint={nextSession?.time}
          />
          <KPICard
            title={t('app.notifications')}
            value={unread.length}
            icon={<Bell strokeWidth={1.75} />}
            hint={unread.length > 0 ? l('غير مقروء', 'unread') : l('لا جديد', 'all caught up')}
          />
        </KPIRow>

        {/* ───────── Journey ───────── */}
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {l('رحلتك', 'Your journey')}
            </h2>
            <span className="ledger-num text-xs text-fg-faint" dir="ltr">
              {doneCount}/{journey.length}
            </span>
          </div>

          {/* Each step is a rule that fills when reached. No ring, no glow. */}
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, i) => (
              <li key={step.label} aria-current={step.done && i === doneCount - 1 ? 'step' : undefined}>
                <span
                  className={`block h-0.5 ${step.done ? 'bg-primary' : 'bg-rule'}`}
                  aria-hidden="true"
                />
                <span className="mt-2.5 flex items-center gap-2">
                  {step.done && <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />}
                  <span className={`text-sm ${step.done ? 'text-foreground' : 'text-fg-faint'}`}>
                    {step.label}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ───────── Lists ───────── */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Requests */}
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-rule pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {t('app.applications')}
              </h2>
              {requests.length > 0 && (
                <Link
                  to="/app/applications"
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  {t('common.viewAll')}
                  <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
              )}
            </div>

            {requests.length === 0 ? (
              <div className="border border-dashed border-rule-strong px-5 py-10 text-center">
                <BookOpen className="mx-auto mb-3 h-5 w-5 text-fg-faint" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-sm text-fg-muted">
                  {l('لم تطلب أي خطة بعد.', 'You have not requested a plan yet.')}
                </p>
                <Link
                  to="/courses"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                  {l('ابدأ من هنا', 'Start here')}
                  <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              <ul>
                {requests.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {l(r.plan_name_ar, r.plan_name_en) || '—'}
                      </span>
                      <span className="block text-xs text-fg-faint">
                        {fmtDate(r.created_at, language)}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Next session + unread */}
          <section>
            <div className="mb-3 border-b border-rule pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {t('app.nextSession')}
              </h2>
            </div>

            {nextSession ? (
              <div className="border border-rule p-4">
                <p className="ledger-num text-lg text-foreground" dir="ltr">
                  {fmtDate(nextSession.date, language)}
                </p>
                {nextSession.time && (
                  <p className="ledger-num mt-0.5 text-sm text-fg-muted" dir="ltr">{nextSession.time}</p>
                )}
                {nextSession.title && (
                  <p className="mt-2 text-sm text-foreground">{nextSession.title}</p>
                )}
              </div>
            ) : (
              <p className="border border-dashed border-rule-strong px-4 py-8 text-center text-sm text-fg-muted">
                {l('لا توجد جلسات مجدولة.', 'Nothing scheduled.')}
              </p>
            )}

            <div className="mb-3 mt-8 flex items-baseline justify-between gap-4 border-b border-rule pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {t('app.notifications')}
              </h2>
              {unread.length > 0 && (
                <Link
                  to="/app/notifications"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  {t('common.viewAll')}
                </Link>
              )}
            </div>

            {unread.length === 0 ? (
              <p className="py-3 text-sm text-fg-muted">
                {l('لا توجد إشعارات جديدة.', 'Nothing new.')}
              </p>
            ) : (
              <ul>
                {unread.slice(0, 4).map((n) => (
                  <li key={n.id} className="border-b border-rule py-3">
                    <p className="text-sm text-foreground">{l(n.title_ar, n.title_en) || n.title}</p>
                    {n.created_at && (
                      <p className="mt-0.5 text-xs text-fg-faint">{fmtDate(n.created_at, language)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AppOverview;
