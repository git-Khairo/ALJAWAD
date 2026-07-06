import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium block mb-1.5 text-foreground">{label}</label>
    {children}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all ${className}`}
  />
);

const Textarea = ({ ...props }) => (
  <textarea
    {...props}
    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
  />
);

// Default values shown before the DB settings load
const COMPANY_DEFAULTS = {
  name_ar: '', name_en: '', email: '', phone: '',
  address_ar: '', address_en: '', website: '', bio_ar: '', bio_en: '',
};
const SOCIAL_DEFAULTS = { instagram: '', tiktok: '', youtube: '', telegram: '', whatsapp: '' };

const AdminSettings = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { settings, saveSettings } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  // Local form state — seeded from DB settings once they load
  const [company,      setCompany]      = useState(COMPANY_DEFAULTS);
  const [social,       setSocial]       = useState(SOCIAL_DEFAULTS);
  const [saving,       setSaving]       = useState(false);

  // When settings load from API, seed the local form
  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) return;
    if (settings.company) setCompany(prev => ({ ...prev, ...settings.company }));
    if (settings.social)  setSocial(prev  => ({ ...prev, ...settings.social }));
  }, [settings]);

  // ── Save helpers ──────────────────────────────────────────────────────────
  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await saveSettings({ company });
    } catch {
      toast.error(l('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    setSaving(true);
    try {
      await saveSettings({ social });
    } catch {
      toast.error(l('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const sf = (obj, setter) => (f) => (e) => setter(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{l('الإعدادات العامة', 'General Settings')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('إدارة بيانات الأكاديمية وإعدادات التكامل', 'Manage academy details and integration settings')}
        </p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="company">{l('بيانات الأكاديمية', 'Academy Info')}</TabsTrigger>
          <TabsTrigger value="social">{l('التواصل الاجتماعي', 'Social Media')}</TabsTrigger>
          <TabsTrigger value="email">{l('قوالب البريد', 'Email Templates')}</TabsTrigger>
        </TabsList>

        {/* Company Info */}
        <TabsContent value="company" className="mt-4">
          <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={l('الاسم (عربي)', 'Name (Arabic)')}>
                <Input value={company.name_ar} onChange={sf(company, setCompany)('name_ar')} dir="rtl" />
              </Field>
              <Field label={l('الاسم (إنجليزي)', 'Name (English)')}>
                <Input value={company.name_en} onChange={sf(company, setCompany)('name_en')} />
              </Field>
            </div>
            <Field label={l('البريد الإلكتروني', 'Email')}>
              <Input type="email" value={company.email} onChange={sf(company, setCompany)('email')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={l('الهاتف', 'Phone')}>
                <Input value={company.phone} onChange={sf(company, setCompany)('phone')} />
              </Field>
              <Field label={l('الموقع الإلكتروني', 'Website')}>
                <Input value={company.website} onChange={sf(company, setCompany)('website')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={l('العنوان (عربي)', 'Address (Arabic)')}>
                <Input value={company.address_ar} onChange={sf(company, setCompany)('address_ar')} dir="rtl" />
              </Field>
              <Field label={l('العنوان (إنجليزي)', 'Address (English)')}>
                <Input value={company.address_en} onChange={sf(company, setCompany)('address_en')} />
              </Field>
            </div>
            <Field label={l('نبذة (عربي)', 'Bio (Arabic)')}>
              <Textarea value={company.bio_ar} onChange={sf(company, setCompany)('bio_ar')} rows={3} dir="rtl" />
            </Field>
            <Field label={l('نبذة (إنجليزي)', 'Bio (English)')}>
              <Textarea value={company.bio_en} onChange={sf(company, setCompany)('bio_en')} rows={3} />
            </Field>
            {hasPermission('edit settings') && (
              <Button onClick={handleSaveCompany} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {l('حفظ التغييرات', 'Save Changes')}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social" className="mt-4">
          <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-4">
            {[
              { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
              { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/...' },
              { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/...' },
              { key: 'telegram',  label: 'Telegram',  placeholder: 'https://t.me/...' },
              { key: 'whatsapp',  label: 'WhatsApp',  placeholder: '+963...' },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <Input value={social[key]} onChange={sf(social, setSocial)(key)} placeholder={placeholder} />
              </Field>
            ))}
            {hasPermission('edit settings') && (
              <Button onClick={handleSaveSocial} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {l('حفظ الروابط', 'Save Links')}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Email Templates — UI only (no backend yet) */}
        <TabsContent value="email" className="mt-4">
          <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-3">
            {[
              { name_ar: 'ترحيب بعضو جديد',        name_en: 'Welcome New Member',       status: 'active' },
              { name_ar: 'تأكيد التسجيل في دورة',  name_en: 'Course Enrollment Confirm', status: 'active' },
              { name_ar: 'تذكير بالجلسة القادمة',  name_en: 'Upcoming Session Reminder', status: 'active' },
              { name_ar: 'إشعار الدفع المكتمل',    name_en: 'Payment Confirmation',      status: 'draft' },
              { name_ar: 'إعادة تعيين كلمة المرور', name_en: 'Password Reset',            status: 'active' },
            ].map((tpl, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background rounded-xl border hover:border-primary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{l(tpl.name_ar, tpl.name_en)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l('قالب بريد إلكتروني', 'Email template')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    tpl.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {tpl.status === 'active' ? l('نشط', 'Active') : l('مسودة', 'Draft')}
                  </span>
                  <Button variant="outline" size="sm"
                    onClick={() => toast.info(l('محرر القوالب قريباً', 'Template editor coming soon'))}>
                    {l('تعديل', 'Edit')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
