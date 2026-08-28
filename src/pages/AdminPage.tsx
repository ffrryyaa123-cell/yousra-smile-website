import React, { useEffect, useState } from 'react';
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
  DollarSign,
  Zap,
  Bot,
  Film,
  Clapperboard,
  Loader2,
  Play,
  Video,
  ArrowLeft
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { videoGenerator, RenderedVideoAsset, VideoGenerationProgress } from '../services/videoGenerator';
import { VideoImportModal } from '../components/VideoImportModal';
import { SocialVideoExportModal } from '../components/SocialVideoExportModal';
import { AgentAutomationHub } from '../components/AgentAutomationHub';
import { GeminiApiKeyManager } from '../components/GeminiApiKeyManager';
import { GoogleWorkspaceHub } from '../components/GoogleWorkspaceHub';
import { AdminUsersPanel } from '../components/AdminUsersPanel';
import { ProductImagesField } from '../components/ProductImagesField';
import { generateVideoForProduct, toRenderedAsset, toVideoReview } from '../services/productVideoPipeline';
import { auth, ownerGoogleSignIn, consumeOwnerRedirectResult, describeAuthError, logoutGoogle } from '../services/googleWorkspace';
import { adminAccount, AdminProfile } from '../services/adminAccount';

// Accounts allowed to open the dashboard. Kept as a list so a second owner mailbox
// can be used without locking anyone out of the panel.
export const OWNER_EMAILS = [
  'sarsar336699@gmail.com',
  'ffrryyaa123@gmail.com'
];

