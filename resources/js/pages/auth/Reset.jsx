import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

/**
 * Password reset from an emailed Laravel link (?token=...&email=...).
 *
 * A missing or malformed token is reported on arrival rather than after the
 * user has chosen and confirmed a password, which is the point at which the
 * old version told them.
 */
const Reset = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const token = searchParams.get('token') ?? '';
  const emailFromUrl = searchParams.get('email') ?? '';

  const [form, setForm] = useState({ email: emailFromUrl, password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  // Cleaned up on unmount: the old version left a bare setTimeout that would
  // navigate after the user had already gone somewhere else.
  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => navigate('/auth/login'), 2500);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  const field = (key) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = l('البريد الإلكتروني مطلوب.', 'Your email address is required.');
    if (form.password.length < 8) next.password = l('كلمة المرور 8 أحرف على الأقل.', 'Use at least 8 characters.');
    if (form.confirm !== form.password) next.confirm = l('كلمتا المرور غير متطابقتين.', 'These do not match.');
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.confirm,
      });
      setDone(true);
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.');
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Link is broken: say so before anything is typed ─────────────────── */
  if (!token) {
    return (
      <AuthShell
        title={l('رابط غير صالح', 'That link is not valid')}
        subtitle={l(
          'رابط إعادة التعيين ناقص أو منتهي الصلاحية. اطلب رمزاً جديداً عبر رقم هاتفك.',
          'The reset link is incomplete or has expired. Request a fresh code using your phone number.',
        )}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/auth/claim">
            <Button variant="accent">{l('طلب رمز جديد', 'Request a new code')}</Button>
          </Link>
          <Link to="/auth/login">
            <Button variant="outline">{t('auth.backToLogin')}</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  /* ── Done ─────────────────────────────────────────────────────────────── */
  if (done) {
    return (
      <AuthShell
        title={l('تم تعيين كلمة المرور', 'Your password is set')}
        subtitle={l(
          'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
          'You can now sign in with the new password.',
        )}
      >
        <div className="flex items-start gap-3 border border-chart-up/30 bg-chart-up/10 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-chart-up" aria-hidden="true" />
          <p className="text-sm text-foreground">
            {l('سيتم تحويلك لصفحة تسجيل الدخول…', 'Taking you to the sign-in page…')}
          </p>
        </div>

        {/* An explicit link, so a failed auto-redirect is not a dead end. */}
        <Link to="/auth/login" className="mt-6 inline-flex">
          <Button variant="outline">{t('auth.backToLogin')}</Button>
        </Link>
      </AuthShell>
    );
  }

  /* ── Form ─────────────────────────────────────────────────────────────── */
  return (
    <AuthShell
      title={t('auth.resetPassword')}
      subtitle={l('اختر كلمة مرور جديدة لحسابك.', 'Choose a new password for your account.')}
      footer={
        <p>
          <Link to="/auth/login" className="text-primary underline-offset-4 hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.form && (
          <p role="alert" className="border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-foreground">
            {errors.form}
          </p>
        )}

        {!emailFromUrl && (
          <Field label={t('auth.email')} error={errors.email} required>
            {(props) => (
              <Input
                {...props}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={field('email')}
                disabled={loading}
                dir="ltr"
              />
            )}
          </Field>
        )}

        <Field
          label={t('auth.newPassword')}
          hint={l('8 أحرف على الأقل.', 'At least 8 characters.')}
          error={errors.password}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={field('password')}
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
              value={form.confirm}
              onChange={field('confirm')}
              disabled={loading}
            />
          )}
        </Field>

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? l('جارٍ الحفظ…', 'Saving…') : t('auth.resetBtn')}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Reset;
