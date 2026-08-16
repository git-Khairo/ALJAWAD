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

const Login = () => {
  const { t, language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Errors render inline under the field they belong to, not only as a toast
  // that vanishes before a slow reader gets to it.
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    const next = {};
    if (!identifier.trim()) next.identifier = l('أدخل بريدك أو رقم هاتفك.', 'Enter your email or phone number.');
    if (!password) next.password = l('أدخل كلمة المرور.', 'Enter your password.');
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      const isStaff =
        user?.roles?.some((r) => ['admin', 'super-admin'].includes(r)) || user?.user_type === 'coach';
      navigate(isStaff ? '/admin/overview' : '/app/overview');
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Unclaimed account: send them to set a password via a one-time code.
      if (status === 409 && data?.needs_claim) {
        toast.info(
          l('هذا الحساب يحتاج إلى تفعيل. أدخل رمزاً لتعيين كلمة المرور.',
            'This account needs setup. Enter a code to set your password.'),
        );
        navigate(`/auth/claim?phone=${encodeURIComponent(data.phone || identifier.trim())}`);
        return;
      }

      const message =
        status === 422 ? l('بيانات الدخول غير صحيحة.', 'Those login details are not correct.')
        : status === 403 ? l('حسابك موقوف. تواصل مع الإدارة.', 'Your account has been deactivated. Contact support.')
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
      title={t('auth.login')}
      subtitle={l(
        'ادخل إلى لوحتك لمتابعة طلباتك ومعاملاتك ودفتر تداولك.',
        'Sign in to track your requests, transactions and trading journal.',
      )}
      footer={
        <div className="space-y-2">
          <p>
            <Link to="/auth/claim" className="text-primary underline-offset-4 hover:underline">
              {l('أول مرة، أو نسيت كلمة المرور؟', 'First time, or forgot your password?')}
            </Link>
          </p>
          <p>
            {t('auth.noAccount')}{' '}
            <Link to="/auth/register" className="text-primary underline-offset-4 hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleLogin} noValidate className="space-y-5">
        {errors.form && (
          <p role="alert" className="border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-foreground">
            {errors.form}
          </p>
        )}

        <Field
          label={l('البريد الإلكتروني أو رقم الهاتف', 'Email or phone number')}
          error={errors.identifier}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              dir="ltr"
            />
          )}
        </Field>

        <Field label={t('auth.password')} error={errors.password} required>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          )}
        </Field>

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? l('جارٍ تسجيل الدخول…', 'Signing in…') : t('auth.loginBtn')}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
