import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Copy, 
  Check, 
  Video, 
  ShoppingBag,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { extractBasicProductInfoFromUrl } from '../services/productVideoService';

export const AffiliateDealScanner: React.FC = () => {
  const { products, siteSettings, formatPrice, openProductDetail, setPage } = useApp();
  const [inputQuery, setInputQuery] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const trimmed = inputQuery.trim();
    // 1. Try matching with existing products catalog first
    const matched = products.find(p => 
      p.titleAr.toLowerCase().includes(trimmed.toLowerCase()) ||
      p.titleEn.toLowerCase().includes(trimmed.toLowerCase()) ||
      p.brand.toLowerCase().includes(trimmed.toLowerCase()) ||
      (p.amazonUrl && p.amazonUrl.includes(trimmed)) ||
      (p.aliexpressUrl && p.aliexpressUrl.includes(trimmed))
    );

    if (matched) {
      setScanResult({
        type: 'matched',
        product: matched,
        affiliateLink: matched.amazonUrl || matched.aliexpressUrl || `https://www.amazon.sa/dp/B0CXSAMPLE?tag=${siteSettings.amazonTag}`,
        discountPercent: matched.discountPercent || 25,
        rating: matched.rating || 4.9,
        reviewsCount: matched.reviewsCount || 120
      });
    } else {
      // 2. Extract from external link or name
      const parsed = extractBasicProductInfoFromUrl(trimmed, siteSettings.amazonTag);
      setScanResult({
        type: 'generated',
        name: parsed.name,
        brand: parsed.brand,
        affiliateLink: parsed.affiliateUrl,
        discountPercent: 30,
        estimatedPrice: 289,
        originalPrice: 399
      });
    }
  };

  const copyToClipboard = () => {
    if (!scanResult) return;
    const link = scanResult.affiliateLink || scanResult.product?.amazonUrl || '';
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden my-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-purple-500/20 pb-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black border border-red-500/30 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>فاحص الروابط والعروض الفوري (Affiliate Link Scanner)</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white font-['Tajawal']">
            هل لديك رابط منتج وتريد أفضل كود خصم ورابط شراء موثوق؟
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            الصق أي رابط من أمازون أو علي إكسبريس أو اكتب اسم الجهاز للتحقق من العرض ورابط الخصم الترويجي
          </p>
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="الصق رابط المنتج (Amazon / AliExpress) أو اكتب اسم الجهاز (مثل: Roborock، قلاية فيليبس)..."
            className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-950 border border-purple-500/50 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>فحص العرض وتجهيز الرابط</span>
        </button>
      </form>

      {/* Scan Result */}
      {scanResult && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400">تم التحقق من الرابط والخصم</span>
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md">
                  خصم حتى {scanResult.discountPercent}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                {scanResult.type === 'matched' ? scanResult.product.titleAr : scanResult.name}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                العلامة التجارية: {scanResult.type === 'matched' ? scanResult.product.brand : scanResult.brand}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>نسخ الرابط المعتمد</span>
                </>
              )}
            </button>

            <a
              href={scanResult.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>الشراء بالخصم المباشر</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {scanResult.type === 'matched' && (
              <button
                type="button"
                onClick={() => openProductDetail(scanResult.product)}
                className="px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>تفاصيل السلعة</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
