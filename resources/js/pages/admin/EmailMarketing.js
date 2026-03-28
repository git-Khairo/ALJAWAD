import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmailMarketing = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const campaigns = [
    { name: l('ترحيب بالعملاء الجدد', 'Welcome New Clients'), sent: 245, opened: 189, clicked: 67, status: 'sent' },
    { name: l('عرض الدورة المتقدمة', 'Advanced Course Offer'), sent: 0, opened: 0, clicked: 0, status: 'draft' },
    { name: l('تحديث شهري', 'Monthly Update'), sent: 512, opened: 398, clicked: 145, status: 'sent' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('التسويق بالبريد الإلكتروني', 'Email Marketing')}</h1>
        <Button size="sm"><Plus className="h-4 w-4 me-1" />{l('حملة جديدة', 'New Campaign')}</Button>
      </div>
      <div className="grid gap-4">
        {campaigns.map((c, i) => (
          <div key={i} className="bg-card rounded-xl border p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{c.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {c.status === 'sent' ? `${l('أُرسلت', 'Sent')}: ${c.sent} · ${l('فُتحت', 'Opened')}: ${c.opened} · ${l('نُقرت', 'Clicked')}: ${c.clicked}` : l('مسودة', 'Draft')}
                </p>
              </div>
            </div>
            <Button variant={c.status === 'draft' ? 'default' : 'outline'} size="sm">
              {c.status === 'draft' ? <><Send className="h-4 w-4 me-1" />{l('إرسال', 'Send')}</> : l('عرض التقرير', 'View Report')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailMarketing;
