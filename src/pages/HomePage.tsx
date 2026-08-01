import React from 'react';
import { useApp } from '../context/AppContext';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../data/categories';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';
import { 
  Flame, 
  Sparkles, 
  PlaySquare, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Award,
  TrendingUp,
  Tag,
  ThumbsUp,
  SlidersHorizontal
} from 'lucide-react';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';

export const HomePage: React.FC = () => {
  const { 
    products, 
    setPage, 
    setSelectedCategory, 
    openVideoModal,
    openProductDetail,
    language,
    formatPrice,
    t
  } = useApp();

  const featuredProducts = products.filter(p => p.isFeatured || p.discountPercent >= 25).slice(0, 8);
  const editorialStripProducts = products.slice(0, 4);
  const topSellingProducts = products.filter(p => p.isTopSelling).slice(0, 6);

  return (
    <div className="space-y-16 pb-20 text-[#FDFCFB]">
      
      {/* Design Variation: Editorial Magazine Header Hero */}
      <section className="text-center pt-6 pb-2 max-w-5xl mx-auto space-y-6">
        <div className="font-mono-meta text-[#D4AF37] tracking-widest text-xs uppercase">
          [ {language === 'en' ? 'THE FUTURE OF HOME TECHNOLOGY' : 'تكنولوجيا المنزل الذكي — مراجعات موثوقة'} ]
        </div>
        <h1 className="font-serif-editorial text-5xl sm:text-7xl md:text-9xl text-white font-normal leading-none tracking-tight">
          Yousra Smile
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[#FDFCFB]/70 max-w-2xl mx-auto font-light leading-relaxed">
          {language === 'en' 
            ? 'Curated smart devices, modern home essentials, and honest affiliate reviews. Transform your daily lifestyle with verified recommendations.'
            : 'مراجعات الأجهزة الذكية والمنزل العصري بلمسة من الفخامة والصدق. ننتقي لك الأفضل لنغير نمط حياتك اليومي.'}
        </p>
      </section>

      {/* Hero Banner Section */}
      <HeroBanner />

      {/* Design Variation: Editorial Product Strip */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#FDFCFB]/10 pb-4">
          <div className="font-mono-meta text-xs text-[#D4AF37]">
            // {language === 'en' ? 'EDITORIAL SELECTIONS' : 'اختيارات التحرير الفاخرة'}
          </div>
          <button 
            onClick={() => { setSelectedCategory('all'); setPage('products'); }}
            className="font-mono-meta text-xs text-[#FDFCFB]/70 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
          >
            {language === 'en' ? 'VIEW CATALOG' : 'عرض الكتالوج الكامل'} →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#FDFCFB]/10 border border-[#FDFCFB]/10 rounded-2xl overflow-hidden shadow-2xl">
          {editorialStripProducts.map((prod, idx) => {
            const title = language === 'en' ? (prod.titleEn || prod.titleAr) : prod.titleAr;
            return (
              <div 
                key={prod.id}
                onClick={() => openProductDetail(prod)}
                className="group bg-[#111113] hover:bg-[#1A1A1C] p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono-meta text-[11px] text-[#D4AF37] mb-3">
                    {prod.brand.toUpperCase()} / [0{idx + 1}]
                  </div>
                  <div className="w-full aspect-square bg-[#1A1A1C] rounded-xl overflow-hidden mb-5 border border-[#FDFCFB]/5">
                    <img 
                      src={prod.image} 
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <h3 className="font-serif-editorial text-xl text-white group-hover:text-[#D4AF37] transition-colors mb-2 line-clamp-2 leading-snug">
                    {title}
                  </h3>
                </div>
                <div className="font-mono-meta text-xs text-[#FDFCFB]/60 pt-4 border-t border-[#FDFCFB]/10 flex justify-between items-center">
                  <span>Price: {formatPrice(prod.discountPrice)}</span>
                  <span className="text-[#D4AF37]">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Design Variation: High-Contrast Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-[#FDFCFB]/10 my-8 py-2">
        <div className="p-8 border-b md:border-b-0 md:border-l border-[#FDFCFB]/10 text-center md:text-right space-y-2">
          <span className="font-serif-editorial text-5xl sm:text-6xl text-white block">124k</span>
          <span className="font-mono-meta text-xs text-[#D4AF37]">YouTube Community</span>
        </div>
        <div className="p-8 border-b md:border-b-0 md:border-l border-[#FDFCFB]/10 text-center md:text-right space-y-2">
          <span className="font-serif-editorial text-5xl sm:text-6xl text-white block">450k</span>
          <span className="font-mono-meta text-xs text-[#D4AF37]">TikTok Reach</span>
        </div>
        <div className="p-8 text-center md:text-right space-y-2">
          <span className="font-serif-editorial text-5xl sm:text-6xl text-[#D4AF37] block">0%</span>
          <span className="font-mono-meta text-xs text-[#FDFCFB]/70">Fake Reviews Guarantee</span>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
              {t.categories}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {language === 'en' ? 'Explore top rated products in smart home, kitchen, and personal care' : 'اختر القسم لاستكشاف منتجات المنزل الذكي والديكور والعناية بالمطبخ والمرأة'}
            </p>
          </div>
          <button
            onClick={() => { setSelectedCategory('all'); setPage('products'); }}
            className="text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            {t.allCategories} ({CATEGORIES.length})
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            const catName = language === 'en' ? cat.nameEn : cat.nameAr;
            return (
              <div
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setPage('products'); }}
                className="group relative bg-slate-900/90 rounded-3xl p-4 border border-slate-800 hover:border-amber-400/60 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-full h-24 rounded-2xl overflow-hidden mb-3 bg-slate-800 relative border border-slate-700/40">
                  <img 
                    src={cat.image} 
                    alt={catName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 backdrop-blur-xs">
                    {count} {t.productsCount}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors font-['Tajawal']">
                  {catName}
                </h3>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {cat.subcategories.slice(0, 2).join(' • ')}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Deals Horizontal Section */}
      <section className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl border border-purple-800/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow">
                  {language === 'en' ? 'Discounts up to 40%' : 'خصومات تصل لـ 40%'}
                </span>
                <span className="text-xs text-slate-300">{language === 'en' ? 'Updated Today' : 'محدثة اليوم'}</span>
              </div>
              <h2 className="text-2xl font-black font-['Tajawal'] text-white">
                {t.deals}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setPage('deals')}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all shrink-0"
          >
            {t.deals}
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {featuredProducts.slice(0, 4).map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Yousra's Video Reviews Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-950/80 border border-red-800/60 text-red-400 rounded-2xl">
              <PlaySquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-400">{language === 'en' ? 'Live Interactive Reviews' : 'مراجعات تفاعلية حية'}</span>
              <h2 className="text-2xl font-black text-white font-['Tajawal']">
                {t.videoReviews}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setPage('videos')}
            className="text-xs sm:text-sm font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            {language === 'en' ? `Watch All Videos (${SAMPLE_VIDEOS.length})` : `مشاهدة جميع الفيديوهات (${SAMPLE_VIDEOS.length})`}
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_VIDEOS.slice(0, 3).map(video => (
            <div
              key={video.id}
              onClick={() => openVideoModal(video)}
              className="group bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden hover:shadow-2xl hover:border-purple-600 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-950 overflow-hidden">
                <img 
                  src={video.productImage} 
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <PlaySquare className="w-7 h-7 fill-white text-white" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700">
                  {video.duration}
                </span>
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  {video.platform}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-[11px] font-bold text-amber-300">
                  {video.productTitle}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors font-['Tajawal']">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>{video.views}</span>
                  <span>{video.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-950/80 border border-purple-800/60 text-amber-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-['Tajawal']">
                {t.topSelling}
              </h2>
              <p className="text-xs text-slate-400">{t.topSellingSubtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setPage('products')}
            className="text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            {t.viewAllProducts}
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellingProducts.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Why Trust Yousra Smile Affiliate Section */}
      <section className="bg-slate-900/80 rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 bg-purple-950/80 text-amber-300 border border-purple-800/60 px-3.5 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            {t.whyTrustTag}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal']">
            {t.whyTrustTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.whyTrustSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950/90 text-purple-400 border border-purple-800/60 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-['Tajawal']">{t.trustFeature1Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.trustFeature1Desc}
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950/90 text-amber-400 border border-amber-800/60 flex items-center justify-center font-bold">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-['Tajawal']">{t.trustFeature2Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.trustFeature2Desc}
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-['Tajawal']">{t.trustFeature3Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.trustFeature3Desc}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
