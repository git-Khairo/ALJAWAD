import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import CountUp from '@/components/interactive/CountUp';

/**
 * KPI card used across the user and admin dashboards.
 * - Glassmorphism surface with teal gradient accent on hover
 * - Auto-counts numeric values with CountUp
 * - Smart +/- colouring for the `change` prop
 */
export const KPICard = ({ title, value, icon, change, prefix = '', suffix = '', hint }) => {
  const numeric = typeof value === 'number'
    ? value
    : (typeof value === 'string' && /^-?[\d,]+(\.\d+)?$/.test(value.replace(/,/g, ''))
        ? Number(value.replace(/,/g, ''))
        : null);

  const positive = typeof change === 'string' ? change.trim().startsWith('+') : false;
  const negative = typeof change === 'string' ? change.trim().startsWith('-') : false;
  const changeClass = positive
    ? 'text-chart-up bg-chart-up/10 border-chart-up/20'
    : negative
      ? 'text-destructive bg-destructive/10 border-destructive/20'
      : 'text-primary bg-primary/10 border-primary/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-primary/15 bg-card/70 backdrop-blur-xl p-5 shadow-sm hover:shadow-neon hover:border-primary/40 transition-all"
    >
      {/* Accent glow */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-start gap-4">
        <div className="shrink-0 p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-neon transition-all">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
          <p className="text-2xl md:text-3xl font-extrabold mt-1 tabular-nums">
            {prefix}
            {numeric !== null ? <CountUp end={numeric} duration={1.2} /> : value}
            {suffix}
          </p>
          {(change || hint) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {change && (
                <span className={`inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border ${changeClass}`}>
                  {positive && <ArrowUpRight className="h-3 w-3" />}
                  {negative && <ArrowDownRight className="h-3 w-3" />}
                  {change}
                </span>
              )}
              {hint && <span className="text-[0.7rem] text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;
