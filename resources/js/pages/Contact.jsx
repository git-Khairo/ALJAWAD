import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AnimatedSection } from '@/components/AnimatedSection';
import AnimatedText from '@/components/interactive/AnimatedText';
import MagneticButton from '@/components/interactive/MagneticButton';
import { Parallax, ScrollReveal } from '@/components/interactive/ParallaxSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(t('common.success'));
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  const cards = [
    { icon: MapPin, label: l('العنوان', 'Address'), value: t('contact_section.address') },
    { icon: Phone, label: l('الهاتف', 'Phone'), value: t('contact_section.phone_val') },
    { icon: Mail, label: l('البريد', 'Email'), value: t('contact_section.email_val') },
  ];

  return (
    <div className="py-20 relative">
      <Parallax speed={0.18} className="absolute top-40 start-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <Parallax speed={-0.22} className="absolute bottom-40 end-10 h-80 w-80 rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <AnimatedSection>
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
              {l('تواصل', 'Get in touch')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              <AnimatedText text={t('contact_section.title')} className="gradient-text" />
            </h1>
            <p className="text-muted-foreground text-lg">{t('contact_section.subtitle')}</p>
          </div>
        </AnimatedSection>

        {/* Contact cards */}
        <AnimatedSection delay={0.1}>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-14">
            {cards.map((item, i) => (
              <motion.a
                href="#"
                key={i}
                whileHover={{ y: -6, rotateY: 4, rotateX: -2 }}
                transition={{ type: 'spring', stiffness: 260 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative glass rounded-2xl border border-primary/15 p-6 text-center group overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all duration-500">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-sm font-medium">{item.value}</div>
                </div>
              </motion.a>
            ))}
          </div>
        </AnimatedSection>

        {/* Branches */}
        <AnimatedSection delay={0.15}>
          <div className="max-w-4xl mx-auto mb-14">
            <div className="text-center mb-6">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2">
                {l('فروعنا', 'Our Branches')}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  city_ar: 'دمشق', city_en: 'Damascus',
                  type_ar: 'الفرع الرئيسي', type_en: 'Main Branch',
                  detail_ar: 'أبو رمانة، مقابل سناك الرواد', detail_en: 'Abu Rumana, Opposite Al-Ruwwad Snack',
                },
                {
                  city_ar: 'طرطوس', city_en: 'Tartus',
                  type_ar: 'فرع طرطوس', type_en: 'Tartus Branch',
                  detail_ar: 'شارع المحكمة، مقابل بنك الآغا خان', detail_en: 'Al-Mahkama St., opposite Aga Khan Bank',
                },
              ].map((branch, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 260 }}
                  className="relative glass rounded-2xl border border-primary/15 p-6 group overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all duration-500">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-primary tracking-widest uppercase mb-1">
                        {l(branch.type_ar, branch.type_en)}
                      </div>
                      <div className="font-bold text-lg mb-0.5">{l(branch.city_ar, branch.city_en)}</div>
                      <div className="text-sm text-muted-foreground">{l(branch.detail_ar, branch.detail_en)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Form + map */}
        <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto mb-24">
          <ScrollReveal className="lg:col-span-3">
            <div className="relative glass-strong rounded-3xl border border-primary/20 p-8 overflow-hidden">
              <div className="absolute -top-20 -end-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-20 -start-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shadow-neon">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">{l('أرسل لنا رسالة', 'Send us a message')}</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field
                    value={form.name}
                    placeholder={t('contact_section.name')}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      type="email"
                      value={form.email}
                      placeholder={t('contact_section.email')}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                    <Field
                      value={form.phone}
                      placeholder={t('contact_section.phone')}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <FieldArea
                    value={form.message}
                    placeholder={t('contact_section.message')}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    rows={5}
                    required
                  />
                  <MagneticButton className="w-full">
                    <Button type="submit" variant="accent" className="w-full shadow-neon">
                      {t('contact_section.send')}
                      <Send className="h-4 w-4 ms-2 rtl:rotate-180" />
                    </Button>
                  </MagneticButton>
                </form>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15} className="lg:col-span-2">
            <div className="relative h-full min-h-[320px] rounded-3xl border border-primary/20 overflow-hidden">
              <iframe
                title={l('موقعنا على الخريطة', 'Our location on map')}
                src="https://maps.google.com/maps?q=Abu+Rumana+Damascus+Syria&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full min-h-[320px] border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-[0.2em]">
                  {l('موقعنا', 'Our location')}
                </p>
                <p className="text-sm font-medium">{t('contact_section.address')}</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* FAQ */}
        <AnimatedSection delay={0.2}>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                {l('الأسئلة', 'Questions')}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold">
                <AnimatedText text={t('faq_section.title')} className="gradient-text-soft" />
              </h2>
            </div>
            <Accordion type="single" collapsible>
              {[1, 2, 3, 4, 5].map((i) => (
                <AccordionItem
                  key={i}
                  value={`q${i}`}
                  className="border border-primary/10 rounded-xl mb-3 overflow-hidden glass hover:border-primary/30 transition-colors"
                >
                  <AccordionTrigger className="text-start px-5 py-4 hover:text-primary transition-colors hover:no-underline">
                    {t(`faq_section.q${i}`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground px-5 pb-5 leading-relaxed">
                    {t(`faq_section.a${i}`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

const Field = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/60 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${className}`}
  />
);
const FieldArea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full px-4 py-3 rounded-xl border border-primary/20 bg-background/60 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all resize-none ${className}`}
  />
);

export default Contact;
