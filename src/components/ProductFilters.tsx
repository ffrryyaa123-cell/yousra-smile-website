import React from 'react';
import { useApp } from '../context/AppContext';
import { Check, RotateCcw, Filter, X } from 'lucide-react';
import { FilterState } from '../types';

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  onClose?: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  onClose
}) => {
  const { products, categories, language, formatPrice } = useApp();

  // Extract unique brands
  const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);

  const currentCategoryObj = categories.find(c => c.id === filters.category);
  const subcategoryOptions = Array.from(
    new Map(
      products
        .filter(product => filters.category === 'all' || product.category === filters.category)
        .map(product => [
          product.subcategory,
          language === 'en' ? (product.subcategoryEn || 'Product') : product.subcategory
        ])
    ).entries()
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-6 shadow-sm">
      
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Tajawal']">
            {language === 'ar' ? 'تصفية المنتجات' : 'Product Filters'}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {!onClose && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg px-2 py-1.5 text-xs font-bold text-purple-600 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/50 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={language === 'ar' ? 'إغلاق التصفية' : 'Close filters'}
              title={language === 'ar' ? 'إغلاق' : 'Close'}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          {language === 'ar' ? 'القسم الرئيسي' : 'Main Category'}
        </label>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value, subcategory: 'all' })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">{language === 'ar' ? 'جميع الأقسام' : 'All Categories'}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{language === 'en' ? cat.nameEn : cat.nameAr}</option>
          ))}
        </select>
      </div>

      {/* Subcategory Filter */}
      {currentCategoryObj && subcategoryOptions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {language === 'ar' ? 'الفرع / التخصص' : 'Subcategory'}
          </label>
          <select
            value={filters.subcategory}
            onChange={(e) => onFilterChange({ subcategory: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">{language === 'ar' ? 'جميع التخصصات الفرعية' : 'All Subcategories'}</option>
            {subcategoryOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Brand Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          {language === 'ar' ? 'العلامة التجارية' : 'Brand'}
        </label>
        <select
          value={filters.brand}
          onChange={(e) => onFilterChange({ brand: e.target.value })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">{language === 'ar' ? 'جميع الماركات' : 'All Brands'}</option>
          {brands.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Minimum Discount Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          {language === 'ar' ? 'نسبة الخصم الأدنى' : 'Minimum Discount'}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 15, 25, 35, 40, 50].map(disc => (
            <button
              key={disc}
              onClick={() => onFilterChange({ minDiscount: disc })}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                filters.minDiscount === disc
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              {disc === 0 ? (language === 'ar' ? 'الكل' : 'All') : `${disc}%+`}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 font-bold">
          <span>{language === 'ar' ? 'نطاق السعر الأقصى:' : 'Maximum Price:'}</span>
          <span className="text-purple-600 dark:text-purple-400 font-extrabold font-['Tajawal']">{formatPrice(filters.maxPrice)}</span>
        </div>
        <input 
          type="range"
          min={100}
          max={10000}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
          className="w-full accent-purple-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{formatPrice(100)}</span>
          <span>{formatPrice(10000)}</span>
        </div>
      </div>

      {onClose && (
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-700 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2.5 text-xs font-black text-white shadow-md transition-colors hover:bg-purple-700"
          >
            <Check className="h-4 w-4" />
            {language === 'ar' ? 'موافق' : 'Apply'}
          </button>
        </div>
      )}

    </div>
  );
};
