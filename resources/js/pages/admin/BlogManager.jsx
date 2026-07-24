import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { usePagination } from '@/lib/usePagination';
import { blogApi } from '@/lib/api';
import TablePagination from '@/components/TablePagination';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FileText, Eye, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['forex', 'crypto', 'stocks'];

const CAT_COLORS = {
  forex:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  crypto:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  stocks:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const EMPTY_FORM = {
  title_ar: '', title_en: '', category: 'forex',
  author_ar: '', author_en: '',
  excerpt_ar: '', excerpt_en: '',
  content_ar: '', content_en: '',
  image: '',
  read_time: 5, status: 'draft', published_date: '',
};

const BlogManager = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { hasPermission } = useAuth();
  const { allBlogPosts: blogPosts, addBlogPost, updateBlogPost, deleteBlogPost } = useAppData();

  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterCat,    setFilterCat]      = useState('all');
  const [modalOpen,    setModalOpen]      = useState(false);
  const [editingPost,  setEditingPost]    = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [form,         setForm]           = useState(EMPTY_FORM);
  const [uploading,    setUploading]      = useState(false);

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    try {
      const res = await blogApi.upload(file);
      setForm(p => ({ ...p, image: res.data?.url ?? '' }));
      toast.success(l('تم رفع الصورة', 'Image uploaded'));
    } catch {
      toast.error(l('فشل رفع الصورة', 'Image upload failed'));
    } finally {
      setUploading(false);
    }
  };

  // KPIs
  const allPosts  = blogPosts.length;
  const published = blogPosts.filter(p => p.status === 'published').length;
  const drafts    = blogPosts.filter(p => p.status === 'draft').length;

  const filtered = blogPosts.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCat    !== 'all' && p.category !== filterCat)  return false;
    return true;
  });
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(filtered, 12, filterStatus + filterCat);

  const openAdd = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditingPost(post);
    setForm({
      title_ar: post.title_ar, title_en: post.title_en,
      category: post.category,
      author_ar: post.author_ar, author_en: post.author_en,
      excerpt_ar: post.excerpt_ar, excerpt_en: post.excerpt_en,
      content_ar: post.content_ar, content_en: post.content_en,
      image: post.image ?? '',
      read_time: post.read_time, status: post.status,
      published_date: post.published_date ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title_ar.trim() && !form.title_en.trim()) {
      toast.error(l('يرجى إدخال عنوان المقال', 'Please enter a post title'));
      return;
    }
    if (editingPost) {
      updateBlogPost({ ...editingPost, ...form, read_time: Number(form.read_time) });
      toast.success(l('تم تحديث المقال', 'Post updated'));
    } else {
      addBlogPost({ ...form, read_time: Number(form.read_time) });
      toast.success(l('تم إضافة المقال', 'Post added'));
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBlogPost(deleteTarget.id);
    toast.success(l('تم حذف المقال', 'Post deleted'));
    setDeleteTarget(null);
  };

  const statusFilterBtns = [
    { key: 'all',       labelAr: 'الكل',    labelEn: 'All' },
    { key: 'published', labelAr: 'منشور',   labelEn: 'Published' },
    { key: 'draft',     labelAr: 'مسودة',   labelEn: 'Draft' },
  ];

  const catFilterBtns = [
    { key: 'all',    labelAr: 'جميع الفئات', labelEn: 'All Categories' },
    { key: 'forex',  labelAr: 'فوركس',        labelEn: 'Forex' },
    { key: 'crypto', labelAr: 'كريبتو',       labelEn: 'Crypto' },
    { key: 'stocks', labelAr: 'أسهم',         labelEn: 'Stocks' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{l('إدارة المدونة', 'Blog Manager')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{l('إنشاء المقالات وإدارتها', 'Create and manage blog posts')}</p>
        </div>
        {hasPermission('create blog') && (
          <Button onClick={openAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />{l('مقال جديد', 'New Post')}
          </Button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label_ar: 'إجمالي المقالات', label_en: 'Total Posts',  value: allPosts,  color: 'text-primary',        bg: 'bg-primary/8' },
          { label_ar: 'منشور',           label_en: 'Published',     value: published, color: 'text-emerald-400',    bg: 'bg-emerald-500/8' },
          { label_ar: 'مسودات',          label_en: 'Drafts',        value: drafts,    color: 'text-amber-400',      bg: 'bg-amber-500/8' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-primary/10 rounded-2xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${k.bg} mb-3`}>
              <FileText className={`h-4 w-4 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l(k.label_ar, k.label_en)}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-primary/10 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statusFilterBtns.map(b => (
            <button key={b.key} onClick={() => setFilterStatus(b.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                filterStatus === b.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
              }`}>
              {l(b.labelAr, b.labelEn)}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border self-center hidden sm:block" />
        <div className="flex flex-wrap gap-1.5">
          {catFilterBtns.map(b => (
            <button key={b.key} onClick={() => setFilterCat(b.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                filterCat === b.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
              }`}>
              {l(b.labelAr, b.labelEn)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-card border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {l('لا توجد مقالات', 'No posts found')}
            </motion.div>
          )}
          {paginated.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {l(post.title_ar, post.title_en) || (language === 'ar' ? post.title_en : post.title_ar) || '—'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${CAT_COLORS[post.category] ?? 'bg-muted text-muted-foreground border-border'}`}>
                      {post.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      post.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {post.status === 'published' ? l('منشور', 'Published') : l('مسودة', 'Draft')}
                    </span>
                    {post.published_date && (
                      <span className="text-xs text-muted-foreground">{post.published_date}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />{post.views ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.read_time} {l('د قراءة', 'min read')}</span>
                  </div>
                </div>
              </div>
              {(hasPermission('edit blog') || hasPermission('delete blog')) && (
                <div className="flex gap-1 shrink-0">
                  {hasPermission('edit blog') && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('delete blog') && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(post)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length > 0 && (
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} labelAr="مقال" labelEn="post" language={language} />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? l('تعديل المقال', 'Edit Post') : l('مقال جديد', 'New Post')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('العنوان (عربي)', 'Title (Arabic)')}</label>
                <input value={form.title_ar} onChange={field('title_ar')} dir="rtl"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (English)</label>
                <input value={form.title_en} onChange={field('title_en')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الفئة', 'Category')}</label>
                <select value={form.category} onChange={field('category')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('وقت القراءة (دقائق)', 'Read Time (min)')}</label>
                <input type="number" min={1} value={form.read_time} onChange={field('read_time')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الكاتب (عربي)', 'Author (Arabic)')}</label>
                <input value={form.author_ar} onChange={field('author_ar')} dir="rtl"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Author (English)</label>
                <input value={form.author_en} onChange={field('author_en')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('المقتطف (عربي) — اختياري', 'Excerpt (Arabic) — optional')}</label>
                <textarea value={form.excerpt_ar} onChange={field('excerpt_ar')} rows={2} dir="rtl"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Excerpt (English) — optional</label>
                <textarea value={form.excerpt_en} onChange={field('excerpt_en')} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('المحتوى (عربي)', 'Content (Arabic)')}</label>
              <textarea value={form.content_ar} onChange={field('content_ar')} rows={6} dir="rtl"
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Content (English)</label>
              <textarea value={form.content_en} onChange={field('content_en')} rows={6}
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>

            {/* Cover image */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {l('صورة الغلاف (اختياري)', 'Cover Image (optional)')}
              </label>
              {form.image ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-primary/15 group">
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(p => ({ ...p, image: '' }))}
                    className="absolute top-2 end-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border border-dashed border-primary/25 cursor-pointer hover:bg-primary/5 transition ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-primary" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {uploading ? l('جاري الرفع...', 'Uploading...') : l('اضغط لرفع صورة', 'Click to upload an image')}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
                <select value={form.status} onChange={field('status')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="draft">{l('مسودة', 'Draft')}</option>
                  <option value="published">{l('منشور', 'Published')}</option>
                </select>
              </div>
              {form.status === 'published' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('تاريخ النشر', 'Published Date')}</label>
                  <input type="date" value={form.published_date} onChange={field('published_date')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button onClick={handleSave}>{l('حفظ', 'Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('حذف المقال', 'Delete Post')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {l('هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع.', 'Are you sure you want to delete this post? This cannot be undone.')}
          </p>
          <p className="text-sm font-medium mt-1">
            {deleteTarget ? l(deleteTarget.title_ar, deleteTarget.title_en) : ''}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{l('إلغاء', 'Cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{l('حذف', 'Delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManager;
