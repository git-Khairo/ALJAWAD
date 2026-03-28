import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';

const CRM = () => {
  const { t, language } = useLanguage();
  const { users, updateUserTags, updateUserNotes } = useAppData();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [noteText, setNoteText] = useState('');

  const l = (key) => language === 'ar' ? key + '_ar' : key + '_en';
  const filtered = users.filter((u) => {
    const name = u[l('name')] || '';
    return name.includes(search) || u.email.includes(search);
  });

  const handleAddTag = () => {
    if (!newTag || !selected) return;
    updateUserTags(selected.id, [...(selected.tags || []), newTag]);
    setSelected({ ...selected, tags: [...(selected.tags || []), newTag] });
    setNewTag('');
    toast.success(t('common.success'));
  };

  const handleRemoveTag = (tag) => {
    if (!selected) return;
    const tags = (selected.tags || []).filter((t) => t !== tag);
    updateUserTags(selected.id, tags);
    setSelected({ ...selected, tags });
  };

  const handleSaveNote = () => {
    if (!selected) return;
    updateUserNotes(selected.id, noteText);
    setSelected({ ...selected, notes: noteText });
    toast.success(t('common.success'));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.crm')}</h1>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
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
                <th className="text-start p-3 font-medium">{t('common.phone')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{language === 'ar' ? 'وسوم' : 'Tags'}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{u[l('name')]}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{u.phone}</td>
                  <td className="p-3"><StatusBadge status={u.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.tags || []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(u); setNoteText(u.notes || ''); }}>{t('common.details')}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Panel */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('common.details')}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{selected[l('name')]?.[0]}</div>
                <div>
                  <p className="font-semibold">{selected[l('name')]}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium">{language === 'ar' ? 'الوسوم' : 'Tags'}</label>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(selected.tags || []).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                      {tag} <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder={language === 'ar' ? 'وسم جديد' : 'New tag'} className="px-3 py-1.5 rounded-lg border bg-background text-sm flex-1" />
                  <Button size="sm" onClick={handleAddTag}>{language === 'ar' ? 'إضافة' : 'Add'}</Button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">{t('admin.addNote')}</label>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border bg-background text-sm mt-1.5" />
                <Button size="sm" className="mt-2" onClick={handleSaveNote}>{t('app.save')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
