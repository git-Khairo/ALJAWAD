import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { t, language, toggleLanguage, theme, toggleTheme } = useLanguage();
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    toast.success(t('common.success'));
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.settings')}</h1>
      <div className="space-y-6 max-w-2xl">
        {/* Language */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-3">{t('app.language')}</h2>
          <div className="flex gap-3">
            <button onClick={toggleLanguage} className={`px-4 py-2 rounded-lg text-sm font-medium border ${language === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>العربية</button>
            <button onClick={toggleLanguage} className={`px-4 py-2 rounded-lg text-sm font-medium border ${language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>English</button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-3">{t('app.theme')}</h2>
          <div className="flex gap-3">
            <button onClick={() => { if (theme === 'dark') toggleTheme(); }} className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{language === 'ar' ? 'فاتح' : 'Light'}</button>
            <button onClick={() => { if (theme === 'light') toggleTheme(); }} className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{language === 'ar' ? 'داكن' : 'Dark'}</button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-3">{t('app.changePassword')}</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input type="password" placeholder={t('app.currentPassword')} value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required />
            <input type="password" placeholder={t('auth.newPassword')} value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required />
            <input type="password" placeholder={t('auth.confirmPassword')} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required />
            <Button type="submit">{t('app.save')}</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
