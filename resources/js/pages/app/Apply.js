import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockCourses } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Apply = () => {
  const { t, language } = useLanguage();
  const { addApplication } = useAppData();
  const { currentUser } = useAuth();
  const [courseId, setCourseId] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseId) { toast.error(language === 'ar' ? 'يرجى اختيار دورة' : 'Please select a course'); return; }
    addApplication({ userId: currentUser?.id || '1', courseId });
    toast.success(t('common.success'));
    setCourseId('');
    setMessage('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.apply')}</h1>
      <div className="bg-card rounded-xl border p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('app.selectCourse')}</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required>
              <option value="">{language === 'ar' ? '— اختر دورة —' : '— Select a course —'}</option>
              {mockCourses.map(c => (
                <option key={c.id} value={c.id}>{c[language === 'ar' ? 'title_ar' : 'title_en']} — {c.price} {t('common.sar')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{language === 'ar' ? 'رسالة (اختياري)' : 'Message (optional)'}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
          </div>
          <Button type="submit" variant="accent">{t('app.submitApplication')}</Button>
        </form>
      </div>
    </div>
  );
};

export default Apply;
