import React, { useState } from 'react';
import { 
  Search, 
  Heart, 
  Scale, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Youtube, 
  Video, 
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal,
  Home,
  Tag,
  PlaySquare,
  Settings,
  ChevronDown,
  Globe,
  Coins
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
    selectedCategory
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

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
      <div className="bg-[#18181B]/95 text-xs py-2 px-4 border-b border-[#FDFCFB]/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono-meta text-[#D4AF37]">
              YOUSRA SMILE — EST. 2026
            </span>
            <span className="hidden md:inline text-[#FDFCFB]/50 text-[11px] border-r ltr:border-l ltr:border-r-0 border-[#FDFCFB]/10 px-3">
              {t.affiliateDisclaimer}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 font-mono-meta text-[11px] text-[#FDFCFB]/70">
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-red-400 transition-colors flex items-center gap-1"
                title="YouTube Channel"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YOUTUBE</span>
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-pink-400 transition-colors flex items-center gap-1"
                title="TikTok Account"
              >
                <Video className="w-3.5 h-3.5 text-pink-400" />
                <span>TIKTOK</span>
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-amber-400 transition-colors flex items-center gap-1"
                title="Pinterest Boards"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>PINTEREST</span>
              </a>
            </div>

            {/* Currency Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111113] hover:bg-[#222] text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-mono-meta transition-colors cursor-pointer"
                title={language === 'ar' ? 'اختر العملة' : 'Select Currency'}
                id="currency-switcher-top"
              >
                <span className="text-xs">{currencyConfig.flag}</span>
                <span>{currencyConfig.code} ({language === 'ar' ? currencyConfig.symbolAr : currencyConfig.symbolEn})</span>
                <ChevronDown className={`w-3 h-3 text-[#D4AF37] transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyDropdownOpen && (
                <div 
                  className="absolute left-0 sm:left-auto right-0 mt-1.5 w-48 bg-slate-900 border border-[#D4AF37]/30 rounded-xl shadow-2xl py-1.5 z-50 text-white animate-in fade-in zoom-in-95"
                  onClick={() => setCurrencyDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] text-[#D4AF37] font-bold border-b border-slate-800 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
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
                        currency === c.code ? 'bg-purple-950/60 text-amber-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{language === 'ar' ? c.labelAr : c.labelEn}</span>
                      </div>
                      <span className="font-bold text-[10px] text-amber-400 font-['Tajawal']">
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
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111113] hover:bg-[#222] text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-mono-meta transition-colors cursor-pointer"
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              id="language-switcher-top"
            >
              <Globe className="w-3 h-3 text-[#D4AF37]" />
              <span>{t.switchLanguage}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-[#111113]/90 text-[#FDFCFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Personal Brand Identity */}
          <div 
            onClick={() => setPage('home')}
            className="flex items-center gap-3.5 cursor-pointer group shrink-0"
          >
            <div className="relative">
              <img 
                src={logoImg} 
                alt="Yousra Smile Logo" 
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover shadow-lg border border-[#D4AF37]/60 group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black font-mono-meta text-[8px] font-bold px-1 py-0.2 rounded shadow">
                ★ 4.9
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-serif-editorial text-white group-hover:text-[#D4AF37] transition-colors">
                Yousra Smile
              </span>
              <span className="font-mono-meta text-[10px] text-[#D4AF37]">
                {language === 'en' ? 'CURATED HOME TECH & REVIEWS' : 'أجهزة وخدمات المنزل العصري الذكية'}
              </span>
            </div>
          </div>

          {/* Quick Search Bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex items-center flex-1 max-w-md relative"
          >
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-800 text-white placeholder-slate-400 border border-slate-700/80 focus:border-amber-400 focus:bg-slate-900 focus:outline-none transition-all text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
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

          {/* Action Buttons & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
              title={darkMode ? t.lightMode : t.darkMode}
              id="dark-mode-toggle"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-purple-400" />}
            </button>

            {/* Favorites Counter Button */}
            <button
              onClick={() => setPage('favorites')}
              className={`relative p-2.5 rounded-xl transition-colors ${
                activePage === 'favorites' 
                  ? 'bg-purple-950/80 text-amber-300 border border-purple-800' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title={t.favorites}
              id="favorites-nav-btn"
            >
              <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Compare Counter Button */}
            <button
              onClick={() => setPage('compare')}
              className={`relative p-2.5 rounded-xl transition-colors ${
                activePage === 'compare' 
                  ? 'bg-purple-950/80 text-amber-300 border border-purple-800' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title={t.compare}
              id="compare-nav-btn"
            >
              <Scale className="w-5 h-5" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {compareList.length}
                </span>
              )}
            </button>

            {/* Admin Dashboard Switch */}
            <button
              onClick={() => setPage('admin')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
                activePage === 'admin'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-800 text-white font-bold border border-purple-500'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border border-slate-700'
              }`}
              id="admin-dashboard-btn"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">{t.adminPanel}</span>
            </button>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-200 hover:bg-slate-800"
              id="mobile-menu-trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Secondary Category Navigation Header */}
        <div className="hidden md:block bg-slate-950/90 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            
            {/* Nav Links */}
            <nav className="flex items-center gap-1 py-1.5">
              <button
                onClick={() => { setSelectedCategory('all'); setPage('home'); }}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  activePage === 'home'
                    ? 'text-amber-300 bg-purple-950/60 font-bold border border-purple-800/40'
                    : 'text-slate-300 hover:text-amber-300'
                }`}
              >
                <Home className="w-4 h-4" />
                {t.home}
              </button>

              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    activePage === 'products' && selectedCategory !== 'all'
                      ? 'text-amber-300 bg-purple-950/60 font-bold border border-purple-800/40'
                      : 'text-slate-300 hover:text-amber-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  {t.categories}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {categoriesDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setCategoriesDropdownOpen(false)}
                  >
                    <button
                      onClick={() => handleCategorySelect('all')}
                      className="w-full text-right px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-purple-950/80 hover:text-amber-300 flex items-center justify-between"
                    >
                      <span>{t.allCategories}</span>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">All</span>
                    </button>
                    <hr className="my-1 border-slate-800" />
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className="w-full text-right px-4 py-2 text-sm text-slate-300 hover:bg-purple-950/80 hover:text-amber-300 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        {language === 'en' ? cat.nameEn : cat.nameAr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setSelectedCategory('all'); setPage('products'); }}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activePage === 'products' && selectedCategory === 'all'
                    ? 'text-amber-300 bg-purple-950/60 font-bold border border-purple-800/40'
                    : 'text-slate-300 hover:text-amber-300'
                }`}
              >
                {t.allProducts}
              </button>

              <button
                onClick={() => setPage('videos')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  activePage === 'videos'
                    ? 'text-amber-300 bg-purple-950/60 font-bold border border-purple-800/40'
                    : 'text-slate-300 hover:text-amber-300'
                }`}
              >
                <PlaySquare className="w-4 h-4 text-red-500 animate-pulse" />
                {t.videoReviews}
              </button>

              <button
                onClick={() => setPage('deals')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  activePage === 'deals'
                    ? 'text-amber-300 bg-purple-950/60 font-bold border border-purple-800/40'
                    : 'text-slate-300 hover:text-amber-300'
                }`}
              >
                <Tag className="w-4 h-4 text-emerald-400" />
                {t.deals}
              </button>

              <button
                onClick={() => setPage('about', 'about')}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activePage === 'about'
                    ? 'text-amber-300 bg-purple-950/60 font-bold border border-purple-800/40'
                    : 'text-slate-300 hover:text-amber-300'
                }`}
              >
                {t.aboutUs}
              </button>
            </nav>

            <div className="text-xs text-slate-400 font-medium hidden lg:block">
              {t.quickNav} <span className="text-amber-400 font-semibold">Amazon & AliExpress Affiliate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col">
          <div className="bg-slate-900 w-full p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Yousra Smile" className="w-9 h-9 rounded-lg" />
              <span className="font-extrabold text-white">{t.siteTitle}</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-slate-900 flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Mobile Search */}
            <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }}>
              <div className="relative">
                <input 
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-800 text-white text-sm border border-slate-700"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            {/* Mobile Language Switcher button */}
            <button
              onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-950/90 text-amber-300 font-bold border border-purple-800/80 flex items-center justify-between text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                {t.switchLanguage}
              </span>
              <span className="text-xs bg-purple-900/60 px-2 py-0.5 rounded text-amber-200">
                {t.currentLanguageLabel}
              </span>
            </button>

            {/* Mobile Currency Switcher Row */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#D4AF37] font-bold">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#D4AF37]" />
                  <span>{language === 'ar' ? 'عملة عرض الأسعار' : 'Display Currency'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currencyConfig.flag} {currencyConfig.code}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCurrency(c.code as CurrencyCode);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currency === c.code 
                        ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black shadow-md' 
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs">{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <button
                onClick={() => { setPage('home'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-slate-200 hover:bg-slate-800 font-bold flex items-center gap-3"
              >
                <Home className="w-5 h-5 text-purple-400" />
                {t.home}
              </button>
              <button
                onClick={() => { setSelectedCategory('all'); setPage('products'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-slate-200 hover:bg-slate-800 font-bold flex items-center gap-3"
              >
                <SlidersHorizontal className="w-5 h-5 text-purple-400" />
                {t.allProducts}
              </button>
              <button
                onClick={() => { setPage('videos'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-slate-200 hover:bg-slate-800 font-bold flex items-center gap-3"
              >
                <PlaySquare className="w-5 h-5 text-red-500" />
                {t.videoReviews}
              </button>
              <button
                onClick={() => { setPage('deals'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-slate-200 hover:bg-slate-800 font-bold flex items-center gap-3"
              >
                <Tag className="w-5 h-5 text-emerald-400" />
                {t.deals}
              </button>
              <button
                onClick={() => { setPage('favorites'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-slate-200 hover:bg-slate-800 font-bold flex items-center gap-3"
              >
                <Heart className="w-5 h-5 text-red-500" />
                {t.favorites} ({favorites.length})
              </button>
              <button
                onClick={() => { setPage('compare'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-slate-200 hover:bg-slate-800 font-bold flex items-center gap-3"
              >
                <Scale className="w-5 h-5 text-purple-400" />
                {t.compare} ({compareList.length})
              </button>
              <button
                onClick={() => { setPage('admin'); setMobileMenuOpen(false); }}
                className="w-full text-right py-3 px-4 rounded-xl text-amber-300 bg-purple-950/80 border border-purple-800 font-bold flex items-center gap-3"
              >
                <Settings className="w-5 h-5 text-amber-400" />
                {t.adminPanel}
              </button>
            </div>

            <hr className="border-slate-800 my-4" />

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase block px-2">{t.categories}</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { handleCategorySelect(cat.id); setMobileMenuOpen(false); }}
                  className="w-full text-right px-4 py-2 text-sm text-slate-300 hover:text-amber-400 flex items-center justify-between"
                >
                  <span>{language === 'en' ? cat.nameEn : cat.nameAr}</span>
                  <span className="text-xs text-slate-500">({cat.subcategories.length})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
