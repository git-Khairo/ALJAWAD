import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Send, LifeBuoy } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Account claim: the route both first-time setup and password reset take.
 *
 * Two steps, and the step is stated rather than implied, because arriving
 * here mid-flow from a redirect (an unclaimed login, or a registration that
 * hit an existing phone) is the common case, not the exception.
 */
const Claim = () => {
  const { t, language } = useLanguage();
  const { requestCode, claim } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState(params.get('phone') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sentVia, setSentVia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrors({ phone: l('أدخل رقم هاتفك.', 'Enter your phone number.') });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await requestCode(phone.trim());
      setSentVia(res.sent_via);
      setStep('code');
      toast.success(
        res.sent_via === 'telegram'
          ? l('تم إرسال الرمز عبر تيليجرام.', 'Code sent on Telegram.')
          : l('تواصل مع الدعم للحصول على الرمز.', 'Contact support to get your code.'),
      );
    } catch (err) {
      const status = err?.response?.status;
      const message =
        status === 404 ? l('لا يوجد حساب بهذا الرقم.', 'There is no account for that number.')
        : status === 429 ? l('محاولات كثيرة. حاول بعد قليل.', 'Too many attempts. Please try again shortly.')
        : l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.');
      setErrors({ phone: message });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    const next = {};
    if (!code.trim()) next.code = l('أدخل الرمز.', 'Enter the code.');
    if (password.length < 8) next.password = l('كلمة المرور 8 أحرف على الأقل.', 'Use at least 8 characters.');
    if (confirm !== password) next.confirm = l('كلمتا المرور غير متطابقتين.', 'These do not match.');
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const user = await claim({
        phone: phone.trim(),
        code: code.trim(),
        password,
        password_confirmation: confirm,
      });
      toast.success(l('تم تعيين كلمة المرور.', 'Password set. You are signed in.'));
      const isStaff =
        user?.roles?.some((r) => ['admin', 'super-admin'].includes(r)) || user?.user_type === 'coach';
      navigate(isStaff ? '/admin/overview' : '/app/overview');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        setErrors({ code: l('الرمز غير صحيح أو منتهٍ.', 'That code is not valid, or it has expired.') });
        return;
      }
      const message =
        status === 429
          ? l('محاولات كثيرة. حاول بعد قليل.', 'Too many attempts. Please try again shortly.')
          : l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.');
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onPhoneStep = step === 'phone';

  return (
    <AuthShell
      title={l('تفعيل الحساب', 'Set up your account')}
      subtitle={
        onPhoneStep
          ? l('أدخل رقم هاتفك لإرسال رمز لمرة واحدة.', 'Enter your phone number and we will send a one-time code.')
          : l('أدخل الرمز واختر كلمة مرور جديدة.', 'Enter the code, then choose a new password.')
      }
      footer={
        <p>
          {t('auth.hasAccount')}{' '}
          <Link to="/auth/login" className="text-primary underline-offset-4 hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      }
    >
      {/* Step marker: two ruled segments, the active one in the brand teal. */}
      <ol className="mb-7 flex gap-2" aria-label={l('الخطوات', 'Steps')}>
        {[
          { key: 'phone', label: l('الهاتف', 'Phone') },
          { key: 'code', label: l('الرمز', 'Code') },
        ].map((s) => {
          const active = s.key === step;
          return (
            <li key={s.key} className="flex-1" aria-current={active ? 'step' : undefined}>
              <span className={`block h-0.5 ${active ? 'bg-primary' : 'bg-rule'}`} />
              <span className={`mt-2 block text-xs ${active ? 'text-foreground' : 'text-fg-faint'}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {errors.form && (
        <p role="alert" className="mb-5 border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-foreground">
          {errors.form}
        </p>
      )}

      {onPhoneStep ? (
        <form onSubmit={handleRequest} noValidate className="space-y-5">
          <Field
            label={l('رقم الهاتف', 'Phone number')}
            hint={l('الرقم المسجّل لدى الفريق.', 'The number the team has on file for you.')}
            error={errors.phone}
            required
          >
            {(props) => (
              <Input
                {...props}
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                disabled={loading}
                dir="ltr"
              />
            )}
          </Field>

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {l('إرسال الرمز', 'Send the code')}
          </Button>

          <button
            type="button"
            onClick={() => {
              if (!phone.trim()) {
                setErrors({ phone: l('أدخل رقم هاتفك أولاً.', 'Enter your phone number first.') });
                return;
              }
              setErrors({});
              setSentVia('support');
              setStep('code');
            }}
            className="w-full py-1 text-center text-sm text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
          >
            {l('لديّ رمز من فريق الدعم', 'I already have a code from support')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleClaim} noValidate className="space-y-5">
          {sentVia === 'support' && (
            <Alert variant="accent">
              <LifeBuoy aria-hidden="true" />
              <AlertDescription>
                {l(
                  'لا يوجد تيليجرام مرتبط بحسابك. تواصل مع الدعم للحصول على رمزك.',
                  'There is no Telegram linked to your account. Contact support to receive your code.',
                )}
              </AlertDescription>
            </Alert>
          )}

          <Field label={l('رمز مكوّن من 6 أرقام', '6-digit code')} error={errors.code} required>
            {(props) => (
              <Input
                {...props}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value); clearError('code'); }}
                disabled={loading}
                dir="ltr"
                className="text-center font-mono text-lg tracking-[0.4em]"
              />
            )}
          </Field>

          <Field
            label={l('كلمة المرور الجديدة', 'New password')}
            hint={l('8 أحرف على الأقل.', 'At least 8 characters.')}
            error={errors.password}
            required
          >
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                disabled={loading}
              />
            )}
          </Field>

          <Field label={t('auth.confirmPassword')} error={errors.confirm} required>
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearError('confirm'); }}
                disabled={loading}
              />
            )}
          </Field>

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {l('تعيين كلمة المرور والدخول', 'Set password and sign in')}
          </Button>

          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); setErrors({}); }}
            className="w-full py-1 text-center text-sm text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
          >
            {l('تغيير رقم الهاتف', 'Use a different phone number')}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default Claim;
