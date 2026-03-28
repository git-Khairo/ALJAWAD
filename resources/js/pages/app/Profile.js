import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Profile = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.[language === 'ar' ? 'name_ar' : 'name_en'] || '',
    email: currentUser?.email || 'ahmed@example.com',
    phone: '+966501234567',
    bio: language === 'ar' ? 'مهتم بالاستثمار والتداول في الأسواق المالية' : 'Interested in investment and trading in financial markets',
  });

  const handleSave = () => { setEditing(false); toast.success(t('common.success')); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('app.profile')}</h1>
        {!editing && <Button size="sm" onClick={() => setEditing(true)}>{t('app.editProfile')}</Button>}
      </div>

      <div className="bg-card rounded-xl border p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
            {form.name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{form.name}</h2>
            <p className="text-sm text-muted-foreground">{form.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.name')}</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!editing} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm disabled:opacity-60" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.email')}</label>
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!editing} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm disabled:opacity-60" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.phone')}</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={!editing} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm disabled:opacity-60" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{language === 'ar' ? 'نبذة' : 'Bio'}</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} disabled={!editing} rows={3} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm disabled:opacity-60" />
          </div>

          {editing && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave}>{t('app.save')}</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>{t('app.cancel')}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
