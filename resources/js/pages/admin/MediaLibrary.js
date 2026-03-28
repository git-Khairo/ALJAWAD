import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Image, Video, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MediaLibrary = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{l('مكتبة الوسائط', 'Media Library')}</h1>
        <Button size="sm"><Upload className="h-4 w-4 me-1" />{l('رفع ملف', 'Upload')}</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[Image, Video, File, Image, Image, Video].map((Icon, i) => (
          <div key={i} className="bg-card rounded-xl border p-6 flex flex-col items-center justify-center gap-3 aspect-square hover:bg-muted/30 cursor-pointer transition-colors">
            <Icon className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">file-{i + 1}.{Icon === Video ? 'mp4' : Icon === File ? 'pdf' : 'jpg'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaLibrary;
