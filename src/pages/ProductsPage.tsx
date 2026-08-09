import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters } from '../components/ProductFilters';
import { FilterState } from '../types';
import { Grid, List, SlidersHorizontal, Search, PackageX, ChevronRight, ChevronLeft } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { 
    products, 
    selectedCategory, 
    selectedSubcategory, 
    searchQuery, 
    setSearchQuery,
    setSelectedCategory,
    categories,
    language
  } = useApp();

  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: searchQuery || '',
    category: selectedCategory || 'all',
    subcategory: selectedSubcategory || 'all',
    brand: 'all',
    minPrice: 0,
    maxPrice: 10000,
    minDiscount: 0,
    sortBy: 'latest'
  });

  // Keep synced with global context category selection if changed from Header
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      searchQuery: searchQuery
    }));
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  React.useEffect(() => {
    if (!mobileFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFilterOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileFilterOpen]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'all',
      subcategory: 'all',
      brand: 'all',
      minPrice: 0,
      maxPrice: 10000,
      minDiscount: 0,
      sortBy: 'latest'
    });
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const titleArMatch = product.titleAr.toLowerCase().includes(query);
        const titleEnMatch = product.titleEn.toLowerCase().includes(query);
        const descMatch = product.description.toLowerCase().includes(query);
        const descEnMatch = product.descriptionEn?.toLowerCase().includes(query) || false;
        const brandMatch = product.brand.toLowerCase().includes(query);
        const keywordMatch = product.keywords && product.keywords.some(k => k.toLowerCase().includes(query));
        const keywordEnMatch = product.keywordsEn?.some(k => k.toLowerCase().includes(query)) || false;
        if (!titleArMatch && !titleEnMatch && !descMatch && !descEnMatch && !brandMatch && !keywordMatch && !keywordEnMatch) return false;
      }

      // Category
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
      }

      // Subcategory
      if (filters.subcategory !== 'all' && product.subcategory !== filters.subcategory) {
        return false;
      }

      // Brand
      if (filters.brand !== 'all' && product.brand !== filters.brand) {
        return false;
      }

      // Minimum Discount
      if (filters.minDiscount > 0 && product.discountPercent < filters.minDiscount) {
        return false;
      }

      // Max Price
      if (product.discountPrice > filters.maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'best-selling') return (b.isTopSelling ? 1 : 0) - (a.isTopSelling ? 1 : 0);
      if (filters.sortBy === 'highest-discount') return b.discountPercent - a.discountPercent;
      if (filters.sortBy === 'price-low') return a.discountPrice - b.discountPrice;
      if (filters.sortBy === 'price-high') return b.discountPrice - a.discountPrice;
      return 0;
    });
  }, [products, filters]);

  const selectedCategoryDetails = categories.find(c => c.id === filters.category);
  const categoryTitle = language === 'en'
    ? selectedCategoryDetails?.nameEn || 'All Products'
    : selectedCategoryDetails?.nameAr || 'جميع المنتجات';

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-purple-400 bg-purple-950/80 px-3 py-1 rounded-lg">
            {language === 'ar' ? 'دليل التسويق بالعمولة' : 'Affiliate Shopping Guide'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-['Tajawal'] mt-2">
            {categoryTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'ar'
              ? `تم العثور على ${filteredProducts.length} منتج متاح بخصومات وروابط مباشرة`
              : `${filteredProducts.length} products available with deals and direct links`}
          </p>
        </div>

        {/* Layout Switch & Mobile Filter Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {language === 'ar' ? 'التصفية والفلترة' : 'Filters'}
          </button>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={language === 'ar' ? 'عرض الشبكة' : 'Grid view'}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={language === 'ar' ? 'عرض القائمة' : 'List view'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className={`grid grid-cols-1 gap-8 ${desktopFilterOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
        
        {/* Sidebar Filters (Desktop) */}
        {desktopFilterOpen && <div className="hidden lg:block space-y-6">
          <ProductFilters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            onClose={() => setDesktopFilterOpen(false)}
          />
        </div>}

        {/* Products Grid & Sorting Controls */}
        <div className={`${desktopFilterOpen ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6`}>
          
          {/* Daily Deals Notice Line above Product Cards */}
          <div className="bg-gradient-to-r from-amber-500/15 via-purple-950/80 to-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 text-center text-xs sm:text-sm font-bold text-amber-200 font-['Tajawal'] flex items-center justify-center gap-2 shadow-xl backdrop-blur-md">
            <span className="text-amber-400 text-base">🔥</span>
            <span>
              {language === 'ar'
                ? 'يتم تحديث أفضل العروض يوميًا من Amazon وAliExpress، وقد تتغير الأسعار حسب التوفر.'
                : 'Top deals are updated daily from Amazon and AliExpress; prices may change based on availability.'}
            </span>
          </div>

          {/* Top Control Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDesktopFilterOpen(open => !open)}
                className="hidden lg:flex shrink-0 items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-black text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-200"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {desktopFilterOpen
                  ? (language === 'ar' ? 'إخفاء التصفية' : 'Hide filters')
                  : (language === 'ar' ? 'إظهار التصفية' : 'Show filters')}
              </button>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                {language === 'ar' ? 'الترتيب حسب:' : 'Sort by:'}
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="latest">{language === 'ar' ? 'الأحدث نزوَلاً' : 'Newest'}</option>
                <option value="rating">{language === 'ar' ? 'الأعلى تقييمًا (★ 5.0)' : 'Highest rated (★ 5.0)'}</option>
                <option value="best-selling">{language === 'ar' ? 'الأكثر مبيعًا وطلباً' : 'Best selling'}</option>
                <option value="highest-discount">{language === 'ar' ? 'الأعلى نسبة خصم' : 'Biggest discount'}</option>
                <option value="price-low">{language === 'ar' ? 'السعر: من الأرخص للأغلى' : 'Price: Low to high'}</option>
                <option value="price-high">{language === 'ar' ? 'السعر: من الأغلى للأرخص' : 'Price: High to low'}</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              {language === 'ar' ? 'يعرض' : 'Showing'}{' '}
              <strong className="text-purple-600 dark:text-purple-400">{filteredProducts.length}</strong>{' '}
              {language === 'ar' ? `من إجمالي ${products.length} منتجات` : `of ${products.length} products`}
            </div>
          </div>

          {/* Filter Drawer for Mobile */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-[120] lg:hidden" role="dialog" aria-modal="true" aria-label={language === 'ar' ? 'تصفية المنتجات' : 'Product filters'}>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                aria-label={language === 'ar' ? 'إغلاق التصفية' : 'Close filters'}
              />
              <div className={`absolute inset-y-0 w-[min(92vw,380px)] overflow-y-auto p-3 sm:p-5 ${language === 'ar' ? 'right-0' : 'left-0'}`}>
                <ProductFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleResetFilters}
                  onClose={() => setMobileFilterOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Products List Rendering */}
          {filteredProducts.length > 0 ? (
            <div className="space-y-8">
              <div className={
                layout === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {paginatedProducts.map(prod => (
                  <ProductCard key={prod.id} product={prod} layout={layout} />
                ))}
              </div>

              {/* Pagination Controls with Arrows */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      currentPage === 1
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 font-['Tajawal'] text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{language === 'ar' ? 'الصفحة' : 'Page'}</span>
                    <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-mono">
                      {currentPage}
                    </span>
                    <span>{language === 'ar' ? 'من' : 'of'}</span>
                    <span className="font-mono">{totalPages}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      currentPage === totalPages
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer'
                    }`}
                  >
                    <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
              <PackageX className="w-16 h-16 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-['Tajawal']">
                {language === 'ar' ? 'لم نجد أي منتجات تطابق معايير البحث الحالية!' : 'No products match your current search.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'ar'
                  ? 'جرّب تغيير كلمات البحث أو إعادة ضبط خيارات تصفية الأسعار والأقسام لنتائج أفضل.'
                  : 'Try different search terms or reset the price and category filters.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                {language === 'ar' ? 'إعادة ضبط جميع الفلاتر' : 'Reset all filters'}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
