import { Check } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/badge';

const STAGE_STEPS = ['lead', 'client_inactive', 'client_active'];

const STAGE_COPY = {
  lead: {
    ar: { label: 'عميل محتمل', desc: 'سجّلت معنا لكنك لم تبدأ بعد علاقة تداول ممولة. تواصل مع الفريق لفتح حساب.' },
    en: { label: 'Lead', desc: 'You have registered, but have not started a funded trading relationship yet. Talk to the team to open an account.' },
  },
  client_inactive: {
    ar: { label: 'عميل غير نشط', desc: 'حسابك مُنشأ وجاهز. قم بأول إيداع لتفعيله والبدء بالتداول.' },
    en: { label: 'Inactive client', desc: 'Your account is set up and ready. Make your first deposit to activate it.' },
  },
  client_active: {
    ar: { label: 'عميل نشط', desc: 'حسابك نشط وممول بالكامل.' },
    en: { label: 'Active client', desc: 'Your account is active and fully funded.' },
  },
};

/**
 * Profile.
 *
 * Account facts are a definition list, not a stack of rows each carrying a
 * tinted icon tile. The icons were decorative: every row had one, so none of
 * them distinguished anything.
 */
const Profile = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const displayName = currentUser?.name ?? '—';
  const displayEmail = currentUser?.email ?? '—';
  const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const isCoach = currentUser?.user_type === 'coach';
  const stage = currentUser?.profile?.stage;
  const stageIdx = STAGE_STEPS.indexOf(stage);
  const stageCopy = stage ? STAGE_COPY[stage]?.[language] : null;

  const memberSince = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString(
        language === 'ar' ? 'ar-SA' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      )
    : '—';

  const facts = [
    { term: t('auth.email'), value: displayEmail, ltr: true },
    { term: t('auth.phone'), value: currentUser?.phone || l('غير مضاف', 'Not added'), ltr: !!currentUser?.phone },
    { term: l('عضو منذ', 'Member since'), value: memberSince },
    { term: l('مرتبط بتيليجرام', 'Telegram linked'), value: currentUser?.telegram_chat_id ? l('نعم', 'Yes') : l('لا', 'No') },
    ...(currentUser?.affiliate_code
      ? [{ term: l('رمز الإحالة', 'Affiliate code'), value: currentUser.affiliate_code, ltr: true, mono: true }]
      : []),
    ...(currentUser?.referred_by
      ? [{ term: l('تمت الإحالة عبر', 'Referred by'), value: currentUser.referred_by }]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t('app.profile')}
        description={l('بيانات حسابك كما هي مسجلة لدينا.', 'Your account details as we hold them.')}
      />

      <div className="grid max-w-4xl gap-10 lg:grid-cols-5 lg:gap-12">
        {/* Identity */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded bg-primary text-xl font-bold text-primary-foreground"
              aria-hidden="true"
            >
              {initials || '—'}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-foreground">{displayName}</h2>
              <p className="truncate text-sm text-fg-muted" dir="ltr">{displayEmail}</p>
              {currentUser?.roles?.[0] && (
                <Badge variant="accent" className="mt-2 capitalize">{currentUser.roles[0]}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Facts + stage */}
        <div className="space-y-10 lg:col-span-3">
          <section>
            <h2 className="mb-3 border-b border-rule pb-2 text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {l('تفاصيل الحساب', 'Account details')}
            </h2>
            <dl>
              {facts.map((f) => (
                <div
                  key={f.term}
                  className="flex items-baseline justify-between gap-6 border-b border-rule py-3"
                >
                  <dt className="shrink-0 text-sm text-fg-faint">{f.term}</dt>
                  <dd
                    className={`min-w-0 truncate text-end text-sm text-foreground ${f.mono ? 'font-mono' : ''}`}
                    dir={f.ltr ? 'ltr' : undefined}
                  >
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 border-b border-rule pb-2 text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
              {l('نوع الحساب', 'Account type')}
            </h2>

            {isCoach ? (
              <p className="measure text-sm leading-relaxed text-fg-muted">
                {l(
                  'حسابك من نوع "كوتش": عضو في فريق العمل لديه صلاحيات إدارية داخل لوحة التحكم بحسب دوره.',
                  'Your account is a coach account: a staff member with admin permissions in the dashboard, scoped to their role.',
                )}
              </p>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground">{stageCopy?.label ?? '—'}</p>
                <p className="measure mt-1.5 text-sm leading-relaxed text-fg-muted">
                  {stageCopy?.desc ?? l('لا توجد بيانات حالة.', 'No stage data available.')}
                </p>

                {/* Stage marker: three rules, filled up to where you are. */}
                <ol className="mt-6 grid grid-cols-3 gap-2">
                  {STAGE_STEPS.map((s, i) => {
                    const reached = i <= stageIdx;
                    const copy = STAGE_COPY[s][language];
                    return (
                      <li key={s} aria-current={i === stageIdx ? 'step' : undefined}>
                        <span
                          className={`block h-0.5 ${reached ? 'bg-primary' : 'bg-rule'}`}
                          aria-hidden="true"
                        />
                        <span className="mt-2 flex items-center gap-1.5">
                          {reached && i < stageIdx && (
                            <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={2.5} />
                          )}
                          <span className={`text-xs ${reached ? 'text-foreground' : 'text-fg-faint'}`}>
                            {copy.label}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Profile;
