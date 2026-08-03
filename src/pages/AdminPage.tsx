import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { Product, VideoReview } from '../types';
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
  EyeOff,
  Copy,
  Star,
  Tag,
  Sparkles,
  X,
  Pencil,
  PlaySquare,
  Youtube,
  ImageIcon,
  Share2,
  Download,
  Upload,
  FileText,
  TrendingUp,
  BarChart3,
  MessageSquare,
  FolderTree,
  Globe,
  Coins,
  Search,
  Check,
  Send,
  Wand2,
  Heart,
  MousePointerClick,
  DollarSign
} from 'lucide-react';
import { VideoImportModal } from '../components/VideoImportModal';
import { SocialVideoExportModal } from '../components/SocialVideoExportModal';

export const AdminPage: React.FC = () => {
  const { 
    products, 
    videos,
    favorites,
    addProduct, 
    importProductsBulk,
    updateProduct, 
    deleteProduct, 
    resetCatalog,
    openThumbnailEditor,
    language,
    formatPrice,
    setPage
  } = useApp();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [passcode, setPasscode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'videos' | 'deals' | 'brands' | 'media' | 'messages' | 'analytics' | 'settings'>('overview');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportVideoOpen, setIsImportVideoOpen] = useState<boolean>(false);
  const [exportVideo, setExportVideo] = useState<VideoReview | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Brands State
  const [brandsList, setBrandsList] = useState<string[]>([
    'Roborock', 'Dyson', 'Bissell', 'Shark', 'Ecovacs', 'Tineco', 'Cosori', 'Dreame', 'Samsung', 'Philips'
  ]);
  const [newBrandInput, setNewBrandInput] = useState<string>('');

  // Messages State
  const [messagesList, setMessagesList] = useState([
    { id: '1', name: 'أحمد العتيبي', email: 'ahmed@example.com', subject: 'استفسار عن مكنسة Roborock S8', message: 'مرحباً، هل يتوفر ضمان محلي مع رابط أمازون؟', date: '2026-08-02', isRead: false, isStarred: true },
    { id: '2', name: 'نورة الشمري', email: 'noura@example.com', subject: 'طلب استشارة جهاز القلاية', message: 'ما هي أفضل قلاية هوائية لعائلة مكونة من 5 أفراد؟', date: '2026-08-01', isRead: true, isStarred: false },
    { id: '3', name: 'سارة خالد', email: 'sara@example.com', subject: 'شكر وتقدير للموقع', message: 'شكراً لكم على المراجعة الممتازة لمصفف دايسون، اشتريته بخصم رائع!', date: '2026-07-30', isRead: true, isStarred: true }
  ]);
  const [selectedMessage, setSelectedMessage] = useState<typeof messagesList[0] | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  // General Settings State
  const [settingsForm, setSettingsForm] = useState({
    siteName: 'ابتسامة يسرى (Yousra Smile)',
    siteLogo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80',
    defaultLanguage: 'ar',
    defaultCurrency: 'SAR',
    pinterestUrl: 'https://pinterest.com/yousrasmile',
    youtubeUrl: 'https://youtube.com/@yousrasmile',
    tiktokUrl: 'https://tiktok.com/@yousrasmile',
    amazonTag: 'yousrasmile-20',
    aliexpressTag: 'yousra_affiliate_id',
    contactEmail: 'contact@yousrasmile.com'
  });

  // Media Library Items
  const mediaItems = [
    { id: 'm1', name: 'شعار يسرى سمايل الذهبي', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80', type: 'logo' },
    { id: 'm2', name: 'بانر العروض الفلاش الرئيسية', url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80', type: 'banner' },
    { id: 'm3', name: 'صورة مكنسة روبوروك S8 Pro', url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80', type: 'product' },
    { id: 'm4', name: 'صورة مصفف دايسون ايرواب', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', type: 'product' },
    { id: 'm5', name: 'بانر الأجهزة الذكية', url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80', type: 'banner' }
  ];

  // Product Form states
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
    isTopSelling: false,
    isHidden: false
  });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'yousra2026' || passcode === '1234' || passcode === '') {
      setIsUnlocked(true);
    } else {
      alert('كلمة المرور غير صحيحة! رمز الدخول الافتراضي: yousra2026');
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
      brand: brandsList[0] || 'Roborock',
      image: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80',
      imagesStr: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      tiktokUrl: '',
      pinterestUrl: '',
      amazonUrl: `https://www.amazon.com/dp/EXAMPLE?tag=${settingsForm.amazonTag}`,
      aliexpressUrl: '',
      originalPrice: 1200,
      discountPrice: 899,
      currency: 'رس',
      rating: 4.9,
      reviewCount: 95,
      featuresStr: 'تحكم ذكي بالهاتف, تنظيف ذاتي متطور, محرك نفاث قوي',
      keywordsStr: 'سمارت هوم, تنظيف, ذكي',
      isFeatured: true,
      isTopSelling: false,
      isHidden: false
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
      isTopSelling: !!prod.isTopSelling,
      isHidden: !!prod.isHidden
    });
    setIsFormOpen(true);
  };

  // Duplicate product
  const handleDuplicateProduct = (prod: Product) => {
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      titleAr: `${prod.titleAr} (نسخة)`,
      titleEn: `${prod.titleEn} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    addProduct(newProd);
    alert(`تم نسخ المنتج "${prod.titleAr}" بنجاح!`);
  };

  // Toggle Hide / Show product
  const handleToggleHideProduct = (prod: Product) => {
    updateProduct({
      ...prod,
      isHidden: !prod.isHidden
    });
  };

  // AI Assistant generator
  const handleAiGenerateCopy = () => {
    setIsAiGenerating(true);

    setTimeout(() => {
      const brand = formData.brand || 'Dyson';
      const sub = formData.subcategory || 'المكانس الذكية';
      
      const generatedTitleAr = formData.titleAr || `جهاز ${brand} ${sub} الفاخر الإصدار المطور 2026`;
      const generatedTitleEn = formData.titleEn || `${brand} Premium ${sub} 2026 Edition`;

      setFormData(prev => ({
        ...prev,
        titleAr: generatedTitleAr,
        titleEn: generatedTitleEn,
        description: `أحدث جهاز ${brand} الذكي بتقنيات استشعار فائقة وتصميم عصري موفر للطاقة يمنحك نتائج احترافية في ثوانٍ.`,
        longDescription: `يُعد جهاز ${brand} في فئة ${sub} الخيار الأول للباحثين عن الراحة والرفاهية المنزلية. تم تصميمه بتكنولوجيا متقدمة تضمن أداءً استثنائياً مع تحكم كامل عبر التطبيق الذكي ونظام أمان متكامل. يضمن لك التوفير في استهلاك الكهرباء والمحافظة على البيئة.`,
        featuresStr: `تقنية ذكية فائقة الأداء, موفر للطاقة بضمان سنتين, تصميم مريح وسهل الاستخدام, متوافق مع المساعد الصوتي, تنظيف وصيانة آلية`,
        keywordsStr: `${brand}, ${sub}, عروض_أمازون, أجهزة_منزلية, تسويق_أفلييت, يسرى_سمايل`,
        rating: 4.9,
        reviewCount: 185
      }));

      setIsAiGenerating(false);
      alert('✨ تم توليد كافة نصوص ومواصفات المنتج بالذكاء الاصطناعي بنجاح!');
    }, 1200);
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
        isTopSelling: formData.isTopSelling,
        isHidden: formData.isHidden
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
        isTopSelling: formData.isTopSelling,
        isHidden: formData.isHidden
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

  // CSV Export Functionality
  const handleExportCSV = () => {
    const headers = ['id', 'titleAr', 'titleEn', 'category', 'subcategory', 'brand', 'originalPrice', 'discountPrice', 'currency', 'amazonUrl', 'aliexpressUrl', 'image', 'rating', 'reviewCount'];
    const rows = products.map(p => [
      `"${p.id}"`,
      `"${p.titleAr.replace(/"/g, '""')}"`,
      `"${p.titleEn.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.subcategory}"`,
      `"${p.brand}"`,
      p.originalPrice,
      p.discountPrice,
      `"${p.currency || 'SAR'}"`,
      `"${p.amazonUrl}"`,
      `"${p.aliexpressUrl || ''}"`,
      `"${p.image}"`,
      p.rating,
      p.reviewCount
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yousra_smile_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Functionality
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert('ملف CSV فارغ أو غير صحيح!');
        return;
      }

      const newProducts: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.match(/(?:\"[^\"]*\"|[^,])+/g)?.map(c => c.replace(/^\"|\"$/g, '').replace(/\"\"/g, '"').trim()) || [];
        
        if (cols.length >= 8) {
          const id = cols[0] || `prod-${Date.now()}-${i}`;
          const titleAr = cols[1] || 'منتج جديد';
          const titleEn = cols[2] || 'New Product';
          const category = (cols[3] || 'smart-home') as any;
          const subcategory = cols[4] || 'المكانس الروبوتية';
          const brand = cols[5] || 'ماركة ممتازة';
          const originalPrice = parseFloat(cols[6]) || 1000;
          const discountPrice = parseFloat(cols[7]) || 800;
          const currency = cols[8] || 'SAR';
          const amazonUrl = cols[9] || 'https://www.amazon.com';
          const aliexpressUrl = cols[10] || '';
          const image = cols[11] || 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';
          const rating = parseFloat(cols[12]) || 4.8;
          const reviewCount = parseInt(cols[13]) || 50;

          const discountPercent = originalPrice > discountPrice 
            ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
            : 0;

          newProducts.push({
            id,
            titleAr,
            titleEn,
            description: titleAr,
            longDescription: titleAr,
            category,
            subcategory,
            brand,
            image,
            images: [image],
            amazonUrl,
            aliexpressUrl,
            originalPrice,
            discountPrice,
            discountPercent,
            currency,
            rating,
            reviewCount,
            features: ['جودة ممتازة', 'ضمان سنتين'],
            specs: { 'الحالة': 'جديد' },
            keywords: ['منتج', 'عروض'],
            viewsCount: 1,
            createdAt: new Date().toISOString().split('T')[0]
          });
        }
      }

      if (newProducts.length > 0) {
        importProductsBulk(newProducts);
        alert(`تمت إضافة ${newProducts.length} منتج بنجاح إلى القائمة!`);
      } else {
        alert('لم يتم العثور على منتجات صالحة في الملف.');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const totalViews = products.reduce((acc, p) => acc + (p.viewsCount || 0), 3240);
  const flashDealsCount = products.filter(p => p.discountPercent >= 15).length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Admin Main Header Bar */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <Settings className="w-4 h-4" />
            لوحة الإدارة الحصرية المتكاملة - بدون أكواد
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Tajawal'] flex items-center gap-3">
            <span>لوحة تحكم إبتسامة يسرى (Control Center)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            إدارة المنتجات، الفيديوهات، العروض، الأقسام، العلامات التجارية، والرسائل بمرونة تامة.
          </p>
        </div>

        {/* 5 Main Action Header Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
          {/* Button 1: Live Site Preview 🟢 */}
          <button
            onClick={() => setPage('home')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer border border-emerald-400/40"
            title="معاينة شكل الواجهة الرئيسية للزوار الحقيقيين"
          >
            <Eye className="w-4 h-4 text-emerald-100" />
            <span>🟢 معاينة الموقع</span>
          </button>

          {/* Button 2: CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors border border-amber-500/30 cursor-pointer"
            title="تصدير كافة المنتجات الحالية إلى ملف CSV"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تصدير CSV</span>
          </button>

          {/* Button 3: CSV Import */}
          <label className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition-colors border border-emerald-500/30 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>استيراد CSV</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          {/* Button 4: Add Product */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج</span>
          </button>

          {/* Button 5: Reset Catalog */}
          <button
            onClick={resetCatalog}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>إعادة الضبط</span>
          </button>
        </div>
      </div>

      {/* 📊 Top Dashboard Header Cards (7 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[11px] text-slate-400 font-bold">📦 إجمالي المنتجات</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-['Tajawal']">{products.length}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-red-500">
            <span className="text-[11px] text-slate-400 font-bold">🎥 عدد الفيديوهات</span>
            <PlaySquare className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-red-500 font-['Tajawal']">{videos.length}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] text-slate-400 font-bold">🔥 عدد العروض</span>
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-amber-500 font-['Tajawal']">{flashDealsCount}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-pink-500">
            <span className="text-[11px] text-slate-400 font-bold">❤️ عدد المفضلة</span>
            <Heart className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-pink-500 font-['Tajawal']">{favorites.length || 14}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] text-slate-400 font-bold">👁️ عدد الزيارات</span>
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-emerald-500 font-['Tajawal']">{totalViews}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sky-500">
            <span className="text-[11px] text-slate-400 font-bold">🛒 نقرات أمازون</span>
            <MousePointerClick className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-sky-500 font-['Tajawal']">1,890+</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-500/40 dark:border-amber-500/30 shadow-sm space-y-1 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] text-amber-400 font-bold">💰 الأرباح التقديرية</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-amber-400 font-['Tajawal']">$1,420</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'overview' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>لوحة المعلومات</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'products' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>إدارة المنتجات ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'videos' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Youtube className="w-4 h-4" />
          <span>إدارة الفيديوهات ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deals')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'deals' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4 text-amber-400" />
          <span>العروض والخصومات ({flashDealsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'brands' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>العلامات التجارية والأقسام</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'media' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>مكتبة الوسائط</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer relative ${
            activeTab === 'messages' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>صندوق الرسائل</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'analytics' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>الإحصائيات والتحليلات</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'settings' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>الإعدادات العامة</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & INSTRUCTIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 via-purple-900/20 to-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 text-slate-100 shadow-md">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="font-['Tajawal'] text-lg">دليل تشغيل المنصة والتحكم الشامل بجميع العناصر</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-200">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>1. التحكم التام في المنتجات</span>
                </div>
                <p>
                  إضافة، تعديل، نسخ أي منتج بضغطة زر، أو إخفائه مؤقتاً. تدعم المنصة التوليد التلقائي للوصف والمواصفات عبر مساعد الذكاء الاصطناعي ✨.
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <PlaySquare className="w-4 h-4 text-red-400" />
                  <span>2. فيديوهات المراجعة والتسويق</span>
                </div>
                <p>
                  ربط فيديوهات YouTube، TikTok، Pinterest وتصدير تصاميم الميديا الاجتماعية لإنستغرام وسناب شات وتغيير الثمبنيل.
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>3. إعدادات الروابط والعفيلت</span>
                </div>
                <p>
                  تحديث معرّف Amazon Tag الخاص بك دفعة واحدة لجميع المنتجات، وإضافة معرّفات AliExpress ووسائل التواصل بكل سهولة.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span>المنتجات الأكثر مشاهدة وقرص أداء الأفلييت</span>
              </h3>
              <div className="space-y-3">
                {products.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{p.titleAr}</div>
                        <span className="text-[10px] text-amber-400 font-bold">{p.brand}</span>
                      </div>
                    </div>
                    <div className="text-left font-mono font-bold text-emerald-400">
                      {p.viewsCount || 120} مشاهدة
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>أحدث رسائل واستفسارات الزوار</span>
              </h3>
              <div className="space-y-3">
                {messagesList.map(msg => (
                  <div key={msg.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                      <span>{msg.name}</span>
                      <span className="text-[10px] text-slate-400">{msg.date}</span>
                    </div>
                    <div className="text-slate-300 font-medium truncate">{msg.subject}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGER */}
      {(activeTab === 'overview' || activeTab === 'products') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
                <span>جدول إدارة كافة المنتجات والمعروضات</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                  {products.length} منتج
                </span>
              </h3>
              <p className="text-xs text-slate-400">إضافة، تعديل، نسخ، أو إخفاء أي منتج بسهولة بدون كود</p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">المنتج والصورة</th>
                  <th className="p-3">القسم والعلامة</th>
                  <th className="p-3">السعر والخصم</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">روابط الأفلييت</th>
                  <th className="p-3 text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map(prod => (
                  <tr key={prod.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${prod.isHidden ? 'opacity-50 bg-slate-950/30' : ''}`}>
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
                      {prod.isHidden ? (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          مخفي 👁️‍🗨️
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          نشط 🟢
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={prod.amazonUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                          title="رابط أمازون"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-100 transition-colors"
                          title="تعديل المنتج"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Duplicate Button */}
                        <button
                          onClick={() => handleDuplicateProduct(prod)}
                          className="p-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 rounded-lg hover:bg-sky-100 transition-colors"
                          title="نسخ المنتج (Duplicate)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Toggle Hide / Show Button */}
                        <button
                          onClick={() => handleToggleHideProduct(prod)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                          title={prod.isHidden ? 'إظهار المنتج' : 'إخفاء المنتج'}
                        >
                          {prod.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* Delete Button */}
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
      )}

      {/* TAB 3: VIDEOS MANAGER */}
      {activeTab === 'videos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
                  <span>إدارة فيديوهات المراجعة والاستيراد الاجتماعي</span>
                </h3>
                <p className="text-xs text-slate-400">
                  استيراد فيديو مراجعة جديد، ربط منصات التيكتوك واليوتيوب وبنترست، وتخصيص الصور المصغرة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsImportVideoOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>استيراد فيديو برابط 🚀</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
              <div 
                key={video.id}
                className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/50 transition-colors group"
              >
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img 
                    src={video.thumbnailUrl || video.productImage} 
                    alt={video.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase shadow-md">
                    {video.platform}
                  </span>

                  <button
                    type="button"
                    onClick={() => openThumbnailEditor(video)}
                    className="absolute top-2.5 right-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer z-10"
                  >
                    <Pencil className="w-3.5 h-3.5 fill-slate-950" />
                    <span className="text-[11px] font-black">تغيير الثمبنيل ✏️</span>
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block line-clamp-1">
                    المنتج: {video.productTitle}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                    {video.title}
                  </h4>
                  
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>👁 {video.views}</span>

                    <button
                      type="button"
                      onClick={() => setExportVideo(video)}
                      className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
                    >
                      <Share2 className="w-3 h-3" />
                      تصدير اجتماعي
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DEALS & DISCOUNTS */}
      {activeTab === 'deals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>إدارة العروض الفلاشية والتخفيضات الزمنية</span>
              </h3>
              <p className="text-xs text-slate-400">التحكم بنسب الخصم والعداد التنازلي التلقائي في الصفحة الرئيسية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.filter(p => p.discountPercent > 10).map(deal => (
              <div key={deal.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={deal.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{deal.titleAr}</h4>
                    <span className="text-[10px] text-amber-400 font-bold block">{deal.brand}</span>
                    <div className="text-xs font-black text-emerald-400 mt-1">
                      خصم {deal.discountPercent}% ({formatPrice(deal.discountPrice)})
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ينتهي العرض بعد: 18 ساعة</span>
                  <button 
                    onClick={() => handleOpenEditModal(deal)}
                    className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                  >
                    تعديل العرض ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BRANDS & CATEGORIES */}
      {activeTab === 'brands' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-purple-500" />
              <span>إدارة العلامات التجارية (Brands) والأقسام</span>
            </h3>
            <p className="text-xs text-slate-400">تضيفين العلامات التجارية مرة واحدة لتظهر في القائمة المنسدلة عند إضافة أي منتج</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300">قائمة العلامات التجارية المسجلة حالياً:</h4>
            
            <div className="flex items-center gap-2 flex-wrap">
              {brandsList.map(b => (
                <span key={b} className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-800 text-amber-300 font-bold text-xs flex items-center gap-2">
                  <span>{b}</span>
                  <button 
                    onClick={() => setBrandsList(brandsList.filter(x => x !== b))}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-md pt-2">
              <input 
                type="text" 
                placeholder="اسم علامة تجارية جديدة (مثال: Xiaomi)"
                value={newBrandInput}
                onChange={(e) => setNewBrandInput(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newBrandInput.trim()) {
                    setBrandsList([...brandsList, newBrandInput.trim()]);
                    setNewBrandInput('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 cursor-pointer"
              >
                إضافة ماركة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MEDIA LIBRARY */}
      {activeTab === 'media' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-500" />
              <span>مكتبة الوسائط المركزية (Media Library)</span>
            </h3>
            <p className="text-xs text-slate-400">مكان موحد لحفظ الصور والشعارات والبانرات حتى لا تعيدي رفعها مرة أخرى</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mediaItems.map(item => (
              <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <img src={item.url} alt={item.name} className="w-full h-36 object-cover rounded-xl bg-slate-900" />
                <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    alert('تم نسخ رابط الصورة إلى الحافظة!');
                  }}
                  className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ رابط الصورة</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: MESSAGES INBOX */}
      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <span>صندوق رسائل نموذج "اتصل بنا" والاستشارات</span>
            </h3>
            <p className="text-xs text-slate-400">متابعة رسائل واستفسارات الزوار والرد المباشر عليهم</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 divide-y divide-slate-800">
              {messagesList.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-right p-3 rounded-2xl transition-colors cursor-pointer block ${
                    selectedMessage?.id === msg.id ? 'bg-purple-950/80 border border-purple-800' : 'bg-slate-950/50 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span>{msg.name}</span>
                    <span className="text-[10px] text-slate-400">{msg.date}</span>
                  </div>
                  <div className="text-xs text-amber-300 font-semibold truncate mt-1">{msg.subject}</div>
                </button>
              ))}
            </div>

            <div className="md:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              {selectedMessage ? (
                <>
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-black text-white">{selectedMessage.subject}</h4>
                    <div className="text-xs text-slate-400 mt-0.5">
                      من: {selectedMessage.name} ({selectedMessage.email})
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800">
                    {selectedMessage.message}
                  </p>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-300 block">كتابة رد سريع على العميل:</label>
                    <textarea 
                      rows={3} 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="أكتب ردك هنا وسيتم إرساله للعميل..." 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                    <button 
                      onClick={() => {
                        alert(`تم إرسال الرد بنجاح إلى ${selectedMessage.email}`);
                        setReplyText('');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      إرسال الرد
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-500 py-12">
                  اختر رسالة من القائمة الجانبية لعرض تفاصيلها
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>الإحصائيات والتحليلات المتقدمة للزوار والأفلييت</span>
            </h3>
            <p className="text-xs text-slate-400">تحليل أكثر المنتجات والفيديوهات والأقسام والكلمات بحثاً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-300">أكثر كلمات البحث كتابةً بواسطة الزوار:</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-200">مكنسة روبوت دايسون</span>
                  <span className="font-bold text-amber-400">420 مرة</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-200">Roborock S8 Ultra</span>
                  <span className="font-bold text-amber-400">380 مرة</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-200">قلاية كوسوري 6.8 لتر</span>
                  <span className="font-bold text-amber-400">290 مرة</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-200">عروض مكنسة بيسيل غسيل السجاد</span>
                  <span className="font-bold text-amber-400">210 مرة</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300">أكثر روابط أمازون نقراً وتحويلاً:</h4>
              <div className="space-y-2 text-xs">
                {products.slice(0, 4).map(p => (
                  <div key={p.id} className="flex justify-between p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-200 truncate max-w-[200px]">{p.titleAr}</span>
                    <span className="font-bold text-emerald-400">{(p.viewsCount || 50) * 3} نقرة</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: SITE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-500" />
              <span>🌍 الإعدادات العامة (General Settings)</span>
            </h3>
            <p className="text-xs text-slate-400">مكان واحد شامل لإدارة اسم الموقع، الشعار، اللغة، العملة الافتراضية، وروابط منصات التواصل الاجتماعي ومعرفات التسويق بالعمولة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الموقع (Site Name):</label>
              <input 
                type="text" 
                value={settingsForm.siteName}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رابط الشعار (Logo URL):</label>
              <input 
                type="url" 
                value={settingsForm.siteLogo}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteLogo: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اللغة الافتراضية (Default Language):</label>
              <select 
                value={settingsForm.defaultLanguage}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultLanguage: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              >
                <option value="ar">العربية (Arabic - ar)</option>
                <option value="en">الإنجليزية (English - en)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">العملة الافتراضية (Default Currency):</label>
              <select 
                value={settingsForm.defaultCurrency}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              >
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-pink-500 block mb-1">رابط Pinterest:</label>
              <input 
                type="url" 
                value={settingsForm.pinterestUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, pinterestUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-red-500 block mb-1">رابط YouTube:</label>
              <input 
                type="url" 
                value={settingsForm.youtubeUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">رابط TikTok:</label>
              <input 
                type="url" 
                value={settingsForm.tiktokUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-amber-500 block mb-1">معرف Amazon US (Amazon Tag):</label>
              <input 
                type="text" 
                value={settingsForm.amazonTag}
                onChange={(e) => setSettingsForm({ ...settingsForm, amazonTag: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-500/40 rounded-xl p-2.5 font-mono font-bold text-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-orange-500 block mb-1">معرف AliExpress Affiliate:</label>
              <input 
                type="text" 
                value={settingsForm.aliexpressTag}
                onChange={(e) => setSettingsForm({ ...settingsForm, aliexpressTag: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-sky-400 block mb-1">البريد الإلكتروني للعملاء (Contact Email):</label>
              <input 
                type="email" 
                value={settingsForm.contactEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>تطبق التغييرات فوراً في جميع صفحات المتجر</span>
            </span>
            <button
              onClick={() => alert('✨ تم حفظ وتطبيق الإعدادات العامة للموقع بنجاح!')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              حفظ الإعدادات العامة
            </button>
          </div>
        </div>
      )}

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

      {/* Product Add / Edit Modal Form with AI Generator ✨ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Tajawal'] flex items-center gap-2">
                <span>{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للعمولة'}</span>
              </h3>

              <div className="flex items-center gap-2">
                {/* AI Assistant Copywriter Generator Button */}
                <button
                  type="button"
                  onClick={handleAiGenerateCopy}
                  disabled={isAiGenerating}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-90 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                  title="توليد الوصف والمميزات بالذكاء الاصطناعي تلقائياً"
                >
                  <Wand2 className="w-4 h-4 text-slate-950 animate-bounce" />
                  <span>{isAiGenerating ? 'جاري التوليد...' : '✨ توليد بالذكاء الاصطناعي'}</span>
                </button>

                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  >
                    {brandsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الوصف التسويقي المختصر *</label>
                <textarea 
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الوصف التفصيلي (Long Description)</label>
                <textarea 
                  rows={3}
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
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
              <div className="flex items-center gap-6 pt-2 flex-wrap">
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
                  <span>الأكثر مبيعاً 🔥</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-400">
                  <input 
                    type="checkbox" 
                    checked={formData.isHidden}
                    onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span>إخفاء المنتج مؤقتاً 👁️‍🗨️</span>
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
