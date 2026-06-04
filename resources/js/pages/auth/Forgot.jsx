import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import api from '@/lib/api';
import logo from '@/assets/logo.png';

const Forgot = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      const msg = err?.response?.data?.message;
      toast.error(msg ?? l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

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

        {sent ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold mb-2">{l('تم الإرسال!', 'Email Sent!')}</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {l(
                `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. تحقق من بريدك الوارد.`,
                `A password reset link has been sent to ${email}. Check your inbox.`
              )}
            </p>
            <Link to="/auth/login" className="text-primary hover:underline text-sm">
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">{t('auth.resetPassword')}</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {l(
                'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.',
                'Enter your email and we\'ll send you a password reset link.'
              )}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all disabled:opacity-60"
              />
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading
                  ? l('جارٍ الإرسال...', 'Sending…')
                  : t('auth.sendResetLink')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link to="/auth/login" className="text-primary hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Forgot;
