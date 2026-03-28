import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { CreditCard } from 'lucide-react';

const Transactions = () => {
  const { language } = useLanguage();
  const { transactions, users } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('المعاملات', 'Transactions')}</h1>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3 font-medium">#</th>
              <th className="text-start p-3 font-medium">{l('العميل', 'Client')}</th>
              <th className="text-start p-3 font-medium">{l('النوع', 'Type')}</th>
              <th className="text-start p-3 font-medium">{l('المبلغ', 'Amount')}</th>
              <th className="text-start p-3 font-medium">{l('الحالة', 'Status')}</th>
              <th className="text-start p-3 font-medium">{l('التاريخ', 'Date')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const user = users.find((u) => u.id === tx.userId);
              return (
                <tr key={tx.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{tx.invoiceNo}</td>
                  <td className="p-3">{user ? (language === 'ar' ? user.name_ar : user.name_en) : '—'}</td>
                  <td className="p-3"><StatusBadge status={tx.type} /></td>
                  <td className="p-3 font-medium">{tx.amount.toLocaleString()} {l('ر.س', 'SAR')}</td>
                  <td className="p-3"><StatusBadge status={tx.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
