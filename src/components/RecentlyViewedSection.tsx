import React from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const RecentlyViewedSection: React.FC = () => {
  const { products, recentlyViewedIds, language } = useApp();
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const viewedProducts = recentlyViewedIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is typeof products[0] => Boolean(p));

  if (viewedProducts.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollerRef.current) return;
    const isRtl = document.documentElement.dir === 'rtl' || language === 'ar';
    let offset = direction === 'left' ? -320 : 320;
    if (isRtl) offset = -offset;
    scrollerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-100 font-['Cairo'] flex items-center gap-2">
              <span>{language === 'ar' ? 'شاهدت مؤخراً' : 'Recently Viewed'}</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {viewedProducts.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'الأجهزة والمنتجات التي قمت باستعراض تفاصيلها مؤخراً' : 'Products you recently inspected'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {viewedProducts.slice(0, 4).map(product => (
            <div key={product.id} className="w-[84vw] max-w-[340px] shrink-0 snap-start md:w-auto md:max-w-none">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {viewedProducts.length > 1 && (
          <>
            <button type="button" onClick={() => scroll('left')} className="absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-amber-400/40 bg-slate-950/90 text-amber-300 shadow-lg md:hidden" aria-label={language === 'ar' ? 'المنتج السابق' : 'Previous product'}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => scroll('right')} className="absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-amber-400/40 bg-slate-950/90 text-amber-300 shadow-lg md:hidden" aria-label={language === 'ar' ? 'المنتج التالي' : 'Next product'}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};