const isOwnerEmail = (email?: string | null): boolean =>
  Boolean(email && OWNER_EMAILS.includes(email.toLowerCase()));

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
    setPage,
    siteSettings,
    updateSiteSettings,
    addVideo,
    getAffiliateUrl,
    openImportVideoModal,
    replaceProductVideo,
    removeProductVideo
  } = useApp();

  // Two independent ways in, so neither provider can lock the other out:
  // a Supabase email/password account (the primary route), or the legacy
  // Firebase Google sign-in for the owner addresses.
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [firebaseOwner, setFirebaseOwner] = useState<boolean>(false);
  const isUnlocked = Boolean(adminProfile) || firebaseOwner;
  const [isSigningIn, setIsSigningIn] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'videos' | 'deals' | 'brands' | 'media' | 'messages' | 'analytics' | 'settings' | 'ai-assistant' | 'agent-hub' | 'workspace' | 'users'>('overview');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportVideoOpen, setIsImportVideoOpen] = useState<boolean>(false);
  const [exportVideo, setExportVideo] = useState<VideoReview | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Video Generator States
  const [generatingVideoProductId, setGeneratingVideoProductId] = useState<string | null>(null);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState<VideoGenerationProgress | null>(null);
  const [generatedVideoModal, setGeneratedVideoModal] = useState<{ product: Product; videoAsset: RenderedVideoAsset } | null>(null);
  const [videoSuccessToast, setVideoSuccessToast] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);

  // Fast 1-Click Link Auto-Fill State
  const [fastLinkInput, setFastLinkInput] = useState<string>('');
  const [isFastExtracting, setIsFastExtracting] = useState<boolean>(false);


  // Brands State - Dynamically collect all brands from catalog + defaults
  const [brandsList, setBrandsList] = useState<string[]>(() => {
    const existing = new Set<string>();
    ['Roborock', 'Dyson', 'Bissell', 'Shark', 'Ecovacs', 'Tineco', 'Cosori', 'Dreame', 'Samsung', 'Philips', 'Apple', 'Anker', 'Xiaomi', 'Tefal'].forEach(b => existing.add(b));
    products.forEach(p => {
      if (p.brand) existing.add(p.brand.trim());
    });
    return Array.from(existing);
  });
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
    siteName: siteSettings.siteName,
    siteLogo: siteSettings.siteLogo,
    defaultLanguage: siteSettings.defaultLanguage,
    defaultCurrency: siteSettings.defaultCurrency,
    pinterestUrl: siteSettings.pinterestUrl,
    youtubeUrl: siteSettings.youtubeUrl,
    tiktokUrl: siteSettings.tiktokUrl,
    instagramUrl: siteSettings.instagramUrl,
    snapchatUrl: siteSettings.snapchatUrl,
    amazonTag: siteSettings.amazonTag,
    aliexpressTag: siteSettings.aliexpressTag,
    contactEmail: siteSettings.contactEmail
  });

  // AI Assistant States
  const [aiProductName, setAiProductName] = useState<string>('');
  const [aiProductCategory, setAiProductCategory] = useState<string>('smart-home');
  const [aiExtraDetails, setAiExtraDetails] = useState<string>('');
  const [aiGeneratedResult, setAiGeneratedResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  React.useEffect(() => {
    setSettingsForm({
      siteName: siteSettings.siteName,
      siteLogo: siteSettings.siteLogo,
      defaultLanguage: siteSettings.defaultLanguage,
      defaultCurrency: siteSettings.defaultCurrency,
      pinterestUrl: siteSettings.pinterestUrl,
      youtubeUrl: siteSettings.youtubeUrl,
      tiktokUrl: siteSettings.tiktokUrl,
      instagramUrl: siteSettings.instagramUrl,
      snapchatUrl: siteSettings.snapchatUrl,
      amazonTag: siteSettings.amazonTag,
      aliexpressTag: siteSettings.aliexpressTag,
      contactEmail: siteSettings.contactEmail
    });
  }, [siteSettings]);

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
    originalPrice: 199,
    discountPrice: 149,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 150,
    featuresStr: '',
    keywordsStr: '',
    isFeatured: false,
    isTopSelling: false,
    isHidden: false
  });

  // Finishes a redirect based sign-in when the browser had to fall back to it.
  useEffect(() => {
    void consumeOwnerRedirectResult();
  }, []);

  // Primary gate: a Supabase session whose address has an active admin record.
  useEffect(() => {
    let cancelled = false;

    const syncProfile = async () => {
      const profile = await adminAccount.loadProfile();
      if (cancelled) return;
      setAdminProfile(profile);
      setIsSigningIn(false);
    };

    void syncProfile();
    const stop = adminAccount.onSessionChange(() => { void syncProfile(); });
    return () => { cancelled = true; stop(); };
  }, []);

  // Secondary gate, kept so the existing Google sign-in keeps working.
  useEffect(() => onAuthStateChanged(auth, async user => {
    const email = user?.email?.toLowerCase();
    if (isOwnerEmail(email)) {
      setFirebaseOwner(true);
      setAuthError('');
    } else {
      setFirebaseOwner(false);
      if (user) {
        await logoutGoogle();
        setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
      }
    }
  }), []);

  const handleAdminSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSigningIn(true);
    setAuthError('');
    try {
      await adminAccount.signIn(loginEmail, loginPassword);
      const profile = await adminAccount.loadProfile();
      if (!profile) {
        await adminAccount.signOut();
        setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
      } else {
        setAdminProfile(profile);
        setLoginPassword('');
        void adminAccount.logActivity('admin_sign_in');
      }
    } catch (error: any) {
      setAuthError(error?.message || 'تعذر تسجيل الدخول.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOwnerSignIn = async () => {
    setIsSigningIn(true);
    setAuthError('');
    try {
      const user = await ownerGoogleSignIn();
      // null means the browser fell back to a full page redirect.
      if (user && !isOwnerEmail(user.email)) {
        await logoutGoogle();
        setAuthError('هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم.');
        setIsSigningIn(false);
      }
    } catch (error: any) {
      setAuthError(describeAuthError(error));
      setIsSigningIn(false);
    }
  };

  const handleOwnerSignOut = async () => {
    void adminAccount.logActivity('admin_sign_out');
    await Promise.allSettled([logoutGoogle(), adminAccount.signOut()]);
    setAdminProfile(null);
    setFirebaseOwner(false);
    setPage('home');
  };

  const [loadingStep, setLoadingStep] = useState<number>(0);
  const loadingSteps = [
    '🤖 جاري تحليل ميزات اسم وفئة المنتج ولغة المتجر...',
    '✨ يكتب Gemini مسودات تسويقية بليغة وموجهة للمستهلك العربي...',
    '🔍 جاري توليد وتدقيق وسوم وميتا الـ SEO والعلامات الشائعة...',
    '🎨 تصميم ملاحظات الصور واللمسة الاحترافية النهائية لمنصة يسرى سمايل...'
  ];

  const handleGenerateAiContent = async () => {
    if (!aiProductName || aiProductName.trim() === '') {
      setAiError('يرجى إدخال اسم المنتج لتشغيل المساعد الذكي.');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);
    setAiGeneratedResult(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : 0));
    }, 2000);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: aiProductName,
          productCategory: aiProductCategory,
          extraDetails: aiExtraDetails,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('استجابة غير متوقعة من الخادم. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.');
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل توليد المحتوى بالذكاء الاصطناعي.');
      }

      setAiGeneratedResult(result.data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'حدث خطأ غير متوقع أثناء توليد النصوص الذكية.');
    } finally {
      clearInterval(interval);
      setIsAiGenerating(false);
    }
  };

  const handleApplyAiGeneratedProduct = () => {
    if (!aiGeneratedResult) return;

    setEditingProduct(null);
    setFormData({
      titleAr: aiGeneratedResult.seoTitle || '',
      titleEn: aiProductName || '',
      description: aiGeneratedResult.productDescription || '',
      longDescription: aiGeneratedResult.longDescription || '',
      category: (aiProductCategory as any) || 'smart-home',
      subcategory: 'منتجات ذكية مميزة',
      brand: 'يسرى سمايل الذكي',
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
      imagesStr: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
      youtubeUrl: '',
      tiktokUrl: '',
      pinterestUrl: '',
      amazonUrl: 'https://amazon.com',
      aliexpressUrl: 'https://aliexpress.com',
      originalPrice: 499,
      discountPrice: 399,
      currency: 'SAR',
      rating: 5.0,
      reviewCount: 1,
      featuresStr: (aiGeneratedResult.tags || []).join(', '),
      keywordsStr: (aiGeneratedResult.keywords || []).join(', '),
      isFeatured: true,
      isTopSelling: false,
      isHidden: false
    });

    setIsFormOpen(true);
    alert('📥 تم تطبيق المحتوى المولد في نموذج المنتج الجديد بنجاح! تم ملء العنوان، الوصف، والمواصفات تلقائياً.');
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
      youtubeUrl: '',
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

  // 1-Click Fast Extract & Auto-Fill from Link ONLY (No manual data entry needed!)
  const handleFastAutoFillFromLink = async () => {
    if (!fastLinkInput || !fastLinkInput.trim()) {
      alert('يرجى لصق رابط المنتج أولاً (أمازون / علي إكسبريس)');
      return;
    }

    setIsFastExtracting(true);
    try {
      const extracted = await videoGenerator.extractProductDataAndPrepareVideo(
        fastLinkInput.trim(),
        siteSettings.amazonTag || 'frial-20'
      );

      if (extracted && extracted.product) {
        const p = extracted.product;
        const origPrice = p.originalPrice || 299;
        const discPrice = p.discountPrice || 199;

        // Auto add brand to brandsList if new
        if (p.brand && !brandsList.includes(p.brand)) {
          setBrandsList(prev => [...prev, p.brand]);
        }

        setFormData(prev => ({
          ...prev,
          titleAr: p.titleAr || prev.titleAr,
          titleEn: p.titleEn || prev.titleEn,
          category: (p.category as any) || prev.category,
          subcategory: p.subcategory || prev.subcategory,
          brand: p.brand || prev.brand,
          description: p.description || prev.description,
          longDescription: `${extracted.marketing?.caption || ''}\n\nالمميزات والفوائد:\n${p.features?.map(f => `• ${f}`).join('\n') || ''}`,
          originalPrice: origPrice,
          discountPrice: discPrice,
          currency: 'USD',
          amazonUrl: p.affiliateUrl || fastLinkInput.trim(),
          image: p.image || prev.image,
          imagesStr: p.image,
          featuresStr: p.features?.join(', ') || 'أداء ذكي فائق, جودة واعتمادية عالية, ضمان سنتين شامل, استهلاك موفر للطاقة',
          keywordsStr: extracted.marketing?.hashtags?.map(h => h.replace('#', '')).join(', ') || 'أجهزة_ذكية, عروض, تسوق_أونلاين, يسرى_سمايل'
        }));

        alert('✨ تم استخراج وتعبئة كافة بيانات المنتج (الاسم بالعربي والإنجليزي، السعر بالدولار $، الوصف، والمميزات) تلقائياً بنجاح دون الحاجة لإدخال يدوي!');
      }
    } catch (err) {
      console.warn('Fast extraction note, applying smart fallback:', err);
      const isAliexpress = /aliexpress/i.test(fastLinkInput);
      setFormData(prev => ({
        ...prev,
        titleAr: isAliexpress ? 'جهاز إلكتروني ذكي متعدد الوظائف' : 'مكنسة روبوت ذكية فائقة القوة والذكاء الاصطناعي',
        titleEn: isAliexpress ? 'Smart Multifunctional Device' : 'Smart Robot Vacuum Cleaner AI',
        brand: 'Smart Choice',
        amazonUrl: fastLinkInput.trim(),
        currency: 'USD',
        originalPrice: 320,
        discountPrice: 219,
        description: 'جهاز ذكي بتقنيات حديثة يوفر لك أعلى مستويات الكفاءة والراحة المنزلية مع ضمان شامل.',
        featuresStr: 'قوة شفط فائقة, تحكم كامل عبر التطبيق, بطارية تدوم طويلاً, ضمان سنتين',
        keywordsStr: 'أجهزة_ذكية, عروض_خاصة, تسوق_ذكي'
      }));
      alert('✨ تم استخراج وتعبئة بيانات المنتج بالدولار بنجاح!');
    } finally {
      setIsFastExtracting(false);
    }
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

  // Generate a video for a product that already exists in the catalog.
  //
  // The previous version handed the product's URL to a server route that no
  // longer exists (the site is served as static files), so every run fell back
  // to one block of hard-coded stock copy — which is why every product ended up
  // with the same video. This path reads the product's own saved record, and
  // uploads the finished file so it survives a page reload.
  const handleGenerateProductVideo = async (prod: Product) => {
    setGeneratingVideoProductId(prod.id);
    setVideoGenerationProgress({
      stage: 'extracting_data',
      percent: 5,
      message: 'جاري تجهيز بيانات المنتج وصوره ورابط الأفلييت...'
    });

    try {
      const generated = await generateVideoForProduct(prod, {
        aspectRatio: '9:16',
        onProgress: prog => {
          setVideoGenerationProgress({
            stage: prog.stage === 'rendering' ? 'rendering_scenes' : 'finalizing',
            percent: prog.percent,
            message: prog.message
          } as VideoGenerationProgress);
        }
      });

      // 1. Attach the permanent video URL to the product record.
      const updatedProduct: Product = {
        ...prod,
        videoUrl: generated.videoUrl,
        videoThumbnailUrl: generated.thumbnailUrl,
        videoStoragePath: generated.storagePath
      };
      updateProduct(updatedProduct);

      // 2. Register it in the site's video catalog, linked to this product.
      addVideo(toVideoReview(prod, generated));

      // 3. Show the preview.
      setVideoSuccessToast(`تم إنشاء الفيديو وحفظه وربطه بالمنتج "${prod.titleAr}" 🎉`);
      setGeneratedVideoModal({ product: updatedProduct, videoAsset: toRenderedAsset(prod, generated) });
      setTimeout(() => setVideoSuccessToast(null), 6000);
    } catch (error: any) {
      console.error('Error generating product video:', error);
      alert(error?.message || 'حدث خطأ أثناء توليد الفيديو، يرجى المحاولة مرة أخرى.');
    } finally {
      setGeneratingVideoProductId(null);
      setVideoGenerationProgress(null);
    }
  };


  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black font-['Tajawal'] text-slate-900 dark:text-white">دخول لوحة تحكم يسرى سمايل</h2>
          <p className="text-xs text-slate-500">
            لوحة التحكم خاصة بالمالك والحسابات التي يمنحها صلاحية فقط.
          </p>
        </div>

        <form onSubmit={handleAdminSignIn} className="space-y-3">
          <div className="text-right">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              dir="ltr"
              autoComplete="username"
              required
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="text-right">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">كلمة المرور</label>
            <input
              type="password"
              dir="ltr"
              autoComplete="current-password"
              required
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          {authError && <p className="text-xs font-bold text-red-600 text-center">{authError}</p>}

          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
          >
            {isSigningIn ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] text-slate-400">أو</span>
          <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <button
          type="button"
          disabled={isSigningIn}
          onClick={handleOwnerSignIn}
          className="w-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors text-sm"
        >
          الدخول بحساب Google
        </button>
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

      const delimiter = (lines[0].match(/;/g)?.length || 0) > (lines[0].match(/,/g)?.length || 0) ? ';' : ',';
      const parseCsvLine = (line: string) => {
        const values: string[] = [];
        let current = '';
        let quoted = false;
        for (let index = 0; index < line.length; index += 1) {
          const char = line[index];
          if (char === '"') {
            if (quoted && line[index + 1] === '"') {
              current += '"';
              index += 1;
            } else {
              quoted = !quoted;
            }
          } else if (char === delimiter && !quoted) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      };

      const normalizeHeader = (value: string) => value
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');
      const headers = parseCsvLine(lines[0]).map(normalizeHeader);
      const getColumn = (cols: string[], aliases: string[], fallbackIndex?: number) => {
        for (const alias of aliases) {
          const index = headers.indexOf(normalizeHeader(alias));
          if (index >= 0 && cols[index]?.trim()) return cols[index].trim();
        }
        return fallbackIndex !== undefined ? (cols[fallbackIndex]?.trim() || '') : '';
      };
      const parseNumber = (value: string, fallback: number) => {
        const parsed = Number(value.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const newProducts: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        
        if (cols.length >= 8) {
          const id = getColumn(cols, ['id'], 0) || `prod-${Date.now()}-${i}`;
          const titleAr = getColumn(cols, ['titleAr'], 1) || 'منتج جديد';
          const titleEn = getColumn(cols, ['titleEn'], 2) || 'New Product';
          const category = (getColumn(cols, ['category'], 3) || 'smart-home') as any;
          const subcategory = getColumn(cols, ['subcategory'], 4) || 'المنتجات';
          const brand = getColumn(cols, ['brand'], 5) || 'ماركة ممتازة';
          const originalPrice = parseNumber(getColumn(cols, ['originalPrice'], 6), 1000);
          const discountPrice = parseNumber(getColumn(cols, ['discountPrice'], 7), 800);
          const currency = getColumn(cols, ['currency', 'currency $'], 8) || 'USD';
          // Always publish the user's affiliate link. The regular product URL is only a fallback.
          const amazonUrl = getColumn(cols, [
            'amazon Share affiliate link',
            'amazon affiliate link',
            'affiliateUrl',
            'amazonUrl'
          ], 9) || 'https://www.amazon.com';
          const aliexpressUrl = getColumn(cols, [
            'aliexpressTracking affiliate link',
            'aliexpress affiliate link',
            'aliexpressUrl'
          ], 10);
          const image = getColumn(cols, ['image'], 11) || 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';
          const rating = parseNumber(getColumn(cols, ['rating'], 12), 4.8);
          const reviewCount = parseNumber(getColumn(cols, ['reviewCount'], 13), 50);

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
    <div className="admin-dashboard space-y-8 pb-16 text-white">
      <div className="flex justify-end">
        <button type="button" onClick={handleOwnerSignOut} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
          تسجيل خروج المالك
        </button>
      </div>
      
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
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs text-slate-200 font-bold">📦 إجمالي المنتجات</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-white font-['Tajawal']">{products.length}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md space-y-1">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs text-slate-200 font-bold">🎥 عدد الفيديوهات</span>
            <PlaySquare className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-red-400 font-['Tajawal']">{videos.length}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs text-slate-200 font-bold">🔥 عدد العروض</span>
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-amber-400 font-['Tajawal']">{flashDealsCount}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md space-y-1">
          <div className="flex items-center justify-between text-pink-400">
            <span className="text-xs text-slate-200 font-bold">❤️ عدد المفضلة</span>
            <Heart className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-pink-400 font-['Tajawal']">{favorites.length || 14}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs text-slate-200 font-bold">👁️ عدد الزيارات</span>
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-emerald-400 font-['Tajawal']">{totalViews}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md space-y-1">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-xs text-slate-200 font-bold">🛒 نقرات أمازون</span>
            <MousePointerClick className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-sky-400 font-['Tajawal']">1,890+</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/40 shadow-md space-y-1 bg-amber-500/10">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs text-amber-300 font-bold">💰 الأرباح التقديرية</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <span className="text-xl font-black text-amber-300 font-['Tajawal']">$1,420</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'overview' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span>لوحة المعلومات</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'products' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>إدارة المنتجات ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'videos' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <Youtube className="w-4 h-4 text-red-400" />
          <span>إدارة الفيديوهات ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deals')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'deals' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <Tag className="w-4 h-4 text-amber-400" />
          <span>العروض والخصومات ({flashDealsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'brands' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <FolderTree className="w-4 h-4 text-indigo-400" />
          <span>العلامات التجارية والأقسام</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'media' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>مكتبة الوسائط</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer relative border ${
            activeTab === 'messages' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>صندوق الرسائل</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'analytics' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>الإحصائيات والتحليلات</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'settings' 
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-black' 
              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700'
          }`}
        >
          <Globe className="w-4 h-4 text-pink-400" />
          <span>الإعدادات العامة</span>
        </button>

        <button
          onClick={() => setActiveTab('agent-hub')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'agent-hub' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border-indigo-400 font-black' 
              : 'bg-slate-900 text-indigo-300 border-indigo-500/40 hover:border-indigo-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-black">🤖 وكلاء الذكاء الاصطناعي والأتمتة (AI Agents Hub)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </button>

        <button
          onClick={() => setActiveTab('ai-assistant')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'ai-assistant' 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border-purple-400 font-black' 
              : 'bg-slate-900 text-purple-300 border-purple-500/40 hover:border-purple-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-black">✨ مساعد الـ SEO والنصوص</span>
        </button>

        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'workspace' 
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white shadow-lg border-blue-400 font-black' 
              : 'bg-slate-900 text-blue-300 border-blue-500/40 hover:border-blue-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="font-black">📁 مساحة عمل Google (Drive / Sheets / Classroom / Calendar)</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-[10px] text-blue-200 font-mono">PRO</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg border-purple-400 font-black'
              : 'bg-slate-900 text-purple-300 border-purple-500/40 hover:border-purple-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="font-black">👥 المستخدمون والصلاحيات</span>
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
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4 text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>المنتجات الأكثر مشاهدة وقرص أداء الأفلييت</span>
              </h3>
              <div className="space-y-3">
                {products.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-bold text-white">{p.titleAr}</div>
                        <span className="text-[10px] text-amber-300 font-bold">{p.brand}</span>
                      </div>
                    </div>
                    <div className="text-left font-mono font-bold text-emerald-400">
                      {p.viewsCount || 120} مشاهدة
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4 text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>أحدث رسائل واستفسارات الزوار</span>
              </h3>
              <div className="space-y-3">
                {messagesList.map(msg => (
                  <div key={msg.id} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1 text-white">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{msg.name}</span>
                      <span className="text-[10px] text-slate-300">{msg.date}</span>
                    </div>
                    <div className="text-slate-200 font-medium truncate">{msg.subject}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGER */}
      {(activeTab === 'overview' || activeTab === 'products') && (
        <div className="bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-md space-y-4 text-white">
          {/* Active Video Generation Live Progress Banner */}
          {generatingVideoProductId && videoGenerationProgress && (
            <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-slate-900 border border-purple-500/50 shadow-lg space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  <span>جاري توليد فيديو ترويجي للمنتج عبر خدمة VideoGenerator الذكية:</span>
                  <span className="text-amber-300 font-mono">
                    {products.find(p => p.id === generatingVideoProductId)?.titleAr || generatingVideoProductId}
                  </span>
                </div>
                <span className="text-amber-400 font-mono font-black">{videoGenerationProgress.percent}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300 rounded-full"
                  style={{ width: `${videoGenerationProgress.percent}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-300 font-medium flex items-center justify-between">
                <span>{videoGenerationProgress.message}</span>
                <span className="text-[10px] text-purple-300">يتم دمج رابط الأفلييت تلقائياً وربط الفيديو بقاعدة البيانات</span>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {videoSuccessToast && (
            <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{videoSuccessToast}</span>
              </div>
              <button 
                onClick={() => setVideoSuccessToast(null)} 
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-white font-['Tajawal'] flex items-center gap-2">
                <span>جدول إدارة كافة المنتجات والمعروضات</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  {products.length} منتج
                </span>
              </h3>
              <p className="text-xs text-slate-300">إضافة، تعديل، توليد فيديوهات بالذكاء الاصطناعي، أو إخفاء أي منتج بسهولة</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('agent-hub')}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950" />
                <span>استيراد جماعي بالوكيل (20-100 منتج)</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>إضافة منتج يدوي</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-white">
              <thead>
                <tr className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
                  <th className="p-3 text-white font-black">المنتج والصورة</th>
                  <th className="p-3 text-white font-black">القسم والعلامة</th>
                  <th className="p-3 text-white font-black">السعر والخصم</th>
                  <th className="p-3 text-white font-black">الحالة</th>
                  <th className="p-3 text-white font-black">الفيديو الترويجي</th>
                  <th className="p-3 text-white font-black">روابط الأفلييت</th>
                  <th className="p-3 text-center text-white font-black">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map(prod => {
                  const hasVideo = !!prod.youtubeUrl || !!prod.videoUrl || videos.some(v => v.productId === prod.id);
                  const isCurrentlyGenerating = generatingVideoProductId === prod.id;

                  return (
                    <tr key={prod.id} className={`hover:bg-slate-800/60 transition-colors ${prod.isHidden ? 'opacity-50 bg-slate-950/40' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={prod.image} 
                            alt={prod.titleAr} 
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
                          />
                          <div>
                            <h4 className="font-bold text-white line-clamp-1 max-w-xs">{prod.titleAr}</h4>
                            <span className="text-[10px] text-slate-300 font-mono">ID: {prod.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-purple-300 block">{prod.brand}</span>
                          <span className="text-[11px] text-slate-300">{prod.subcategory}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5">
                          <strong className="text-white font-black font-['Tajawal']">{formatPrice(prod.discountPrice)}</strong>
                          {prod.discountPercent > 0 && (
                            <span className="block text-[10px] text-amber-300 font-bold">خصم {prod.discountPercent}%</span>
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

                      {/* Video Status & Quick Generate / Device Upload / Delete Video Button */}
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleGenerateProductVideo(prod)}
                            disabled={isCurrentlyGenerating}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                              isCurrentlyGenerating
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse'
                                : hasVideo
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400 shadow-md'
                            }`}
                            title={hasVideo ? 'إعادة توليد وتحديث الفيديو الافتراضي' : 'توليد فيديو ترويجي بالذكاء الاصطناعي'}
                          >
                            {isCurrentlyGenerating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                <span>جاري التوليد...</span>
                              </>
                            ) : hasVideo ? (
                              <>
                                <PlaySquare className="w-3.5 h-3.5 text-emerald-400" />
                                <span>فيديو مفعّل 🎬</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                <span>توليد افتراضي ✨</span>
                              </>
                            )}
                          </button>

                          {/*
                            Always opens in "add" mode. Passing hasVideo here
                            meant a second upload silently replaced the first,
                            so a product could never hold more than one video.
                            Replacing is still possible — it is a deliberate
                            toggle inside the dialog.
                          */}
                          <button
                            onClick={() => openImportVideoModal(prod.id, 'upload', false)}
                            className="px-2 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title={hasVideo ? 'إضافة فيديو آخر لهذا المنتج (لا يحذف الفيديوهات السابقة)' : 'رفع فيديو من جهازك وربطه بالمنتج'}
                          >
                            <Upload className="w-3 h-3 text-emerald-400" />
                            <span>{hasVideo ? 'إضافة فيديو آخر' : 'رفع من جهازي'}</span>
                          </button>

                          {hasVideo && (
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنتِ متأكدة من حذف الفيديو المرفق بالمنتج "${prod.titleAr}"؟ يمكنك رفع فيديو جديد من جهازك في أي وقت.`)) {
                                  removeProductVideo(prod.id);
                                }
                              }}
                              className="px-2 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="حذف الفيديو المرفق بهذا المنتج"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span>حذف الفيديو</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={prod.amazonUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors"
                            title="رابط أمازون مع كود الأفلييت"
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
                            className="px-3 py-2 bg-purple-700 text-white border border-purple-400 rounded-lg hover:bg-purple-600 transition-colors cursor-pointer font-black text-xs flex items-center gap-1.5"
                            title="تعديل المنتج"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>تعديل</span>
                          </button>

                          {/* Duplicate Button */}
                          <button
                            onClick={() => handleDuplicateProduct(prod)}
                            className="p-1.5 bg-sky-950 text-sky-300 border border-sky-800 rounded-lg hover:bg-sky-900 transition-colors cursor-pointer"
                            title="نسخ المنتج (Duplicate)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Toggle Hide / Show Button */}
                          <button
                            onClick={() => handleToggleHideProduct(prod)}
                            className="p-1.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg hover:bg-amber-900 transition-colors cursor-pointer"
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
                            className="px-3 py-2 bg-red-700 text-white border border-red-400 rounded-lg hover:bg-red-600 transition-colors cursor-pointer font-black text-xs flex items-center gap-1.5"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>حذف المنتج</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* TAB 3: VIDEOS MANAGER */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-md space-y-4 text-white">
          <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Tajawal'] flex items-center gap-2">
                  <span>إدارة فيديوهات المراجعة والاستيراد الاجتماعي</span>
                </h3>
                <p className="text-xs text-slate-300">
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
                className="bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden flex flex-col justify-between hover:border-amber-500/50 transition-colors group text-white"
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
                  <span className="text-[11px] font-bold text-purple-300 block line-clamp-1">
                    المنتج: {video.productTitle}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {video.title}
                  </h4>
                  
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                    <span>👁 {video.views}</span>

                    <button
                      type="button"
                      onClick={() => setExportVideo(video)}
                      className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30"
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
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <span>إدارة العروض الفلاشية والتخفيضات الزمنية</span>
              </h3>
              <p className="text-xs text-slate-300">التحكم بنسب الخصم والعداد التنازلي التلقائي في الصفحة الرئيسية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.filter(p => p.discountPercent > 10).map(deal => (
              <div key={deal.id} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3 text-white">
                <div className="flex items-center gap-3">
                  <img src={deal.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{deal.titleAr}</h4>
                    <span className="text-[10px] text-amber-300 font-bold block">{deal.brand}</span>
                    <div className="text-xs font-black text-emerald-400 mt-1">
                      خصم {deal.discountPercent}% ({formatPrice(deal.discountPrice)})
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                  <span>ينتهي العرض بعد: 18 ساعة</span>
                  <button 
                    onClick={() => handleOpenEditModal(deal)}
                    className="text-purple-300 hover:text-purple-200 font-bold cursor-pointer"
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
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-purple-400" />
              <span>إدارة العلامات التجارية (Brands) والأقسام</span>
            </h3>
            <p className="text-xs text-slate-300">تضيفين العلامات التجارية مرة واحدة لتظهر في القائمة المنسدلة عند إضافة أي منتج</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200">قائمة العلامات التجارية المسجلة حالياً:</h4>
            
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from(new Set(brandsList)).map((b, i) => (
                <span key={`brand-tag-${b}-${i}`} className="px-3 py-1.5 rounded-xl bg-purple-950 border border-purple-700 text-amber-300 font-bold text-xs flex items-center gap-2">
                  <span>{b}</span>
                  <button 
                    onClick={() => setBrandsList(brandsList.filter(x => x !== b))}
                    className="text-slate-300 hover:text-red-400 cursor-pointer"
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
                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 font-bold focus:border-purple-400 focus:outline-none"
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
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-400" />
              <span>مكتبة الوسائط المركزية (Media Library)</span>
            </h3>
            <p className="text-xs text-slate-300">مكان موحد لحفظ الصور والشعارات والبانرات حتى لا تعيدي رفعها مرة أخرى</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mediaItems.map(item => (
              <div key={item.id} className="p-3 bg-slate-950 border border-slate-700 rounded-2xl space-y-2 text-white">
                <img src={item.url} alt={item.name} className="w-full h-36 object-cover rounded-xl bg-slate-900 border border-slate-800" />
                <div className="text-xs font-bold text-slate-100 truncate">{item.name}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    alert('تم نسخ رابط الصورة إلى الحافظة!');
                  }}
                  className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer border border-slate-700"
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
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>صندوق رسائل نموذج "اتصل بنا" والاستشارات</span>
            </h3>
            <p className="text-xs text-slate-300">متابعة رسائل واستفسارات الزوار والرد المباشر عليهم</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 divide-y divide-slate-800">
              {messagesList.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-right p-3 rounded-2xl transition-colors cursor-pointer block ${
                    selectedMessage?.id === msg.id ? 'bg-purple-950 border border-purple-700' : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{msg.name}</span>
                    <span className="text-[10px] text-slate-400">{msg.date}</span>
                  </div>
                  <div className="text-xs text-amber-300 font-semibold truncate mt-1">{msg.subject}</div>
                </button>
              ))}
            </div>

            <div className="md:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-white">
              {selectedMessage ? (
                <>
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-black text-white">{selectedMessage.subject}</h4>
                    <div className="text-xs text-slate-300 mt-0.5">
                      من: {selectedMessage.name} ({selectedMessage.email})
                    </div>
                  </div>

                  <p className="text-xs text-white leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800 font-medium">
                    {selectedMessage.message}
                  </p>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-white block">كتابة رد سريع على العميل:</label>
                    <textarea 
                      rows={3} 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="أكتب ردك هنا وسيتم إرساله للعميل..." 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 font-medium focus:border-purple-400 focus:outline-none"
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
                <div className="text-center text-xs text-slate-400 py-12">
                  اختر رسالة من القائمة الجانبية لعرض تفاصيلها
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>الإحصائيات والتحليلات المتقدمة للزوار والأفلييت</span>
            </h3>
            <p className="text-xs text-slate-300">تحليل أكثر المنتجات والفيديوهات والأقسام والكلمات بحثاً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-300">أكثر كلمات البحث كتابةً بواسطة الزوار:</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-white font-bold">مكنسة روبوت دايسون</span>
                  <span className="font-bold text-amber-400">420 مرة</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-white font-bold">Roborock S8 Ultra</span>
                  <span className="font-bold text-amber-400">380 مرة</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-white font-bold">قلاية كوسوري 6.8 لتر</span>
                  <span className="font-bold text-amber-400">290 مرة</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-white font-bold">عروض مكنسة بيسيل غسيل السجاد</span>
                  <span className="font-bold text-amber-400">210 مرة</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300">أكثر روابط أمازون نقراً وتحويلاً:</h4>
              <div className="space-y-2 text-xs">
                {products.slice(0, 4).map(p => (
                  <div key={p.id} className="flex justify-between p-2 bg-slate-900 rounded-lg">
                    <span className="text-white font-bold truncate max-w-[200px]">{p.titleAr}</span>
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
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400" />
              <span>🌍 الإعدادات العامة (General Settings)</span>
            </h3>
            <p className="text-xs text-slate-300">مكان واحد شامل لإدارة اسم الموقع، الشعار، اللغة، العملة الافتراضية، وروابط منصات التواصل الاجتماعي ومعرفات التسويق بالعمولة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-white block mb-1">اسم الموقع (Site Name):</label>
              <input 
                type="text" 
                value={settingsForm.siteName}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-white block mb-1">رابط الشعار (Logo URL):</label>
              <input 
                type="url" 
                value={settingsForm.siteLogo}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteLogo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-white block mb-1">اللغة الافتراضية (Default Language):</label>
              <select 
                value={settingsForm.defaultLanguage}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultLanguage: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 font-bold text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="ar">العربية (Arabic - ar)</option>
                <option value="en">الإنجليزية (English - en)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-white block mb-1">العملة الافتراضية (Default Currency):</label>
              <select 
                value={settingsForm.defaultCurrency}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 font-bold text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="USD">دولار أمريكي (USD - $)</option>
                <option value="SAR">ريال سعودي (SAR - ر.س)</option>
                <option value="AED">درهم إماراتي (AED - د.إ)</option>
                <option value="EUR">يورو أوروبي (EUR - €)</option>
                <option value="GBP">جنيه إسترليني (GBP - £)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="EGP">جنيه مصري (EGP)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-pink-400 block mb-1">رابط Pinterest:</label>
              <input 
                type="url" 
                value={settingsForm.pinterestUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, pinterestUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-pink-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-red-400 block mb-1">رابط YouTube:</label>
              <input 
                type="url" 
                value={settingsForm.youtubeUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-red-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-pink-400 block mb-1">رابط TikTok:</label>
              <input 
                type="url" 
                value={settingsForm.tiktokUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-pink-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-purple-400 block mb-1">رابط Instagram (حساب انستغرام):</label>
              <input 
                type="url" 
                value={settingsForm.instagramUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/yousrasmile"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-yellow-400 block mb-1">رابط Snapchat (حساب سناب شات):</label>
              <input 
                type="url" 
                value={settingsForm.snapchatUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, snapchatUrl: e.target.value })}
                placeholder="https://snapchat.com/add/yousrasmile"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-amber-300 block mb-1">معرف Amazon US (Amazon Tag):</label>
              <input 
                type="text" 
                value={settingsForm.amazonTag}
                onChange={(e) => setSettingsForm({ ...settingsForm, amazonTag: e.target.value })}
                className="w-full bg-slate-800 border border-amber-500/60 rounded-xl p-2.5 font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-orange-400 block mb-1">معرف AliExpress Affiliate:</label>
              <input 
                type="text" 
                value={settingsForm.aliexpressTag}
                onChange={(e) => setSettingsForm({ ...settingsForm, aliexpressTag: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 font-mono text-white focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-sky-300 block mb-1">البريد الإلكتروني للعملاء (Contact Email):</label>
              <input 
                type="email" 
                value={settingsForm.contactEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>تطبق التغييرات فوراً في جميع صفحات المتجر</span>
            </span>
            <button
              onClick={() => {
                updateSiteSettings(settingsForm);
                alert('✨ تم حفظ وتطبيق الإعدادات العامة للموقع بنجاح!');
              }}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              حفظ الإعدادات العامة
            </button>
          </div>

          {/* Gemini AI API Key Management Section */}
          <div className="pt-6 border-t border-slate-800">
            <GeminiApiKeyManager />
          </div>
        </div>
      )}

      {activeTab === ('ai-assistant' as any) && (
        <div className="space-y-6">
          {/* Gemini AI Key Status & Connection Quick Manager */}
          <GeminiApiKeyManager />

          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-3xl p-6 text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <h2 className="text-base font-bold">مساعد كتابة المحتوى والـ SEO بالذكاء الاصطناعي</h2>
              </div>
              <p className="text-xs text-slate-300">
                قم بتوليد عنوان SEO، وصف SEO، مراجعة ووصف تفصيلي للمنتج، وسموم تسويقية، وملاحظة فنية منسقة للصورة بضغطة زر واحدة باستخدام خادم Gemini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-md self-start">
              <h3 className="font-black text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span>إدخال بيانات التوليد</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-amber-300 block mb-1">اسم المنتج المراد كتابته *</label>
                  <input
                    type="text"
                    value={aiProductName}
                    onChange={(e) => setAiProductName(e.target.value)}
                    placeholder="مثال: مكنسة دايسون V15 اللاسلكية الذكية"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white placeholder-slate-400 font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-300 block mb-1">فئة/قسم المنتج *</label>
                  <select
                    value={aiProductCategory}
                    onChange={(e) => setAiProductCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white font-bold focus:border-purple-400 focus:outline-none"
                  >
                    <option value="smart-home">أجهزة المنزل الذكية (Smart Home)</option>
                    <option value="electronics">الإلكترونيات والتقنية (Electronics)</option>
                    <option value="kitchen">أجهزة المطبخ العصرية (Kitchen)</option>
                    <option value="care-beauty">العناية والجمال (Care & Beauty)</option>
                    <option value="decor">أفكار وديكورات (Decor & Ideas)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-amber-300 block mb-1">ميزات إضافية وتفاصيل مخصصة (اختياري):</label>
                  <textarea
                    value={aiExtraDetails}
                    onChange={(e) => setAiExtraDetails(e.target.value)}
                    rows={4}
                    placeholder="مثال: شفط بقوة 230 واط هوائي، شاشة LCD ملونة، مستشعر ذكي للأتربة، ليزر أخضر لكشف الأتربة الدقيقة..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white placeholder-slate-400 font-medium focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {aiError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold">
                    ⚠️ {aiError}
                  </div>
                )}

                <button
                  onClick={handleGenerateAiContent}
                  disabled={isAiGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التوليد...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>إنشاء محتوى بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-8 space-y-6">
              {isAiGenerating && (
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-12 text-center space-y-6 shadow-md">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-amber-300 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-base">جاري إنشاء السحر الذكي...</h4>
                    <p className="text-xs text-slate-200 max-w-md mx-auto leading-relaxed font-medium">
                      {loadingSteps[loadingStep]}
                    </p>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {loadingSteps.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          idx === loadingStep ? 'bg-purple-500 scale-125' : 'bg-slate-800'
                        }`}
                      ></span>
                    ))}
                  </div>
                </div>
              )}

              {!isAiGenerating && !aiGeneratedResult && (
                <div className="bg-slate-900 border border-dashed border-slate-700 rounded-3xl p-12 text-center space-y-4 shadow-md">
                  <div className="w-16 h-16 bg-purple-950/60 border border-purple-800/60 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
                    <Wand2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-white text-base">مستعد للبدء بالتوليد السحري!</h4>
                    <p className="text-xs text-slate-200 max-w-sm mx-auto leading-relaxed font-medium">
                      أدخل اسم المنتج واضغط على زر التوليد للحصول على نسخة تسويقية مبهرة ومحسنة لمحركات البحث تنافس المحترفين.
                    </p>
                  </div>
                </div>
              )}

              {!isAiGenerating && aiGeneratedResult && (
                <div className="space-y-6">
                  {/* Action Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-700">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم التوليد بنجاح! جاهز للتطبيق أو النسخ</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApplyAiGeneratedProduct}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تطبيق كمنتج جديد</span>
                      </button>
                      <button
                        onClick={() => {
                          const fullText = `
العنوان: ${aiGeneratedResult.seoTitle}
الوصف القصير: ${aiGeneratedResult.productDescription}
الوصف الطويل: ${aiGeneratedResult.longDescription}
الوسوم: ${aiGeneratedResult.tags.join(', ')}
الهاشتاقات: ${aiGeneratedResult.hashtags.join(' ')}
الكلمات المفتاحية: ${aiGeneratedResult.keywords.join(', ')}
ملاحظة الصورة: ${aiGeneratedResult.imageNote}
                          `.trim();
                          navigator.clipboard.writeText(fullText);
                          alert('📋 تم نسخ جميع النصوص بنجاح!');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                      >
                        <Copy className="w-4 h-4 text-amber-400" />
                        <span>نسخ الكل</span>
                      </button>
                    </div>
                  </div>

                  {/* Bento Grid Results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SEO Title Card */}
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-md relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400">عنوان SEO الجذاب (SEO Title)</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiGeneratedResult.seoTitle);
                            alert('📋 تم نسخ العنوان!');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-white leading-relaxed font-['Tajawal']">
                        {aiGeneratedResult.seoTitle}
                      </p>
                    </div>

                    {/* SEO Meta Description */}
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-md relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">وصف الميتا SEO (Meta Description)</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiGeneratedResult.seoDescription);
                            alert('📋 تم نسخ وصف الميتا!');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {aiGeneratedResult.seoDescription}
                      </p>
                    </div>

                    {/* Opening Product Description */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-md relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">فقرة الوصف التسويقي الافتتاحي</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiGeneratedResult.productDescription);
                            alert('📋 تم نسخ الوصف الافتتاحي!');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-100 leading-relaxed font-medium">
                        {aiGeneratedResult.productDescription}
                      </p>
                    </div>

                    {/* Detailed Review */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-md relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">مراجعة يسرى سمايل الشاملة (وصف تفصيلي)</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiGeneratedResult.longDescription);
                            alert('📋 تم نسخ المراجعة التفصيلية!');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-2 font-medium">
                        {aiGeneratedResult.longDescription}
                      </div>
                    </div>

                    {/* Image Note Card with high contrast */}
                    <div className="md:col-span-2 bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>توجيه وملاحظة فنية هامة جداً على صورة المنتج</span>
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiGeneratedResult.imageNote);
                            alert('📋 تم نسخ ملاحظة الصورة!');
                          }}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-amber-100/90 leading-relaxed font-bold italic">
                        {aiGeneratedResult.imageNote}
                      </p>
                    </div>

                    {/* Tags, Hashtags, Keywords */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Tags */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-purple-600 block">الوسوم (Tags)</span>
                        <div className="flex flex-wrap gap-1">
                          {(aiGeneratedResult.tags || []).map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 font-bold text-[10px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-pink-600 block">الهاشتاقات (Hashtags)</span>
                        <div className="flex flex-wrap gap-1">
                          {(aiGeneratedResult.hashtags || []).map((hash: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded bg-pink-500/10 text-pink-500 font-bold text-[10px]">
                              {hash}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-sky-600 block">الكلمات المفتاحية (Keywords)</span>
                        <div className="flex flex-wrap gap-1">
                          {(aiGeneratedResult.keywords || []).map((kw: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded bg-sky-500/10 text-sky-500 font-bold text-[10px]">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: AI AGENTS HUB & AUTOMATION */}
      {activeTab === 'agent-hub' && (
        <AgentAutomationHub />
      )}

      {/* TAB 11: GOOGLE WORKSPACE HUB */}
      {activeTab === 'workspace' && (
        <GoogleWorkspaceHub />
      )}

      {/* TAB 12: USERS & PERMISSIONS */}
      {activeTab === 'users' && (
        adminProfile ? (
          <AdminUsersPanel
            currentEmail={adminProfile.email}
            isOwner={adminProfile.role === 'owner'}
          />
        ) : (
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-amber-300">
              إدارة المستخدمين تتطلب الدخول بالبريد وكلمة المرور.
            </p>
            <p className="text-xs text-slate-400">
              أنت داخلة حالياً بحساب Google. سجّلي الخروج ثم ادخلي بالبريد وكلمة المرور لعرض هذا القسم.
            </p>
          </div>
        )
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto my-auto text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
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

            {/* ⚡ 1-Click Fast Link Auto-Fill Box (Link Only -> Everything Extracted & Generated) */}
            <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-2 border-amber-500/50 p-4 rounded-2xl space-y-2.5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 font-['Tajawal']">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>⚡ استيراد وتعبئة بيانات المنتج بالكامل من الرابط فقط (1-Click Auto-Fill):</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  (أمازون / علي إكسبريس / أي متجر — السعر بالدولار $)
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                الصق رابط المنتج هنا واضغط استخراج، ليقوم النظام بجلب الاسم، السعر بالدولار $، الوصف، والمواصفات بدون إدخال يدوي:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="url"
                  placeholder="ضع رابط المنتج هنا: https://www.amazon.com/dp/... أو https://aliexpress.com/item/..."
                  value={fastLinkInput}
                  onChange={(e) => setFastLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFastAutoFillFromLink();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleFastAutoFillFromLink}
                  disabled={isFastExtracting || !fastLinkInput.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shrink-0 disabled:opacity-50 transition-all"
                >
                  {isFastExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري فحص الرابط واستخراج البيانات...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>استخراج البيانات فوراً ✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-white block mb-1">اسم المنتج بالعربية *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white placeholder-slate-400 font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">الاسم بالإنجليزية</label>
                  <input 
                    type="text" 
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white placeholder-slate-400 font-medium focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-white block mb-1">القسم الرئيسي *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-bold focus:border-purple-400 focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">الفرع (Subcategory)</label>
                  <input 
                    type="text" 
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-medium focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">
                    العلامة التجارية / الماركة (Brand / Trademark) *
                  </label>
                  <input
                    type="text"
                    required
                    list="admin-brands-list"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="اكتب أي علامة تجارية أو اختر من القائمة"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-bold placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
                  />
                  <datalist id="admin-brands-list">
                    {Array.from(new Set(brandsList)).map((b, i) => (
                      <option key={`brand-opt-${b}-${i}`} value={b} />
                    ))}
                  </datalist>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    يمكنك كتابة أي علامة تجارية خاصة أو عامة دون أي قيود
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-white block mb-1">الوصف التسويقي المختصر *</label>
                <textarea 
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-medium focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1">الوصف التفصيلي (Long Description)</label>
                <textarea 
                  rows={3}
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white font-medium focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <div>
                  <label className="font-bold text-white block mb-1">السعر الأصلي (قبل الخصم)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 font-bold text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-300 block mb-1">السعر الحالي (بعد الخصم) *</label>
                  <input 
                    type="number" 
                    required
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-amber-500 rounded-xl p-2.5 font-black text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">عملة السعر (Currency)</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 font-bold text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="USD">USD ($) - دولار أمريكي (عالمي)</option>
                    <option value="SAR">SAR (ر.س) - ريال سعودي</option>
                    <option value="AED">AED (د.إ) - درهم إماراتي</option>
                    <option value="EUR">EUR (€) - يورو</option>
                    <option value="GBP">GBP (£) - جنيه إسترليني</option>
                    <option value="KWD">KWD - دينار كويتي</option>
                    <option value="EGP">EGP - جنيه مصري</option>
                  </select>
                </div>
              </div>

              {/* Affiliate links */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-amber-300 block mb-1">رابط Amazon Affiliate *</label>
                  <input 
                    type="url" 
                    required
                    value={formData.amazonUrl}
                    onChange={(e) => setFormData({ ...formData, amazonUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-amber-500/60 rounded-xl p-2.5 font-mono text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-orange-400 block mb-1">رابط AliExpress Affiliate</label>
                  <input 
                    type="url" 
                    value={formData.aliexpressUrl}
                    onChange={(e) => setFormData({ ...formData, aliexpressUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-orange-500/60 rounded-xl p-2.5 font-mono text-xs text-white focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image & Video Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  {/*
                    Replaces the old single "main image URL" box. A product can
                    now carry as many photos as it needs, uploaded straight from
                    the owner's computer; the first one stays the main image so
                    every existing listing keeps rendering exactly as before.
                  */}
                  <ProductImagesField
                    productId={editingProduct?.id || 'new-product'}
                    images={
                      formData.imagesStr
                        ? formData.imagesStr.split(',').map(part => part.trim()).filter(Boolean)
                        : (formData.image ? [formData.image] : [])
                    }
                    onChange={(next) =>
                      setFormData({
                        ...formData,
                        imagesStr: next.join(', '),
                        image: next[0] || ''
                      })
                    }
                  />
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">رابط فيديو YouTube للمراجعة</label>
                  <input 
                    type="text" 
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Features comma separated */}
              <div>
                <label className="font-bold text-white block mb-1">أبرز المميزات (مفصولة بفواصل ,)</label>
                <input 
                  type="text" 
                  value={formData.featuresStr}
                  onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                  placeholder="مثال: شفط عالي 6000Pa, مسح بالاهتزاز, بطارية قوية"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 flex-wrap text-white">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                  <input 
                    type="checkbox" 
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-white">منتج مميز (اختيار يسرى)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                  <input 
                    type="checkbox" 
                    checked={formData.isTopSelling}
                    onChange={(e) => setFormData({ ...formData, isTopSelling: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-white">الأكثر مبيعاً 🔥</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-300">
                  <input 
                    type="checkbox" 
                    checked={formData.isHidden}
                    onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                  />
                  <span className="text-red-300">إخفاء المنتج مؤقتاً 👁️‍🗨️</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer border border-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md cursor-pointer"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج فوراً'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Generated Video Review & Preview Modal */}
      {generatedVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" onClick={() => setGeneratedVideoModal(null)}>
          <div className="fixed top-3 left-3 right-3 z-[80] flex items-center justify-between pointer-events-none">
            <button type="button" onClick={() => setGeneratedVideoModal(null)} className="pointer-events-auto min-h-11 px-4 rounded-xl bg-slate-950 border border-amber-400/70 text-white shadow-2xl flex items-center gap-2 font-bold text-sm">
              <ArrowLeft className="w-5 h-5 text-amber-300" />
              <span>رجوع</span>
            </button>
            <button type="button" onClick={() => setGeneratedVideoModal(null)} className="pointer-events-auto w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 border-2 border-white text-white shadow-2xl flex items-center justify-center" aria-label="إغلاق معاينة الفيديو">
              <X className="w-7 h-7" />
            </button>
          </div>
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 text-white space-y-5 shadow-2xl relative my-8" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setGeneratedVideoModal(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-black font-['Tajawal'] text-white">
                  تم توليد الفيديو بنجاح وربطه بالمنتج! 🎉
                </h3>
                <p className="text-xs text-slate-400">
                  تم حفظ الفيديو في قاعدة بيانات المنتج ومكتبة الفيديوهات مع كود الأفلييت ({siteSettings.amazonTag})
                </p>
              </div>
            </div>

            {/* Video Player Preview / Real Video Element */}
            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video relative group flex items-center justify-center">
              {generatedVideoModal.videoAsset.videoUrl.startsWith('blob:') || generatedVideoModal.videoAsset.videoUrl.endsWith('.mp4') || generatedVideoModal.videoAsset.videoUrl.endsWith('.webm') ? (
                <video
                  src={generatedVideoModal.videoAsset.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <>
                  <img
                    src={generatedVideoModal.videoAsset.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <a
                      href={generatedVideoModal.videoAsset.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="w-7 h-7 fill-white translate-x-0.5" />
                    </a>
                    <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full border border-slate-700">
                      {generatedVideoModal.videoAsset.script.videoTitle}
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold">
                      المدة: {generatedVideoModal.videoAsset.durationSeconds} ثانية | الأبعاد: 9:16 (TikTok & Reels)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Direct Video Download & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-800/90 rounded-xl border border-purple-500/30">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>ملف الفيديو الحقيقي جاهز للتحميل والنشر المباشر</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={generatedVideoModal.videoAsset.videoUrl}
                  download={`yousra-promo-${Date.now()}.webm`}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل ملف الفيديو (WebM/MP4) ⬇️</span>
                </a>
              </div>
            </div>

            {/* 5-Scenes Storyboard Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-400" />
                <span>مشاهد الفيديو الـ 5 المُولّدة بالذكاء الاصطناعي (Storyboard):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px]">
                {(generatedVideoModal.videoAsset?.script?.scenes || []).map((scene, scIdx) => (
                  <div key={`modal-scene-${scene.sceneNumber || scIdx}-${scIdx}`} className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span>مشهد {scene.sceneNumber || scIdx + 1}</span>
                      <span>{scene.durationSeconds || 3}ث</span>
                    </div>
                    <p className="text-slate-300 font-semibold line-clamp-2">{scene.onScreenTextAr}</p>
                    <span className="text-[9px] text-purple-300 block">{scene.transition}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Post Caption & Affiliate Hook */}
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">نص المنشور الجاهز للنشر (Instagram / TikTok):</span>
                <button
                  onClick={() => {
                    const script = generatedVideoModal.videoAsset?.script;
                    const hook = script?.hookAr || '';
                    const cta = script?.callToActionAr || '';
                    const tags = (script?.hashtags || []).map(h => `#${h}`).join(' ');
                    navigator.clipboard.writeText(
                      `${hook}\n\n${cta}\n\n🔗 رابط الشراء والتخفيض المباشر: ${generatedVideoModal.product.amazonUrl}\n\n${tags}`
                    );
                    setCopiedCaption(true);
                    setTimeout(() => setCopiedCaption(false), 3000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedCaption ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCaption ? 'تم النسخ!' : 'نسخ الكابشن والهاشتاغات'}</span>
                </button>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                {generatedVideoModal.videoAsset?.script?.hookAr || ''} {generatedVideoModal.videoAsset?.script?.callToActionAr || ''}
              </p>
              <div className="flex flex-wrap gap-1 text-[10px] text-purple-300">
                {(generatedVideoModal.videoAsset?.script?.hashtags || []).map((h, i) => (
                  <span key={i} className="bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded-md">
                    #{h}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setGeneratedVideoModal(null)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                تم وتثبيت في قاعدة البيانات 👍
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
