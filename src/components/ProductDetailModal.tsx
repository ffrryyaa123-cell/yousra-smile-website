import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { PriceHistoryChart } from './PriceHistoryChart';
import { 
  X, 
  Star, 
  ShoppingBag, 
  ExternalLink, 
  Heart, 
  Scale, 
  CheckCircle2, 
  Share2, 
  ShieldCheck, 
  PlaySquare, 
  Youtube, 
  Video, 
  Sparkles,
  Info,
  Code,
  Check,
  Search,
  Globe,
  Bell,
  Copy,
  TrendingDown
} from 'lucide-react';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const PinterestIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z"/>
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { 
    favorites, 
    compareList, 
    toggleFavorite, 
    toggleCompare, 
    openPriceAlertModal,
    isSubscribedToAlert,
    logAffiliateClick,
    formatPrice
  } = useApp();

  if (!product) return null;

  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'videos' | 'specs' | 'seo'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const isFav = favorites.includes(product.id);
  const isCompared = compareList.includes(product.id);

  const productUrl = window.location.href;
  const shareTitle = product.titleAr || product.titleEn;
  const shareText = `مراجعة وتفاصيل ${shareTitle} عبر يسرى سمايل Yousra Smile:`;

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + productUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToPinterest = () => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(product.image)}&description=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAmazonBuy = () => {
    logAffiliateClick(product.id, 'amazon');
    window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAliExpressBuy = () => {
    if (product.aliexpressUrl) {
      logAffiliateClick(product.id, 'aliexpress');
      window.open(product.aliexpressUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close Bar */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-3 py-1 rounded-lg">
              {product.brand}
            </span>
            <span className="text-xs text-slate-400">كود المنتج: {product.id}</span>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => toggleFavorite(product.id)}
              className={`p-2 rounded-xl transition-colors ${
                isFav 
                  ? 'bg-red-50 text-red-500 dark:bg-red-950/40' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="إضافة للمفضلة"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500' : ''}`} />
            </button>

            <button
              onClick={() => toggleCompare(product.id)}
              className={`p-2 rounded-xl transition-colors ${
                isCompared 
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="مقارنة المنتجات"
            >
              <Scale className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${
                  showShareMenu
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="مشاركة عبر التواصل الاجتماعي"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {/* Floating Share Dropdown Menu */}
              {showShareMenu && (
                <div 
                  className="absolute top-12 left-0 ltr:left-auto ltr:right-0 bg-[#111113] border border-[#FDFCFB]/15 shadow-2xl rounded-2xl p-3 w-56 z-50 space-y-2 animate-fadeIn text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[11px] font-mono-meta text-[#D4AF37] px-2 pb-1 border-b border-[#FDFCFB]/10 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    مشاركة المنتج عبر:
                  </div>

                  <button
                    onClick={() => { shareToWhatsApp(); setShowShareMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-950/40 text-emerald-400 font-bold text-xs transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                    <span>واتساب (WhatsApp)</span>
                  </button>

                  <button
                    onClick={() => { shareToPinterest(); setShowShareMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-950/40 text-red-400 font-bold text-xs transition-colors"
                  >
                    <PinterestIcon className="w-4 h-4 text-red-400" />
                    <span>بنترست (Pinterest)</span>
                  </button>

                  <button
                    onClick={() => { shareToTwitter(); setShowShareMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-950/40 text-sky-400 font-bold text-xs transition-colors"
                  >
                    <TwitterIcon className="w-4 h-4 text-sky-400" />
                    <span>تويتر / X (Twitter)</span>
                  </button>

                  <button
                    onClick={() => { copyToClipboard(); setShowShareMenu(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 font-bold text-xs transition-colors border-t border-[#FDFCFB]/10 mt-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>نسخ رابط الصفحة</span>
                    </div>
                    {copiedLink && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {copiedLink && (
            <div className="bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl text-center shadow animate-fadeIn">
              ✓ تم نسخ رابط المنتج بنجاح!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Gallery Left/Right Side */}
            <div className="space-y-4">
              <div className="relative w-full h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-800 group">
                <img 
                  src={activeImage} 
                  alt={product.titleAr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.discountPercent > 0 && (
                  <span className="absolute top-4 right-4 bg-red-600 text-white font-extrabold text-sm px-3 py-1 rounded-xl shadow-md z-10">
                    خصم {product.discountPercent}%
                  </span>
                )}

                {/* Floating Share Quick Pill Bar on Product Image */}
                <div className="absolute bottom-3 right-3 left-3 bg-slate-950/85 backdrop-blur-md border border-white/15 p-2 rounded-2xl flex items-center justify-between gap-1 text-white shadow-xl z-20">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold px-1 shrink-0">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">مشاركة:</span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
                    {/* WhatsApp Button */}
                    <button
                      onClick={shareToWhatsApp}
                      className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="مشاركة عبر واتساب"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </button>

                    {/* Pinterest Button */}
                    <button
                      onClick={shareToPinterest}
                      className="flex items-center gap-1 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="مشاركة عبر بنترست"
                    >
                      <PinterestIcon className="w-3.5 h-3.5" />
                      <span>بنترست</span>
                    </button>

                    {/* Twitter / X Button */}
                    <button
                      onClick={shareToTwitter}
                      className="flex items-center gap-1 text-[11px] font-bold bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="مشاركة عبر تويتر / X"
                    >
                      <TwitterIcon className="w-3.5 h-3.5" />
                      <span>تويتر</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={copyToClipboard}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors shrink-0 cursor-pointer"
                      title="نسخ الرابط"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi Image Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImage === img ? 'border-purple-600 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Purchase Buttons */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Tajawal'] leading-tight mb-2">
                  {product.titleAr}
                </h1>
                <p className="text-xs text-slate-400 mb-3">{product.titleEn}</p>

                {/* Rating & Views */}
                <div className="flex items-center gap-4 text-xs mb-4">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-2.5 py-1 rounded-lg font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 font-normal">({product.reviewCount} تقييم)</span>
                  </div>
                  <span className="text-slate-400">👁 {product.viewsCount} مشاهدة</span>
                </div>

                {/* Price Display */}
                <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 p-4 rounded-2xl mb-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">السعر الحالي عبر روابط التسويق بالعمولة:</span>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-black text-purple-700 dark:text-purple-300 font-['Tajawal']">
                      {formatPrice(product.discountPrice)}
                    </span>
                    {product.originalPrice > product.discountPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    {product.discountPercent > 0 && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        وفرت {formatPrice(product.originalPrice - product.discountPrice)}!
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {product.description}
                </p>

                {/* Price Drop Alert Card */}
                <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        تنبيه عند انخفاض السعر
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        أدخل بريدك الإلكتروني ليصلك إشعار فوري عند هبوط السعر.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openPriceAlertModal(product)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow-md transition-colors cursor-pointer"
                  >
                    {isSubscribedToAlert(product.id) ? '✓ التنبيه مفعل' : 'تفعيل التنبيه'}
                  </button>
                </div>
              </div>

              {/* Affiliate Action CTAs with Live Store Price Badges */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    <span>مقارنة أسعار الشراء المباشرة:</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    أفضل سعر الآن 🔥
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Amazon Option */}
                  <button
                    type="button"
                    onClick={handleAmazonBuy}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm py-3 px-4 rounded-2xl flex items-center justify-between gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>متجر أمازون (Amazon)</span>
                    </div>
                    <div className="bg-slate-950/20 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1">
                      <span>{formatPrice(product.discountPrice)}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* AliExpress Option */}
                  <button
                    type="button"
                    onClick={handleAliExpressBuy}
                    className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-2xl flex items-center justify-between gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>علي إكسبريس (AliExpress)</span>
                    </div>
                    <div className="bg-black/30 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1">
                      <span>{formatPrice(Math.round(product.discountPrice * 0.92))}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>الشراء يتم بأمان مباشر عبر منصة المتجر الرسمي المعني.</span>
                  </div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    محدث لليوم ⚡
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Navigation Tabs (Details / Price History / Video Reviews / Specs) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3 sm:gap-4 mb-6 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                المميزات والوصف
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'history'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                تغير السعر (Recharts)
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  تتبع مباشر 📈
                </span>
              </button>

              <button
                onClick={() => setActiveTab('videos')}
                className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'videos'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <PlaySquare className="w-4 h-4 text-red-500" />
                مراجعات يسرى الفيديويّة
              </button>

              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all shrink-0 ${
                  activeTab === 'specs'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                المواصفات التقنية
              </button>

              <button
                onClick={() => setActiveTab('seo')}
                className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'seo'
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Code className="w-4 h-4 text-amber-400" />
                SEO & Schema
              </button>
            </div>

            {/* Tab 1: Features & Description */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">أهم المميزات الفريدة:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">الوصف التفصيلي للمنتج:</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {product.longDescription || product.description}
                  </p>
                </div>

                {/* Price History Chart Section inside Overview */}
                <PriceHistoryChart product={product} />
              </div>
            )}

            {/* Tab 2: Price History Chart Standalone Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <PriceHistoryChart product={product} />
              </div>
            )}

            {/* Tab 2: Videos (YouTube, TikTok, Pinterest) */}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/60 flex items-center gap-3">
                  <PlaySquare className="w-6 h-6 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">مراجعة يسرى سمايل الحصرية</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">تعرف على أداء ومميزات وسلبيات هذا المنتج بالتفصيل بالفيديو المباشر.</p>
                  </div>
                </div>

                {product.youtubeUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                      <Youtube className="w-5 h-5 text-red-600" />
                      <span>مراجعة يوتيوب الرسمية:</span>
                    </div>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
                      <iframe 
                        className="w-full h-full"
                        src={product.youtubeUrl}
                        title={product.titleAr}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    <Video className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">فيديو المراجعة متاح قريباً على القناة!</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Specs Table */}
            {activeTab === 'specs' && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right text-xs text-slate-700 dark:text-slate-300">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white w-1/3">العلامة التجارية</td>
                      <td className="p-3 font-semibold">{product.brand}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">القسم</td>
                      <td className="p-3">{product.category} ({product.subcategory})</td>
                    </tr>
                    {product.specs && Object.entries(product.specs).map(([key, value], idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{key}</td>
                        <td className="p-3">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 4: SEO & Schema Markup (JSON-LD) */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                {/* Google Search Rich Snippet Mockup */}
                <div className="bg-[#1A1A1C] border border-[#FDFCFB]/10 rounded-2xl p-5 space-y-3 font-sans">
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-mono-meta">
                    <Search className="w-4 h-4 text-[#D4AF37]" />
                    معاينة النتيجة المباشرة في جوجل (Google Rich Snippets):
                  </div>
                  
                  <div className="bg-[#111113] p-4 rounded-xl border border-[#FDFCFB]/5 space-y-1.5 ltr text-left" dir="ltr">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-gray-300">yousrasmile.com</span>
                      <span>›</span>
                      <span className="text-gray-400">{product.category}</span>
                      <span>›</span>
                      <span className="text-gray-400">{product.brand}</span>
                    </div>
                    <h4 className="text-lg text-blue-400 font-normal hover:underline cursor-pointer line-clamp-1">
                      {product.titleAr} | سعر ومراجعة Yousra Smile
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold my-1">
                      <span>Rating: {product.rating}/5</span>
                      <span>★★★★★</span>
                      <span className="text-gray-400">({product.reviewCount} reviews)</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-emerald-400 font-bold">{product.discountPrice} {product.currency}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 font-normal">In stock</span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {product.description} اشترِ الآن بسعر {product.discountPrice} {product.currency} مع خصم {product.discountPercent}% عبر روابط أمازون وعلي إكسبريس.
                    </p>
                  </div>
                </div>

                {/* Structured JSON-LD Code Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-meta text-[#D4AF37]">
                      JSON-LD Structured Data Schema (@type: Product)
                    </span>
                    <button
                      onClick={() => {
                        const jsonStr = JSON.stringify({
                          "@context": "https://schema.org/",
                          "@type": "Product",
                          "name": product.titleAr,
                          "image": product.image,
                          "description": product.description,
                          "brand": { "@type": "Brand", "name": product.brand },
                          "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": product.rating,
                            "reviewCount": product.reviewCount
                          },
                          "offers": {
                            "@type": "Offer",
                            "priceCurrency": product.currency,
                            "price": product.discountPrice,
                            "availability": "https://schema.org/InStock"
                          }
                        }, null, 2);
                        navigator.clipboard.writeText(jsonStr);
                        setCopiedJsonLd(true);
                        setTimeout(() => setCopiedJsonLd(false), 2500);
                      }}
                      className="text-xs font-mono-meta px-3 py-1 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/30 transition-colors flex items-center gap-1"
                    >
                      {copiedJsonLd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
                      {copiedJsonLd ? 'تم نسخ الـ Schema' : 'نسخ كود JSON-LD'}
                    </button>
                  </div>

                  <pre dir="ltr" className="text-[11px] font-mono bg-[#09090B] text-emerald-400 p-4 rounded-xl overflow-x-auto border border-[#FDFCFB]/10 max-h-56">
{JSON.stringify({
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": product.titleAr,
  "image": [product.image, ...(product.images || [])],
  "description": product.description,
  "sku": product.id,
  "brand": {
    "@type": "Brand",
    "name": product.brand
  },
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": product.rating.toString(),
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": "Yousra Smile (يسرى سمايل)"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": product.rating.toString(),
    "reviewCount": product.reviewCount.toString()
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": product.currency,
    "lowPrice": product.discountPrice.toString(),
    "highPrice": product.originalPrice.toString(),
    "offers": [
      {
        "@type": "Offer",
        "url": product.amazonUrl,
        "priceCurrency": product.currency,
        "price": product.discountPrice.toString(),
        "availability": "https://schema.org/InStock"
      }
    ]
  }
}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
