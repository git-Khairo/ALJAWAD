import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, UserCircle } from 'lucide-react';

const Profile = () => {
  const { t, language } = useLanguage();
  const { currentUser, updateProfile } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:  '',
    phone: '',
  });

  // Seed the form whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setForm({
        name:  currentUser.name ?? '',
        phone: currentUser.phone ?? '',
      });
    }
  }, [currentUser]);

  const displayName  = currentUser?.name ?? '—';
  const displayEmail = currentUser?.email ?? '—';
  const initials     = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined });
      toast.success(l('تم تحديث الملف الشخصي', 'Profile updated'));
      setEditing(false);
    } catch (err) {
      const msg = err?.response?.data?.message ?? l('فشل الحفظ', 'Save failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name:  currentUser?.name  ?? '',
      phone: currentUser?.phone ?? '',
    });
    setEditing(false);
  };

  const inputCls = (disabled) =>
    `w-full px-4 py-2.5 rounded-lg border bg-background text-sm outline-none transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/50 focus:border-primary'}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('app.profile')}</h1>
        {!editing && (
          <Button size="sm" onClick={() => setEditing(true)}>
            {t('app.editProfile')}
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border p-6 max-w-2xl">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
            {initials || <UserCircle className="h-8 w-8" />}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            {currentUser?.roles?.[0] && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize mt-1 inline-block">
                {currentUser.roles[0]}
              </span>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.name')}</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              disabled={!editing || loading}
              className={inputCls(!editing || loading)}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.email')}</label>
            <input
              value={displayEmail}
              disabled
              className={inputCls(true)}
              title={l('لا يمكن تغيير البريد الإلكتروني', 'Email cannot be changed')}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              disabled={!editing || loading}
              placeholder={l('أضف رقم هاتف', 'Add phone number')}
              className={inputCls(!editing || loading)}
            />
          </div>

          {editing && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('app.save')}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                {t('app.cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
