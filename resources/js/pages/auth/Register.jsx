import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Register = () => {
  const { t, language } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const field = (key) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = l('الاسم مطلوب.', 'Your name is required.');
    if (!form.phone.trim()) next.phone = l('رقم الهاتف مطلوب.', 'A phone number is required.');
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = l('هذا البريد غير صالح.', 'That email address is not valid.');
    }
    if (form.password.length < 8) {
      next.password = l('كلمة المرور 8 أحرف على الأقل.', 'Use at least 8 characters.');
    }
    if (form.confirm !== form.password) {
      next.confirm = l('كلمتا المرور غير متطابقتين.', 'These do not match.');
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        password_confirmation: form.confirm,
      });
      toast.success(l('تم إنشاء حسابك.', 'Your account is ready.'));
      navigate('/app/overview');
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Phone already belongs to an unclaimed, admin-created account.
      if (status === 409 && data?.needs_claim) {
        toast.info(
          l('لديك حساب بالفعل. فعّله بإدخال رمز.', 'You already have an account. Claim it with a code.'),
        );
        navigate(`/auth/claim?phone=${encodeURIComponent(data.phone || form.phone.trim())}`);
        return;
      }

      // Attach server-side validation to the field it belongs to rather than
      // firing a toast that disappears before it can be acted on.
      if (status === 422 && data?.errors) {
        const mapped = {};
        for (const [key, messages] of Object.entries(data.errors)) {
          const message = Array.isArray(messages) ? messages[0] : messages;
          if (key === 'password_confirmation') mapped.confirm = message;
          else mapped[key] = message;
        }
        setErrors(mapped);
        return;
      }

      const message =
        status === 422 ? (data?.message ?? l('بيانات غير صحيحة.', 'Some of those details are not valid.'))
        : status === 429 ? l('محاولات كثيرة. حاول بعد قليل.', 'Too many attempts. Please try again shortly.')
        : l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.');

      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.register')}
      subtitle={l(
        'يستغرق الأمر دقيقة. لن نطلب أي إيداع لإنشاء الحساب.',
        'It takes a minute, and opening an account costs nothing.',
      )}
      footer={
        <p>
          {t('auth.hasAccount')}{' '}
          <Link to="/auth/login" className="text-primary underline-offset-4 hover:underline">
            {t('auth.login')}
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

        <Field label={t('auth.name')} error={errors.name} required>
          {(props) => (
            <Input
              {...props}
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={field('name')}
              disabled={loading}
            />
          )}
        </Field>

        <Field
          label={l('رقم الهاتف', 'Phone number')}
          hint={l('نستخدمه للتواصل معك بشأن طلباتك.', 'We use this to reach you about your requests.')}
          error={errors.phone}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={field('phone')}
              disabled={loading}
              dir="ltr"
            />
          )}
        </Field>

        <Field
          label={l('البريد الإلكتروني', 'Email address')}
          hint={l('اختياري.', 'Optional.')}
          error={errors.email}
        >
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

        <Field
          label={t('auth.password')}
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
          {loading ? l('جارٍ إنشاء الحساب…', 'Creating your account…') : t('auth.registerBtn')}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;
