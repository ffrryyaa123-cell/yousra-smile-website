import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { PlaySquare, CheckCircle2, Search, ArrowLeft, Flame } from 'lucide-react';
import bannerImg from '../assets/images/yousra_smile_banner_1785601300772.jpg';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';

export const HeroBanner: React.FC = () => {
  const { setPage, setSelectedCategory, searchQuery, setSearchQuery, language, t, videos, visibleProducts, openVideoModal } = useApp();
  const showcase = videos.find(video => !video.productId || visibleProducts.some(p => p.id === video.productId));

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white rounded-3xl my-4 sm:my-6 border border-purple-800/60 shadow-2xl">
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
        <img src={bannerImg} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover scale-105" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md"><Flame className="w-4 h-4 text-amber-400 animate-bounce" />{t.affiliateBadge}</div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{language === 'ar' ? 'نعم - منصة موثوقة ومراجعات معتمدة' : 'Yes - 100% Verified Platform'}</div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-['Tajawal'] leading-tight tracking-tight">{t.heroTitle} <span className="text-amber-400 font-extrabold">{t.heroTitleHighlight}</span></h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">{t.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative w-full sm:w-auto sm:flex-1">
              <input type="text" aria-label={t.searchPlaceholder} placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setPage('products'); }} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/80 text-white placeholder-slate-400 border border-slate-700/80 focus:border-amber-400 focus:outline-none backdrop-blur-md text-sm" />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button onClick={() => setPage('products')} className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all shrink-0">{t.exploreProductsBtn}<ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-purple-800/50 text-xs text-slate-300">
            {[t.trustSignal1, t.trustSignal2, t.trustSignal3].map((signal, i) => <div key={i} className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>{signal}</span></div>)}
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-purple-800/60 p-5 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5"><img src={logoImg} alt="Yousra" width="40" height="40" loading="lazy" decoding="async" className="w-10 h-10 rounded-full border border-purple-400" /><div><h4 className="text-xs font-bold text-white">{t.creatorName}</h4><p className="text-[10px] text-slate-400">{t.creatorBio}</p></div></div>
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><PlaySquare className="w-3 h-3" />{t.liveBadge}</span>
            </div>
            <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              {showcase && !showcase.hideThumbnail && <img src={showcase.thumbnailUrl || showcase.productImage} alt={showcase.productTitle || showcase.title} loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-3"><div className="w-full flex items-center justify-between"><div><span className="text-[10px] text-amber-300 font-bold block">{t.reviewOfTheWeek} 🔥</span><h5 className="text-xs font-bold text-white">{showcase?.productTitle || showcase?.title || (language === 'ar' ? 'مراجعات المنتجات' : 'Product reviews')}</h5></div><button aria-label={language === 'ar' ? 'تشغيل المراجعة' : 'Play review'} onClick={() => showcase ? openVideoModal(showcase) : setPage('videos')} className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-md transition-transform hover:scale-110"><PlaySquare className="w-4 h-4" /></button></div></div>
            </div>
            <div className="space-y-1.5"><span className="text-[11px] text-slate-400 font-bold block">{t.quickJumpCategories}</span><div className="flex flex-wrap gap-1.5">{CATEGORIES.slice(0, 4).map(cat => <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setPage('products'); }} className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition-colors border border-slate-700">{language === 'en' ? cat.nameEn : cat.nameAr}</button>)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};
