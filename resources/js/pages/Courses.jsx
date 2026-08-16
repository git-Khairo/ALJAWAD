import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Minus } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/AnimatedSection';

/**
 * Plans.
 *
 * Three matching pricing cards with a glowing "most popular" ribbon is the
 * most copied layout on the web. These are ruled columns sharing one grid,
 * so the plans line up and can actually be read against each other, and the
 * featured plan is marked with a word rather than a halo.
 */
const Courses = () => {
  const { language } = useLanguage();
  const { coursePlans, myCourseRequests, requestCourse } = useAppData();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const [submitting, setSubmitting] = useState(null);

  const requestFor = (planId) => (myCourseRequests ?? []).find((r) => r.course_plan_id === planId);

  const handleGetStarted = async (planId) => {
    if (!isAuthenticated) {
      navigate('/auth/register');
      return;
    }
    setSubmitting(planId);
    try {
      await requestCourse(planId);
      toast.success(l('تم إرسال طلبك. تابعه من لوحتك.', 'Request sent. Track it in your dashboard.'));
    } catch {
      // 422 (already requested or approved) is surfaced by the global handler.
    } finally {
      setSubmitting(null);
    }
  };

  const plans = (coursePlans ?? [])
    .filter((p) => p.status === 'active')
    .map((p) => ({
      id: p.id,
      label: p.label ?? '',
      name: l(p.name_ar, p.name_en),
      subtitle: l(p.subtitle_ar ?? '', p.subtitle_en ?? ''),
      price: p.price,
      access: l(p.access_ar ?? '', p.access_en ?? ''),
      featured: p.is_featured,
      features: p.features.filter((f) => f.included).map((f) => l(f.text_ar, f.text_en)),
      notIncluded: p.features.filter((f) => !f.included).map((f) => l(f.text_ar, f.text_en)),
    }));

  return (
    <>
      {/* ═══════════ MASTHEAD ═══════════ */}
      <section className="container border-b border-rule py-16 md:py-24">
        <p className="eyebrow mb-5 animate-rise">{l('خطط التداول', 'Trading plans')}</p>
        <h1
          className="measure animate-rise font-display text-display-sm font-bold text-foreground md:text-display-md"
          style={{ animationDelay: '60ms' }}
        >
          {l('اختر خطتك', 'Choose your plan')}
        </h1>
        <p
          className="measure animate-rise mt-5 text-lg leading-relaxed text-fg-muted"
          style={{ animationDelay: '140ms' }}
        >
          {l(
            'خطط تناسب مستويات مختلفة. يمكنك الترقية لاحقاً، ولا يوجد التزام طويل الأجل.',
            'Plans for different levels. You can move up later, and none of them locks you in.',
          )}
        </p>
      </section>

      {/* ═══════════ PLANS ═══════════ */}
      <section className="container py-16 md:py-24">
        {plans.length === 0 ? (
          <EmptyState
            title={l('لا توجد خطط متاحة حالياً', 'No plans are open right now')}
            description={l(
              'تواصل مع الفريق لمعرفة الخيارات المتاحة لك.',
              'Talk to the team about what is available to you.',
            )}
            action={
              <Button variant="accent" onClick={() => navigate('/support')}>
                {l('اسأل الفريق', 'Ask the team')}
              </Button>
            }
          />
        ) : (
          <StaggerContainer className="grid gap-px border border-rule bg-rule lg:grid-cols-3">
            {plans.map((plan) => {
              const request = requestFor(plan.id);
              const busy = submitting === plan.id;

              return (
                <StaggerItem key={plan.id} className="bg-background">
                  <div className="flex h-full flex-col p-7 md:p-9">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {plan.label && <p className="eyebrow">{plan.label}</p>}
                        <h2 className="mt-2 font-display text-display-xs font-bold text-foreground">
                          {plan.name}
                        </h2>
                      </div>
                      {plan.featured && (
                        <Badge variant="accent">{l('الأكثر طلباً', 'Most taken')}</Badge>
                      )}
                    </div>

                    {plan.subtitle && (
                      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{plan.subtitle}</p>
                    )}

                    {/* Price */}
                    <p className="mt-7 flex items-baseline gap-1.5">
                      <span className="ledger-num text-3xl text-foreground" dir="ltr">
                        ${plan.price}
                      </span>
                    </p>
                    {plan.access && (
                      <p className="mt-1 text-xs text-fg-faint">{plan.access}</p>
                    )}

                    {/* What is in it */}
                    <ul className="mt-8 flex-1 space-y-2.5 border-t border-rule pt-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                      {plan.notIncluded.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-fg-faint">
                          <Minus className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                          <span className="line-through decoration-1">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action */}
                    <div className="mt-8">
                      {request ? (
                        <div className="flex items-center justify-between gap-3 border border-rule px-3 py-2.5">
                          <span className="text-sm text-fg-muted">
                            {l('حالة طلبك', 'Your request')}
                          </span>
                          <Badge variant="secondary">{request.status}</Badge>
                        </div>
                      ) : (
                        <Button
                          variant={plan.featured ? 'accent' : 'outline'}
                          className="w-full"
                          disabled={busy}
                          onClick={() => handleGetStarted(plan.id)}
                        >
                          {busy
                            ? l('جارٍ الإرسال…', 'Sending…')
                            : isAuthenticated
                              ? l('اطلب هذه الخطة', 'Request this plan')
                              : l('أنشئ حساباً للمتابعة', 'Create an account to continue')}
                        </Button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        <AnimatedSection delay={0.1}>
          <p className="measure mt-10 text-sm leading-relaxed text-fg-faint">
            {l(
              'الأسعار بالدولار الأمريكي. طلب الخطة لا يخصم أي مبلغ: يراجعه الفريق ويتواصل معك لترتيب الدفع.',
              'Prices are in US dollars. Requesting a plan charges you nothing: the team reviews it and contacts you to arrange payment.',
            )}
          </p>
        </AnimatedSection>
      </section>
    </>
  );
};

export default Courses;
