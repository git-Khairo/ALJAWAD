import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const Register = () => {
  const { t, language } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
  });
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await register({
        name:                  form.name.trim(),
        email:                 form.email.trim(),
        phone:                 form.phone.trim() || undefined,
        password:              form.password,
        password_confirmation: form.confirm,
      });
      toast.success(l('تم إنشاء حسابك بنجاح', 'Account created successfully'));
      navigate('/app/overview');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        const errors = err?.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0];
          toast.error(Array.isArray(first) ? first[0] : first);
        } else {
          toast.error(err?.response?.data?.message ?? l('بيانات غير صحيحة', 'Invalid data'));
        }
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
        <div className="flex items-center justify-center mb-6">
          <img src={logo} alt="AlJawad Trading" className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">{t('auth.register')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder={t('auth.name')}
            value={form.name}
            onChange={field('name')}
            disabled={loading}
            required
            className={inputCls}
          />
          <input
            type="email"
            placeholder={t('auth.email')}
            value={form.email}
            onChange={field('email')}
            disabled={loading}
            required
            className={inputCls}
          />
          <input
            type="tel"
            placeholder={l('رقم الهاتف (اختياري)', 'Phone number (optional)')}
            value={form.phone}
            onChange={field('phone')}
            disabled={loading}
            className={inputCls}
          />
          <input
            type="password"
            placeholder={t('auth.password')}
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
          <Button type="submit" variant="accent" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? l('جارٍ إنشاء الحساب...', 'Creating account…')
              : t('auth.registerBtn')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link to="/auth/login" className="text-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
