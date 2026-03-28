import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const Login = () => {
  const { t, language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e, asAdmin = false) => {
    e.preventDefault();
    login(email || 'user@example.com', password, asAdmin);
    toast.success(t('common.success'));
    navigate(asAdmin ? '/admin/overview' : '/app/overview');
  };

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
          <input type="email" placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
          <input type="password" placeholder={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
          <Button type="submit" variant="accent" className="w-full">{t('auth.loginBtn')}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={e => handleLogin(e, true)}>{t('auth.loginAsAdmin')}</Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link to="/auth/forgot" className="text-primary hover:underline">{t('auth.forgotPassword')}</Link>
        </div>
        <div className="mt-3 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')} <Link to="/auth/register" className="text-primary hover:underline">{t('auth.register')}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
