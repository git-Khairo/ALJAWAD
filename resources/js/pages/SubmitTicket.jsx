import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Phone, MessageSquare, ChevronRight, CheckCircle, AlertCircle,
  ArrowLeft, Globe, Loader2,
} from 'lucide-react';

import { useAppData, normalizePhone } from '@/contexts/AppDataContext';
import { Wordmark } from '@/components/brand/Wordmark';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Public support ticket.
 *
 * Four steps: phone, identity, ticket, confirmation. The step is always
 * stated, because this page is reached cold by someone with a problem and
 * "how much more of this is there" is the first thing they want to know.
 *
 * Carries its own language switch: it sits outside the app shell and the
 * person arriving may never have set one.
 */
const CATEGORIES = [
  { key: 'Payment Issue',   label_ar: 'مشكلة دفع',      label_en: 'Payment issue' },
  { key: 'Course Access',   label_ar: 'دخول الدورة',     label_en: 'Course access' },
  { key: 'Technical Issue', label_ar: 'مشكلة تقنية',     label_en: 'Technical issue' },
  { key: 'Account Problem', label_ar: 'مشكلة بالحساب',   label_en: 'Account problem' },
  { key: 'Refund Request',  label_ar: 'طلب استرداد',     label_en: 'Refund request' },
  { key: 'General Inquiry', label_ar: 'استفسار عام',     label_en: 'General enquiry' },
  { key: 'Other',           label_ar: 'أخرى',            label_en: 'Other' },
];

const STEPS = ['phone', 'confirm', 'form'];

