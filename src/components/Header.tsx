import React, { useState } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingBag,
  Scale, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Youtube, 
  Video, 
  Instagram,
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal,
  Home,
  Tag,
  PlaySquare,
  Settings,
  ChevronDown,
  Globe,
  Coins,
  BookOpen,
  HelpCircle,
  Info,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { CURRENCIES, CurrencyCode } from '../utils/currency';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';

export const Header: React.FC = () => {
  const { 
    activePage, 
    setPage, 
    favorites, 
    cartTotalCount,
    openCartModal,
    compareList, 
    darkMode, 
    toggleDarkMode,
    language,
    toggleLanguage,
    currency,
    currencyConfig,
    setCurrency,
    t,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    selectedCategory,
    products,
    openProductDetail,
    formatPrice,
    siteSettings
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = searchQuery.trim().length >= 2
    ? products.filter(p => 
        p.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setPage('products');
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId, 'all');
    setCategoriesDropdownOpen(false);
    setPage('products');
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-2xl bg-[#111113]/90 backdrop-blur-xl border-b border-[#FDFCFB]/10">
      {/* Editorial Header Bar */}
      <div className="bg-gradient-to-r from-[#12081f] via-[#1a0c2e] to-[#12081f] text-[11px] sm:text-xs py-1 sm:py-1.5 px-2.5 sm:px-6 border-b border-[#D4AF37]/20">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-['Tajawal'] font-bold text-[#D4AF37] text-[11px] sm:text-xs tracking-wider flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'ابتسامة يسرى — دليلك الذكي' : 'YOUSRA SMILE'}</span>
            </span>
            <span className="hidden lg:inline text-slate-400 text-[11px] border-r ltr:border-l ltr:border-r-0 border-slate-800 px-3 font-['Tajawal'] truncate">
              {t.affiliateDisclaimer}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Social Channels Pills (Shown on Tablet & Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-['Tajawal'] font-bold">
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 transition-all shadow-xs"
                title="قناة يوتيوب"
              >
                <Youtube className="w-3 h-3 text-red-500" />
                <span>{language === 'ar' ? 'يوتيوب' : 'YouTube'}</span>
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noreferrer"
                className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 transition-all shadow-xs"
                title="حساب تيك توك"
              >
                <Video className="w-3 h-3 text-pink-400" />
                <span>{language === 'ar' ? 'تيك توك' : 'TikTok'}</span>
              </a>
              <a 
                href="https://instagram.com/yousrasmile" 
                target="_blank" 
                rel="noreferrer"
                className="bg-purple-500/10 hover:bg-purple-500/20 text-pink-400 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 transition-all shadow-xs"
                title="حساب انستغرام"
              >
                <Instagram className="w-3 h-3 text-pink-400" />
                <span>{language === 'ar' ? 'انستغرام' : 'Instagram'}</span>
              </a>
            </div>

            {/* Currency Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 hover:bg-purple-900/80 text-[#D4AF37] border border-[#D4AF37]/50 text-[11px] font-['Tajawal'] font-bold transition-all cursor-pointer shadow-xs"
                title={language === 'ar' ? 'اختر العملة' : 'Select Currency'}
                id="currency-switcher-top"
              >
                <span className="text-xs">{currencyConfig.flag}</span>
                <span>{currencyConfig.code} ({language === 'ar' ? currencyConfig.symbolAr : currencyConfig.symbolEn})</span>
                <ChevronDown className={`w-3 h-3 text-[#D4AF37] transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyDropdownOpen && (
                <div 
                  className="absolute left-0 sm:left-auto right-0 mt-1.5 w-52 bg-slate-900 border border-[#D4AF37]/40 rounded-xl shadow-2xl py-1.5 z-50 text-white animate-in fade-in zoom-in-95 font-['Tajawal']"
                  onClick={() => setCurrencyDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-xs text-[#D4AF37] font-bold border-b border-slate-800 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'اختر عملة العرض' : 'Select Currency'}</span>
                  </div>
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCurrency(c.code as CurrencyCode);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                        currency === c.code ? 'bg-purple-900/60 text-amber-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{language === 'ar' ? c.labelAr : c.labelEn}</span>
                      </div>
                      <span className="font-bold text-[11px] text-amber-400">
                        {language === 'ar' ? c.symbolAr : c.symbolEn}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 hover:bg-purple-900/80 text-[#D4AF37] border border-[#D4AF37]/50 text-[11px] font-['Tajawal'] font-bold transition-all cursor-pointer shadow-xs"
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              id="language-switcher-top"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.switchLanguage}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-[#111113]/90 text-[#FDFCFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => { setSelectedCategory('all'); setPage('home'); }}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          >
            <div className="relative">
              <img 
                src={siteSettings.siteLogo || logoImg} 
                alt="Yousra Smile Logo" 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400/80 shadow-[0_0_12px_rgba(212,175,55,0.4)] group-hover:scale-105 transition-transform object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 p-0.5 rounded-full border border-slate-900 shadow-md flex items-center justify-center" title={language === 'ar' ? 'حساب موثوق ومعتمد' : 'Verified Brand'}>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className={`hidden sm:block font-['Cairo'] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-amber-300 text-sm sm:text-base leading-none block">{siteSettings.siteName || t.siteTitle}</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-extrabold leading-none shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {language === 'ar' ? 'نعم - موثوق' : 'Yes - Verified'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{language === 'ar' ? 'دليل تسوق الأجهزة الذكية' : 'Smart Home Shopping Guide'}</span>
            </div>
          </div>

          {/* Expanded Search Bar with Smart Autocomplete */}
          <div className="relative flex-1 max-w-lg">
            <form 
              onSubmit={handleSearchSubmit} 
              className="flex items-center w-full relative"
            >
              <input 
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-full bg-slate-900 text-white placeholder:text-slate-300 border border-slate-700/80 focus:border-amber-400 focus:bg-slate-950 focus:outline-none transition-all text-xs sm:text-sm shadow-inner font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Smart Autocomplete Dropdown */}
            {searchFocused && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseDown={(e) => e.preventDefault()} // prevent blur on item click
              >
                <div className="p-2 border-b border-slate-800 text-[11px] font-bold text-amber-300 flex items-center justify-between">
                  <span>{language === 'ar' ? 'نتائج البحث المقترحة' : 'Search Suggestions'}</span>
                  <span className="text-[10px] text-slate-400">{searchResults.length} {language === 'ar' ? 'منتجات' : 'products'}</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {searchResults.slice(0, 5).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        openProductDetail(product);
                        setSearchFocused(false);
                      }}
                      className="w-full text-right p-2.5 hover:bg-purple-950/60 flex items-center gap-3 transition-colors text-slate-100 cursor-pointer"
                    >
                      <img 
                        src={product.image} 
                        alt={product.titleAr} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate text-slate-100 font-['Tajawal']">
                          {language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="text-amber-400 font-bold">{product.brand}</span>
                          <span>•</span>
                          <span>{formatPrice(product.discountPrice)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {searchResults.length > 5 && (
                  <button
                    onClick={() => {
                      setPage('products');
                      setSearchFocused(false);
                    }}
                    className="w-full py-2 bg-slate-950 text-center text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-purple-950 transition-colors border-t border-slate-800"
                  >
                    {language === 'ar' ? `عرض كافة (${searchResults.length}) النتائج في صفحة المنتجات →` : `View all (${searchResults.length}) results →`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? t.lightMode : t.darkMode}
              id="dark-mode-toggle"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />}
            </button>

            {/* Favorites Counter Button */}
            <button
              onClick={() => setPage('favorites')}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${
                activePage === 'favorites' 
                  ? 'bg-purple-950/80 text-amber-300 border border-purple-800' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title={t.favorites}
              id="favorites-nav-btn"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={openCartModal}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-colors text-slate-300 hover:bg-slate-800 border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:border-[#D4AF37] cursor-pointer`}
              title={language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
              id="cart-nav-btn"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              {cartTotalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cartTotalCount}
                </span>
              )}
            </button>

            {/* Compare Counter Button */}
            <button
              onClick={() => setPage('compare')}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${
                activePage === 'compare' 
                  ? 'bg-purple-950/80 text-amber-300 border border-purple-800' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title={t.compare}
              id="compare-nav-btn"
            >
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {compareList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Category Navigation Header (Bottom Sub-Nav Line) */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 relative z-30">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            
            {/* Nav Links: Siblings together in one row */}
            <nav className="flex items-center gap-1.5 py-1.5 overflow-visible flex-wrap">
              
              {/* 1. الرئيسية ☰ (Home with 3 dashes, NO house symbol) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`px-3.5 py-2 text-sm font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activePage === 'home' && !mobileMenuOpen
                    ? 'text-amber-300 bg-purple-950/90 font-bold border border-amber-400/50 shadow-sm'
                    : 'text-amber-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/40'
                }`}
                title={language === 'ar' ? 'الرئيسية والقائمة المنسدلة ☰' : 'Home & Dropdown Menu ☰'}
                id="main-home-menu-trigger"
              >
                <span className="text-amber-400 font-mono text-base leading-none font-black">☰</span>
                <span>{t.home}</span>
              </button>

              {/* 2. الأقسام (Dropdown with ☰ icon) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoriesDropdownOpen(prev => !prev);
                  }}
                  className={`px-3.5 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    categoriesDropdownOpen || (activePage === 'products' && selectedCategory !== 'all')
                      ? 'text-amber-300 bg-purple-900/90 font-bold border border-amber-400/60 ring-2 ring-purple-500/30'
                      : 'text-slate-200 bg-slate-900/80 hover:text-amber-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                  id="categories-dropdown-button"
                >
                  <span className="text-amber-400 font-mono text-base leading-none font-black">☰</span>
                  <span>{t.categories}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Click outside backdrop & Dropdown Menu for Categories */}
                {categoriesDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
                      onClick={() => setCategoriesDropdownOpen(false)}
                    />
                    <div 
                      className={`absolute ${language === 'ar' ? 'right-0 sm:-right-2' : 'left-0 sm:-left-2'} top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-[#120A21] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] border-2 border-purple-500/50 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
                    >
                      <div className="px-3 pb-2 mb-1 border-b border-purple-500/20 flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300 font-['Cairo']">
                          {language === 'ar' ? 'أقسام المنتجات' : 'Product Categories'}
                        </span>
                        <span className="text-[10px] bg-purple-950 text-amber-300 px-2 py-0.5 rounded-full border border-purple-800">
                          {CATEGORIES.length} {language === 'ar' ? 'أقسام' : 'Categories'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCategorySelect('all')}
                        className={`w-full text-right px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCategory === 'all'
                            ? 'bg-purple-900/80 text-amber-300 border-r-4 border-amber-400'
                            : 'text-slate-200 hover:bg-purple-950/80 hover:text-amber-300'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-['Tajawal']">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.allCategories}</span>
                        </span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-300 font-mono">All</span>
                      </button>
                      <hr className="my-1.5 border-purple-500/20" />
                      
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`w-full text-right px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            selectedCategory === cat.id
                              ? 'bg-purple-900/80 text-amber-300 border-r-4 border-amber-400'
                              : 'text-slate-300 hover:bg-purple-950/80 hover:text-amber-300'
                          }`}
                        >
                          <span className="flex items-center gap-2 font-['Tajawal']">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                            <span>{language === 'en' ? cat.nameEn : cat.nameAr}</span>
                          </span>
                          <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded-md text-amber-300 font-mono">
                            ({cat.subcategories.length})
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 3. جميع المنتجات */}
              <button
                onClick={() => { setSelectedCategory('all'); setPage('products'); }}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activePage === 'products' && selectedCategory === 'all'
                    ? 'text-amber-300 bg-purple-950/80 font-bold border border-amber-400/40'
                    : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <span>{t.allProducts}</span>
                <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-bold font-mono">
                  {products.length}
                </span>
              </button>

              {/* 4. الفيديوهات والمراجعات */}
              <button
                onClick={() => setPage('videos')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activePage === 'videos'
                    ? 'text-amber-300 bg-purple-950/80 font-bold border border-amber-400/40'
                    : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <PlaySquare className="w-4 h-4 text-red-500 animate-pulse" />
                {t.videoReviews}
              </button>

              {/* 5. أقوى العروض */}
              <button
                onClick={() => setPage('deals')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activePage === 'deals'
                    ? 'text-amber-300 bg-purple-950/80 font-bold border border-amber-400/40'
                    : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <Tag className="w-4 h-4 text-amber-400" />
                {t.deals}
              </button>

              {/* 6. من نحن */}
              <button
                onClick={() => setPage('about')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0 ${
                  activePage === 'about'
                    ? 'text-amber-300 bg-purple-950/80 font-bold border border-amber-400/40'
                    : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                {t.aboutUs}
              </button>

              {/* 7. لوحة التحكم والإدارة (Admin) */}
              <button
                onClick={() => setPage('admin')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  activePage === 'admin'
                    ? 'text-amber-300 bg-purple-950/90 font-bold border border-amber-400'
                    : 'text-amber-400 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40'
                }`}
                title="لوحة تحكم وإحصائيات المتجر"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>{t.adminPanel}</span>
              </button>
            </nav>

            <div className="text-xs text-slate-400 font-medium hidden lg:block">
              {t.quickNav} <span className="text-amber-400 font-semibold">Amazon & AliExpress Affiliate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Top Dropdown Menu Panel (In Front of Screen, Drops Downward) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-6 animate-in fade-in duration-200">
          <div className="bg-[#110A1F] w-full max-w-xl max-h-[82vh] border-2 border-amber-400/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-top-6 duration-300">
            
            {/* Modal Dropdown Header */}
            <div className="bg-[#190F2E] p-4 border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={siteSettings.siteLogo || logoImg} alt="Yousra Smile" className="w-10 h-10 rounded-xl border border-amber-400/50 shadow" referrerPolicy="no-referrer" />
                <div>
                  <span className="font-extrabold text-white text-base block font-['Cairo']">{siteSettings.siteName || t.siteTitle}</span>
                  <span className="text-[11px] text-amber-300 font-['Tajawal']">{language === 'ar' ? 'التصفح المنسدل والتسهيلات' : 'Dropdown Navigation & Services'}</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-xl transition-colors cursor-pointer border border-amber-400/30"
                title="إغلاق"
              >
                <X className="w-6 h-6 text-amber-300" />
              </button>
            </div>

            {/* Modal Dropdown Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-white font-['Tajawal'] scrollbar-thin">
              
              {/* Direct WhatsApp Contact Button */}
              <a
                href="https://wa.me/966500000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%8A%D8%B3%D8%B1%D9%89%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold border border-emerald-400/40 flex items-center justify-between text-xs cursor-pointer shadow-md transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span>{language === 'ar' ? 'تواصل معنا مباشرة عبر واتساب' : 'Direct WhatsApp Support'}</span>
                </span>
                <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-200 font-mono">24/7</span>
              </a>

              {/* Core Navigation Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setPage('about'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-amber-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/40 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{language === 'ar' ? 'من نحن — قصة يسرى سمايل' : 'About Yousra Smile'}</span>
                </button>

                <button
                  onClick={() => { setSelectedCategory('all'); setPage('products'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-slate-200 bg-slate-900/80 hover:bg-purple-900/50 hover:text-amber-300 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{t.allProducts}</span>
                </button>

                <button
                  onClick={() => { setPage('deals'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-amber-300 bg-slate-900/80 hover:bg-purple-900/50 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t.deals}</span>
                </button>

                <button
                  onClick={() => { setPage('videos'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-slate-200 bg-slate-900/80 hover:bg-purple-900/50 hover:text-amber-300 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <PlaySquare className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{t.videoReviews}</span>
                </button>

                <button
                  onClick={() => { setPage('home'); setMobileMenuOpen(false); setTimeout(() => { document.getElementById('blog-section')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-slate-200 bg-slate-900/80 hover:bg-purple-900/50 hover:text-amber-300 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{language === 'ar' ? 'دليل الشراء والمدونة' : 'Buying Guides & Blog'}</span>
                </button>

                <button
                  onClick={() => { setPage('favorites'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-slate-200 bg-slate-900/80 hover:bg-purple-900/50 hover:text-amber-300 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <Heart className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{t.favorites} ({favorites.length})</span>
                </button>

                <button
                  onClick={() => { setPage('compare'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-slate-200 bg-slate-900/80 hover:bg-purple-900/50 hover:text-amber-300 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <Scale className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{t.compare} ({compareList.length})</span>
                </button>

                <button
                  onClick={() => { openCartModal(); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-amber-300 bg-slate-900/80 hover:bg-purple-900/50 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'} ({cartTotalCount})</span>
                </button>

                <button
                  onClick={() => { setPage('faq'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-slate-200 bg-slate-900/80 hover:bg-purple-900/50 hover:text-amber-300 border border-slate-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{language === 'ar' ? 'الأسئلة الشائعة والسياسات' : 'FAQ & Terms'}</span>
                </button>

                <button
                  onClick={() => { setPage('admin'); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3.5 rounded-xl text-amber-300 bg-purple-950/80 border border-purple-800 font-bold flex items-center gap-2.5 transition-colors text-xs"
                >
                  <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t.adminPanel}</span>
                </button>
              </div>

              <hr className="border-purple-500/20 my-3" />

              {/* Categories Section in Dropdown */}
              <div className="space-y-2">
                <span className="text-xs font-black text-amber-300 uppercase block px-1">
                  {language === 'ar' ? 'تصفح الأقسام الرئيسية:' : 'Main Categories:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { handleCategorySelect(cat.id); setMobileMenuOpen(false); }}
                      className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-200 bg-slate-900/90 hover:bg-purple-900/60 hover:text-amber-300 flex items-center justify-between border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer font-bold"
                    >
                      <span>{language === 'en' ? cat.nameEn : cat.nameAr}</span>
                      <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-md text-amber-400 font-mono">({cat.subcategories.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
