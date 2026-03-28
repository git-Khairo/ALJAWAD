import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockCourses } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Clock, Users, BarChart3, TrendingUp, Bitcoin } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';

const categoryIcons = { forex: TrendingUp, crypto: Bitcoin, stocks: BarChart3 };

const CourseDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const l = (key) => language === 'ar' ? key + '_ar' : key + '_en';
  const course = mockCourses.find(c => c.id === id);

  if (!course) return <div className="py-20 text-center text-muted-foreground">{t('common.noData')}</div>;

  const Icon = categoryIcons[course.category] || TrendingUp;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <AnimatedSection>
          <div className="gradient-hero rounded-2xl h-48 flex items-center justify-center relative overflow-hidden mb-8">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <Icon className="h-16 w-16 text-accent relative z-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{course[l('title')]}</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">{course[l('description')]}</p>
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border rounded-xl p-4 text-center card-hover"><Clock className="h-5 w-5 mx-auto mb-2 text-accent" /><div className="text-sm font-medium">{course[l('duration')]}</div><div className="text-xs text-muted-foreground">{t('common.duration')}</div></div>
            <div className="bg-card border rounded-xl p-4 text-center card-hover"><TrendingUp className="h-5 w-5 mx-auto mb-2 text-accent" /><div className="text-sm font-medium">{course.sessions}</div><div className="text-xs text-muted-foreground">{t('common.sessions')}</div></div>
            <div className="bg-card border rounded-xl p-4 text-center card-hover"><BarChart3 className="h-5 w-5 mx-auto mb-2 text-accent" /><div className="text-sm font-medium">{course[l('level')]}</div><div className="text-xs text-muted-foreground">{t('common.level')}</div></div>
            <div className="bg-card border rounded-xl p-4 text-center card-hover"><Users className="h-5 w-5 mx-auto mb-2 text-accent" /><div className="text-sm font-medium">{course.enrolled}</div><div className="text-xs text-muted-foreground">{t('common.enrolled')}</div></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-accent">${course.price}</span>
            <Link to="/contact"><Button variant="accent" size="lg">{t('nav.contact')}</Button></Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default CourseDetails;
