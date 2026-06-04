import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import logo from '@/assets/logo.png';

const Reset = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const l = (ar, en) => language === 'ar' ? ar : en;

  // Laravel password reset links contain ?token=...&email=...
  const token = searchParams.get('token') ?? '';
  const emailFromUrl = searchParams.get('email') ?? '';

  const [form, setForm] = useState({
    email:    emailFromUrl,
    password: '',
    confirm:  '',
  });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      toast.error(l('كلمات المرور غير متطابقة', 'Passwords do not match'));
      return;
    }
    if (form.password.length < 8) {
      toast.error(l('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'));
      return;
    }
    if (!token) {
      toast.error(l('رابط إعادة التعيين غير صالح. اطلب رابطاً جديداً.', 'Invalid reset link. Please request a new one.'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email:                form.email.trim(),
        password:             form.password,
        password_confirmation: form.confirm,
      });
      setDone(true);
      setTimeout(() => navigate('/auth/login'), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message;
      toast.error(msg ?? l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all disabled:opacity-60';

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero px-4 relative overflow-hidden">
      <Link
        to="/auth/login"
        className={`absolute top-4 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${language === 'ar' ? 'right-4 flex-row-reverse' : 'left-4'}`}
      >
        <ArrowLeft className={`h-5 w-5 shrink-0 ${language === 'ar' ? 'rotate-180' : ''}`} />
        <span>{t('auth.backToLogin')}</span>
      </Link>

      <div className="absolute inset-0 grid-bg opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl border p-8 relative z-10 shadow-2xl"
      >
        <div className="flex items-center justify-center mb-6">
          <img src={logo} alt="AlJawad Trading" className="h-12 w-auto" />
        </div>

        {done ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold mb-2">{l('تم تعيين كلمة المرور!', 'Password Reset!')}</h1>
            <p className="text-sm text-muted-foreground">
              {l('سيتم تحويلك لصفحة تسجيل الدخول...', 'Redirecting to login…')}
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">{t('auth.resetPassword')}</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {l('أدخل كلمة المرور الجديدة لحسابك.', 'Enter a new password for your account.')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!emailFromUrl && (
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={form.email}
                  onChange={field('email')}
                  disabled={loading}
                  required
                  className={inputCls}
                />
              )}
              <input
                type="password"
                placeholder={t('auth.newPassword')}
                value={form.password}
                onChange={field('password')}
                disabled={loading}
                required
                className={inputCls}
              />
              <input
                type="password"
                placeholder={t('auth.confirmPassword')}
                value={form.confirm}
                onChange={field('confirm')}
                disabled={loading}
                required
                className={inputCls}
              />
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading
                  ? l('جارٍ الحفظ...', 'Saving…')
                  : t('auth.resetBtn')}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Reset;
