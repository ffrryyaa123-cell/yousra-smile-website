import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  X, 
  Mail, 
  CheckCircle2, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const PriceAlertModal: React.FC = () => {
  const { alertModalProduct, closePriceAlertModal, addPriceAlert, isSubscribedToAlert, language, formatPrice } = useApp();
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState<number>(() => alertModalProduct ? Math.round(alertModalProduct.discountPrice * 0.9) : 0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!alertModalProduct) return null;

  const title = language === 'en' ? (alertModalProduct.titleEn || alertModalProduct.titleAr) : alertModalProduct.titleAr;
  const isAlreadyAlerted = isSubscribedToAlert(alertModalProduct.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(language === 'en' ? 'Please enter a valid email address.' : 'الرجاء إدخال عنوان بريد إلكتروني صحيح.');
      return;
    }
    setError('');
    addPriceAlert(alertModalProduct, email, targetPrice);
    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError('');
    setEmail('');
    closePriceAlertModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg max-h-[92vh] bg-[#111113] border border-[#FDFCFB]/15 rounded-3xl shadow-2xl text-[#FDFCFB] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Decor Bar */}
        <div className="bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/40 to-[#D4AF37]/20 h-1.5 w-full shrink-0" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 ltr:left-auto ltr:right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable body — same fix as ThumbnailEditorModal: on a short
            browser window this content could run taller than the
            viewport, and a plain overflow-hidden wrapper would clip the
            bottom action button out of view with no way to reach it. */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-[#D4AF37] animate-bounce" />
            </div>
            <div>
              <div className="font-mono-meta text-xs text-[#D4AF37]">
                {language === 'en' ? 'PRICE DROP TRACKER' : 'تنبيهات الأسعار الذكية'}
              </div>
              <h3 className="font-serif-editorial text-2xl text-white">
                {language === 'en' ? 'Get Notified On Price Drop' : 'اشترك لتصلك تنبيهات انخفاض السعر'}
              </h3>
            </div>
          </div>

          {/* Product Summary Card */}
          <div className="flex items-center gap-4 bg-[#18181B] p-4 rounded-2xl border border-[#FDFCFB]/10">
            <img 
              src={alertModalProduct.image} 
              alt={title}
              referrerPolicy="no-referrer"
              className="w-16 h-16 object-cover rounded-xl border border-[#FDFCFB]/10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="font-mono-meta text-[10px] text-[#D4AF37] block">
                {alertModalProduct.brand.toUpperCase()}
              </span>
              <h4 className="font-medium text-sm text-white truncate">
                {title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-[#D4AF37]">
                  {formatPrice(alertModalProduct.discountPrice)}
                </span>
                {alertModalProduct.originalPrice > alertModalProduct.discountPrice && (
                  <span className="text-xs text-slate-500 line-through">
                    {formatPrice(alertModalProduct.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isSuccess ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-6 rounded-2xl text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif-editorial text-xl text-white">
                  {language === 'en' ? 'Alert Activated Successfully!' : 'تم تفعيل التنبيه بنجاح!'}
                </h4>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  {language === 'en' 
                    ? `We will email ${email} immediately when the price drops below ${targetPrice} ${alertModalProduct.currency}.`
                    : `سنقوم بإرسال إشعار فوري إلى ${email} بمجرد انخفاض السعر إلى أقل من ${targetPrice} ${alertModalProduct.currency}.`}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#F3E5AB] transition-colors"
                >
                  {language === 'en' ? 'Done' : 'موافق وإغلاق'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block font-mono-meta text-xs text-[#FDFCFB]/80">
                  {language === 'en' ? 'Your Email Address' : 'بريدك الإلكتروني لتلقي التنبيهات'}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute top-3.5 right-3.5 ltr:right-auto ltr:left-3.5 pointer-events-none" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full py-3 px-11 bg-[#18181B] border border-[#FDFCFB]/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              {/* Target Price Slider & Input */}
              <div className="space-y-2 bg-[#18181B] p-4 rounded-2xl border border-[#FDFCFB]/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono-meta text-slate-300">
                    {language === 'en' ? 'Alert When Price Reaches:' : 'تنبيهي عندما يصل السعر إلى:'}
                  </span>
                  <span className="font-bold text-[#D4AF37] text-sm">
                    {formatPrice(targetPrice)}
                  </span>
                </div>
                <input 
                  type="range"
                  min={Math.round(alertModalProduct.discountPrice * 0.5)}
                  max={alertModalProduct.discountPrice}
                  step={10}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono-meta text-slate-500">
                  <span>50% {language === 'en' ? 'Off' : 'خصم'}</span>
                  <span>{language === 'en' ? 'Current Price' : 'السعر الحالي'} ({formatPrice(alertModalProduct.discountPrice)})</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Guarantees */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 px-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'en'
                    ? '100% Free service • Instant Amazon & AliExpress price tracking'
                    : 'خدمة مجانية 100% • تتبع لحظي لأسعار أمازون وعلي إكسبريس بدون إزعاج'}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-black font-extrabold text-sm hover:opacity-95 transition-opacity shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell className="w-4 h-4 fill-black" />
                <span>
                  {language === 'en' ? 'Activate Price Alert' : 'تفعيل تنبيه انخفاض السعر'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
