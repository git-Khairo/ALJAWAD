import { useMemo } from 'react';
import { Wallet } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { KPICard, KPIRow } from '@/components/KPICard';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { txDirectionLabel, txMethodLabel, txPlaceLabel } from '@/constants/transactions';
import { fmtDate } from '@/lib/format';

/**
 * Money in and out.
 *
 * A real table, because this is a ledger and a ledger's job is to let you run
 * your eye down a column of figures. Amounts are tabular mono and end-aligned
 * so the decimal points stack; the previous version set them in the body face
 * inside a stack of rounded cards, where no two amounts lined up.
 */
const Transactions = () => {
  const { t, language } = useLanguage();
  const { myTransactions } = useAppData();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const rows = myTransactions ?? [];

  const summary = useMemo(() => {
    const completed = rows.filter((r) => r.status === 'completed');
    const sum = (direction) =>
      completed
        .filter((r) => r.direction === direction)
        .reduce((total, r) => total + Number(r.amount || 0), 0);

    const deposited = sum('deposit');
    const withdrawn = sum('withdrawal');
    return { deposited, withdrawn, net: deposited - withdrawn };
  }, [rows]);

  const fmt = (n) =>
    `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader
        title={t('app.transactions')}
        description={l(
          'كل إيداع وسحب مسجّل على حسابك.',
          'Every deposit and withdrawal recorded against your account.',
        )}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={l('لا توجد معاملات بعد', 'No transactions yet')}
          description={l(
            'ستظهر عمليات الإيداع والسحب هنا فور تسجيلها من قبل الفريق.',
            'Deposits and withdrawals appear here as soon as the team records them.',
          )}
        />
      ) : (
        <div className="space-y-8">
          {/* Totals count completed transactions only: a pending withdrawal
              has not left the account yet, and showing it as though it had
              would misstate the balance. */}
          <div>
            <KPIRow className="lg:grid-cols-3">
              <KPICard title={l('إجمالي الإيداع', 'Deposited')} value={fmt(summary.deposited)} />
              <KPICard title={l('إجمالي السحب', 'Withdrawn')} value={fmt(summary.withdrawn)} />
              <KPICard
                title={l('الصافي', 'Net')}
                value={fmt(summary.net)}
                className={summary.net < 0 ? '[&>p]:text-chart-down' : undefined}
              />
            </KPIRow>
            <p className="mt-2 text-xs text-fg-faint">
              {l('تشمل المعاملات المكتملة فقط.', 'Completed transactions only.')}
            </p>
          </div>

          <div className="border border-rule">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{l('النوع', 'Type')}</TableHead>
                  <TableHead>{l('الطريقة', 'Method')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead numeric>{l('المبلغ', 'Amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isDeposit = r.direction === 'deposit';
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-fg-muted">
                        {fmtDate(r.created_at, language)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {txDirectionLabel(r.direction, language)}
                      </TableCell>
                      <TableCell className="text-fg-muted">
                        {txMethodLabel(r.method, language)}
                        {r.place && <span className="text-fg-faint"> · {txPlaceLabel(r.place, language)}</span>}
                        {r.notes && (
                          <span className="mt-0.5 block max-w-[24ch] truncate text-xs text-fg-faint">
                            {r.notes}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell
                        numeric
                        className={`whitespace-nowrap font-medium ${
                          isDeposit ? 'text-chart-up' : 'text-chart-down'
                        }`}
                      >
                        <span dir="ltr">{isDeposit ? '+' : '−'}{fmt(r.amount)}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
};

export default Transactions;
