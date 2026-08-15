import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { SlidersHorizontal, RotateCcw, Search, Tag, Filter } from 'lucide-react';
import { FilterState } from '../types';

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const { products, formatPrice } = useApp();

  // Extract unique brands
  const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);

  const currentCategoryObj = CATEGORIES.find(c => c.id === filters.category);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-6 shadow-sm">
      
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Tajawal']">تصفية المنتجات</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">القسم الرئيسي</label>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value, subcategory: 'all' })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">جميع الأقسام</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
          ))}
        </select>
      </div>

      {/* Subcategory Filter */}
      {currentCategoryObj && currentCategoryObj.subcategories.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">الفرع / التخصص</label>
          <select
            value={filters.subcategory}
            onChange={(e) => onFilterChange({ subcategory: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">جميع التخصصات الفرعية</option>
            {currentCategoryObj.subcategories.map((sub, i) => (
              <option key={i} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      )}

      {/* Brand Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">العلامة التجارية (Brand)</label>
        <select
          value={filters.brand}
          onChange={(e) => onFilterChange({ brand: e.target.value })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">جميع الماركات ({brands.length})</option>
          {brands.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Minimum Discount Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">نسبة الخصم الأدنى</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 15, 25, 35, 40, 50].map(disc => (
            <button
              key={disc}
              onClick={() => onFilterChange({ minDiscount: disc })}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                filters.minDiscount === disc
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              {disc === 0 ? 'الكل' : `${disc}%+`}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 font-bold">
          <span>نطاق السعر الأقصى:</span>
          <span className="text-purple-600 dark:text-purple-400 font-extrabold font-['Tajawal']">{formatPrice(filters.maxPrice)}</span>
        </div>
        <input 
          type="range"
          min={50}
          max={5000}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
          className="w-full accent-purple-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{formatPrice(50)}</span>
          <span>{formatPrice(5000)}</span>
        </div>
      </div>

    </div>
  );
};
