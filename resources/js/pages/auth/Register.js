import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const Register = () => {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error(t('common.error')); return; }
    register(form);
    toast.success(t('common.success'));
    navigate('/app/overview');
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero px-4 relative overflow-hidden">
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
          <input placeholder={t('auth.name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
          <input type="email" placeholder={t('auth.email')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
          <input placeholder={t('auth.phone')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
          <input type="password" placeholder={t('auth.password')} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
          <input type="password" placeholder={t('auth.confirmPassword')} value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
          <Button type="submit" variant="accent" className="w-full">{t('auth.registerBtn')}</Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t('auth.hasAccount')} <Link to="/auth/login" className="text-primary hover:underline">{t('auth.login')}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
