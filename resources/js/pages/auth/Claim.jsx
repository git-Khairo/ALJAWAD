import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send, LifeBuoy } from 'lucide-react';
import logo from '@/assets/logo.png';

const Claim = () => {
  const { t, language } = useLanguage();
  const { requestCode, claim } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [step, setStep]       = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone]     = useState(params.get('phone') || '');
  const [code, setCode]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sentVia, setSentVia] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputCls = 'w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all disabled:opacity-60';

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error(l('أدخل رقم الهاتف', 'Enter your phone number'));
      return;
    }
    setLoading(true);
    try {
      const res = await requestCode(phone.trim());
      setSentVia(res.sent_via);
      setStep('code');
      toast.success(res.sent_via === 'telegram'
        ? l('تم إرسال الرمز عبر تيليجرام', 'Code sent on Telegram')
        : l('تواصل مع الدعم للحصول على الرمز', 'Contact support to get your code'));
    } catch (err) {
      const s = err?.response?.status;
      if (s === 404)      toast.error(l('لا يوجد حساب بهذا الرقم. سجّل حساباً جديداً.', 'No account for this number. Please sign up.'));
      else if (s === 429) toast.error(l('محاولات كثيرة. حاول بعد قليل.', 'Too many attempts. Please try again shortly.'));
      else                toast.error(l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(l('كلمات المرور غير متطابقة', 'Passwords do not match'));
      return;
    }
    if (password.length < 8) {
      toast.error(l('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'));
      return;
    }
    setLoading(true);
    try {
      const user = await claim({
        phone:                 phone.trim(),
        code:                  code.trim(),
        password,
        password_confirmation: confirm,
      });
      toast.success(l('تم تعيين كلمة المرور وتسجيل الدخول', 'Password set — you are signed in'));
      if (user?.roles?.some(r => ['admin', 'super-admin'].includes(r)) || user?.user_type === 'coach') {
        navigate('/admin/overview');
      } else {
        navigate('/app/overview');
      }
    } catch (err) {
      const s = err?.response?.status;
      if (s === 422)      toast.error(l('الرمز غير صحيح أو منتهٍ', 'The code is invalid or has expired'));
      else if (s === 429) toast.error(l('محاولات كثيرة. حاول بعد قليل.', 'Too many attempts. Please try again shortly.'));
      else                toast.error(l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.'));
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
        <span>{t('auth.login')}</span>
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

        <h1 className="text-2xl font-bold text-center mb-1">
          {l('تفعيل الحساب', 'Set up your account')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {step === 'phone'
            ? l('أدخل رقم هاتفك لإرسال رمز لمرة واحدة', 'Enter your phone to get a one-time code')
            : l('أدخل الرمز واختر كلمة مرور جديدة', 'Enter the code and choose a new password')}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <input
              type="tel"
              placeholder={l('رقم الهاتف', 'Phone number')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={loading}
              required
              className={inputCls}
            />
            <Button type="submit" variant="accent" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {l('إرسال الرمز', 'Send code')}
            </Button>
            <button
              type="button"
              onClick={() => {
                if (!phone.trim()) {
                  toast.error(l('أدخل رقم هاتفك أولاً', 'Enter your phone number first'));
                  return;
                }
                setSentVia('support');
                setStep('code');
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {l('لديّ رمز من فريق الدعم', 'I already have a code from support')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            {sentVia === 'support' && (
              <div className="flex items-start gap-2 text-xs rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 px-3 py-2">
                <LifeBuoy className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{l('لا يوجد تيليجرام مرتبط — تواصل مع الدعم للحصول على رمزك.', 'No Telegram on file — contact support to receive your code.')}</span>
              </div>
            )}
            <input
              inputMode="numeric"
              placeholder={l('رمز مكوّن من 6 أرقام', '6-digit code')}
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={loading}
              required
              className={`${inputCls} tracking-[0.3em] text-center font-mono`}
            />
            <input
              type="password"
              placeholder={l('كلمة المرور الجديدة', 'New password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              required
              className={inputCls}
            />
            <input
              type="password"
              placeholder={t('auth.confirmPassword')}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              disabled={loading}
              required
              className={inputCls}
            />
            <Button type="submit" variant="accent" className="w-full gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {l('تعيين كلمة المرور والدخول', 'Set password & sign in')}
            </Button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setCode(''); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {l('تغيير رقم الهاتف', 'Change phone number')}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link to="/auth/login" className="text-primary hover:underline">{t('auth.login')}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Claim;
