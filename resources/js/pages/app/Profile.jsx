import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircle, Mail, Phone, Calendar, Send, Users, Award,
  Circle, CircleDot, CheckCircle2,
} from 'lucide-react';

const STAGE_STEPS = ['lead', 'client_inactive', 'client_active'];

const STAGE_COPY = {
  lead: {
    ar: { label: 'عميل محتمل (Lead)', desc: 'سجّلت معنا لكنك لم تبدأ بعد علاقة تداول ممولة. تواصل مع فريقنا لفتح حساب.' },
    en: { label: 'Lead', desc: "You've registered but haven't started a funded trading relationship with us yet. Reach out to our team to open an account." },
  },
  client_inactive: {
    ar: { label: 'عميل غير نشط', desc: 'حسابك مُنشأ وجاهز — قم بأول عملية إيداع لتفعيله والبدء بالتداول.' },
    en: { label: 'Inactive Client', desc: 'Your account is set up and ready — make your first deposit to activate it and start trading.' },
  },
  client_active: {
    ar: { label: 'عميل نشط', desc: 'حسابك نشط وممول بالكامل. استمر بمتابعة تحليلاتنا وصفقاتك!' },
    en: { label: 'Active Client', desc: 'Your account is active and fully funded. Keep following our analysis and your trades!' },
  },
};

const Profile = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const displayName  = currentUser?.name ?? '—';
  const displayEmail = currentUser?.email ?? '—';
  const initials     = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isCoach      = currentUser?.user_type === 'coach';
  const stage        = currentUser?.profile?.stage; // Client model stage — undefined for coaches
  const stageIdx     = STAGE_STEPS.indexOf(stage);
  const stageCopy    = stage ? STAGE_COPY[stage]?.[language] : null;

  const memberSince = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const row = (Icon, label, value) => (
    <div className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.profile')}</h1>

      <div className="grid lg:grid-cols-5 gap-5 max-w-4xl">
        {/* Identity card */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-6 h-fit">
          <div className="flex flex-col items-center text-center mb-2">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-3">
              {initials || <UserCircle className="h-9 w-9" />}
            </div>
            <h2 className="font-semibold text-lg">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            {currentUser?.roles?.[0] && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize mt-2 inline-block">
                {currentUser.roles[0]}
              </span>
            )}
          </div>
        </div>

        {/* Details + account type */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold mb-1">{l('تفاصيل الحساب', 'Account Details')}</h2>
            <div>
              {row(Mail, t('auth.email'), displayEmail)}
              {row(Phone, t('auth.phone'), currentUser?.phone || l('غير مضاف', 'Not added'))}
              {row(Calendar, l('عضو منذ', 'Member since'), memberSince)}
              {row(Send, l('مرتبط بتليغرام', 'Telegram linked'), currentUser?.telegram_chat_id ? l('نعم', 'Yes') : l('لا', 'No'))}
              {currentUser?.affiliate_code && row(Award, l('رمز الإحالة', 'Affiliate code'), currentUser.affiliate_code)}
              {currentUser?.referred_by && row(Users, l('تمت الإحالة عبر', 'Referred by'), currentUser.referred_by)}
            </div>
          </div>

          {/* Account type explainer */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold mb-3">{l('نوع الحساب', 'Account Type')}</h2>

            {isCoach ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {l(
                  'حسابك من نوع "كوتش" — عضو في فريق العمل لديه صلاحيات إدارية داخل لوحة التحكم بحسب دوره.',
                  'Your account type is "Coach" — a staff member with admin permissions in the dashboard based on their role.'
                )}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-primary mb-1">
                  {stageCopy?.label ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {stageCopy?.desc ?? l('لا توجد بيانات حالة.', 'No stage data available.')}
                </p>

                {/* Mini stage indicator */}
                <div className="flex items-center gap-1">
                  {STAGE_STEPS.map((s, i) => {
                    const done = i < stageIdx;
                    const current = i === stageIdx;
                    const StepIcon = done ? CheckCircle2 : current ? CircleDot : Circle;
                    return (
                      <div key={s} className="flex items-center flex-1">
                        <StepIcon className={`h-4 w-4 shrink-0 ${done || current ? 'text-primary' : 'text-muted-foreground/40'}`} />
                        {i < STAGE_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 rounded-full ${done ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5 text-[0.65rem] text-muted-foreground">
                  <span>{l('عميل محتمل', 'Lead')}</span>
                  <span>{l('غير نشط', 'Inactive')}</span>
                  <span>{l('نشط', 'Active')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
