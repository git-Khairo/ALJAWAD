import { useState } from 'react';
import { useAppData, normalizePhone } from '@/contexts/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Phone, User, Mail, MessageSquare, ChevronRight,
  CheckCircle, AlertCircle, Search, ArrowLeft, Globe,
  HelpCircle,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'Payment Issue',   icon: '💳', label_ar: 'مشكلة دفع' },
  { key: 'Course Access',   icon: '🎓', label_ar: 'دخول الدورة' },
  { key: 'Technical Issue', icon: '🔧', label_ar: 'مشكلة تقنية' },
  { key: 'Account Problem', icon: '👤', label_ar: 'مشكلة بالحساب' },
  { key: 'Refund Request',  icon: '↩️', label_ar: 'طلب استرداد' },
  { key: 'General Inquiry', icon: '❓', label_ar: 'استفسار عام' },
  { key: 'Other',           icon: '📋', label_ar: 'أخرى' },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
// 1. phone   → enter phone number
// 2. confirm → found / not-found, if new ask for name+email
// 3. form    → subject + category + description
// 4. success → confirmation screen

const SubmitTicket = () => {
  const { lookupByPhone, addTicket } = useAppData();

  const [lang, setLang] = useState('ar');
  const l = (ar, en) => lang === 'ar' ? ar : en;

  const [step, setStep]         = useState('phone');
  const [phone, setPhone]       = useState('');
  const [lookup, setLookup]     = useState(null); // { record, type } | 'new'
  const [newName, setNewName]   = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [form, setForm]         = useState({ subject: '', category: '', description: '' });
  const [submitted, setSubmitted] = useState(null); // the created ticket

  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading]       = useState(false);

  // ── Step 1: phone lookup ───────────────────────────────────────────────────
  const handlePhoneLookup = () => {
    setPhoneError('');
    const normalized = normalizePhone(phone);
    if (normalized.length < 9) { setPhoneError(l('يرجى إدخال رقم هاتف صحيح', 'Please enter a valid phone number')); return; }
    setLoading(true);
    setTimeout(() => {
      const found = lookupByPhone(phone);
      setLookup(found || 'new');
      setLoading(false);
      setStep('confirm');
    }, 600);
  };

  // ── Step 2: confirm identity ───────────────────────────────────────────────
  const handleConfirm = () => {
    if (lookup === 'new' && !newName.trim()) return;
    setStep('form');
  };

  // ── Step 3: submit ticket ──────────────────────────────────────────────────
  // The contact is resolved/created server-side (the public page can't touch
  // the admin CRM), so we just pass the submitter's name/phone/email along.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.category || !form.description.trim()) return;

    const name  = (lookup && lookup !== 'new') ? lookup.record.name  : newName;
    const email = (lookup && lookup !== 'new') ? lookup.record.email : newEmail;

    setLoading(true);
    try {
      const ticket = await addTicket({
        subject:     form.subject,
        category:    form.category,
        description: form.description,
        name,
        phone,
        email:       email || undefined,
        priority:    'medium',
      });
      setSubmitted(ticket);
      setStep('success');
    } catch {
      toast.error(l('تعذّر إرسال التذكرة. حاول مرة أخرى.', 'Could not submit your ticket. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Shared wrapper ─────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-[#0d0d0d] text-white flex flex-col ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shadow-neon">
            <HelpCircle className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold text-sm">AlJawad Support</span>
        </div>
        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs hover:bg-white/5 transition">
          <Globe className="h-3.5 w-3.5" />
          {lang === 'ar' ? 'English' : 'عربي'}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Progress dots */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {['phone', 'confirm', 'form'].map((s, i) => {
                const idx    = ['phone', 'confirm', 'form'].indexOf(step);
                const active = i === idx;
                const done   = i < idx;
                return (
                  <div key={s} className={`rounded-full transition-all duration-300 ${
                    active ? 'w-6 h-2 bg-primary' : done ? 'w-2 h-2 bg-primary/60' : 'w-2 h-2 bg-white/15'
                  }`} />
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── STEP 1: phone ──────────────────────────────────────────── */}
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <h1 className="text-2xl font-bold mb-1">{l('تواصل مع الدعم', 'Contact Support')}</h1>
                <p className="text-sm text-white/50 mb-8">
                  {l('أدخل رقم هاتفك لنتحقق من هويتك', 'Enter your phone number so we can verify your identity')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-2">
                      {l('رقم الهاتف', 'Phone Number')}
                    </label>
                    <div className="relative">
                      <Phone className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePhoneLookup()}
                        placeholder="+966 5X XXX XXXX"
                        className={`w-full h-12 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-white/20 ${lang === 'ar' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'}`}
                      />
                    </div>
                    {phoneError && <p className="text-xs text-red-400 mt-1.5">{phoneError}</p>}
                  </div>

                  <button onClick={handlePhoneLookup} disabled={loading}
                    className="w-full h-12 rounded-xl gradient-gold text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-neon">
                    {loading
                      ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      : <><Search className="h-4 w-4" />{l('تحقق', 'Verify')}</>}
                  </button>
                </div>

                <p className="text-center text-xs text-white/25 mt-8">
                  {l('يمكنك أيضاً التواصل عبر واتساب على', 'You can also reach us on WhatsApp at')}
                  {' '}<span className="text-primary">+966 5X XXX XXXX</span>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: confirm identity ────────────────────────────────── */}
            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                {lookup !== 'new' ? (
                  <>
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center text-black font-black text-2xl shadow-neon">
                        {lookup.record.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-center mb-1">
                      {l('مرحباً،', 'Hello,')} {lookup.record.name}
                    </h1>
                    <p className="text-sm text-white/50 text-center mb-2">
                      {lookup.type === 'client'
                        ? l('تم التعرف عليك كعميل', 'You\'re recognized as a client')
                        : l('تم التعرف عليك كعميل محتمل', 'You\'re recognized as a lead')}
                    </p>
                    <p className="text-xs text-white/30 text-center mb-8">{phone}</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold mb-1">{l('رقم غير موجود', 'New Contact')}</h1>
                    <p className="text-sm text-white/50 mb-6">
                      {l('لم نجد حساباً بهذا الرقم. أدخل بياناتك لنتمكن من التواصل معك.', 'We couldn\'t find an account with this number. Enter your details so we can follow up.')}
                    </p>
                    <div className="space-y-3 mb-6">
                      <div className="relative">
                        <User className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                        <input required value={newName} onChange={e => setNewName(e.target.value)}
                          placeholder={l('الاسم الكامل *', 'Full Name *')}
                          className={`w-full h-11 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/20 ${lang === 'ar' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'}`} />
                      </div>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                          placeholder={l('البريد الإلكتروني (اختياري)', 'Email (optional)')}
                          className={`w-full h-11 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/20 ${lang === 'ar' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'}`} />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setStep('phone'); setLookup(null); }}
                    className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition text-sm">
                    <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                  <button onClick={handleConfirm}
                    disabled={lookup === 'new' && !newName.trim()}
                    className="flex-1 h-12 rounded-xl gradient-gold text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-neon">
                    {l('تابع', 'Continue')} <ChevronRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: ticket form ─────────────────────────────────────── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <h1 className="text-2xl font-bold mb-1">{l('تفاصيل المشكلة', 'Describe Your Issue')}</h1>
                <p className="text-sm text-white/50 mb-6">
                  {l('سنعمل على حلها في أقرب وقت ممكن', 'We\'ll work on resolving it as soon as possible')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-2">
                      {l('عنوان المشكلة', 'Subject')} <span className="text-red-400">*</span>
                    </label>
                    <input required value={form.subject} onChange={e => setField('subject', e.target.value)}
                      placeholder={l('وصف مختصر للمشكلة', 'Brief description of the issue')}
                      className={`w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/20 ${lang === 'ar' ? 'text-right' : ''}`} />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-2">
                      {l('نوع المشكلة', 'Category')} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat.key} type="button"
                          onClick={() => setField('category', cat.key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-start transition ${
                            form.category === cat.key
                              ? 'border-primary/60 bg-primary/15 text-primary'
                              : 'border-white/8 bg-white/3 text-white/60 hover:bg-white/8'
                          }`}>
                          <span className="text-base leading-none">{cat.icon}</span>
                          <span className="text-xs font-medium leading-tight">{l(cat.label_ar, cat.key)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-2">
                      {l('وصف المشكلة', 'Description')} <span className="text-red-400">*</span>
                    </label>
                    <textarea required value={form.description} onChange={e => setField('description', e.target.value)}
                      rows={4} placeholder={l('اشرح مشكلتك بالتفصيل...', 'Describe your issue in detail...')}
                      className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/20 resize-none ${lang === 'ar' ? 'text-right' : ''}`} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setStep('confirm')}
                      className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition text-sm">
                      <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    </button>
                    <button type="submit"
                      disabled={!form.subject || !form.category || !form.description || loading}
                      className="flex-1 h-12 rounded-xl gradient-gold text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-neon">
                      {loading
                        ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        : <><MessageSquare className="h-4 w-4" />{l('إرسال التذكرة', 'Submit Ticket')}</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 4: success ─────────────────────────────────────────── */}
            {step === 'success' && submitted && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </motion.div>

                <h1 className="text-2xl font-bold mb-2">{l('تم إرسال تذكرتك!', 'Ticket Submitted!')}</h1>
                <p className="text-sm text-white/50 mb-6">
                  {l('سيتواصل معك فريق الدعم قريباً', 'Our support team will contact you shortly')}
                </p>

                <div className="bg-white/5 border border-white/8 rounded-2xl p-5 text-start mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-sm font-bold text-primary">{submitted.id}</span>
                    <span className="text-xs text-white/30">{new Date(submitted.opened).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{submitted.subject}</p>
                  <p className="text-xs text-white/40">{submitted.category}</p>
                </div>

                <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3 text-start mb-6">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60">
                    {l(
                      'احتفظ برقم التذكرة أعلاه للمتابعة. سنتواصل معك عبر الهاتف المُسجَّل.',
                      'Keep the ticket number above for reference. We\'ll contact you on the registered phone.'
                    )}
                  </p>
                </div>

                <button onClick={() => { setStep('phone'); setPhone(''); setLookup(null); setNewName(''); setNewEmail(''); setForm({ subject: '', category: '', description: '' }); setSubmitted(null); }}
                  className="text-sm text-white/40 hover:text-white/70 transition underline underline-offset-2">
                  {l('تقديم تذكرة أخرى', 'Submit another ticket')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-white/20">
        AlJawad © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default SubmitTicket;
