import { useLanguage } from '@/contexts/LanguageContext';
import {
  CheckCircle2, Clock, XCircle, AlertCircle, FileText, Calendar, Sparkles,
  CreditCard, RotateCcw
} from 'lucide-react';

const statusLabels = {
  draft:        { ar: 'مسودة',         en: 'Draft' },
  submitted:    { ar: 'مقدم',          en: 'Submitted' },
  under_review: { ar: 'قيد المراجعة',  en: 'Under Review' },
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
};

/**
 * Status pill used in dashboards. Aligned to the brand teal palette with
 * semantic accents only where status is intrinsically positive/negative.
 */
const STATUS_CONFIG = {
  draft:        { cls: 'bg-muted text-muted-foreground border-border',                icon: FileText },
  submitted:    { cls: 'bg-primary/10 text-primary border-primary/25',                icon: FileText },
  under_review: { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/25',          icon: Clock },
  pending:      { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/25',          icon: Clock },
  approved:     { cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',    icon: CheckCircle2 },
  active:       { cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',    icon: CheckCircle2 },
  completed:    { cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',    icon: CheckCircle2 },
  rejected:     { cls: 'bg-destructive/10 text-destructive border-destructive/25',    icon: XCircle },
  failed:       { cls: 'bg-destructive/10 text-destructive border-destructive/25',    icon: XCircle },
  inactive:     { cls: 'bg-muted text-muted-foreground border-border',                icon: AlertCircle },
  scheduled:    { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/25',       icon: Calendar },
  payment:      { cls: 'bg-primary/10 text-primary border-primary/25',                icon: CreditCard },
  refund:       { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25',       icon: RotateCcw },
};

export const StatusBadge = ({ status, withIcon = true }) => {
  const { language } = useLanguage();
  const label = statusLabels[status]?.[language] || status;
  const { cls, icon: Icon } = STATUS_CONFIG[status] || { cls: STATUS_CONFIG.draft.cls, icon: Sparkles };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-medium border backdrop-blur-sm ${cls}`}>
      {withIcon && Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
};

export default StatusBadge;
