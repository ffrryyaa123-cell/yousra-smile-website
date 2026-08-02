import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, PageView, VideoReview, PriceAlert, CartItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { translations, Language } from '../utils/i18n';
import { CurrencyCode, CURRENCIES, CurrencyConfig, formatPriceValue } from '../utils/currency';

interface AppContextType {
  products: Product[];
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
  toggleDarkMode: () => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  
  // Admin CRUD
  addProduct: (newProduct: Omit<Product, 'id' | 'createdAt' | 'viewsCount'>) => void;
  updateProduct: (updatedProduct: Product) => void;
  deleteProduct: (id: string) => void;
  resetCatalog: () => void;
  
  // Metrics
  logAffiliateClick: (productId: string, platform: 'amazon' | 'aliexpress') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PRODUCTS_KEY = 'yousrasmile_products_v1';
const LOCAL_STORAGE_FAVS_KEY = 'yousrasmile_favorites_v1';
const LOCAL_STORAGE_CART_KEY = 'yousrasmile_cart_v1';
const LOCAL_STORAGE_COMPARE_KEY = 'yousrasmile_compare_v1';
const LOCAL_STORAGE_DARK_KEY = 'yousrasmile_darkmode_v1';
const LOCAL_STORAGE_LANG_KEY = 'yousrasmile_language_v1';
const LOCAL_STORAGE_CURRENCY_KEY = 'yousrasmile_currency_v1';
const LOCAL_STORAGE_PRICE_ALERTS_KEY = 'yousrasmile_price_alerts_v1';
const LOCAL_STORAGE_VIDEOS_KEY = 'yousrasmile_videos_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: Product) => ({
            ...p,
            amazonUrl: p.amazonUrl ? p.amazonUrl.replace('amazon.sa', 'amazon.com') : p.amazonUrl
          }));
        }
      }
    } catch (e) {
      console.error('Error loading products from localStorage:', e);
    }
    return INITIAL_PRODUCTS;
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
      return saved ? JSON.parse(saved) : ['prod-1', 'prod-6'];
    } catch (e) {
      return ['prod-1', 'prod-6'];
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      return saved ? JSON.parse(saved) : [
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
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRICE_ALERTS_KEY);
      return saved ? JSON.parse(saved) : [
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

  // Language state: 'ar' | 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      return (saved === 'en' || saved === 'ar') ? saved : 'ar';
    } catch (e) {
      return 'ar';
    }
  });

  // Currency state
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY) as CurrencyCode;
      if (saved && CURRENCIES[saved]) return saved;
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

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setFavorites(prev => prev.filter(fId => fId !== id));
    setCompareList(prev => prev.filter(cId => cId !== id));
  };

  const resetCatalog = () => {
    const confirmMsg = language === 'ar' 
      ? 'هل أنت تأكيد من إعادة ضبط قائمة المنتجات إلى الوضع الافتراضي الأصلي؟'
      : 'Are you sure you want to reset product catalog to original defaults?';
    if (window.confirm(confirmMsg)) {
      setProducts(INITIAL_PRODUCTS);
      localStorage.removeItem(LOCAL_STORAGE_PRODUCTS_KEY);
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
        toggleDarkMode,
        toggleLanguage,
        setLanguage,
        addProduct,
        updateProduct,
        deleteProduct,
        resetCatalog,
        logAffiliateClick
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
