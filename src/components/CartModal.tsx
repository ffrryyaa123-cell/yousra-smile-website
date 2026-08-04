import React from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ExternalLink, 
  ShoppingBasket, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartModal: React.FC = () => {
  const { 
    cart, 
    products, 
    cartModalOpen, 
    closeCartModal, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart,
    formatPriceObject,
    language,
    t,
    openProductDetail,
    logAffiliateClick,
    getAffiliateUrl
  } = useApp();

  if (!cartModalOpen) return null;

  // Resolve products in cart
  const cartItems = cart
    .map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    })
    .filter((item): item is { productId: string; quantity: number; addedAt: string; product: typeof products[0] } => Boolean(item.product));

  const totalSar = cartItems.reduce((acc, item) => acc + item.product.discountPrice * item.quantity, 0);
  const totalSavingsSar = cartItems.reduce((acc, item) => acc + (item.product.originalPrice - item.product.discountPrice) * item.quantity, 0);

  const formattedTotal = formatPriceObject(totalSar);
  const formattedSavings = formatPriceObject(totalSavingsSar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg h-full bg-[#111113] text-[#FDFCFB] border-l ltr:border-r ltr:border-l-0 border-[#D4AF37]/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#18181B] border-b border-[#FDFCFB]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-[#FDFCFB] flex items-center gap-2">
                <span>{language === 'ar' ? 'سلة تسوق المنتجات' : 'Shopping Cart'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </h2>
              <p className="text-xs text-[#FDFCFB]/60">
                {language === 'ar' ? 'مراجعات المنتجات والتسوق المباشر' : 'Review items & affiliate checkout links'}
              </p>
            </div>
          </div>

          <button
            onClick={closeCartModal}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                <ShoppingBasket className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">
                  {language === 'ar' ? 'سلة التسوق فارغة حالياً' : 'Your Shopping Cart is Empty'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  {language === 'ar' 
                    ? 'تصفحي منتجات يسرى المميزة وأضيفي المنتجات التي تنال إعجابكِ لمتابعة الشراء' 
                    : 'Browse featured items and add products to your cart for direct shopping.'}
                </p>
              </div>
              <button
                onClick={closeCartModal}
                className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg flex items-center gap-2"
              >
                <span>{language === 'ar' ? 'تصفح المنتجات الآن' : 'Browse Products Now'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                <span>{language === 'ar' ? 'المنتجات المختارة' : 'Selected Products'} ({cartItems.length})</span>
                <button
                  onClick={clearCart}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 hover:underline text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'محي السلة' : 'Clear All'}</span>
                </button>
              </div>

              {cartItems.map(({ productId, quantity, product }) => {
                const title = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;
                const priceObj = formatPriceObject(product.discountPrice * quantity);
                const unitPriceObj = formatPriceObject(product.discountPrice);

                return (
                  <div 
                    key={productId}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#D4AF37]/40 transition-all flex gap-3 items-center group shadow-md"
                  >
                    {/* Thumbnail */}
                    <img 
                      src={product.image} 
                      alt={title}
                      onClick={() => {
                        openProductDetail(product);
                        closeCartModal();
                      }}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-700/60 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 
                        onClick={() => {
                          openProductDetail(product);
                          closeCartModal();
                        }}
                        className="text-xs font-bold text-slate-100 truncate hover:text-[#D4AF37] cursor-pointer transition-colors"
                      >
                        {title}
                      </h4>
                      <div className="text-[11px] text-amber-400 font-mono mt-0.5 font-semibold">
                        {priceObj.fullText}
                        {quantity > 1 && (
                          <span className="text-[10px] text-slate-400 font-normal mr-1.5 ltr:ml-1.5">
                            ({unitPriceObj.fullText} {language === 'ar' ? '/ للقطعة' : '/ each'})
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700 p-0.5">
                          <button
                            onClick={() => updateCartQuantity(productId, quantity - 1)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title={language === 'ar' ? 'إنقاص' : 'Decrease'}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(productId, quantity + 1)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title={language === 'ar' ? 'زيادة' : 'Increase'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Direct Amazon link */}
                        <a
                          href={getAffiliateUrl(product, 'amazon')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => logAffiliateClick(product.id, 'amazon')}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1 transition-colors"
                          title={t.buyOnAmazon}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Amazon</span>
                        </a>
                      </div>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeFromCart(productId)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title={language === 'ar' ? 'إزالة' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer / Summary */}
        {cartItems.length > 0 && (
          <div className="p-6 bg-[#18181B] border-t border-[#FDFCFB]/10 space-y-4">
            <div className="space-y-2 text-xs">
              {totalSavingsSar > 0 && (
                <div className="flex justify-between items-center text-emerald-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إجمالي التوفير في السلة' : 'Total Savings'}</span>
                  </span>
                  <span className="font-mono font-bold">-{formattedSavings.fullText}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-slate-300 text-sm font-bold pt-1 border-t border-slate-800">
                <span>{language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}</span>
                <span className="text-amber-400 font-mono text-base font-extrabold">{formattedTotal.fullText}</span>
              </div>
            </div>

            {/* Direct Purchase Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={cartItems[0] ? getAffiliateUrl(cartItems[0].product, 'amazon') : 'https://www.amazon.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  cartItems.forEach(i => logAffiliateClick(i.product.id, 'amazon'));
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all text-center"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'شراء منتجات السلة عبر Amazon' : 'Buy Cart via Amazon'}</span>
              </a>

              {cartItems.some(i => i.product.aliexpressUrl) && (
                <a
                  href={getAffiliateUrl(cartItems.find(i => i.product.aliexpressUrl)!.product, 'aliexpress')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    cartItems.forEach(i => logAffiliateClick(i.product.id, 'aliexpress'));
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{language === 'ar' ? 'شراء عبر AliExpress' : 'Buy via AliExpress'}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
