import { useLanguage } from '@/contexts/LanguageContext';

const statusLabels = {
  draft:        { ar: 'مسودة',         en: 'Draft' },
  submitted:    { ar: 'مقدم',          en: 'Submitted' },
  under_review: { ar: 'قيد المراجعة',  en: 'Under review' },
  approved:     { ar: 'مقبول',         en: 'Approved' },
  rejected:     { ar: 'مرفوض',         en: 'Rejected' },
  scheduled:    { ar: 'مجدول',         en: 'Scheduled' },
  completed:    { ar: 'مكتمل',         en: 'Completed' },
  active:       { ar: 'نشط',           en: 'Active' },
  inactive:     { ar: 'غير نشط',       en: 'Inactive' },
  pending:      { ar: 'معلق',          en: 'Pending' },
  failed:       { ar: 'فشل',           en: 'Failed' },
  payment:      { ar: 'دفع',           en: 'Payment' },
  refund:       { ar: 'استرداد',       en: 'Refund' },
  cancelled:    { ar: 'ملغى',          en: 'Cancelled' },
  paid:         { ar: 'مدفوع',         en: 'Paid' },
  partial:      { ar: 'دفع جزئي',      en: 'Partial' },
  refunded:     { ar: 'مسترد',         en: 'Refunded' },
  open:         { ar: 'مفتوحة',        en: 'Open' },
  hit_tp:       { ar: 'حققت الهدف',    en: 'Hit TP' },
  hit_sl:       { ar: 'ضربت الوقف',    en: 'Hit SL' },
  manual_close: { ar: 'إغلاق يدوي',    en: 'Manual close' },
};

/**
 * Status marker.
 *
 * Four tones, all from the palette, each meaning one thing:
 *   neutral   nothing has happened yet, or the state is inert
 *   info      in motion, awaiting the other side (the brand teal)
 *   warn      needs someone's attention
 *   up/down   resolved well / resolved badly
 *
 * A dot rather than a per-status icon: twenty-one icons across a dense table
 * is noise, and the tone already carries the meaning. Squared to match Badge.
 */
const TONE = {
  neutral: 'border-rule bg-surface-sunken text-fg-muted',
  info:    'border-primary/25 bg-primary/10 text-primary',
  warn:    'border-warn/25 bg-warn/10 text-warn',
  up:      'border-chart-up/25 bg-chart-up/10 text-chart-up',
  down:    'border-chart-down/25 bg-chart-down/10 text-chart-down',
};

const STATUS_TONE = {
  draft: 'neutral', inactive: 'neutral', manual_close: 'neutral',
  submitted: 'info', payment: 'info', open: 'info', scheduled: 'info',
  under_review: 'warn', pending: 'warn', partial: 'warn', refund: 'warn', refunded: 'warn',
  approved: 'up', active: 'up', completed: 'up', paid: 'up', hit_tp: 'up',
  rejected: 'down', failed: 'down', cancelled: 'down', hit_sl: 'down',
};

export const StatusBadge = ({ status, withIcon = true }) => {
  const { language } = useLanguage();
  const label = statusLabels[status]?.[language] || status;
  const tone = TONE[STATUS_TONE[status]] ?? TONE.neutral;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {withIcon && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
