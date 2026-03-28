import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Financing = () => {
  const { t, language } = useLanguage();
  const { transactions, users, addTransaction } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: '', type: 'payment', description_ar: '', description_en: '', status: 'completed', invoiceNo: '' });

  const l = (key) => language === 'ar' ? key + '_ar' : key + '_en';

  const handleAdd = (e) => {
    e.preventDefault();
    addTransaction({ ...form, amount: Number(form.amount), invoiceNo: `INV-${Date.now()}` });
    toast.success(t('common.success'));
    setModalOpen(false);
    setForm({ userId: '', amount: '', type: 'payment', description_ar: '', description_en: '', status: 'completed', invoiceNo: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.financing')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success(language === 'ar' ? 'تم التصدير' : 'Exported')}><Download className="h-4 w-4 me-1" />{t('admin.export')}</Button>
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 me-1" />{t('admin.addTransaction')}</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice No.'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'العميل' : 'Client'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'النوع' : 'Type'}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const user = users.find((u) => u.id === tx.userId);
                return (
                  <tr key={tx.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{tx.invoiceNo}</td>
                    <td className="p-3">{user ? user[l('name')] : '—'}</td>
                    <td className="p-3 text-muted-foreground">{tx[l('description')]}</td>
                    <td className="p-3"><StatusBadge status={tx.type} /></td>
                    <td className="p-3 font-medium">{tx.amount.toLocaleString()} {t('common.sar')}</td>
                    <td className="p-3"><StatusBadge status={tx.status} /></td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.addTransaction')}</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required>
              <option value="">{language === 'ar' ? '— اختر عميل —' : '— Select client —'}</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u[l('name')]}</option>)}
            </select>
            <input type="number" placeholder={language === 'ar' ? 'المبلغ' : 'Amount'} value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm">
              <option value="payment">{language === 'ar' ? 'دفع' : 'Payment'}</option>
              <option value="refund">{language === 'ar' ? 'استرداد' : 'Refund'}</option>
            </select>
            <input placeholder={language === 'ar' ? 'الوصف' : 'Description'} value={form[l('description')]} onChange={e => setForm(p => ({ ...p, [l('description')]: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
            <Button type="submit" className="w-full">{t('common.confirm')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financing;
