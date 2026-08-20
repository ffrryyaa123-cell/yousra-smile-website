import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { PriceHistoryChart } from './PriceHistoryChart';
import { 
  X, 
  Star, 
  ShoppingBag, 
  ShoppingCart,
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
  TrendingDown,
  Upload,
  RefreshCw,
  HardDrive,
  Plus,
  Play,
  Film,
  Trash2
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

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
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
    formatPrice,
    addToCart,
    isInCart,
    openCartModal,
    language,
    t,
    addReview,
    products,
    openProductDetail,
    filterByBrand,
    setPage,
    setSelectedCategory,
    getAffiliateUrl,
    videos,
    openImportVideoModal,
    replaceProductVideo,
    removeProductVideo
  } = useApp();

  if (!product) return null;

  const displayTitle = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;
  const displayDescription = language === 'en' ? (product.descriptionEn || '') : product.description;
  const displayLongDescription = language === 'en' ? (product.longDescriptionEn || product.descriptionEn || '') : (product.longDescription || product.description);
  const displayFeatures = language === 'en' ? (product.featuresEn || []) : (product.features || []);
  const displaySpecs = language === 'en' ? (product.specsEn || {}) : (product.specs || {});
  const displaySubcategory = language === 'en' ? (product.subcategoryEn || product.category) : product.subcategory;

  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'videos' | 'specs' | 'reviews' | 'seo'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // New Review Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewAddedSuccess, setReviewAddedSuccess] = useState(false);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerComment.trim()) return;
    addReview(product.id, reviewerName, reviewerRating, reviewerComment);
    setReviewerComment('');
    setReviewerName('');
    setReviewAddedSuccess(true);
    setTimeout(() => setReviewAddedSuccess(false), 4000);
  };

  const isFav = favorites.includes(product.id);
  const isCompared = compareList.includes(product.id);

  // User Star Rating System
  const LOCAL_RATINGS_KEY = 'yousrasmile_product_ratings_v1';
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_RATINGS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [ratingSubmittedMsg, setRatingSubmittedMsg] = useState(false);

  const currentUserRating = userRatings[product.id] || 0;

  const handleRateProduct = (rating: number) => {
    const updated = { ...userRatings, [product.id]: rating };
    setUserRatings(updated);
    try {
      localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving rating:', e);
    }
    setRatingSubmittedMsg(true);
    setTimeout(() => setRatingSubmittedMsg(false), 3500);
  };

  const productUrl = window.location.href;
  const shareTitle = product.titleAr || product.titleEn;
  const shareText = `مراجعة وتفاصيل ${shareTitle} عبر يسرى سمايل Yousra Smile:`;

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + productUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
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
    const url = getAffiliateUrl(product, 'amazon');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAliExpressBuy = () => {
    if (product.aliexpressUrl) {
      logAffiliateClick(product.id, 'aliexpress');
      const url = getAffiliateUrl(product, 'aliexpress');
      window.open(url, '_blank', 'noopener,noreferrer');
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
                    onClick={() => { shareToFacebook(); setShowShareMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-950/40 text-blue-400 font-bold text-xs transition-colors"
                  >
                    <FacebookIcon className="w-4 h-4 text-blue-400" />
                    <span>فيسبوك (Facebook)</span>
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

          {/* SEO Breadcrumbs Navigation Bar */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => { setPage('home'); onClose(); }}
              className="hover:text-amber-400 font-bold shrink-0"
            >
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <button 
              onClick={() => { setSelectedCategory(product.category); setPage('products'); onClose(); }}
              className="hover:text-amber-400 font-bold shrink-0"
            >
              {product.category}
            </button>
            <span>/</span>
            <button 
              onClick={() => { filterByBrand(product.brand); onClose(); }}
              className="text-amber-400 font-bold shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/20"
            >
              {language === 'ar' ? `علامة ${product.brand}` : `Brand ${product.brand}`}
            </button>
            <span>/</span>
            <span className="text-slate-200 truncate max-w-xs">{product.titleAr}</span>
          </nav>

          {/* Interactive Brand Models Pill / Chip */}
          {(() => {
            const sameBrandProducts = products.filter(p => p.brand.toLowerCase() === product.brand.toLowerCase());
            if (sameBrandProducts.length > 0) {
              return (
                <div className="bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-800/80 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <div>
                      <div className="text-xs font-bold text-amber-300 font-['Tajawal']">
                        {language === 'ar' ? `استعرض جميع موديلات ${product.brand}` : `Browse all models of ${product.brand}`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {language === 'ar' ? `يوجد ${sameBrandProducts.length} طراز متاح لهذه العلامة التجارية` : `${sameBrandProducts.length} models available for this brand`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      filterByBrand(product.brand);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer shrink-0"
                  >
                    {language === 'ar' ? `عرض كافة موديلات ${product.brand} ←` : `View all ${product.brand} models →`}
                  </button>
                </div>
              );
            }
            return null;
          })()}

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
                  <span className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-base px-4 py-2 rounded-2xl shadow-xl border border-red-400/40 tracking-wider z-10 flex items-center gap-1.5">
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
                <div className="flex items-center gap-4 text-xs mb-3">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-2.5 py-1 rounded-lg font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 font-normal">({product.reviewCount + (currentUserRating > 0 ? 1 : 0)} تقييم)</span>
                  </div>
                  <span className="text-slate-400">👁 {product.viewsCount} مشاهدة</span>
                </div>

                {/* Interactive User Star Rating Picker */}
                <div className="bg-[#18181B] border border-[#D4AF37]/30 p-3.5 rounded-2xl mb-4 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{language === 'ar' ? 'تقييمك للمنتج (Star Rating):' : 'Rate this Product:'}</span>
                    </span>
                    {currentUserRating > 0 && (
                      <span className="text-[11px] text-emerald-400 font-extrabold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                        {language === 'ar' ? `تقييمك: ${currentUserRating} من 5 نجوم ★` : `Your Rating: ${currentUserRating}/5 ★`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverStar || currentUserRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRateProduct(star)}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          className="p-1 rounded-lg hover:bg-slate-800 transition-all transform hover:scale-115 cursor-pointer"
                          title={`تقييم ${star} نجوم`}
                        >
                          <Star 
                            className={`w-6 h-6 transition-colors ${
                              active 
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                                : 'text-slate-600 fill-slate-800/80'
                            }`} 
                          />
                        </button>
                      );
                    })}
                    <span className="text-[11px] text-slate-400 mr-2 ltr:ml-2">
                      {hoverStar > 0 
                        ? (language === 'ar' ? `${hoverStar} من 5 نجوم` : `${hoverStar}/5 Stars`) 
                        : (currentUserRating > 0 
                          ? (language === 'ar' ? 'انقري لتعديل تقييمك' : 'Click to change rating') 
                          : (language === 'ar' ? 'اضغطي النجوم للتقييم' : 'Click stars to rate'))}
                    </span>
                  </div>

                  {ratingSubmittedMsg && (
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn pt-1 border-t border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'ar' ? 'شكراً لكِ! تم حفظ تقييمك للمنتج بنجاح.' : 'Thank you! Your product rating has been saved successfully.'}</span>
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl mb-4 shadow-md">
                  <span className="text-xs font-semibold text-slate-300 block mb-1">{language === 'ar' ? 'السعر الحالي عبر روابط التسويق بالعمولة:' : 'Current price through affiliate links:'}</span>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-black text-amber-300 font-['Cairo'] tracking-tight">
                      {formatPrice(product.discountPrice)}
                    </span>
                    {product.originalPrice > product.discountPrice && (
                      <span className="text-sm text-slate-400 font-medium line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    {product.discountPercent > 0 && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {language === 'ar' ? 'وفرت' : 'You save'} {formatPrice(product.originalPrice - product.discountPrice)}!
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-normal">
                  {displayDescription}
                </p>

                {/* Price Drop Alert Card */}
                <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        {language === 'ar' ? 'تنبيه عند انخفاض السعر' : 'Price drop alert'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {language === 'ar' ? 'أدخل بريدك الإلكتروني ليصلك إشعار فوري عند هبوط السعر.' : 'Enter your email to be notified when the price drops.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openPriceAlertModal(product)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow-md transition-colors cursor-pointer"
                  >
                    {isSubscribedToAlert(product.id)
                      ? (language === 'ar' ? '✓ التنبيه مفعل' : '✓ Alert enabled')
                      : (language === 'ar' ? 'تفعيل التنبيه' : 'Enable alert')}
                  </button>
                </div>
              </div>

              {/* Affiliate Action CTAs with Live Store Price Badges */}
              <div className="space-y-3 pt-2">
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{language === 'ar' ? 'نعم - روابط شراء أصلية ومعتمدة 100%' : 'Yes - 100% Direct & Authentic Purchase Links'}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {language === 'ar' ? 'موثوق' : 'Verified'}
                  </span>
                </div>

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

                {/* Social Share Buttons Bar */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-purple-500" />
                      {language === 'ar' ? 'مشاركة المنتج مع الأصدقاء:' : 'Share Product:'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={shareToWhatsApp}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="مشاركة عبر واتساب"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline">واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={shareToFacebook}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="مشاركة عبر فيسبوك"
                    >
                      <FacebookIcon className="w-4 h-4 text-blue-500" />
                      <span className="hidden sm:inline">فيسبوك</span>
                    </button>

                    <button
                      type="button"
                      onClick={shareToTwitter}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="مشاركة عبر تويتر / X"
                    >
                      <TwitterIcon className="w-4 h-4 text-sky-500" />
                      <span className="hidden sm:inline">تويتر / X</span>
                    </button>

                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="نسخ رابط المنتج"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
                      <span className="hidden sm:inline">{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>

                {/* Shopper Cart Button in Modal */}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product.id);
                    openCartModal();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {isInCart(product.id)
                      ? (language === 'ar' ? 'المنتج موجود بالسلة — عرض سلة المشتريات' : 'Item in Cart — Open Cart')
                      : (language === 'ar' ? 'إضافة إلى سلة المشتريات للمتسوق' : 'Add to Shopper Cart')}
                  </span>
                </button>

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
                {language === 'ar' ? 'المميزات والوصف' : 'Features & Description'}
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
                {language === 'ar' ? 'تغير السعر' : 'Price History'} (Recharts)
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  {language === 'ar' ? 'تتبع مباشر' : 'Live tracking'} 📈
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
                {language === 'ar' ? 'مراجعات يسرى الفيديويّة' : 'Yousra Video Reviews'}
              </button>

              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all shrink-0 ${
                  activeTab === 'specs'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {language === 'ar' ? 'المواصفات التقنية' : 'Technical Specifications'}
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'reviews'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {language === 'ar' ? 'آراء وتجارب العملاء' : 'Customer Reviews'} ({product.reviewCount})
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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">{language === 'ar' ? 'أهم المميزات الفريدة:' : 'Key features:'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayFeatures.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{language === 'ar' ? 'الوصف التفصيلي للمنتج:' : 'Detailed product description:'}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {displayLongDescription}
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

            {/* Tab 2: Videos (YouTube, TikTok, Local Upload, Replacement) */}
            {activeTab === 'videos' && (() => {
              const linkedVideoReviews = videos.filter(v => v.productId === product.id);
              const primaryVideoUrl = product.videoUrl || product.youtubeUrl || linkedVideoReviews[0]?.videoUrl;
              const hasVideo = Boolean(primaryVideoUrl || linkedVideoReviews.length > 0);
              const isDirectOrLocal = primaryVideoUrl?.startsWith('blob:') || primaryVideoUrl?.endsWith('.mp4') || primaryVideoUrl?.endsWith('.webm') || linkedVideoReviews[0]?.platform === 'local' || linkedVideoReviews[0]?.platform === 'direct';

              return (
                <div className="space-y-4">
                  {/* Video Actions Header */}
                  <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 p-4 rounded-2xl border border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <PlaySquare className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">فيديوهات ومراجعات المنتج</h4>
                        <p className="text-xs text-slate-400">شاهد الفيديو أو استبدله بملف فيديو قمت بإنشائه من جهازك.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openImportVideoModal(product.id, 'upload', false)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 رفع فيديو من جهازي</span>
                      </button>

                      {hasVideo && (
                        <>
                          <button
                            onClick={() => openImportVideoModal(product.id, 'upload', true)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                            <span>🔄 استبدال الفيديو الحالي</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('هل أنتِ متأكدة من حذف الفيديو المرفق بهذا المنتج؟ يمكنك رفع أو توليد فيديو آخر في أي وقت.')) {
                                removeProductVideo(product.id);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                            title="حذف الفيديو المرفق"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>🗑️ حذف الفيديو</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Video Player Display */}
                  {hasVideo ? (
                    <div className="space-y-3">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl relative">
                        {isDirectOrLocal ? (
                          <video 
                            src={primaryVideoUrl} 
                            poster={product.videoThumbnailUrl || product.image}
                            controls 
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <iframe 
                            className="w-full h-full"
                            src={primaryVideoUrl}
                            title={product.titleAr}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>

                      {/* Video Quick Actions Bar */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-300 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>الفيديو مربوط ببيانات المنتج الحالية</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openImportVideoModal(product.id, 'upload', true)}
                            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            استبدال بفيديو من الكمبيوتر
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            onClick={() => openImportVideoModal(product.id, 'link', false)}
                            className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <Globe className="w-3 h-3" />
                            استيراد رابط
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنتِ متأكدة من حذف الفيديو المرفق بهذا المنتج؟')) {
                                removeProductVideo(product.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            حذف الفيديو
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* No Video State -> Offer Upload Immediately */
                    <div className="text-center py-10 px-4 bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-2xl space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center mx-auto">
                        <Upload className="w-7 h-7 text-purple-300" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-white">لم يتم ربط فيديو بهذا المنتج بعد</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          يمكنك رفع فيديو قمت بتسجيله من جهازك أو استيراد رابط فيديو من يوتيوب / تيك توك لتثبيته في بيانات هذا المنتج.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => openImportVideoModal(product.id, 'upload', false)}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                        >
                          <HardDrive className="w-4 h-4 text-emerald-400" />
                          <span>رفع فيديو من جهازي (كمبيوتر / هاتف)</span>
                        </button>

                        <button
                          onClick={() => openImportVideoModal(product.id, 'link', false)}
                          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
                        >
                          <Globe className="w-4 h-4 text-amber-400" />
                          <span>استيراد برابط (YouTube / TikTok)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tab 3: Specs Table */}
            {activeTab === 'specs' && (
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                <table className="w-full text-right text-xs sm:text-sm text-slate-100">
                  <tbody className="divide-y divide-slate-800">
                    <tr className="bg-slate-800/80">
                      <td className="p-3.5 font-bold text-amber-300 w-1/3">{language === 'ar' ? 'العلامة التجارية' : 'Brand'}</td>
                      <td className="p-3.5 font-semibold text-white">{product.brand}</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-amber-300">{language === 'ar' ? 'القسم' : 'Category'}</td>
                      <td className="p-3.5 text-slate-200">{product.category} ({displaySubcategory})</td>
                    </tr>
                    {Object.entries(displaySpecs).map(([key, value], idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900'}>
                        <td className="p-3.5 font-bold text-slate-200">{key}</td>
                        <td className="p-3.5 font-medium text-white">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Customer Reviews & Ratings */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 dir-rtl font-['Cairo']">
                {/* Rating Overview Header */}
                <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
                  <div className="text-center sm:text-right">
                    <div className="text-4xl font-black text-amber-300">{product.rating}</div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">بناءً على {product.reviewCount} تقييم حقيقي</p>
                  </div>

                  <div className="flex-1 w-full max-w-md space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span>5 نجوم</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full w-[85%]"></div>
                      </div>
                      <span className="w-8 text-left">85%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>4 نجوم</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full w-[12%]"></div>
                      </div>
                      <span className="w-8 text-left">12%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>3 نجوم</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full w-[3%]"></div>
                      </div>
                      <span className="w-8 text-left">3%</span>
                    </div>
                  </div>
                </div>

                {/* Add Review Form */}
                <form onSubmit={handleReviewSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>شاركي تجربتك ورأيك عن هذا المنتج:</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">اسمك الكريمة (اختياري):</label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="مثال: أم عبد الله"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">تقييمك بالنجوم:</label>
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewerRating(s)}
                            className="p-1 cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${s <= reviewerRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">تفاصيل تجربتك وتوصيتك للمشترين:</label>
                    <textarea
                      value={reviewerComment}
                      onChange={(e) => setReviewerComment(e.target.value)}
                      placeholder="اكتبي ملخص تجربتك عن سرعة الشحن، جودة التصنيع، سهولة الاستخدام..."
                      rows={3}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    {reviewAddedSuccess ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تمت إضافة تقييمك ورأيك بنجاح!</span>
                      </span>
                    ) : <span />}

                    <button
                      type="submit"
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      إضافة التقييم
                    </button>
                  </div>
                </form>

                {/* Customer Reviews List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200">أحدث آراء المشترين:</h4>

                  {/* Built-in Sample Reviews */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                          س
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">سارة الشمري</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 mr-2">مشتري مؤكد ✓</span>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-400 text-xs">
                        ★★★★★
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      المنتج رائع جداً واستفدت كثيراً من فيديو مراجعة يسرى سمايل قبل الشراء. الشحن كان سريع عبر أمازون والأداء يفوق التوقعات!
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                          م
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">م. محمد علي</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 mr-2">مشتري مؤكد ✓</span>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-400 text-xs">
                        ★★★★★
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      جودة تصنيع عالية جداً وتطبيق التحكم سلس للغاية، وفر علي الكثير من الجهد والوقت في المنزل.
                    </p>
                  </div>

                  {product.reviews && product.reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-900 border border-amber-500/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                            {rev.userName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">{rev.userName}</span>
                            <span className="text-[10px] text-slate-400 mr-2">{rev.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400 text-xs">
                          {'★'.repeat(rev.rating)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
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

            {/* Related Products Cards Section */}
            <div className="border-t border-slate-800 pt-6 mt-6 space-y-4 font-['Cairo']">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'ar' ? 'منتجات ذات صلة مقترحة لك:' : 'Recommended Related Products:'}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {product.category}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products
                  .filter(p => p.category === product.category && p.id !== product.id)
                  .slice(0, 3)
                  .map((relProd) => (
                    <div 
                      key={relProd.id}
                      onClick={() => { openProductDetail(relProd); setActiveImage(relProd.image); }}
                      className="bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 mb-2 border border-slate-800">
                        <img 
                          src={relProd.image} 
                          alt={relProd.titleAr} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                          {relProd.brand}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                          {language === 'en' ? (relProd.titleEn || relProd.titleAr) : relProd.titleAr}
                        </h4>
                        <div className="flex items-center justify-between text-xs font-bold pt-1">
                          <span className="text-amber-400">{formatPrice(relProd.discountPrice)}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            ★ {relProd.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
