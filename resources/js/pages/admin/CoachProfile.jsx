import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, UserCircle, Wallet, NotebookPen, Bell, KeyRound, Network } from 'lucide-react';

import Profile from '@/pages/app/Profile';
import AppTransactions from '@/pages/app/Transactions';
import Journal from '@/pages/app/Journal';
import Notifications from '@/pages/app/Notifications';
import NetworkPage from '@/pages/app/Network';

// Change-password card — mirrors the password form on the client dashboard's Settings page.
const ChangePasswordCard = () => {
  const { t, language } = useLanguage();
  const { changePassword } = useAuth();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      const status = err?.response?.status;
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
    <div className="bg-card rounded-xl border p-5 max-w-2xl">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        {t('app.changePassword')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
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
  );
};

// Coach self-service profile area — reuses the client dashboard pages but swaps the
// sidebar for in-page tabs (Profile · Transactions · Journal · Notifications).
const CoachProfile = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const isAffiliate = !!currentUser?.affiliate_code;
  const tabCls = 'gap-1.5';

  return (
    <div className="space-y-5">
      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="profile" className={tabCls}>
            <UserCircle className="h-4 w-4" />
            {l('الملف الشخصي', 'Profile')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className={tabCls}>
            <Wallet className="h-4 w-4" />
            {l('المعاملات', 'Transactions')}
          </TabsTrigger>
          <TabsTrigger value="journal" className={tabCls}>
            <NotebookPen className="h-4 w-4" />
            {l('دفتر التداول', 'Journal')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className={tabCls}>
            <Bell className="h-4 w-4" />
            {l('الإشعارات', 'Notifications')}
          </TabsTrigger>
          {isAffiliate && (
            <TabsTrigger value="network" className={tabCls}>
              <Network className="h-4 w-4" />
              {l('شبكتي', 'My Network')}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile info + change password */}
        <TabsContent value="profile" className="mt-4 space-y-6">
          <Profile />
          <ChangePasswordCard />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <AppTransactions />
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <Journal />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Notifications />
        </TabsContent>

        {isAffiliate && (
          <TabsContent value="network" className="mt-4">
            <NetworkPage />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CoachProfile;
