import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSettings = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [company, setCompany] = useState({ name: l('أكاديمية الرواد', 'Rawad Academy'), email: 'info@rawad-academy.com', phone: '+966 50 123 4567', address: l('الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia') });
  const [branding, setBranding] = useState({ primaryColor: '#1a365d', accentColor: '#d4920a' });

  const handleSave = () => toast.success(t('common.success'));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.settings')}</h1>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{t('admin.companyProfile')}</TabsTrigger>
          <TabsTrigger value="branding">{t('admin.branding')}</TabsTrigger>
          <TabsTrigger value="email">{t('admin.emailTemplates')}</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <div className="bg-card rounded-xl border p-6 mt-4 max-w-2xl space-y-4">
            <div><label className="text-sm font-medium block mb-1.5">{l('اسم الشركة', 'Company Name')}</label>
              <input value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1.5">{t('common.email')}</label>
              <input value={company.email} onChange={e => setCompany(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1.5">{t('common.phone')}</label>
              <input value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1.5">{l('العنوان', 'Address')}</label>
              <input value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" /></div>
            <Button onClick={handleSave}>{t('app.save')}</Button>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="bg-card rounded-xl border p-6 mt-4 max-w-2xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">{l('ر', 'R')}</div>
              <Button variant="outline" size="sm">{l('تغيير الشعار', 'Change Logo')}</Button>
            </div>
            <div><label className="text-sm font-medium block mb-1.5">{l('اللون الرئيسي', 'Primary Color')}</label>
              <div className="flex items-center gap-3"><input type="color" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><span className="text-sm text-muted-foreground">{branding.primaryColor}</span></div></div>
            <div><label className="text-sm font-medium block mb-1.5">{l('اللون الثانوي', 'Accent Color')}</label>
              <div className="flex items-center gap-3"><input type="color" value={branding.accentColor} onChange={e => setBranding(p => ({ ...p, accentColor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><span className="text-sm text-muted-foreground">{branding.accentColor}</span></div></div>
            <Button onClick={handleSave}>{t('app.save')}</Button>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="bg-card rounded-xl border p-6 mt-4 max-w-2xl space-y-4">
            {[l('ترحيب بعضو جديد', 'Welcome New Member'), l('تأكيد التسجيل', 'Registration Confirmation'), l('إشعار الجلسة', 'Session Notification')].map((tpl, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div><p className="text-sm font-medium">{tpl}</p><p className="text-xs text-muted-foreground">{l('قالب بريد إلكتروني', 'Email template')}</p></div>
                <Button variant="outline" size="sm">{t('common.edit')}</Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
