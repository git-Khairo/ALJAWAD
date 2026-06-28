import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const Login = () => {
  const { t, language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error(language === 'ar' ? 'يرجى إدخال بيانات الدخول' : 'Please enter your login details');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      // Navigate based on the user's actual role from the API
      if (user?.roles?.some(r => ['admin', 'super-admin'].includes(r)) || user?.user_type === 'coach') {
        navigate('/admin/overview');
      } else {
        navigate('/app/overview');
      }
    } catch (err) {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      // Unclaimed account → send them to set a password via a one-time code.
      if (status === 409 && data?.needs_claim) {
        toast.info(l('هذا الحساب يحتاج إلى تفعيل. أدخل رمزاً لتعيين كلمة المرور.', 'This account needs setup — enter a code to set your password.'));
        navigate(`/auth/claim?phone=${encodeURIComponent(data.phone || identifier.trim())}`);
        return;
      }
      if (status === 422) {
        toast.error(l('بيانات الدخول غير صحيحة', 'Incorrect login details'));
      } else if (status === 403) {
        toast.error(l('حسابك موقوف. تواصل مع الإدارة.', 'Your account has been deactivated. Contact support.'));
      } else if (status === 429) {
        toast.error(l('محاولات كثيرة. حاول بعد قليل.', 'Too many attempts. Please try again shortly.'));
      } else {
        toast.error(l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all disabled:opacity-60';

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero px-4 relative overflow-hidden">
      <Link
        to="/"
        className={`absolute top-4 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${language === 'ar' ? 'right-4 flex-row-reverse' : 'left-4'}`}
        aria-label={t('nav.home')}
      >
        <ArrowLeft className={`h-5 w-5 shrink-0 ${language === 'ar' ? 'rotate-180' : ''}`} />
        <span>{t('nav.home')}</span>
      </Link>

      <div className="absolute inset-0 grid-bg opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl border p-8 relative z-10 shadow-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logo} alt="AlJawad Trading" className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">{t('auth.login')}</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder={l('البريد الإلكتروني أو رقم الهاتف', 'Email or phone number')}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            disabled={loading}
            required
            className={inputCls}
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            required
            className={inputCls}
          />
          <Button type="submit" variant="accent" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? (language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in…')
              : t('auth.loginBtn')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/auth/claim" className="text-primary hover:underline">
            {l('أول مرة أو نسيت كلمة المرور؟', 'First time, or forgot your password?')}
          </Link>
        </div>

        <div className="mt-3 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/auth/register" className="text-primary hover:underline">
            {t('auth.register')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
