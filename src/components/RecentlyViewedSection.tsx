import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Eye, Sparkles } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const RecentlyViewedSection: React.FC = () => {
  const { products, recentlyViewedIds, openProductDetail, language, formatPrice } = useApp();

  const viewedProducts = (recentlyViewedIds || [])
    .map(id => (products || []).find(p => p.id === id))
    .filter((p): p is typeof products[0] => Boolean(p));

  if (viewedProducts.length === 0) return null;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {viewedProducts.slice(0, 4).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