const SubmitTicket = () => {
  const { lookupByPhone, addTicket } = useAppData();

  const [lang, setLang] = useState('ar');
  const l = (ar, en) => (lang === 'ar' ? ar : en);

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [lookup, setLookup] = useState(null); // { record, type } | 'new'
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [form, setForm] = useState({ subject: '', category: '', description: '' });
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  /* ── Step 1: phone lookup ──────────────────────────────────────────────── */
  const handlePhoneLookup = (e) => {
    e.preventDefault();
    if (normalizePhone(phone).length < 9) {
      setErrors({ phone: l('يرجى إدخال رقم هاتف صحيح.', 'Enter a valid phone number.') });
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLookup(lookupByPhone(phone) || 'new');
      setLoading(false);
      setStep('confirm');
    }, 600);
  };

  /* ── Step 2: confirm identity ──────────────────────────────────────────── */
  const handleConfirm = (e) => {
    e.preventDefault();
    if (lookup === 'new' && !newName.trim()) {
      setErrors({ name: l('الاسم مطلوب.', 'Your name is required.') });
      return;
    }
    setErrors({});
    setStep('form');
  };

  /* ── Step 3: submit ────────────────────────────────────────────────────── */
  // The contact is resolved or created server-side (a public page cannot
  // touch the admin CRM), so the submitter's details just travel along.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.subject.trim()) next.subject = l('العنوان مطلوب.', 'A subject is required.');
    if (!form.category) next.category = l('اختر نوع المشكلة.', 'Choose a category.');
    if (!form.description.trim()) next.description = l('الوصف مطلوب.', 'A description is required.');
    setErrors(next);
    if (Object.keys(next).length) return;

    const known = lookup && lookup !== 'new';
    setLoading(true);
    try {
      const ticket = await addTicket({
        subject: form.subject,
        category: form.category,
        description: form.description,
        name: known ? lookup.record.name : newName,
        phone,
        email: (known ? lookup.record.email : newEmail) || undefined,
        priority: 'medium',
      });
      setSubmitted(ticket);
      setStep('success');
    } catch {
      toast.error(l('تعذّر إرسال التذكرة. حاول مرة أخرى.', 'Could not submit your ticket. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep('phone'); setPhone(''); setLookup(null);
    setNewName(''); setNewEmail('');
    setForm({ subject: '', category: '', description: '' });
    setSubmitted(null); setErrors({});
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center justify-between border-b border-rule px-5 py-4">
        <Wordmark size="sm" />
        <button
          onClick={() => setLang((p) => (p === 'ar' ? 'en' : 'ar'))}
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-2 text-xs text-fg-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-foreground"
          lang={lang === 'ar' ? 'en' : 'ar'}
        >
          <Globe className="h-3.5 w-3.5" />
          {lang === 'ar' ? 'English' : 'عربي'}
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* Step marker, hidden once the ticket exists. */}
          {step !== 'success' && (
            <ol className="mb-8 flex gap-2" aria-label={l('الخطوات', 'Steps')}>
              {[
                l('الهاتف', 'Phone'),
                l('هويتك', 'You'),
                l('التذكرة', 'Ticket'),
              ].map((label, i) => (
                <li key={label} className="flex-1" aria-current={i === stepIndex ? 'step' : undefined}>
                  <span
                    className={`block h-0.5 ${i <= stepIndex ? 'bg-primary' : 'bg-rule'}`}
                    aria-hidden="true"
                  />
                  <span className={`mt-2 block text-xs ${i === stepIndex ? 'text-foreground' : 'text-fg-faint'}`}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {/* ── STEP 1: phone ───────────────────────────────────────────── */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneLookup} noValidate className="animate-rise">
              <h1 className="text-xl font-bold text-foreground">
                {l('افتح تذكرة دعم', 'Open a support ticket')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {l(
                  'أدخل رقم هاتفك لنربط التذكرة بحسابك إن كان لديك حساب.',
                  'Enter your phone number so we can link the ticket to your account, if you have one.',
                )}
              </p>

              <div className="mt-7">
                <Field label={l('رقم الهاتف', 'Phone number')} error={errors.phone} required>
                  {(props) => (
                    <Input
                      {...props}
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setErrors({}); }}
                      disabled={loading}
                      dir="ltr"
                      className="font-mono"
                    />
                  )}
                </Field>
              </div>

              <Button type="submit" variant="accent" size="lg" className="mt-6 w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {loading ? l('جارٍ البحث…', 'Looking you up…') : l('متابعة', 'Continue')}
              </Button>
            </form>
          )}

          {/* ── STEP 2: identity ────────────────────────────────────────── */}
          {step === 'confirm' && (
            <form onSubmit={handleConfirm} noValidate className="animate-rise">
              {lookup && lookup !== 'new' ? (
                <>
                  <h1 className="text-xl font-bold text-foreground">
                    {l('وجدنا حسابك', 'We found your account')}
                  </h1>
                  <div className="mt-6 border border-rule p-4">
                    <p className="text-base font-semibold text-foreground">{lookup.record.name}</p>
                    <p className="ledger-num mt-0.5 text-sm text-fg-muted" dir="ltr">{phone}</p>
                    {lookup.record.email && (
                      <p className="mt-0.5 text-sm text-fg-muted" dir="ltr">{lookup.record.email}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-foreground">
                    {l('عرّفنا بنفسك', 'Tell us who you are')}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                    {l(
                      'لا يوجد حساب بهذا الرقم، ولا بأس: يمكنك فتح تذكرة دون حساب.',
                      'There is no account on that number, which is fine: you can open a ticket without one.',
                    )}
                  </p>

                  <div className="mt-7 space-y-5">
                    <Field label={l('الاسم', 'Name')} error={errors.name} required>
                      {(props) => (
                        <Input {...props} value={newName}
                          onChange={(e) => { setNewName(e.target.value); setErrors({}); }} />
                      )}
                    </Field>
                    <Field label={l('البريد الإلكتروني', 'Email')} hint={l('اختياري.', 'Optional.')}>
                      {(props) => (
                        <Input {...props} type="email" value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)} dir="ltr" />
                      )}
                    </Field>
                  </div>
                </>
              )}

              <div className="mt-7 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('phone')}>
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {l('رجوع', 'Back')}
                </Button>
                <Button type="submit" variant="accent" className="flex-1">
                  {l('متابعة', 'Continue')}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 3: ticket ──────────────────────────────────────────── */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} noValidate className="animate-rise">
              <h1 className="text-xl font-bold text-foreground">
                {l('ما المشكلة؟', 'What is the problem?')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {l(
                  'كلما كان الوصف أدق، كان الرد أسرع.',
                  'The more precisely you describe it, the faster the reply.',
                )}
              </p>

              <div className="mt-7 space-y-5">
                <Field label={l('عنوان المشكلة', 'Subject')} error={errors.subject} required>
                  {(props) => (
                    <Input {...props} value={form.subject}
                      onChange={(e) => setField('subject', e.target.value)} />
                  )}
                </Field>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    {l('نوع المشكلة', 'Category')}
                    <span className="ms-1 text-primary" aria-hidden="true">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => {
                      const active = form.category === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setField('category', c.key)}
                          className={`rounded-sm border px-3 py-2 text-sm transition-colors duration-120 ${
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-rule-strong text-fg-muted hover:border-fg-faint hover:text-foreground'
                          }`}
                        >
                          {l(c.label_ar, c.label_en)}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p role="alert" className="mt-2 text-xs text-destructive">{errors.category}</p>
                  )}
                </fieldset>

                <Field label={l('وصف المشكلة', 'Description')} error={errors.description} required>
                  {(props) => (
                    <Textarea {...props} rows={5} value={form.description}
                      onChange={(e) => setField('description', e.target.value)} />
                  )}
                </Field>
              </div>

              <div className="mt-7 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('confirm')}>
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {l('رجوع', 'Back')}
                </Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  {l('إرسال التذكرة', 'Submit ticket')}
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 4: confirmation ────────────────────────────────────── */}
          {step === 'success' && submitted && (
            <div className="animate-rise">
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-7 w-7 text-chart-up" strokeWidth={1.5} aria-hidden="true" />
                <h1 className="text-xl font-bold text-foreground">
                  {l('تم إرسال تذكرتك', 'Your ticket is in')}
                </h1>
                <p className="mt-2 text-sm text-fg-muted">
                  {l('سيتواصل معك فريق الدعم قريباً.', 'Support will get back to you shortly.')}
                </p>
              </div>

              <dl className="mt-7 border border-rule">
                <div className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-3">
                  <dt className="text-xs text-fg-faint">{l('رقم التذكرة', 'Ticket number')}</dt>
                  <dd className="ledger-num text-sm font-semibold text-primary" dir="ltr">{submitted.id}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-3">
                  <dt className="text-xs text-fg-faint">{l('العنوان', 'Subject')}</dt>
                  <dd className="text-end text-sm text-foreground">{submitted.subject}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-3">
                  <dt className="text-xs text-fg-faint">{l('النوع', 'Category')}</dt>
                  <dd className="text-end text-sm text-foreground">{submitted.category}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-xs text-fg-faint">{l('التاريخ', 'Opened')}</dt>
                  <dd className="text-end text-sm text-fg-muted">
                    {new Date(submitted.opened).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                  </dd>
                </div>
              </dl>

              <Alert variant="accent" className="mt-5">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>
                  {l(
                    'احتفظ برقم التذكرة للمتابعة. سنتواصل معك على الرقم المُسجَّل.',
                    'Keep the ticket number for reference. We will contact you on the number you gave.',
                  )}
                </AlertDescription>
              </Alert>

              <button
                onClick={restart}
                className="mt-6 w-full text-center text-sm text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
              >
                {l('تقديم تذكرة أخرى', 'Submit another ticket')}
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-rule py-4 text-center text-xs text-fg-faint">
        AlJawad © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default SubmitTicket;
