import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/lib/format';

/**
 * Plan requests and where each one stands.
 *
 * A ruled list rather than a grid of cards: these are records with a status,
 * and a record list is read down a column, not scanned across tiles.
 */
const Applications = () => {
  const { t, language } = useLanguage();
  const { myCourseRequests } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const requests = myCourseRequests ?? [];

  return (
    <>
      <PageHeader
        title={t('app.applications')}
        description={l(
          'طلبات الانضمام إلى الخطط وحالة كل منها.',
          'Your requests to join a plan, and where each one stands.',
        )}
        actions={
          requests.length > 0 && (
            <Link to="/courses">
              <Button variant="outline" size="sm">{l('الخطط', 'Plans')}</Button>
            </Link>
          )
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={l('لا توجد طلبات بعد', 'No requests yet')}
          description={l(
            'اطلب الانضمام إلى خطة من صفحة الدورات، وتابع حالتها هنا.',
            'Request a plan from the Courses page and track its status here.',
          )}
          action={
            <Link to="/courses">
              <Button variant="accent">
                {l('استكشف الخطط', 'Browse the plans')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="border-t border-rule-strong">
          {requests.map((r) => {
            const name = l(r.plan_name_ar, r.plan_name_en) || '—';
            const subtitle = l(r.plan_subtitle_ar, r.plan_subtitle_en);
            const access = l(r.plan_access_ar, r.plan_access_en);

            return (
              <li key={r.id} className="grid gap-x-8 gap-y-3 border-b border-rule py-5 md:grid-cols-12">
                <div className="md:col-span-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-foreground">{name}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
                  {access && <p className="mt-1 text-xs text-fg-faint">{access}</p>}
                </div>

                {/* The record's facts, as a definition list. */}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:col-span-6 md:col-start-7 md:grid-cols-3">
                  <div>
                    <dt className="text-xs text-fg-faint">{l('السعر', 'Price')}</dt>
                    <dd className="ledger-num mt-0.5 text-foreground" dir="ltr">
                      {r.plan_price != null ? `$${r.plan_price}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-fg-faint">{l('قُدّم في', 'Submitted')}</dt>
                    <dd className="mt-0.5 text-foreground">{fmtDate(r.created_at, language)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-fg-faint">{l('روجع في', 'Reviewed')}</dt>
                    <dd className="mt-0.5 text-foreground">
                      {r.reviewed_at ? fmtDate(r.reviewed_at, language) : '—'}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default Applications;
