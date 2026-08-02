import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { Product } from '../types';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  ShoppingBag, 
  ExternalLink,
  Eye,
  Star,
  Tag,
  Sparkles,
  X,
  Pencil,
  PlaySquare,
  Youtube,
  ImageIcon,
  Share2
} from 'lucide-react';
import { VideoImportModal } from '../components/VideoImportModal';
import { SocialVideoExportModal } from '../components/SocialVideoExportModal';
import { VideoReview } from '../types';

export const AdminPage: React.FC = () => {
  const { 
    products, 
    videos,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    resetCatalog,
    openThumbnailEditor,
    language,
    formatPrice
  } = useApp();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(true); // unlocked for convenience
  const [passcode, setPasscode] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportVideoOpen, setIsImportVideoOpen] = useState<boolean>(false);
  const [exportVideo, setExportVideo] = useState<VideoReview | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    description: '',
    longDescription: '',
    category: 'smart-home' as any,
    subcategory: 'المكانس الروبوتية',
    brand: '',
    image: '',
    imagesStr: '',
    youtubeUrl: '',
    tiktokUrl: '',
    pinterestUrl: '',
    amazonUrl: '',
    aliexpressUrl: '',
    originalPrice: 1000,
    discountPrice: 750,
    currency: 'رس',
    rating: 4.8,
    reviewCount: 150,
    featuresStr: '',
    keywordsStr: '',
    isFeatured: false,
    isTopSelling: false
  });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'yousra2026' || passcode === '1234' || passcode === '') {
      setIsUnlocked(true);
    } else {
      alert('كلمة المرور غير صحيحة! جرب: yousra2026');
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      titleAr: '',
      titleEn: '',
      description: '',
      longDescription: '',
      category: 'smart-home',
      subcategory: 'المكانس الروبوتية',
      brand: 'Roborock',
      image: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80',
      imagesStr: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      tiktokUrl: '',
      pinterestUrl: '',
      amazonUrl: 'https://www.amazon.com/dp/EXAMPLE?tag=yousrasmile-20',
      aliexpressUrl: 'https://s.click.aliexpress.com/e/EXAMPLE',
      originalPrice: 1200,
      discountPrice: 899,
      currency: 'رس',
      rating: 4.9,
      reviewCount: 95,
      featuresStr: 'تحكم ذكي من الهاتف, قوة شفط عالية, تنظيف ذاتي',
      keywordsStr: 'سمارت هوم, تنظيف, ذكي',
      isFeatured: true,
      isTopSelling: false
    });
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      titleAr: prod.titleAr,
      titleEn: prod.titleEn,
      description: prod.description,
      longDescription: prod.longDescription || '',
      category: prod.category,
      subcategory: prod.subcategory,
      brand: prod.brand,
      image: prod.image,
      imagesStr: prod.images ? prod.images.join(', ') : prod.image,
      youtubeUrl: prod.youtubeUrl || '',
      tiktokUrl: prod.tiktokUrl || '',
      pinterestUrl: prod.pinterestUrl || '',
      amazonUrl: prod.amazonUrl,
      aliexpressUrl: prod.aliexpressUrl || '',
      originalPrice: prod.originalPrice,
      discountPrice: prod.discountPrice,
      currency: prod.currency || 'رس',
      rating: prod.rating,
      reviewCount: prod.reviewCount,
      featuresStr: prod.features ? prod.features.join(', ') : '',
      keywordsStr: prod.keywords ? prod.keywords.join(', ') : '',
      isFeatured: !!prod.isFeatured,
      isTopSelling: !!prod.isTopSelling
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const discountPercent = formData.originalPrice > formData.discountPrice 
      ? Math.round(((formData.originalPrice - formData.discountPrice) / formData.originalPrice) * 100) 
      : 0;

    const imagesArray = formData.imagesStr 
      ? formData.imagesStr.split(',').map(s => s.trim()).filter(Boolean) 
      : [formData.image];

    const featuresArray = formData.featuresStr 
      ? formData.featuresStr.split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    const keywordsArray = formData.keywordsStr 
      ? formData.keywordsStr.split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        titleAr: formData.titleAr,
        titleEn: formData.titleEn,
        description: formData.description,
        longDescription: formData.longDescription,
        category: formData.category,
        subcategory: formData.subcategory,
        brand: formData.brand,
        image: formData.image,
        images: imagesArray,
        youtubeUrl: formData.youtubeUrl,
        tiktokUrl: formData.tiktokUrl,
        pinterestUrl: formData.pinterestUrl,
        amazonUrl: formData.amazonUrl,
        aliexpressUrl: formData.aliexpressUrl,
        originalPrice: Number(formData.originalPrice),
        discountPrice: Number(formData.discountPrice),
        discountPercent: discountPercent,
        currency: formData.currency,
        rating: Number(formData.rating),
        reviewCount: Number(formData.reviewCount),
        features: featuresArray,
        specs: editingProduct.specs || { 'الضمان': 'سنتان' },
        keywords: keywordsArray,
        isFeatured: formData.isFeatured,
        isTopSelling: formData.isTopSelling
      });
    } else {
      addProduct({
        titleAr: formData.titleAr,
        titleEn: formData.titleEn,
        description: formData.description,
        longDescription: formData.longDescription,
        category: formData.category,
        subcategory: formData.subcategory,
        brand: formData.brand,
        image: formData.image,
        images: imagesArray,
        youtubeUrl: formData.youtubeUrl,
        tiktokUrl: formData.tiktokUrl,
        pinterestUrl: formData.pinterestUrl,
        amazonUrl: formData.amazonUrl,
        aliexpressUrl: formData.aliexpressUrl,
        originalPrice: Number(formData.originalPrice),
        discountPrice: Number(formData.discountPrice),
        discountPercent: discountPercent,
        currency: formData.currency,
        rating: Number(formData.rating),
        reviewCount: Number(formData.reviewCount),
        features: featuresArray,
        specs: { 'الضمان': 'سنتان شاملتان' },
        keywords: keywordsArray,
        isFeatured: formData.isFeatured,
        isTopSelling: formData.isTopSelling
      });
    }

    setIsFormOpen(false);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
          دخول لوحة تحكم يسرى سمايل
        </h2>
        <p className="text-xs text-slate-500">
          يرجى إدخال رمز المرور الإداري للتحكم بالمنتجات والروابط العفيلت.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password"
            placeholder="كلمة المرور (رمز افتراضي: yousra2026)"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-sm"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
          >
            فتح اللوحة الآن
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <Settings className="w-4 h-4" />
            لوحة الإدارة الحصرية بدون برمجة
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Tajawal']">
            لوحة تحكم منتجات يسرى سمايل (Dashboard)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            إضافة وإعادة ترتيب وتعديل المنتجات، الفيديوهات، وروابط التسويق بالعمولة لأمازون وعلي إكسبريس.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={resetCatalog}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            استعادة الكتالوج الافتراضي
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* Quick Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 block font-bold">إجمالي المنتجات</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-['Tajawal']">{products.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 block font-bold">المنتجات المميزة</span>
          <span className="text-2xl font-black text-amber-500 font-['Tajawal']">{products.filter(p => p.isFeatured).length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 block font-bold">الأقسام المتاحة</span>
          <span className="text-2xl font-black text-emerald-500 font-['Tajawal']">{CATEGORIES.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 block font-bold">نقرات الأفلييت المحاكاة</span>
          <span className="text-2xl font-black text-blue-500 font-['Tajawal']">1,480+</span>
        </div>
      </div>

      {/* Guide Box for Adding Products & Videos */}
      <div className="bg-gradient-to-br from-amber-500/10 via-purple-900/20 to-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 text-slate-100 shadow-md">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <h2 className="font-['Tajawal'] text-lg">دليل استخدام المنصة وإضافة المنتجات والفيديوهات (لكل مسوّق)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-200">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>1. كيف أضيف منتجاً جديداً؟</span>
            </div>
            <p>
              اضغط على زر <strong className="text-purple-300">"إضافة منتج جديد"</strong> بالأعلى. أدخل اسم المنتج، رابط الصورة، السعر، ورابط الأفلييت الخاص بك في Amazon أو AliExpress. سيظهر المنتج فوراً في المتجر مع أزرار الشراء المباشرة.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <PlaySquare className="w-4 h-4 text-red-400" />
              <span>2. كيف أضيف فيديو مراجعة؟</span>
            </div>
            <p>
              يمكنك إضافة رابط فيديو يوتيوب أو تيك توك أو بنترست عند إضافة/تعديل أي منتج، أو اضغط على <strong className="text-purple-300">"استيراد فيديو مراجعة جديد"</strong> بالأسفل لإظهاره في قسم الفيديوهات.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>3. هل يمكن لأي شخص استخدامه للتسويق؟</span>
            </div>
            <p>
              <strong className="text-emerald-300">نعم، بالكامل!</strong> المنصة مصممة لتكون عامة وجاهزة لأي شخص يعمل في التسويق بالعمولة. يمكنك وضع روابطك الخاصة، تعديل الكتالوج، وتخصيص المتجر كما تحب.
            </p>
          </div>
        </div>
      </div>

      {/* Products Table Manager */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Tajawal']">
            جدول إدارة جميع المنتجات المعروضة
          </h3>
          <span className="text-xs text-slate-400">إجمالي {products.length} منتج</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">المنتج والصورة</th>
                <th className="p-3">القسم والعلامة التجارية</th>
                <th className="p-3">السعر والخصم</th>
                <th className="p-3">فيديوهات المراجعة</th>
                <th className="p-3">روابط الأفلييت</th>
                <th className="p-3 text-center">إجراءات الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map(prod => (
                <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={prod.image} 
                        alt={prod.titleAr} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-xs">{prod.titleAr}</h4>
                        <span className="text-[10px] text-slate-400">ID: {prod.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-purple-600 dark:text-purple-400 block">{prod.brand}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{prod.subcategory}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 dark:text-white font-black font-['Tajawal']">{formatPrice(prod.discountPrice)}</strong>
                      {prod.discountPercent > 0 && (
                        <span className="block text-[10px] text-red-500 font-bold">خصم {prod.discountPercent}%</span>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1 text-[11px]">
                      {prod.youtubeUrl && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">YouTube</span>}
                      {prod.tiktokUrl && <span className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-bold">TikTok</span>}
                      {prod.pinterestUrl && <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">Pinterest</span>}
                      {!prod.youtubeUrl && !prod.tiktokUrl && !prod.pinterestUrl && <span className="text-slate-400">لا يوجد</span>}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <a 
                        href={prod.amazonUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
                        title="رابط أمازون أفلييت"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </a>
                      {prod.aliexpressUrl && (
                        <a 
                          href={prod.aliexpressUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="رابط علي إكسبريس"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-100 transition-colors"
                        title="تعديل المنتج"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنتِ متأكدة من حذف المنتج "${prod.titleAr}"؟`)) {
                            deleteProduct(prod.id);
                          }
                        }}
                        className="p-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Reviews & YouTube-Style Thumbnail Manager */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Youtube className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
                <span>إدارة فيديوهات المراجعة والاستيراد الاجتماعي</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-md">YouTube / TikTok / Pinterest</span>
              </h3>
              <p className="text-xs text-slate-400">
                يمكنك استيراد فيديو جديد برابط مباشر، أو تعديل الثمبنيل، أو تصدير ومشاركة الأفرع فوراً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportVideoOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>استيراد فيديو برابط 🚀</span>
            </button>

            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
              {videos.length} فيديو
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div 
              key={video.id}
              className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/50 transition-colors group"
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img 
                  src={video.thumbnailUrl || video.productImage} 
                  alt={video.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Platform Badge */}
                <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase shadow-md">
                  {video.platform}
                </span>

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 bg-slate-950/90 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                  {video.duration}
                </span>

                {/* Pencil Edit Thumbnail Overlay Button */}
                <button
                  type="button"
                  onClick={() => openThumbnailEditor(video)}
                  className="absolute top-2.5 right-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer z-10"
                  title="تعديل الصورة المصغرة للفيديو (أيقونة القلم)"
                >
                  <Pencil className="w-4 h-4 fill-slate-950" />
                  <span className="text-[11px] font-black">تغيير الصورة ✏️</span>
                </button>
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block line-clamp-1">
                  المنتج: {video.productTitle}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                  {video.title}
                </h4>
                
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>👁 {video.views}</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExportVideo(video)}
                      className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
                    >
                      <Share2 className="w-3 h-3" />
                      تصدير
                    </button>

                    <button
                      type="button"
                      onClick={() => openThumbnailEditor(video)}
                      className="text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      ثمبنيل
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Import Modal */}
      <VideoImportModal 
        isOpen={isImportVideoOpen} 
        onClose={() => setIsImportVideoOpen(false)} 
      />

      {/* Video Export Modal */}
      {exportVideo && (
        <SocialVideoExportModal 
          video={exportVideo} 
          onClose={() => setExportVideo(null)} 
        />
      )}

      {/* Product Add / Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal']">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للعمولة'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم المنتج بالعربية *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الاسم بالإنجليزية</label>
                  <input 
                    type="text" 
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">القسم الرئيسي *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الفرع (Subcategory)</label>
                  <input 
                    type="text" 
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">العلامة التجارية (Brand)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الوصف المختصر *</label>
                <textarea 
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-purple-50/50 dark:bg-purple-950/30 p-3 rounded-2xl border border-purple-100 dark:border-purple-900">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">السعر الأصلي (قبل الخصم)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-purple-700 dark:text-purple-300 block mb-1">السعر الحالي (بعد الخصم) *</label>
                  <input 
                    type="number" 
                    required
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">العملة</label>
                  <input 
                    type="text" 
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Affiliate links */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-amber-600 dark:text-amber-400 block mb-1">رابط Amazon Affiliate *</label>
                  <input 
                    type="url" 
                    required
                    value={formData.amazonUrl}
                    onChange={(e) => setFormData({ ...formData, amazonUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl p-2.5 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-red-600 dark:text-red-400 block mb-1">رابط AliExpress Affiliate</label>
                  <input 
                    type="url" 
                    value={formData.aliexpressUrl}
                    onChange={(e) => setFormData({ ...formData, aliexpressUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Image & Video Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رابط الصورة الرئيسية *</label>
                  <input 
                    type="url" 
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رابط فيديو YouTube للمراجعة</label>
                  <input 
                    type="text" 
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Features comma separated */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">أبرز المميزات (مفصولة بفواصل ,)</label>
                <input 
                  type="text" 
                  value={formData.featuresStr}
                  onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                  placeholder="مثال: شفط عالي 6000Pa, مسح بالاهتزاز, بطارية قوية"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input 
                    type="checkbox" 
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span>منتج مميز (اختيار يسرى)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input 
                    type="checkbox" 
                    checked={formData.isTopSelling}
                    onChange={(e) => setFormData({ ...formData, isTopSelling: e.target.checked })}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span>الثرية والأكثر مبيعاً</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج فوراً'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
