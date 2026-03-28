import { useLanguage } from '@/contexts/LanguageContext';
import { Share2 } from 'lucide-react';

const SocialMedia = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const platforms = [
    { name: 'Instagram', followers: '12.5K', engagement: '4.2%', posts: 45 },
    { name: 'Twitter / X', followers: '8.3K', engagement: '2.8%', posts: 128 },
    { name: 'LinkedIn', followers: '5.1K', engagement: '5.6%', posts: 32 },
    { name: 'TikTok', followers: '22.1K', engagement: '8.1%', posts: 67 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('وسائل التواصل الاجتماعي', 'Social Media')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((p, i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{p.name}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-lg font-bold">{p.followers}</p>
                <p className="text-xs text-muted-foreground">{l('متابعون', 'Followers')}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-lg font-bold">{p.engagement}</p>
                <p className="text-xs text-muted-foreground">{l('تفاعل', 'Engagement')}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-lg font-bold">{p.posts}</p>
                <p className="text-xs text-muted-foreground">{l('منشورات', 'Posts')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialMedia;
