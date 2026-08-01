import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Heart, 
  Scale, 
  Star, 
  PlaySquare, 
  ShoppingBag, 
  ExternalLink,
  Eye,
  CheckCircle2,
  Sparkles,
  Bell
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const { 
    favorites, 
    compareList, 
    toggleFavorite, 
    toggleCompare, 
    openProductDetail,
    openVideoModal,
    openPriceAlertModal,
    isSubscribedToAlert,
    logAffiliateClick,
    language,
    formatPrice,
    t
  } = useApp();

  const isFav = favorites.includes(product.id);
  const isCompared = compareList.includes(product.id);
  const isAlerted = isSubscribedToAlert(product.id);

  const displayTitle = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;
  const displayDesc = language === 'en' ? (product.descriptionEn || product.description) : product.description;

  const handleBuyAmazon = (e: React.MouseEvent) => {
    e.stopPropagation();
    logAffiliateClick(product.id, 'amazon');
    window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBuyAliExpress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.aliexpressUrl) {
      logAffiliateClick(product.id, 'aliexpress');
      window.open(product.aliexpressUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWatchVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.youtubeUrl || product.tiktokUrl || product.pinterestUrl) {
      openVideoModal({
        id: `vid-${product.id}`,
        productId: product.id,
        productTitle: displayTitle,
        productImage: product.image,
        platform: product.youtubeUrl ? 'youtube' : product.tiktokUrl ? 'tiktok' : 'pinterest',
        embedId: product.youtubeUrl ? 'dQw4w9WgXcQ' : '123456',
        videoUrl: product.youtubeUrl || product.tiktokUrl || product.pinterestUrl || '',
        title: language === 'en' ? `Yousra's Review for ${displayTitle}` : `مراجعة يسرى سمايل لـ ${displayTitle}`,
        views: language === 'en' ? 'Over 15K views' : 'أكثر من 15K مشاهدة',
        date: language === 'en' ? 'Latest video' : 'أحدث فيديو',
        duration: language === 'en' ? 'Available now' : 'متاح الآن'
      });
    } else {
      openProductDetail(product);
    }
  };

  if (layout === 'list') {
    return (
      <div 
        onClick={() => openProductDetail(product)}
        className="group bg-slate-900/90 rounded-2xl border border-slate-800 p-4 hover:shadow-2xl hover:border-purple-600 transition-all duration-300 flex flex-col sm:flex-row gap-5 cursor-pointer text-slate-100"
      >
        {/* Product Image */}
        <div className="relative w-full sm:w-56 h-48 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/50">
          <img 
            src={product.image} 
            alt={displayTitle}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 ease-out transform-gpu group-hover:scale-115"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          {product.discountPercent > 0 && (
            <span className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
              {t.discount} {product.discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              {t.yousraChoice}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-amber-300 bg-purple-950/80 border border-purple-800/60 px-2.5 py-0.5 rounded-md">
                {product.brand}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-slate-400 font-normal">({product.reviewCount})</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mb-2 font-['Tajawal']">
              {displayTitle}
            </h3>

            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              {displayDesc}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {product.features.slice(0, 2).map((feat, idx) => (
                <span key={idx} className="text-[11px] text-slate-300 flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {feat}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {/* Price section */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-400 font-['Tajawal']">
                {formatPrice(product.discountPrice)}
              </span>
              {product.originalPrice > product.discountPrice && (
                <span className="text-xs text-slate-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {(product.youtubeUrl || product.tiktokUrl || product.pinterestUrl) && (
                <button
                  onClick={handleWatchVideo}
                  className="px-3 py-1.5 rounded-xl bg-red-950/70 text-red-300 hover:bg-red-900 border border-red-800/60 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <PlaySquare className="w-4 h-4 text-red-400" />
                  {t.watchReview}
                </button>
              )}

              <button
                onClick={handleBuyAmazon}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                {t.buyNowAmazon}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => openProductDetail(product)}
      className="group bg-slate-900 rounded-2xl border border-slate-800/90 hover:border-purple-600/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative text-slate-100"
    >
      {/* Top Image Container */}
      <div className="relative w-full h-52 bg-slate-800 overflow-hidden border-b border-slate-800">
        <img 
          src={product.image} 
          alt={displayTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out transform-gpu group-hover:scale-115"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Overlay Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
          {product.discountPercent > 0 && (
            <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-md">
              {t.discount} {product.discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              {t.yousraChoice}
            </span>
          )}
        </div>

        {/* Top Left Floating Actions (Favorite, Compare & Price Alert) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all ${
              isFav 
                ? 'bg-red-500 text-white' 
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-red-400 border border-slate-700/60'
            }`}
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleCompare(product.id); }}
            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all ${
              isCompared 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-amber-400 border border-slate-700/60'
            }`}
            title={isCompared ? "إزالة من المقارنة" : "إضافة للمقارنة"}
          >
            <Scale className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); openPriceAlertModal(product); }}
            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all ${
              isAlerted 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-amber-400 border border-slate-700/60'
            }`}
            title={language === 'en' ? 'Set Price Alert' : 'تنبيه انخفاض السعر'}
          >
            <Bell className={`w-4 h-4 ${isAlerted ? 'fill-slate-950 animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Video Review Ribbon indicator */}
        {(product.youtubeUrl || product.tiktokUrl || product.pinterestUrl) && (
          <button
            onClick={handleWatchVideo}
            className="absolute bottom-3 right-3 bg-slate-950/85 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 transition-colors shadow-md border border-slate-700/50"
          >
            <PlaySquare className="w-3.5 h-3.5 text-red-400 hover:text-white" />
            {t.watchReview}
          </button>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-amber-300 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded-md">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 font-['Tajawal'] leading-snug">
            {displayTitle}
          </h3>
        </div>

        {/* Pricing & Affiliate Buy CTA */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-amber-400 font-['Tajawal']">
                {formatPrice(product.discountPrice)}
              </span>
            </div>

            {product.originalPrice > product.discountPrice && (
              <span className="text-xs text-slate-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleBuyAmazon}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all hover:shadow-md"
              title="رابط التسويق بالعمولة لأمازون"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {t.buyNowAmazon}
              <ExternalLink className="w-3 h-3 text-slate-950 opacity-70" />
            </button>

            {product.aliexpressUrl ? (
              <button
                onClick={handleBuyAliExpress}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all hover:shadow-md"
                title="رابط التسويق بالعمولة لعلي إكسبريس"
              >
                {t.buyNowAliExpress}
                <ExternalLink className="w-3 h-3 text-white opacity-70" />
              </button>
            ) : (
              <button
                onClick={() => openProductDetail(product)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5" />
                {t.details}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
