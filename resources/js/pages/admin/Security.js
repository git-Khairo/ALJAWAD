import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Key, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Security = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('الأمان', 'Security')}</h1>
      <div className="grid gap-4">
        {[
          { icon: Key, title: l('المصادقة الثنائية', 'Two-Factor Authentication'), desc: l('فعّل المصادقة الثنائية لحماية إضافية', 'Enable 2FA for extra security'), action: l('تفعيل', 'Enable') },
          { icon: Key, title: l('مفاتيح API', 'API Keys'), desc: l('إدارة مفاتيح الوصول للتطبيقات الخارجية', 'Manage API keys for external apps'), action: l('إدارة', 'Manage') },
          { icon: Shield, title: l('سجل الأمان', 'Security Log'), desc: l('عرض محاولات تسجيل الدخول والأنشطة المشبوهة', 'View login attempts and suspicious activity'), action: l('عرض', 'View') },
          { icon: Lock, title: l('النسخ الاحتياطي', 'Backups'), desc: l('إعداد نسخ احتياطية تلقائية للبيانات', 'Set up automatic data backups'), action: l('إعداد', 'Configure') },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-xl border p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">{item.action}</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Security;
