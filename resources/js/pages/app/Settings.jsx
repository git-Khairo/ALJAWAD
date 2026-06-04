import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SettingsPage = () => {
  const { t, language, toggleLanguage, theme, toggleTheme } = useLanguage();
  const { changePassword } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [loading,   setLoading]   = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwords.newPass !== passwords.confirm) {
      toast.error(l('كلمات المرور الجديدة غير متطابقة', 'New passwords do not match'));
      return;
    }
    if (passwords.newPass.length < 8) {
      toast.error(l('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'));
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwords.current, passwords.newPass);
      toast.success(l('تم تغيير كلمة المرور بنجاح', 'Password changed successfully'));
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 422 && message?.includes('incorrect')) {
        toast.error(l('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect'));
      } else {
        toast.error(message ?? l('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.settings')}</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Language */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-3">{t('app.language')}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => language !== 'ar' && toggleLanguage()}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${language === 'ar' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-primary/5'}`}
            >
              العربية
            </button>
            <button
              onClick={() => language !== 'en' && toggleLanguage()}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${language === 'en' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-primary/5'}`}
            >
              English
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-3">{t('app.theme')}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${theme === 'light' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-primary/5'}`}
            >
              {l('فاتح', 'Light')}
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${theme === 'dark' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-primary/5'}`}
            >
              {l('داكن', 'Dark')}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-3">{t('app.changePassword')}</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('app.currentPassword')}</label>
              <input
                type="password"
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                disabled={loading}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('auth.newPassword')}</label>
              <input
                type="password"
                value={passwords.newPass}
                onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                disabled={loading}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                disabled={loading}
                required
                className={inputCls}
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {l('تغيير كلمة المرور', 'Change Password')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
