import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle2, AlertCircle, Loader2, Globe, Send } from 'lucide-react';

import { csatApi } from '@/lib/api';
import { Wordmark } from '@/components/brand/Wordmark';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * Customer-satisfaction rating, opened from a one-time link.
 *
 * Reached from a Telegram message by someone who has just finished a support
 * conversation, usually on a phone, so it stays a single column with one
 * decision on screen at a time. It carries its own language switch because
 * it sits outside the app shell and the recipient may never have set one.
 *
 * Stars use --warn rather than a stock amber: a rating is a judgement, and it
 * belongs to the same attention colour as every other "needs a look" state.
 */
const Rate = () => {
  const { token } = useParams();

  const [lang, setLang] = useState('ar');
  const l = (ar, en) => (lang === 'ar' ? ar : en);

  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState(null);
  const [invalid, setInvalid] = useState(null); // 'not_found' | 'expired' | 'answered' | 'error'
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

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

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md animate-rise">{children}</div>
      </main>
    </div>
  );

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <Shell>
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {l('جارٍ التحميل…', 'Loading…')}
        </p>
      </Shell>
    );
  }

  /* ── Link no longer usable ───────────────────────────────────────────── */
  if (invalid && invalid !== 'answered') {
    const copy = {
      not_found: l('هذا الرابط غير صالح.', 'This link is not valid.'),
      expired:   l('انتهت صلاحية هذا الرابط.', 'This link has expired.'),
      error:     l('تعذّر فتح التقييم الآن.', 'We could not open the rating just now.'),
    }[invalid];

    return (
      <Shell>
        <div className="border border-rule p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-6 w-6 text-fg-faint" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground">{copy}</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {l(
              'إن أردت إضافة ملاحظة، تواصل مع الدعم وسنسجّلها.',
              'If you still want to leave feedback, contact support and we will record it.',
            )}
          </p>
        </div>
      </Shell>
    );
  }

  /* ── Submitted ───────────────────────────────────────────────────────── */
  if (done || invalid === 'answered') {
    const deepLink = done?.bot_deep_link;
    return (
      <Shell>
        <div className="border border-rule p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-7 w-7 text-chart-up" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground">
            {invalid === 'answered'
              ? l('سبق أن قيّمت هذه المحادثة.', 'You have already rated this conversation.')
              : l('وصل تقييمك. شكراً لك.', 'Your rating is in. Thank you.')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {l(
              'نقرأ كل تقييم، ونستخدمه لتحسين خدمة الدعم.',
              'We read every rating, and we use them to improve how support works.',
            )}
          </p>

          {deepLink && (
            <a href={deepLink} className="mt-7 inline-flex">
              <Button variant="accent">
                <Send className="h-4 w-4" />
                {l('العودة إلى تيليجرام', 'Back to Telegram')}
              </Button>
            </a>
          )}
        </div>
      </Shell>
    );
  }

  /* ── Rating form ─────────────────────────────────────────────────────── */
  const shown = hover || stars;
  const starLabel = (n) =>
    l(`${n} من 5`, `${n} out of 5`);

  return (
    <Shell>
      <div className="border border-rule p-7">
        <h1 className="text-lg font-bold leading-snug text-foreground">
          {l('كيف كانت تجربتك مع خدمة العملاء؟', 'How was your customer-service experience?')}
        </h1>
        {ctx?.agent_name && (
          <p className="mt-1.5 text-sm text-fg-muted">
            {l('خدمك:', 'Served by:')}{' '}
            <span className="font-medium text-primary">{ctx.agent_name}</span>
          </p>
        )}

        {/* Stars. A radiogroup rather than five loose buttons, so the whole
            control is reachable and announced as one choice. */}
        <div
          className="mt-7 flex justify-center gap-2"
          role="radiogroup"
          aria-label={l('التقييم', 'Rating')}
          onPointerLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={starLabel(n)}
              onPointerEnter={() => setHover(n)}
              onClick={() => setStars(n)}
              className="rounded-sm p-1 transition-transform duration-120 ease-out-quart hover:scale-110 active:scale-105"
            >
              <Star
                className={`h-9 w-9 transition-colors duration-120 ${
                  n <= shown ? 'fill-warn text-warn' : 'text-rule-strong'
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        {stars > 0 && (
          <div className="mt-7 animate-rise">
            <label htmlFor="csat-comment" className="mb-2 block text-sm font-medium text-foreground">
              {l('أضف تعليقاً', 'Add a comment')}
              <span className="ms-1.5 text-xs font-normal text-fg-faint">
                {l('اختياري', 'optional')}
              </span>
            </label>
            <Textarea
              id="csat-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={l('ما الذي سار جيداً، أو ما الذي لم يسر؟', 'What went well, or what did not?')}
            />

            <Button
              variant="accent"
              size="lg"
              className="mt-4 w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {l('إرسال التقييم', 'Submit rating')}
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default Rate;
