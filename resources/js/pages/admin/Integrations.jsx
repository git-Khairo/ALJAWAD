import { useLanguage } from '@/contexts/LanguageContext';
import { Database, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Integrations = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const integrations = [
    { name: 'Stripe', desc: l('بوابة الدفع', 'Payment gateway'), connected: true },
    { name: 'Google Analytics', desc: l('تحليلات الموقع', 'Website analytics'), connected: true },
    { name: 'Mailchimp', desc: l('التسويق بالبريد', 'Email marketing'), connected: false },
    { name: 'WhatsApp Business', desc: l('خدمة العملاء', 'Customer support'), connected: false },
    { name: 'Zoom', desc: l('الندوات والاجتماعات', 'Webinars & meetings'), connected: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('التكاملات', 'Integrations')}</h1>
      <div className="grid gap-4">
        {integrations.map((int, i) => (
          <div key={i} className="bg-card rounded-xl border p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{int.name}</h3>
                <p className="text-xs text-muted-foreground">{int.desc}</p>
              </div>
            </div>
            {int.connected ? (
              <span className="flex items-center gap-1 text-xs text-green-500"><Check className="h-4 w-4" />{l('متصل', 'Connected')}</span>
            ) : (
              <Button variant="outline" size="sm"><Link2 className="h-4 w-4 me-1" />{l('ربط', 'Connect')}</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
