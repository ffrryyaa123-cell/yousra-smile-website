import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, Trash2, ArrowLeft, Bell, Mail, ShoppingBag, ShoppingCart, ArrowRight } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { 
    visibleProducts: products,
    favorites, 
    toggleFavorite, 
    setPage, 
    priceAlerts, 
    removePriceAlert, 
    openProductDetail, 
    addToCart,
    openCartModal,
    language, 
    formatPrice 
  } = useApp();

  const favProducts = products.filter(p => favorites.includes(p.id));

  const addAllFavsToCart = () => {
    favProducts.forEach(p => addToCart(p.id));
    openCartModal();
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header */}
      <div className="bg-[#111113] text-[#FDFCFB] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold mb-1">
            <Heart className="w-4 h-4 fill-red-500" />
            <span>{language === 'ar' ? 'قائمة المفضلات الشخصية للمتسوق' : 'Shopper Personal Favorites'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
            {language === 'ar' 
              ? `المنتجات المحفوظة في المفضلة (${favProducts.length})` 
              : `Saved Favorite Products (${favProducts.length})`}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar'
              ? 'جميع المنتجات التي قمتِ بحفظها لمشاهدتها أو إضافتها للسلة وشراؤها لاحقاً.'
              : 'All saved items for later review, cart addition, and shopping.'}
          </p>
        </div>

        {favProducts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={addAllFavsToCart}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة كافة المفضلات للسلة' : 'Add All to Shopping Cart'}</span>
            </button>

            <button
              onClick={() => favorites.forEach(id => toggleFavorite(id))}
              className="px-4 py-2.5 rounded-xl bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/60 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'مسح المفضلة' : 'Clear Favorites'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {favProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favProducts.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <Heart className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-['Tajawal']">
            قائمة المفضلة فارغة حالياً!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            اضغطي على أيقونة القلب على أي بطاقة منتج أثناء التصفح لحفظه في هذه القائمة.
          </p>
          <button
            onClick={() => setPage('products')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            تصفحي المنتجات الآن
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Price Alerts Management Section */}
      <div className="bg-[#111113] rounded-3xl p-6 sm:p-8 border border-[#FDFCFB]/15 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#FDFCFB]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-editorial text-white flex items-center gap-2">
                تنبيهات الأسعار النشطة ({priceAlerts.length})
              </h2>
              <p className="text-xs text-slate-400">
                إدارات التنبيهات التي قمت بتفعيلها لتلقي إشعارات البريد عند هبوط الأسعار.
              </p>
            </div>
          </div>
        </div>

        {priceAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priceAlerts.map(alert => {
              const matchingProduct = products.find(p => p.id === alert.productId);
              return (
                <div 
                  key={alert.id}
                  className="bg-[#18181B] border border-[#FDFCFB]/10 rounded-2xl p-4 flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all"
                >
                  <img 
                    src={alert.productImage} 
                    alt={alert.productTitle}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover rounded-xl border border-[#FDFCFB]/10 shrink-0 cursor-pointer"
                    onClick={() => matchingProduct && openProductDetail(matchingProduct)}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 
                      onClick={() => matchingProduct && openProductDetail(matchingProduct)}
                      className="text-xs font-bold text-white truncate cursor-pointer hover:text-[#D4AF37] transition-colors"
                    >
                      {alert.productTitle}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono-meta">
                      <span className="text-slate-400">السعر الحالي:</span>
                      <span className="text-amber-400 font-bold">{formatPrice(alert.currentPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono-meta">
                      <span className="text-slate-400">سعر التنبيه:</span>
                      <span className="text-emerald-400 font-bold">≤ {formatPrice(alert.targetPrice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate pt-1">
                      <Mail className="w-3 h-3 text-[#D4AF37]" />
                      <span className="truncate">{alert.email}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removePriceAlert(alert.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors shrink-0"
                    title="إلغاء التنبيه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-600" />
            <p>لا يوجد تنبيهات أسعار مفعلة حالياً. يمكنك تفعيل التنبيه على أي منتج من خلال زر الأيقونة الجرس 🔔.</p>
          </div>
        )}
      </div>

    </div>
  );
};


