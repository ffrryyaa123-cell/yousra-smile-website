import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, PageView, VideoReview, PriceAlert, CartItem, SiteSettings, BlogPost } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { SAMPLE_BLOG_POSTS } from '../data/blogPosts';
import { translations, Language } from '../utils/i18n';
import { CurrencyCode, CURRENCIES, CurrencyConfig, formatPriceValue } from '../utils/currency';

interface AppContextType {
  products: Product[];
  blogPosts: BlogPost[];
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'publishedDate'>) => void;
  updateBlogPost: (updatedPost: BlogPost) => void;
  deleteBlogPost: (id: string) => void;
  favorites: string[];
  cart: CartItem[];
  cartModalOpen: boolean;
  openCartModal: () => void;
  closeCartModal: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  cartTotalCount: number;
  compareList: string[];
  priceAlerts: PriceAlert[];
  alertModalProduct: Product | null;
  videos: VideoReview[];
  editingThumbnailVideo: VideoReview | null;
  activePage: PageView;
  selectedCategory: string;
  selectedSubcategory: string;
  searchQuery: string;
  selectedProduct: Product | null;
  selectedVideo: VideoReview | null;
  darkMode: boolean;
  language: Language;
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  t: typeof translations.ar;
  activeStaticTab: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure';
  
  // Currency helpers
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (priceInSar: number) => string;
  formatPriceObject: (priceInSar: number) => { amount: number; formattedAmount: string; symbol: string; fullText: string };

  // Actions
  setPage: (page: PageView, staticTab?: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure') => void;
  setSelectedCategory: (cat: string, subcat?: string) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;
  openVideoModal: (video: VideoReview) => void;
  closeVideoModal: () => void;
  openPriceAlertModal: (product: Product) => void;
  closePriceAlertModal: () => void;
  addPriceAlert: (product: Product, email: string, targetPrice?: number) => void;
  removePriceAlert: (alertId: string) => void;
  isSubscribedToAlert: (productId: string) => boolean;
  openThumbnailEditor: (video: VideoReview) => void;
  closeThumbnailEditor: () => void;
  updateVideoThumbnail: (videoId: string, newThumbnailUrl: string) => void;
  addVideo: (videoData: Omit<VideoReview, 'id' | 'views' | 'date'>) => void;
  deleteVideo: (videoId: string) => void;
  
  // Video Import & Replacement Modal (from device or link)
  importVideoModalOpen: boolean;
  importVideoPreselectedProductId: string | null;
  importVideoDefaultMode: 'upload' | 'link';
  importVideoIsReplacing: boolean;
  openImportVideoModal: (productId?: string, defaultMode?: 'upload' | 'link', isReplacing?: boolean) => void;
  closeImportVideoModal: () => void;
  replaceProductVideo: (productId: string, newVideoUrl: string, platform?: VideoReview['platform'], customTitle?: string) => void;
  removeProductVideo: (productId: string) => void;

  toggleDarkMode: () => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  recentlyViewedIds: string[];
  filterByBrand: (brandName: string) => void;
  
  // Admin CRUD
  addProduct: (newProduct: Omit<Product, 'id' | 'createdAt' | 'viewsCount'>) => void;
  importProductsBulk: (newProducts: Product[]) => void;
  updateProduct: (updatedProduct: Product) => void;
  deleteProduct: (id: string) => void;
  resetCatalog: () => void;
  addReview: (productId: string, userName: string, rating: number, comment: string) => void;
  
  // Metrics
  logAffiliateClick: (productId: string, platform: 'amazon' | 'aliexpress') => void;

  // Site settings
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  getAffiliateUrl: (product: Product, platform: 'amazon' | 'aliexpress') => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PRODUCTS_KEY = 'yousrasmile_products_v5';
const LOCAL_STORAGE_DELETED_PRODUCTS_KEY = 'yousrasmile_deleted_products_v1';
const LOCAL_STORAGE_FAVS_KEY = 'yousrasmile_favorites_v1';
const LOCAL_STORAGE_CART_KEY = 'yousrasmile_cart_v1';
const LOCAL_STORAGE_COMPARE_KEY = 'yousrasmile_compare_v1';
const LOCAL_STORAGE_DARK_KEY = 'yousrasmile_darkmode_v1';
const LOCAL_STORAGE_LANG_KEY = 'yousrasmile_language_v1';
const LOCAL_STORAGE_CURRENCY_KEY = 'yousrasmile_currency_v1';
const LOCAL_STORAGE_PRICE_ALERTS_KEY = 'yousrasmile_price_alerts_v1';
const LOCAL_STORAGE_VIDEOS_KEY = 'yousrasmile_videos_v5';
const LOCAL_STORAGE_DELETED_PRODUCT_VIDEOS_KEY = 'yousrasmile_deleted_product_videos_v1';
const LOCAL_STORAGE_RECENTLY_VIEWED_KEY = 'yousrasmile_recently_viewed_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'yousrasmile_settings_v4';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'ابتسامة يسرى (Yousra Smile)',
  siteLogo: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80',
  defaultLanguage: 'ar',
  defaultCurrency: 'USD',
  instagramUrl: 'https://instagram.com/yousrasmile',
  snapchatUrl: 'https://snapchat.com/add/yousrasmile',
  pinterestUrl: 'https://pinterest.com/yousrasmile',
  youtubeUrl: 'https://youtube.com/@yousrasmile',
  tiktokUrl: 'https://tiktok.com/@yousrasmile',
  amazonTag: 'frial-20',
  aliexpressTag: 'yousra_affiliate_id',
  contactEmail: 'contact@yousrasmile.com'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isProductVideoDeleted = (productId: string): boolean => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCT_VIDEOS_KEY);
      const deletedIds = saved ? JSON.parse(saved) : [];
      return Array.isArray(deletedIds) && deletedIds.includes(productId);
    } catch {
      return false;
    }
  };

  const normalizeProduct = (p: any): Product => {
    const englishTitle = p.titleEn || p.titleAr || 'Featured product';
    const englishCategory = String(p.category || 'products')
      .split('-')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return ({
    ...p,
    titleEn: englishTitle,
    descriptionEn: p.descriptionEn || `Discover ${englishTitle}, selected by Yousra Smile for its quality, useful features, and value.`,
    longDescriptionEn: p.longDescriptionEn || `${englishTitle} is a carefully selected product for modern living. Review the current specifications, price, availability, and retailer details before purchasing.`,
    subcategoryEn: p.subcategoryEn || englishCategory,
    features: Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? p.features.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    featuresEn: Array.isArray(p.featuresEn) && p.featuresEn.length > 0 ? p.featuresEn : [
      'Carefully selected for quality and everyday usefulness',
      'Competitive price with current retailer offers',
      'Full product details available before purchase'
    ],
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
    videoThumbnailUrl: isProductVideoDeleted(p.id) ? undefined : (p.videoThumbnailUrl || (p.id === 'prod-tineco-s6-stretch-steam' ? '/videos/tineco-s6-thumbnail.jpg' : undefined)),
    videoUrl: isProductVideoDeleted(p.id) ? undefined : (p.id === 'prod-tineco-s6-stretch-steam' ? '/videos/tineco-s6-stretch-steam-25s-en.mp4' : p.videoUrl),
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    specs: p.specs && typeof p.specs === 'object' ? p.specs : {},
    specsEn: p.specsEn && typeof p.specsEn === 'object' ? p.specsEn : {
      Brand: p.brand || 'See retailer',
      Category: englishCategory,
      Availability: 'See retailer for current details'
    },
    amazonUrl: p.amazonUrl ? p.amazonUrl.replace('amazon.sa', 'amazon.com') : (p.amazonUrl || '')
  })};

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const deletedIdsRaw = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
      const deletedIds = new Set<string>(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
      const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Always merge newly published catalog products without removing products
          // the administrator has already saved in this browser.
          const activeSaved = parsed.filter((p: Product) => !deletedIds.has(p.id));
          const existingIds = new Set(activeSaved.map((p: Product) => p.id));
          const newDefaults = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id) && !deletedIds.has(p.id));
          return [...activeSaved.map(normalizeProduct), ...newDefaults.map(normalizeProduct)];
        }
      }
    } catch (e) {
      console.error('Error loading products from localStorage:', e);
    }
    const deletedIdsRaw = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
    const deletedIds = new Set<string>(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
    return INITIAL_PRODUCTS.filter(p => !deletedIds.has(p.id)).map(normalizeProduct);
  });

  const [videos, setVideos] = useState<VideoReview[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading videos from localStorage:', e);
    }
    return SAMPLE_VIDEOS;
  });

  const [editingThumbnailVideo, setEditingThumbnailVideo] = useState<VideoReview | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAVS_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : ['prod-1', 'prod-6'];
    } catch (e) {
      return ['prod-1', 'prod-6'];
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        { productId: 'prod-1', quantity: 1, addedAt: new Date().toISOString() }
      ];
    } catch (e) {
      return [];
    }
  });

  const [cartModalOpen, setCartModalOpen] = useState<boolean>(false);

  const [compareList, setCompareList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COMPARE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRICE_ALERTS_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        {
          id: 'alert-sample-1',
          productId: 'prod-1',
          productTitle: 'Roborock S8 Pro Ultra',
          productImage: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80',
          currentPrice: 3699,
          targetPrice: 3400,
          currency: 'SAR',
          email: 'user@example.com',
          createdAt: new Date().toISOString().split('T')[0],
          isActive: true
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [alertModalProduct, setAlertModalProduct] = useState<Product | null>(null);

  // Default Dark Mode to true for rich dark aesthetic
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DARK_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const updateSiteSettings = useCallback((newSettings: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return updated;
    });
  }, []);

  const getAffiliateUrl = useCallback((product: Product, platform: 'amazon' | 'aliexpress'): string => {
    if (platform === 'amazon') {
      const url = product.amazonUrl || 'https://www.amazon.com';
      if (siteSettings.amazonTag) {
        try {
          const parsedUrl = new URL(url);
          parsedUrl.searchParams.set('tag', siteSettings.amazonTag);
          return parsedUrl.toString();
        } catch (e) {
          if (url.includes('?')) {
            if (url.includes('tag=')) {
              return url.replace(/tag=[^&]+/, `tag=${siteSettings.amazonTag}`);
            }
            return `${url}&tag=${siteSettings.amazonTag}`;
          }
          return `${url}?tag=${siteSettings.amazonTag}`;
        }
      }
      return url;
    } else {
      const url = product.aliexpressUrl || 'https://www.aliexpress.com';
      if (siteSettings.aliexpressTag) {
        try {
          const parsedUrl = new URL(url);
          parsedUrl.searchParams.set('aff_id', siteSettings.aliexpressTag);
          return parsedUrl.toString();
        } catch (e) {
          if (url.includes('?')) {
            if (url.includes('aff_id=')) {
              return url.replace(/aff_id=[^&]+/, `aff_id=${siteSettings.aliexpressTag}`);
            }
            return `${url}&aff_id=${siteSettings.aliexpressTag}`;
          }
          return `${url}?aff_id=${siteSettings.aliexpressTag}`;
        }
      }
      return url;
    }
  }, [siteSettings.amazonTag, siteSettings.aliexpressTag]);

  // Language state: 'ar' | 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
      
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.defaultLanguage) return parsed.defaultLanguage;
      }
    } catch (e) {}
    return 'ar';
  });

  // Currency state
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY) as CurrencyCode;
      if (saved && CURRENCIES[saved]) return saved;

      const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.defaultCurrency && CURRENCIES[parsed.defaultCurrency]) return parsed.defaultCurrency;
      }
    } catch (e) {
      console.error('Error loading currency:', e);
    }
    return 'USD';
  });

  const setCurrency = useCallback((code: CurrencyCode) => {
    if (CURRENCIES[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem(LOCAL_STORAGE_CURRENCY_KEY, code);
      } catch (e) {
        console.error('Failed to save currency:', e);
      }
    }
  }, []);

  const currencyConfig = CURRENCIES[currency] || CURRENCIES.USD;

  const formatPriceObject = useCallback((priceInSar: number) => {
    return formatPriceValue(priceInSar, currency, language);
  }, [currency, language]);

  const formatPrice = useCallback((priceInSar: number) => {
    return formatPriceValue(priceInSar, currency, language).fullText;
  }, [currency, language]);

  const [activePage, setActivePage] = useState<PageView>('home');
  const [activeStaticTab, setActiveStaticTab] = useState<'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure'>('about');
  const [selectedCategory, setSelectedCategoryState] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategoryState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoReview | null>(null);

  // Video Import & Replacement Modal (Device / Link)
  const [importVideoModalOpen, setImportVideoModalOpen] = useState<boolean>(false);
  const [importVideoPreselectedProductId, setImportVideoPreselectedProductId] = useState<string | null>(null);
  const [importVideoDefaultMode, setImportVideoDefaultMode] = useState<'upload' | 'link'>('upload');
  const [importVideoIsReplacing, setImportVideoIsReplacing] = useState<boolean>(false);

  const openImportVideoModal = (productId?: string, defaultMode: 'upload' | 'link' = 'upload', isReplacing: boolean = false) => {
    setImportVideoPreselectedProductId(productId || null);
    setImportVideoDefaultMode(defaultMode);
    setImportVideoIsReplacing(isReplacing);
    setImportVideoModalOpen(true);
  };

  const closeImportVideoModal = () => {
    setImportVideoModalOpen(false);
    setImportVideoPreselectedProductId(null);
    setImportVideoIsReplacing(false);
  };

  const replaceProductVideo = (productId: string, newVideoUrl: string, platform: VideoReview['platform'] = 'local', customTitle?: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCT_VIDEOS_KEY);
      const deletedIds: string[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem(LOCAL_STORAGE_DELETED_PRODUCT_VIDEOS_KEY, JSON.stringify(deletedIds.filter(id => id !== productId)));
    } catch (e) {
      console.error('Failed to restore product video state:', e);
    }

    // Update Product object with new video url
    const updatedProd: Product = {
      ...prod,
      videoUrl: newVideoUrl,
      youtubeUrl: platform === 'youtube' ? newVideoUrl : (prod.youtubeUrl || newVideoUrl)
    };
    updateProduct(updatedProd);

    // Update or Add to videos feed
    const existingVideoIndex = videos.findIndex(v => v.productId === productId);
    const videoTitle = customTitle || `مراجعة وتجربة حصرية لـ ${prod.titleAr}`;
    
    if (existingVideoIndex >= 0) {
      setVideos(prev => prev.map((v, i) => i === existingVideoIndex ? {
        ...v,
        platform,
        videoUrl: newVideoUrl,
        title: videoTitle,
        date: 'اليوم (محدث)'
      } : v));
    } else {
      addVideo({
        productId,
        productTitle: prod.titleAr,
        productImage: prod.image,
        thumbnailUrl: prod.image,
        platform,
        embedId: `vid-${Date.now()}`,
        videoUrl: newVideoUrl,
        title: videoTitle,
        duration: '01:00'
      });
    }

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(updatedProd);
    }
  };

  const removeProductVideo = (productId: string) => {
    // 1. Remove videoUrl and youtubeUrl from the Product
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          videoUrl: undefined,
          youtubeUrl: undefined
        };
      }
      return p;
    }));

    // 2. Remove any associated video review from the global videos feed
    setVideos(prev => prev.filter(v => v.productId !== productId));
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCT_VIDEOS_KEY);
      const deletedIds: string[] = saved ? JSON.parse(saved) : [];
      if (!deletedIds.includes(productId)) {
        localStorage.setItem(LOCAL_STORAGE_DELETED_PRODUCT_VIDEOS_KEY, JSON.stringify([...deletedIds, productId]));
      }
    } catch (e) {
      console.error('Failed to persist removed product video:', e);
    }

    // 3. Update currently viewed product if active
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => prev ? ({
        ...prev,
        videoUrl: undefined,
        youtubeUrl: undefined
      }) : null);
    }
  };

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RECENTLY_VIEWED_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : ['prod-1', 'prod-2', 'prod-6'];
    } catch (e) {
      return ['prod-1', 'prod-2', 'prod-6'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewedIds));
    } catch (e) {
      console.error('Failed to save recently viewed ids:', e);
    }
  }, [recentlyViewedIds]);

  const filterByBrand = (brandName: string) => {
    setSearchQuery(brandName);
    setSelectedCategoryState('all');
    setSelectedSubcategoryState('all');
    setActivePage('products');
  };

  const t = translations[language];

  // Sync products to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  }, [products]);

  // Sync favorites
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVS_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Sync cart
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cart]);

  // Sync compare
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_COMPARE_KEY, JSON.stringify(compareList));
    } catch (e) {
      console.error('Failed to save compare list:', e);
    }
  }, [compareList]);

  // Sync price alerts
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRICE_ALERTS_KEY, JSON.stringify(priceAlerts));
    } catch (e) {
      console.error('Failed to save price alerts:', e);
    }
  }, [priceAlerts]);

  // Sync videos to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(videos));
    } catch (e) {
      console.error('Failed to save videos:', e);
    }
  }, [videos]);

  // Handle dark mode class
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DARK_KEY, JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Dark mode sync failed:', e);
    }
  }, [darkMode]);

  // Handle language and document direction (RTL for Arabic, LTR for English)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    } catch (e) {
      console.error('Language sync failed:', e);
    }
  }, [language]);

  const setPage = (page: PageView, staticTab?: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure') => {
    setActivePage(page);
    if (staticTab) {
      setActiveStaticTab(staticTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSelectedCategory = (cat: string, subcat: string = 'all') => {
    setSelectedCategoryState(cat);
    setSelectedSubcategoryState(subcat);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const openCartModal = () => setCartModalOpen(true);
  const closeCartModal = () => setCartModalOpen(false);

  const addToCart = (productId: string, quantity: number = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.productId === productId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }
      return [...prev, { productId, quantity, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const isInCart = (productId: string) => cart.some(item => item.productId === productId);

  const cartTotalCount = cart.reduce((total, item) => total + item.quantity, 0);

  const toggleCompare = (productId: string) => {
    setCompareList(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      if (prev.length >= 4) {
        alert(language === 'ar' ? 'يمكنك مقارنة حتى 4 منتجات في وقت واحد' : 'You can compare up to 4 products at once');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const clearCompare = () => setCompareList([]);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setRecentlyViewedIds(prev => {
      const filtered = prev.filter(id => id !== product.id);
      return [product.id, ...filtered].slice(0, 10);
    });
    // Increment view count
    setProducts(prev => 
      prev.map(p => p.id === product.id ? { ...p, viewsCount: p.viewsCount + 1 } : p)
    );
  };

  const closeProductDetail = () => setSelectedProduct(null);

  const openVideoModal = (video: VideoReview) => setSelectedVideo(video);
  const closeVideoModal = () => setSelectedVideo(null);

  const openPriceAlertModal = (product: Product) => setAlertModalProduct(product);
  const closePriceAlertModal = () => setAlertModalProduct(null);

  const addPriceAlert = (product: Product, email: string, targetPrice?: number) => {
    const title = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      productId: product.id,
      productTitle: title,
      productImage: product.image,
      currentPrice: product.discountPrice,
      targetPrice: targetPrice || Math.round(product.discountPrice * 0.9),
      currency: product.currency,
      email: email,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true
    };
    setPriceAlerts(prev => [newAlert, ...prev.filter(a => a.productId !== product.id || a.email !== email)]);
  };

  const removePriceAlert = (alertId: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const openThumbnailEditor = (video: VideoReview) => setEditingThumbnailVideo(video);
  const closeThumbnailEditor = () => setEditingThumbnailVideo(null);

  const updateVideoThumbnail = (videoId: string, newThumbnailUrl: string) => {
    setVideos(prev => 
      prev.map(v => v.id === videoId ? { ...v, thumbnailUrl: newThumbnailUrl } : v)
    );
  };

  const addVideo = (videoData: Omit<VideoReview, 'id' | 'views' | 'date'>) => {
    const newVideo: VideoReview = {
      ...videoData,
      id: `v-${Date.now()}`,
      views: '1.2K',
      date: 'اليوم'
    };
    setVideos(prev => [newVideo, ...prev]);
  };

  const deleteVideo = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const isSubscribedToAlert = (productId: string) => {
    return priceAlerts.some(a => a.productId === productId && a.isActive);
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleLanguage = () => setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
  const setLanguage = (lang: Language) => setLanguageState(lang);

  // Admin CRUD
  const addProduct = (newProdData: Omit<Product, 'id' | 'createdAt' | 'viewsCount'>) => {
    const newProd: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      viewsCount: 1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const importProductsBulk = (importedList: Product[]) => {
    if (!importedList || importedList.length === 0) return;
    setProducts(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newItems = importedList.filter(p => !existingIds.has(p.id));
      return [...newItems, ...prev];
    });
  };

  const addReview = (productId: string, userName: string, rating: number, comment: string) => {
    const newRev = {
      id: `rev-${Date.now()}`,
      productId,
      userName: userName.trim() || (language === 'ar' ? 'مشتري مؤكد' : 'Verified Buyer'),
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true
    };

    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const currentReviews = p.reviews || [];
      const updatedReviews = [newRev, ...currentReviews];
      const totalRatings = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      const newAvgRating = Number((totalRatings / updatedReviews.length).toFixed(1));

      const updatedProduct = {
        ...p,
        rating: newAvgRating,
        reviewCount: (p.reviewCount || 0) + 1,
        reviews: updatedReviews
      };

      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(updatedProduct);
      }

      return updatedProduct;
    }));
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setFavorites(prev => prev.filter(fId => fId !== id));
    setCompareList(prev => prev.filter(cId => cId !== id));
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
      const deletedIds: string[] = saved ? JSON.parse(saved) : [];
      if (!deletedIds.includes(id)) {
        localStorage.setItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY, JSON.stringify([...deletedIds, id]));
      }
    } catch (e) {
      console.error('Failed to persist deleted product:', e);
    }
  };

  const resetCatalog = () => {
    const confirmMsg = language === 'ar' 
      ? 'هل أنت تأكيد من إعادة ضبط قائمة المنتجات إلى الوضع الافتراضي الأصلي؟'
      : 'Are you sure you want to reset product catalog to original defaults?';
    if (window.confirm(confirmMsg)) {
      setProducts(INITIAL_PRODUCTS);
      localStorage.removeItem(LOCAL_STORAGE_PRODUCTS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
    }
  };

  const logAffiliateClick = (productId: string, platform: 'amazon' | 'aliexpress') => {
    console.log(`Affiliate click logged for product ${productId} on ${platform}`);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        favorites,
        cart,
        cartModalOpen,
        openCartModal,
        closeCartModal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isInCart,
        cartTotalCount,
        compareList,
        priceAlerts,
        alertModalProduct,
        videos,
        editingThumbnailVideo,
        activePage,
        selectedCategory,
        selectedSubcategory,
        searchQuery,
        selectedProduct,
        selectedVideo,
        darkMode,
        language,
        currency,
        currencyConfig,
        recentlyViewedIds,
        filterByBrand,
        t,
        activeStaticTab,
        setCurrency,
        formatPrice,
        formatPriceObject,
        setPage,
        setSelectedCategory,
        setSearchQuery,
        toggleFavorite,
        toggleCompare,
        clearCompare,
        openProductDetail,
        closeProductDetail,
        openVideoModal,
        closeVideoModal,
        openPriceAlertModal,
        closePriceAlertModal,
        addPriceAlert,
        removePriceAlert,
        isSubscribedToAlert,
        openThumbnailEditor,
        closeThumbnailEditor,
        updateVideoThumbnail,
        addVideo,
        deleteVideo,
        importVideoModalOpen,
        importVideoPreselectedProductId,
        importVideoDefaultMode,
        importVideoIsReplacing,
        openImportVideoModal,
        closeImportVideoModal,
        replaceProductVideo,
        removeProductVideo,
        toggleDarkMode,
        toggleLanguage,
        setLanguage,
        addProduct,
        importProductsBulk,
        updateProduct,
        deleteProduct,
        resetCatalog,
        addReview,
        logAffiliateClick,
        siteSettings,
        updateSiteSettings,
        getAffiliateUrl
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
