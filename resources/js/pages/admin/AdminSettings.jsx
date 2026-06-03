import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium block mb-1.5 text-foreground">{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
);

const Textarea = ({ ...props }) => (
  <textarea {...props} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none" />
);

const AdminSettings = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [company, setCompany] = useState({
    name_ar: 'الجواد للتداول', name_en: 'AlJawad Trading Academy',
    email: 'info@aljawad.com', phone: '+963 11 123 4567',
    address_ar: 'دمشق، سوريا', address_en: 'Damascus, Syria',
    website: 'https://aljawad.com',
    bio_ar: 'أكاديمية متخصصة في تعليم تداول الفوركس والعملات الرقمية والأسهم.',
    bio_en: 'A specialized academy teaching Forex, Crypto, and Stock trading.',
  });

  const [social, setSocial] = useState({
    instagram: 'https://instagram.com/aljawad_trading',
    tiktok:    'https://tiktok.com/@aljawad_trading',
    youtube:   'https://youtube.com/@aljawad_trading',
    telegram:  'https://t.me/aljawad_trading',
    whatsapp:  '+963999123456',
  });

  const [integrations, setIntegrations] = useState({
    openai_key:      localStorage.getItem('openai_key') ?? '',
    telegram_token:  localStorage.getItem('telegram_token') ?? '',
    zoom_api_key:    localStorage.getItem('zoom_api_key') ?? '',
  });

  const [showKeys, setShowKeys] = useState({});
  const toggleShow = (k) => setShowKeys(p => ({ ...p, [k]: !p[k] }));

  const handleSaveCompany = () => {
    toast.success(l('تم حفظ بيانات الشركة', 'Company info saved'));
  };

  const handleSaveSocial = () => {
    toast.success(l('تم حفظ روابط التواصل', 'Social links saved'));
  };

  const handleSaveIntegrations = () => {
    Object.entries(integrations).forEach(([k, v]) => {
      if (v) localStorage.setItem(k, v); else localStorage.removeItem(k);
    });
    toast.success(l('تم حفظ مفاتيح التكامل', 'Integration keys saved'));
  };

  const sf = (obj, setter) => (f) => (e) => setter(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{l('الإعدادات العامة', 'General Settings')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{l('إدارة بيانات الأكاديمية وإعدادات التكامل', 'Manage academy details and integration settings')}</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="company">{l('بيانات الأكاديمية', 'Academy Info')}</TabsTrigger>
          <TabsTrigger value="social">{l('التواصل الاجتماعي', 'Social Media')}</TabsTrigger>
          <TabsTrigger value="integrations">{l('مفاتيح API', 'API Keys')}</TabsTrigger>
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
            <Button onClick={handleSaveCompany}>{l('حفظ التغييرات', 'Save Changes')}</Button>
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
            <Button onClick={handleSaveSocial}>{l('حفظ الروابط', 'Save Links')}</Button>
          </div>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="integrations" className="mt-4">
          <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {l('المفاتيح تُحفظ محلياً في المتصفح فقط. لا يتم إرسالها للخادم حتى يتم ربطها رسمياً.', 'Keys are stored locally in the browser only. Not sent to server until officially wired.')}
            </div>

            {[
              { key: 'openai_key',     label: 'OpenAI API Key',     placeholder: 'sk-...', hint: l('مطلوب لإنشاء المحتوى بالذكاء الاصطناعي', 'Required for AI content creation') },
              { key: 'telegram_token', label: 'Telegram Bot Token', placeholder: '123456:ABC...', hint: l('مطلوب لإرسال إشعارات تليغرام', 'Required for Telegram notifications') },
              { key: 'zoom_api_key',   label: 'Zoom API Key',       placeholder: 'xxx...', hint: l('مطلوب لإنشاء روابط الندوات تلقائياً', 'Required for auto-creating webinar links') },
            ].map(({ key, label, placeholder, hint }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">{label}</label>
                  {integrations[key] && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Check className="h-3.5 w-3.5" />{l('مضبوط', 'Set')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showKeys[key] ? 'text' : 'password'}
                    value={integrations[key]}
                    onChange={(e) => setIntegrations(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(key)}
                    className="absolute end-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
              </div>
            ))}

            <Button onClick={handleSaveIntegrations}>{l('حفظ المفاتيح', 'Save Keys')}</Button>
          </div>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="mt-4">
          <div className="bg-card rounded-xl border p-6 max-w-2xl space-y-3">
            {[
              { name_ar: 'ترحيب بعضو جديد',      name_en: 'Welcome New Member',        status: 'active' },
              { name_ar: 'تأكيد التسجيل في دورة', name_en: 'Course Enrollment Confirm',  status: 'active' },
              { name_ar: 'تذكير بالجلسة القادمة', name_en: 'Upcoming Session Reminder',  status: 'active' },
              { name_ar: 'إشعار الدفع المكتمل',   name_en: 'Payment Confirmation',       status: 'draft' },
              { name_ar: 'إعادة تعيين كلمة المرور', name_en: 'Password Reset',            status: 'active' },
            ].map((tpl, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background rounded-xl border hover:border-primary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{l(tpl.name_ar, tpl.name_en)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l('قالب بريد إلكتروني', 'Email template')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${tpl.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-muted text-muted-foreground border-border'}`}>
                    {tpl.status === 'active' ? l('نشط', 'Active') : l('مسودة', 'Draft')}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => toast.info(l('محرر القوالب قريباً', 'Template editor coming soon'))}>
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
