import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AnimatedSection } from '@/components/AnimatedSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(t('common.success'));
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('contact_section.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('contact_section.subtitle')}</p>
          </div>
        </AnimatedSection>

        {/* Contact info cards */}
        <AnimatedSection delay={0.1}>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-14">
            {[
              { icon: MapPin, label: l('العنوان', 'Address'), value: t('contact_section.address') },
              { icon: Phone, label: l('الهاتف', 'Phone'), value: t('contact_section.phone_val') },
              { icon: Mail, label: l('البريد', 'Email'), value: t('contact_section.email_val') },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} className="bg-card rounded-xl border p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="text-sm font-medium">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Form */}
        <AnimatedSection delay={0.2}>
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-card rounded-2xl border p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">{l('أرسل لنا رسالة', 'Send us a message')}</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input placeholder={t('contact_section.name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="email" placeholder={t('contact_section.email')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
                  <input placeholder={t('contact_section.phone')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                </div>
                <textarea placeholder={t('contact_section.message')} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" required />
                <Button type="submit" variant="accent" className="w-full">{t('contact_section.send')}</Button>
              </form>
            </div>
          </div>
        </AnimatedSection>

        {/* FAQ Section */}
        <AnimatedSection delay={0.3}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('faq_section.title')}</h2>
            <Accordion type="single" collapsible>
              {[1, 2, 3, 4, 5].map(i => (
                <AccordionItem key={i} value={`q${i}`} className="border-b border-border">
                  <AccordionTrigger className="text-start py-5 hover:text-primary transition-colors">{t(`faq_section.q${i}`)}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">{t(`faq_section.a${i}`)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Contact;
