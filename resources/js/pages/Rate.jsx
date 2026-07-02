import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { csatApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, AlertCircle, Loader2, Globe, Send } from 'lucide-react';
import logo from '@/assets/logo.png';

const Rate = () => {
  const { token } = useParams();

  const [lang, setLang] = useState('ar');
  const l = (ar, en) => (lang === 'ar' ? ar : en);

  const [loading, setLoading]   = useState(true);
  const [ctx, setCtx]           = useState(null);   // context payload
  const [invalid, setInvalid]   = useState(null);   // 'not_found' | 'expired' | 'answered'
  const [stars, setStars]       = useState(0);
  const [hover, setHover]       = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(null);   // { bot_deep_link }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await csatApi.context(token);
        if (!active) return;
        if (res.data?.answered) setInvalid('answered');
        else if (res.data?.expired) setInvalid('expired');
        setCtx(res.data);
      } catch (err) {
        if (active) setInvalid(err?.response?.status === 404 ? 'not_found' : 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async () => {
    if (stars < 1) return;
    setSubmitting(true);
    try {
      const res = await csatApi.submit(token, { stars, comment: comment.trim() || null });
      setDone(res.data ?? { ok: true });
    } catch (err) {
      const code = err?.response?.data?.message;
      if (code === 'already_answered') setInvalid('answered');
      else if (code === 'expired') setInvalid('expired');
      else setInvalid('error');
    } finally {
      setSubmitting(false);
    }
  };

  const Shell = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-[0.08]" />
      </div>
      <button
        onClick={() => setLang(p => (p === 'ar' ? 'en' : 'ar'))}
        className="absolute top-5 end-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition"
      >
        <Globe className="h-4 w-4" />{lang === 'ar' ? 'EN' : 'عربي'}
      </button>
      <img src={logo} alt="AlJawad" className="h-auto w-40 mb-8" />
      <div className="w-full max-w-md" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return <Shell><div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Shell>;
  }

  // Invalid / expired / already-answered states
  if (invalid && invalid !== 'answered') {
    const copy = {
      not_found: l('هذا الرابط غير صالح.', 'This link is not valid.'),
      expired:   l('انتهت صلاحية هذا الرابط.', 'This rating link has expired.'),
      error:     l('صار خطأ، جرّب لاحقاً.', 'Something went wrong. Please try again later.'),
    }[invalid] ?? l('رابط غير صالح.', 'Invalid link.');
    return (
      <Shell>
        <div className="glass-strong rounded-3xl border border-primary/20 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{copy}</p>
        </div>
      </Shell>
    );
  }

  // Already answered (or just submitted) → thank-you
  if (done || invalid === 'answered') {
    const deepLink = done?.bot_deep_link;
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl border border-primary/20 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">{l('شكراً لتقييمك! 🙏', 'Thank you for your feedback! 🙏')}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {l('رأيك بيساعدنا نطوّر خدمتنا لإلك.', 'Your feedback helps us improve our service for you.')}
          </p>

          {deepLink && (
            <div className="pt-5 border-t border-primary/10">
              <p className="text-xs text-muted-foreground mb-3">
                {l('بدك توصلك إشعاراتك وتحديثاتك مباشرة؟', 'Want to get your updates & notifications directly?')}
              </p>
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm shadow-neon hover:scale-[1.03] transition-transform"
              >
                <Send className="h-4 w-4" />
                {l('اربط تيليجرام', 'Connect Telegram')}
              </a>
            </div>
          )}
        </motion.div>
      </Shell>
    );
  }

  // Rating form
  const shown = hover || stars;
  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl border border-primary/20 p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1.5">
            {l('كيف كانت تجربتك مع خدمة العملاء؟', 'How was your customer-service experience?')}
          </h1>
          {ctx?.agent_name && (
            <p className="text-sm text-muted-foreground">
              {l('خدمك:', 'Served by:')} <span className="text-primary font-medium">{ctx.agent_name}</span>
            </p>
          )}
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => setStars(n)}
              className="transition-transform hover:scale-110"
              aria-label={`${n} stars`}
            >
              <Star
                className={`h-9 w-9 ${n <= shown ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
              />
            </button>
          ))}
        </div>

        <AnimatePresence>
          {stars > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            >
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder={l('أضف تعليقاً (اختياري)...', 'Add a comment (optional)...')}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full px-3 py-2.5 rounded-xl border border-primary/20 bg-background/60 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all mb-4"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm shadow-neon hover:scale-[1.02] transition-transform disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {l('إرسال التقييم', 'Submit Rating')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Shell>
  );
};

export default Rate;
