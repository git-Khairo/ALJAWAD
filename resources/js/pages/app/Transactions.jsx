import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { txDirectionLabel, txMethodLabel, txPlaceLabel } from '@/constants/transactions';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Transactions = () => {
  const { t, language } = useLanguage();
  const { myTransactions } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const rows = myTransactions ?? [];
  const isEmpty = rows.length === 0;

  const summary = useMemo(() => {
    const completed = rows.filter(r => r.status === 'completed');
    const deposited  = completed.filter(r => r.direction === 'deposit').reduce((s, r) => s + Number(r.amount || 0), 0);
    const withdrawn  = completed.filter(r => r.direction === 'withdrawal').reduce((s, r) => s + Number(r.amount || 0), 0);
    return { deposited, withdrawn, net: deposited - withdrawn };
  }, [rows]);

  const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.transactions')}</h1>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 opacity-30" />
          </div>
          <p className="text-sm font-medium mb-1">
            {l('لا توجد معاملات بعد', 'No transactions yet')}
          </p>
          <p className="text-xs opacity-60 max-w-xs">
            {l(
              'ستظهر عمليات الإيداع والسحب الخاصة بك هنا فور تسجيلها.',
              'Your deposits and withdrawals will appear here once recorded.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{l('إجمالي الإيداع', 'Total Deposited')}</p>
                <p className="text-lg font-bold text-emerald-400">{fmt(summary.deposited)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{l('إجمالي السحب', 'Total Withdrawn')}</p>
                <p className="text-lg font-bold text-rose-400">{fmt(summary.withdrawn)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{l('الصافي', 'Net')}</p>
                <p className="text-lg font-bold text-primary">{fmt(summary.net)}</p>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {rows.map((r, idx) => {
              const isDeposit = r.direction === 'deposit';
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isDeposit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isDeposit ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        {txDirectionLabel(r.direction, language)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {txMethodLabel(r.method, language)}
                        {r.place && <> · {txPlaceLabel(r.place, language)}</>}
                        {' · '}
                        {r.created_at ? new Date(r.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}
                      </p>
                      {r.notes && <p className="text-xs text-muted-foreground/70 mt-1 truncate">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isDeposit ? '+' : '-'}{fmt(r.amount)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
