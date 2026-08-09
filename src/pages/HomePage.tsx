import React from 'react';
import smartHomeBanner from '../assets/images/smart_home_banner_1785693287624.jpg';
import { useApp } from '../context/AppContext';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { 
  Flame, 
  Sparkles, 
  PlaySquare, 
  ArrowLeft, 
  CheckCircle2, 
  TrendingUp,
  ThumbsUp,
  SlidersHorizontal,
  Target,
  Eye,
  HeartHandshake,
  ShoppingBag,
  Video,
  Layers,
  Globe,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';
import bannerImg from '../assets/images/yousra_smile_banner_1785601300772.jpg';

import { BlogSection } from '../components/BlogSection';
import { FlashDealsTicker } from '../components/FlashDealsTicker';
import { RecentlyViewedSection } from '../components/RecentlyViewedSection';

export const HomePage: React.FC = () => {
  const { 
    products, 
    setPage, 
    setSelectedCategory, 
    openVideoModal,
    openProductDetail,
    language,
    formatPrice,
    t,
    categories
  } = useApp();

  const featuredProducts = products.filter(p => p.isFeatured || p.discountPercent >= 25).slice(0, 8);
  const editorialStripProducts = products.slice(0, 4);
  const topSellingProducts = products.filter(p => p.isTopSelling).slice(0, 6);
  const homeCategories = categories.filter(category => category.showOnHome !== false);

  const dealsCarouselRef = React.useRef<HTMLDivElement>(null);
  const videosCarouselRef = React.useRef<HTMLDivElement>(null);
  const topSellingCarouselRef = React.useRef<HTMLDivElement>(null);

  const scrollDeals = (direction: 'left' | 'right') => {
    if (dealsCarouselRef.current) {
      const container = dealsCarouselRef.current;
      const scrollAmount = 320;
      const isRtl = document.documentElement.dir === 'rtl' || language === 'ar';
      let offset = direction === 'left' ? -scrollAmount : scrollAmount;
      if (isRtl) {
        offset = -offset;
      }
      container.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollTopSelling = (direction: 'left' | 'right') => {
    if (topSellingCarouselRef.current) {
      const container = topSellingCarouselRef.current;
      const scrollAmount = 320;
      const isRtl = document.documentElement.dir === 'rtl' || language === 'ar';
      let offset = direction === 'left' ? -scrollAmount : scrollAmount;
      if (isRtl) {
        offset = -offset;
      }
      container.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollVideos = (direction: 'left' | 'right') => {
    if (videosCarouselRef.current) {
      const isRtl = document.documentElement.dir === 'rtl' || language === 'ar';
      let offset = direction === 'left' ? -320 : 320;
      if (isRtl) offset = -offset;
      videosCarouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-6 text-[#2C1802] dark:text-[#FDFCFB]">
      
      {/* Flash Deals Countdown Ticker Bar */}
      <FlashDealsTicker />

      {/* Top Prominent Brand Hero Card with Smart Home Banner Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#532180] via-[#3a185c] to-[#280f42] border border-[#D4AF37]/70 rounded-2xl p-3 sm:p-5 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-400/35 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Smart Home Visual Banner Image */}
        <div className="relative w-full h-36 sm:h-48 md:h-56 rounded-xl overflow-hidden mb-3 border border-[#D4AF37]/60 shadow-xl group">
          <img 
            src={smartHomeBanner} 
            alt="Smart Home & Modern Appliances" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-125 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#280f42]/75 via-[#280f42]/20 to-transparent"></div>
          
          <div className="absolute bottom-2.5 right-2.5 ltr:left-2.5 ltr:right-auto bg-slate-950/80 backdrop-blur-md border border-amber-400/50 px-3 py-1 rounded-lg text-amber-300 text-xs font-bold font-['Tajawal'] flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'Smart Home & Modern Appliances Guide' : 'دليل الأجهزة المنزلية الحديثة والذكية'}</span>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-2 text-center">
          
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-[#D4AF37] border border-amber-500/30 px-3 py-0.5 rounded-full text-[11px] font-bold font-['Tajawal'] tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{language === 'en' ? 'THE FUTURE OF HOME TECHNOLOGY' : 'تكنولوجيا المنزل الذكي — مراجعات موثوقة'}</span>
          </div>

          {/* Brand Header: Logo + Title */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 sm:gap-4 py-0.5">
            {/* Enlarged Crisp Logo Avatar (First child = Right side in RTL) */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-purple-500 to-amber-500 blur-md opacity-85 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-3 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.6)] bg-slate-950 transition-transform duration-500 hover:scale-105">
                <img 
                  src={logoImg} 
                  alt={language === 'ar' ? 'ابتسامة يسرى Logo' : 'Yousra Smile Logo'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0.5 right-0.5 bg-amber-400 text-slate-950 p-1 rounded-full shadow-lg border-2 border-slate-950 font-bold" title="Verified Creator">
                <Sparkles className="w-3 h-3 fill-slate-950" />
              </span>
            </div>

            {/* Prominent Golden Title Text (Focused element: centered & brightened for dark background) */}
            <div className="text-center space-y-0.5">
              <h1 
                style={{ color: '#efbfed', marginTop: '4px', marginBottom: '21px' }}
                className={`text-3xl sm:text-5xl md:text-[58px] font-black leading-tight tracking-tight text-center drop-shadow-xl ${
                  language === 'ar' ? "font-['Tajawal']" : "font-serif-editorial"
                }`}
              >
                {language === 'ar' ? 'ابتسامة يسرى' : 'Yousra Smile'}
              </h1>
            </div>
          </div>

          <p 
            style={{ color: '#e7d3ee' }}
            className="text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed font-['Tajawal'] text-center"
          >
            {language === 'en' 
              ? 'Smart devices, modern home essentials, and honest affiliate recommendations. We select the best for you to transform your daily lifestyle.'
              : 'الأجهزة الذكية والمنزل العصري بلمسة من الفخامة والصدق. ننتقي لك الأفضل لنغير نمط حياتك اليومي.'}
          </p>
        </div>
      </section>

      {/* Daily Deals Notice Line above Product Cards */}
      <div 
        style={{ backgroundColor: '#67106a' }}
        className="border border-purple-500/40 rounded-xl p-2 sm:p-2.5 text-center text-xs font-bold font-['Tajawal'] flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
      >
        <span className="text-amber-400 text-sm">🔥</span>
        <span style={{ color: '#f4eff5' }}>
          {language === 'en' 
            ? 'Top deals are updated daily from Amazon & AliExpress; prices may change based on availability.' 
            : 'يتم تحديث أفضل العروض يوميًا من Amazon وAliExpress، وقد تتغير الأسعار حسب التوفر.'}
        </span>
      </div>

      {/* Hero Banner Section */}
      <HeroBanner />

      {/* Design Variation: Editorial Product Strip */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
          <div className="font-mono-meta text-xs text-amber-400">
            // {language === 'en' ? 'EDITORIAL SELECTIONS' : 'اختيارات التحرير الفاخرة'}
          </div>
          <button 
            onClick={() => { setSelectedCategory('all'); setPage('products'); }}
            className="font-mono-meta text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            {language === 'en' ? 'VIEW CATALOG' : 'عرض الكتالوج الكامل'} →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-purple-900/30 border border-purple-500/20 rounded-2xl overflow-hidden shadow-lg">
          {editorialStripProducts.map((prod, idx) => {
            const title = language === 'en' ? (prod.titleEn || prod.brand) : prod.titleAr;
            return (
              <div 
                key={prod.id}
                onClick={() => openProductDetail(prod)}
                className="group bg-[#180D2B] hover:bg-[#23123D] p-3 transition-all duration-300 cursor-pointer flex flex-col justify-between border border-purple-900/40"
              >
                <div>
                  <div className="font-mono-meta text-[11px] text-amber-300 mb-1">
                    {prod.brand.toUpperCase()} / [0{idx + 1}]
                  </div>
                  <div className="w-full aspect-square bg-slate-900 rounded-xl overflow-hidden mb-2 border border-purple-500/20">
                    <img 
                      src={prod.image} 
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <h3 className="font-serif-editorial text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors mb-1 line-clamp-2 leading-snug">
                    {title}
                  </h3>
                </div>
                <div className="font-mono-meta text-xs text-slate-300 pt-2 border-t border-purple-500/20 flex justify-between items-center">
                  <span>Price: {formatPrice(prod.discountPrice)}</span>
                  <span className="text-amber-400">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Design Variation: High-Contrast Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 border border-purple-500/20 my-2.5 py-2 bg-[#180D2B]/80 rounded-xl shadow-lg backdrop-blur-md">
        <div className="p-3 border-b md:border-b-0 md:border-l border-purple-500/20 text-center md:text-right space-y-0.5">
          <span className="font-serif-editorial text-3xl sm:text-4xl text-white block font-extrabold">124k</span>
          <span className="font-mono-meta text-xs text-amber-300 font-bold">YouTube Community</span>
        </div>
        <div className="p-3 border-b md:border-b-0 md:border-l border-purple-500/20 text-center md:text-right space-y-0.5">
          <span className="font-serif-editorial text-3xl sm:text-4xl text-white block font-extrabold">450k</span>
          <span className="font-mono-meta text-xs text-amber-300 font-bold">TikTok Reach</span>
        </div>
        <div className="p-3 text-center md:text-right space-y-0.5">
          <span className="font-serif-editorial text-3xl sm:text-4xl text-amber-300 block font-extrabold">0%</span>
          <span className="font-mono-meta text-xs text-slate-200 font-semibold">Fake Reviews Guarantee</span>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#180D2B] border border-purple-500/30 rounded-2xl p-4 shadow-lg">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              {t.categories}
            </h2>
            <p className="text-sm font-medium text-slate-200 mt-1 leading-6">
              {language === 'en' ? 'Explore top rated products in smart home, kitchen, and personal care' : 'اختر القسم لاستكشاف منتجات المنزل الذكي والديكور والعناية بالمطبخ والعناية الشخصية للجميع'}
            </p>
          </div>
          <button
            onClick={() => { setSelectedCategory('all'); setPage('products'); }}
            className="text-sm font-black text-amber-300 hover:text-white flex items-center gap-1 transition-colors shrink-0"
          >
            {t.allCategories} ({categories.length})
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {homeCategories.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            const catName = language === 'en' ? cat.nameEn : cat.nameAr;
            const subcategorySummary = language === 'en'
              ? Array.from(new Set(
                  products
                    .filter(product => product.category === cat.id)
                    .map(product => product.subcategoryEn)
                    .filter((subcategory): subcategory is string => Boolean(subcategory))
                )).slice(0, 2).join(' • ')
              : cat.subcategories.slice(0, 2).join(' • ');
            return (
              <div
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setPage('products'); }}
                className="group relative bg-[#180D2B] rounded-2xl p-2 border border-purple-500/20 hover:border-amber-400/60 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-full h-20 rounded-xl overflow-hidden mb-1.5 bg-slate-900 relative border border-purple-500/20">
                  <img 
                    src={cat.image} 
                    alt={catName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-amber-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 backdrop-blur-xs">
                    {count} {t.productsCount}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors font-['Tajawal']">
                  {catName}
                </h3>
                <p className="text-[10px] text-slate-300 line-clamp-1">
                  {subcategorySummary || (language === 'en' ? 'Featured products' : 'منتجات مميزة')}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Deals Horizontal Section */}
      <section className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 rounded-2xl p-4 sm:p-5 text-white space-y-4 shadow-xl border border-purple-800/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-xl text-white shadow animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow">
                  {language === 'en' ? 'Discounts up to 40%' : 'خصومات تصل لـ 40%'}
                </span>
                <span className="text-[11px] text-slate-300">{language === 'en' ? 'Updated Today' : 'محدثة اليوم'}</span>
              </div>
              <h2 className="text-xl font-black font-['Tajawal'] text-white">
                {t.deals}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setPage('deals')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow transition-all shrink-0"
          >
            {t.deals}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        {/* Horizontal Carousel with Arrows */}
        <div className="relative group/carousel z-10">
          {/* Scroll container */}
          <div 
            ref={dealsCarouselRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-2 select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredProducts.map(prod => (
              <div key={prod.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>

          {/* Left Arrow Button (Physical Left) */}
          <button
            onClick={() => scrollDeals('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-purple-500/30 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow-lg transition-all md:opacity-0 md:group-hover/carousel:opacity-100 hover:scale-115 active:scale-95 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button (Physical Right) */}
          <button
            onClick={() => scrollDeals('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-purple-500/30 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow-lg transition-all md:opacity-0 md:group-hover/carousel:opacity-100 hover:scale-115 active:scale-95 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Yousra's Video Reviews Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-950/80 border border-red-800/60 text-red-400 rounded-xl">
              <PlaySquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-red-400">{language === 'en' ? 'Live Interactive Reviews' : 'مراجعات تفاعلية حية'}</span>
              <h2 className="text-xl font-black text-white font-['Tajawal']">
                {t.videoReviews}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setPage('videos')}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            {language === 'en' ? `Watch All Videos (${SAMPLE_VIDEOS.length})` : `مشاهدة جميع الفيديوهات (${SAMPLE_VIDEOS.length})`}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="relative group/video-carousel">
          <div
            ref={videosCarouselRef}
            className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth pb-2 md:grid md:grid-cols-3 md:overflow-visible"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {SAMPLE_VIDEOS.slice(0, 3).map(video => (
              <div
                key={video.id}
                onClick={() => openVideoModal(video)}
                className="group flex w-[84vw] max-w-[360px] shrink-0 snap-start cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:border-purple-600 hover:shadow-xl md:w-auto md:max-w-none"
              >
              <div className="relative h-40 bg-slate-950 overflow-hidden">
                <img 
                  src={video.productImage} 
                  alt={language === 'en' ? (video.titleEn || 'Product video review') : video.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <PlaySquare className="w-6 h-6 fill-white text-white" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                  {video.duration}
                </span>
                <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {video.platform}
                </span>
              </div>

              <div className="p-3 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-300">
                  {language === 'en' ? (video.productTitleEn || 'Product') : video.productTitle}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors font-['Tajawal'] leading-snug">
                  {language === 'en' ? (video.titleEn || 'Product Video Review') : video.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                  <span>{language === 'en' ? (video.viewsEn || 'Views') : video.views}</span>
                  <span>{language === 'en' ? (video.dateEn || '') : video.date}</span>
                </div>
              </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollVideos('left')}
            className="absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-purple-500/40 bg-slate-950/90 text-amber-300 shadow-lg md:hidden"
            aria-label={language === 'ar' ? 'الفيديو السابق' : 'Previous video'}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollVideos('right')}
            className="absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-purple-500/40 bg-slate-950/90 text-amber-300 shadow-lg md:hidden"
            aria-label={language === 'ar' ? 'الفيديو التالي' : 'Next video'}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Best Sellers Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-950/80 border border-purple-800/60 text-amber-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-['Tajawal']">
                {t.topSelling}
              </h2>
              <p className="text-[11px] text-slate-400">{t.topSellingSubtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setPage('products')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            {t.viewAllProducts}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        {/* Horizontal Carousel with Arrows */}
        <div className="relative group/carousel z-10">
          {/* Scroll container */}
          <div 
            ref={topSellingCarouselRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-2 select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topSellingProducts.map(prod => (
              <div key={prod.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>

          {/* Left Arrow Button (Physical Left) */}
          <button
            onClick={() => scrollTopSelling('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-purple-500/30 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow-lg transition-all md:opacity-0 md:group-hover/carousel:opacity-100 hover:scale-115 active:scale-95 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button (Physical Right) */}
          <button
            onClick={() => scrollTopSelling('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-purple-500/30 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow-lg transition-all md:opacity-0 md:group-hover/carousel:opacity-100 hover:scale-115 active:scale-95 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Mission, Vision & Values Cards Section */}
      <section className="bg-slate-900/90 rounded-2xl p-4 sm:p-6 border border-[#D4AF37]/30 shadow-lg space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'فلسفة يسرى سمايل' : 'Yousra Smile Philosophy'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
            {language === 'ar' ? 'رسالتنا، رؤيتنا وقيمنا الراسخة' : 'Our Mission, Vision & Values'}
          </h2>
          <p className="text-sm text-slate-100 leading-7 font-medium">
            {language === 'ar' 
              ? 'نهدف إلى إحداث فارق حقيقي في عالم التسوق الإلكتروني من خلال توفير مراجعات ودراسات دقيقة للمنتجات قبل الشراء.' 
              : 'Empowering smart shoppers with transparent recommendations and honest affiliate device reviews.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Card 1: Mission */}
          <div className="bg-[#18181B] p-4 rounded-xl border border-amber-500/20 space-y-2.5 hover:border-amber-400/60 transition-all duration-300 shadow group">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <h3 style={{ color: '#f1eee9' }} className="text-base font-extrabold font-['Tajawal'] flex items-center gap-1.5">
              <span>🎯</span>
              <span>{language === 'ar' ? 'رسالتنا' : 'Our Mission'}</span>
            </h3>
            <p style={{ color: '#ffffff' }} className="text-sm leading-7 font-medium">
              {language === 'ar' 
                ? 'مساعدتك في اختيار أفضل الأجهزة والحلول المنزلية الذكية التي توفر وقتك ومالك وتلبي احتياجات منزلك وديكورك بدقة وسهولة.' 
                : 'Helping you choose the best smart home appliances that save your time and budget.'}
            </p>
          </div>

          {/* Card 2: Vision */}
          <div className="bg-[#18181B] p-4 rounded-xl border border-purple-500/20 space-y-2.5 hover:border-purple-400/60 transition-all duration-300 shadow group">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
            <h3 style={{ color: '#f1eee9' }} className="text-base font-extrabold font-['Tajawal'] flex items-center gap-1.5">
              <span>⭐</span>
              <span>{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</span>
            </h3>
            <p style={{ color: '#ffffff' }} className="text-sm leading-7 font-medium">
              {language === 'ar' 
                ? 'تقديم مراجعات حقيقية وتجارب صادقة وشفافة بعيداً عن الإعلانات المضللة، لنكون مرجعك الموثوق الأول للتسوق الذكي.' 
                : 'Delivering honest, unbiased reviews to become your #1 trusted smart shopping reference.'}
            </p>
          </div>

          {/* Card 3: Values */}
          <div className="bg-[#18181B] p-4 rounded-xl border border-emerald-500/20 space-y-2.5 hover:border-emerald-400/60 transition-all duration-300 shadow group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 style={{ color: '#f1eee9' }} className="text-base font-extrabold font-['Tajawal'] flex items-center gap-1.5">
              <span>🤝</span>
              <span>{language === 'ar' ? 'قيمنا' : 'Our Values'}</span>
            </h3>
            <ul style={{ color: '#ffffff' }} className="text-sm space-y-2 leading-6 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'ar' ? 'الشفافية المطلقة والإفصاح عن روابط الأفلييت.' : 'Total Transparency & Affiliate Disclosure.'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'ar' ? 'المصداقية العالية في التجربة والتقييم.' : 'High Credibility & Authentic Hands-on Testing.'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'ar' ? 'الانتقاء الدقيق لأعلى جودة مقابل السعر.' : 'Curating Quality for Maximum Value.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Verified Numbers & Statistics Section */}
      <section className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 border border-purple-800/60 shadow-2xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">
            {language === 'ar' ? 'أرقام تتحدث عن المصداقية' : 'Platform Numbers & Trust Impact'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal']">
            {language === 'ar' ? 'يسرى سمايل بالأرقام والتغطية' : 'Yousra Smile Key Milestones'}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="bg-slate-900/90 border border-purple-800/50 p-5 rounded-2xl space-y-1">
            <span className="text-3xl sm:text-5xl font-black text-amber-400 block font-heading">+100</span>
            <span className="text-sm font-bold text-white block">{language === 'ar' ? 'مراجعة موثوقة' : 'Honest Reviews'}</span>
            <span className="text-xs font-medium text-slate-100">{language === 'ar' ? 'تجارب حية وفيديوهات' : 'Hands-on video reviews'}</span>
          </div>

          <div className="bg-slate-900/90 border border-purple-800/50 p-5 rounded-2xl space-y-1">
            <span className="text-3xl sm:text-5xl font-black text-purple-400 block font-heading">+500</span>
            <span className="text-sm font-bold text-white block">{language === 'ar' ? 'منتج مفحوص ومصنف' : 'Curated Products'}</span>
            <span className="text-xs font-medium text-slate-100">{language === 'ar' ? 'أجهزة ذكية ومنزلية' : 'Smart home & kitchen tech'}</span>
          </div>

          <div className="bg-slate-900/90 border border-purple-800/50 p-5 rounded-2xl space-y-1">
            <span className="text-3xl sm:text-5xl font-black text-amber-400 block font-heading">Amazon</span>
            <span className="text-sm font-bold text-white block">{language === 'ar' ? '& AliExpress' : '& AliExpress'}</span>
            <span className="text-xs font-medium text-slate-100">{language === 'ar' ? 'مقارنات وأفضل الأسعار' : 'Verified affiliate links'}</span>
          </div>

          <div className="bg-slate-900/90 border border-purple-800/50 p-5 rounded-2xl space-y-1">
            <span className="text-3xl sm:text-5xl font-black text-red-500 block font-heading">Social</span>
            <span className="text-sm font-bold text-white block">{language === 'ar' ? 'YouTube & TikTok' : 'YouTube & TikTok'}</span>
            <span className="text-xs font-medium text-slate-100">{language === 'ar' ? 'محتوى متجدد يومياً' : 'Daily video releases'}</span>
          </div>
        </div>
      </section>

      {/* Buying Guides & Blog Articles Section */}
      <BlogSection />

      {/* Recently Viewed Products Section */}
      <RecentlyViewedSection />

      {/* Bottom Prominent Call-to-Action (CTA) Banner Button */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-600 to-purple-800 text-slate-950 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 border-2 border-amber-300">
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-950 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-400/50 shadow-md">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{language === 'ar' ? 'جاهز لاكتشاف أفضل العروض؟' : 'Ready to discover top deals?'}</span>
          </div>

          <h2 
            style={{ color: '#2A1800', fontSize: '28px', fontWeight: 'bold' }}
            className="font-['Cairo'] leading-snug drop-shadow-sm"
          >
            {language === 'ar' ? 'تصفح جميع المنتجات الذكية والصفقات الحصرية الآن' : 'Explore All Smart Products & Exclusive Deals Now'}
          </h2>

          <p 
            style={{ color: '#2A1800', fontSize: '18px', fontWeight: 'bold' }}
            className="leading-relaxed max-w-2xl mx-auto font-['Cairo']"
          >
            {language === 'ar' 
              ? 'مجموعة متكاملة من أجهزة المنزل الذكي، أدوات المطبخ العصري، العناية الشخصية والديكور بأسعار استثنائية وروابط شراء موثوقة.' 
              : 'Discover curated smart home electronics, modern kitchen tools, and personal care tech with verified purchase links.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage('products')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-base flex items-center justify-center gap-3 shadow-2xl transition-all transform hover:scale-105 cursor-pointer border border-amber-400/50"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span>{language === 'ar' ? 'تصفح جميع المنتجات' : 'Browse All Products'}</span>
              <ArrowLeft className="w-5 h-5 rtl:rotate-0 ltr:rotate-180 text-amber-400" />
            </button>

            <button
              onClick={() => setPage('deals')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all transform hover:scale-105 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-red-600" />
              <span>{language === 'ar' ? 'شاهد أحدث المراجعات والصفقات' : 'View Latest Deals & Reviews'}</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
