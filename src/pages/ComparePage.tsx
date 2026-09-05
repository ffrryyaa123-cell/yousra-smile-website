import React from 'react';
import { useApp } from '../context/AppContext';
import { Scale, Trash2, ShoppingBag, ExternalLink, Star, ArrowLeft } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const { visibleProducts: products, compareList, toggleCompare, clearCompare, setPage, logAffiliateClick, formatPrice, getAffiliateUrl, language } = useApp();

  const comparedProducts = products.filter(p => compareList.includes(p.id));

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold mb-1">
            <Scale className="w-4 h-4" />
            {language === 'ar' ? 'أداة المقارنة الذكية' : 'Smart comparison tool'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
            {language === 'ar' ? 'مقارنة المنتجات والمواصفات' : 'Compare Products & Specifications'} ({comparedProducts.length}/4)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar' ? 'قارني بين الأسعار، الخصومات، التقييمات والمواصفات التقنية جنبًا إلى جنب لاتخاذ القرار الأنسب.' : 'Compare prices, discounts, ratings, and specifications side by side.'}
          </p>
        </div>

        {comparedProducts.length > 0 && (
          <button
            onClick={clearCompare}
            className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'ar' ? 'تفريغ المقارنة' : 'Clear comparison'}
          </button>
        )}
      </div>

      {comparedProducts.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-800">
                <th className="p-4 text-slate-400 font-bold w-48">خاصية المقارنة</th>
                {comparedProducts.map(prod => (
                  <th key={prod.id} className="p-4 w-72 min-w-[240px] align-top">
                    <div className="relative space-y-2">
                      <button
                        onClick={() => toggleCompare(prod.id)}
                        className="absolute -top-2 -left-2 p-1.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500 hover:text-red-500 transition-colors"
                        title="إزالة من المقارنة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <img 
                        src={prod.image} 
                        alt={prod.titleAr}
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                      />

                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md inline-block">
                        {prod.brand}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 font-['Tajawal']">
                        {language === 'en' ? (prod.titleEn || prod.titleAr) : prod.titleAr}
                      </h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Row 1: Price */}
              <tr className="divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
                <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">السعر والتوفير</td>
                {comparedProducts.map(prod => (
                  <td key={prod.id} className="p-4">
                    <div className="space-y-1">
                      <div className="text-base font-black text-purple-700 dark:text-purple-300 font-['Tajawal']">
                        {formatPrice(prod.discountPrice)}
                      </div>
                      {prod.originalPrice > prod.discountPrice && (
                        <div className="text-[11px] text-slate-400 line-through">
                          {formatPrice(prod.originalPrice)}
                        </div>
                      )}
                      {prod.discountPercent > 0 && (
                        <span className="inline-block bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {language === 'ar' ? 'خصم' : 'Save'} {prod.discountPercent}%
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 2: Rating */}
              <tr className="divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
                <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">التقييم وسرعة الطلب</td>
                {comparedProducts.map(prod => (
                  <td key={prod.id} className="p-4">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-slate-400 font-normal">({prod.reviewCount} تقييم)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Category */}
              <tr className="divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
                <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">القسم والتخصص</td>
                {comparedProducts.map(prod => (
                  <td key={prod.id} className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? (prod.subcategoryEn || prod.category) : prod.subcategory}
                  </td>
                ))}
              </tr>

              {/* Row 4: Key Features */}
              <tr className="divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
                <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">أبرز المميزات</td>
                {comparedProducts.map(prod => (
                  <td key={prod.id} className="p-4 align-top">
                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      {(language === 'en' ? (prod.featuresEn || []) : (prod.features || [])).slice(0, 3).map((feat, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-purple-500 font-bold">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Row 5: Action Buy CTAs */}
              <tr className="divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                <td className="p-4 font-bold text-slate-900 dark:text-white">الانتقال للشراء Direct</td>
                {comparedProducts.map(prod => (
                  <td key={prod.id} className="p-4">
                    <button
                      onClick={() => {
                        logAffiliateClick(prod.id, 'amazon');
                        const url = getAffiliateUrl(prod, 'amazon');
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      اشترِ من أمازون
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <Scale className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-['Tajawal']">
            لم تقومي بإضافة أي منتجات للمقارنة بعد!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            انقري على رمز الميزان في بطاقات المنتجات لإضافتها لمصفوفة المقارنة المباشرة.
          </p>
          <button
            onClick={() => setPage('products')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
          >
            تصفحي المنتجات الآن
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};

