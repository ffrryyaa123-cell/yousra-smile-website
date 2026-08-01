import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Tag, Flame, Percent, ArrowLeft } from 'lucide-react';

export const DealsPage: React.FC = () => {
  const { products } = useApp();
  const [minDiscount, setMinDiscount] = useState<number>(20);

  const discountedProducts = products
    .filter(p => p.discountPercent >= minDiscount)
    .sort((a, b) => b.discountPercent - a.discountPercent);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Deals Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-10 border border-emerald-800/40 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
          <Flame className="w-4 h-4 text-emerald-400 animate-bounce" />
          مركز التخفيضات والكوبونات اليومية
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-['Tajawal']">
          صفحة العروض والتخفيضات الكبرى 🏷️
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          جميع المنتجات المتاحة في هذه الصفحة خاضعة لخصومات حقيقية تبدأ من 20% وحتى 50% عبر متاجر أمازون وعلي إكسبريس. تم التحقق من الأسعار حديثاً!
        </p>
      </div>

      {/* Filter by discount level */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">حد الخصم الأدنى المعروض:</span>
        </div>

        <div className="flex items-center gap-2">
          {[15, 20, 25, 30, 40].map(disc => (
            <button
              key={disc}
              onClick={() => setMinDiscount(disc)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                minDiscount === disc
                  ? 'bg-emerald-600 text-white shadow-md scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              خصم {disc}% فأكثر
            </button>
          ))}
        </div>
      </div>

      {/* Discounted Products Grid */}
      {discountedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {discountedProducts.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Tag className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد منتجات بخصم أعلى من {minDiscount}% حالياً</h3>
          <p className="text-xs text-slate-500 mt-1">جرّبي تخفيض نسبة الخصم لمشاهدة باقي العروض المتاحة.</p>
        </div>
      )}

    </div>
  );
};
