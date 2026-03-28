import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Forgot = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); toast.success(t('common.success')); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t('auth.resetPassword')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required />
          <Button type="submit" className="w-full">{t('auth.sendResetLink')}</Button>
        </form>
        <div className="mt-4 text-center text-sm"><Link to="/auth/login" className="text-primary hover:underline">{t('auth.backToLogin')}</Link></div>
      </div>
    </div>
  );
};

export default Forgot;
