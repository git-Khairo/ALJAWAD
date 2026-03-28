import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { t, language } = useLanguage();
  const { users, updateUserRole } = useAppData();
  const [search, setSearch] = useState('');
  const l = (key) => language === 'ar' ? key + '_ar' : key + '_en';

  const filtered = users.filter((u) => {
    const name = u[l('name')] || '';
    return name.includes(search) || u.email.includes(search);
  });

  const handleRoleChange = (userId, role) => {
    updateUserRole(userId, role);
    toast.success(t('common.success'));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.users')}</h1>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('admin.search')} className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-3 font-medium">{t('common.name')}</th>
                <th className="text-start p-3 font-medium">{t('common.email')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.role')}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'تاريخ الانضمام' : 'Join Date'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{u[l('name')]}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3"><StatusBadge status={u.status} /></td>
                  <td className="p-3">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="px-2 py-1 rounded border bg-background text-xs">
                      <option value="user">{language === 'ar' ? 'مستخدم' : 'User'}</option>
                      <option value="admin">{language === 'ar' ? 'مسؤول' : 'Admin'}</option>
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{u.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
