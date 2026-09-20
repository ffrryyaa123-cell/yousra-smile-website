import React from 'react';
import { Flame, ArrowLeft, ArrowRight, Zap, BadgeCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FlashDealsTicker: React.FC = () => {
  const { language, setPage } = useApp();

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-red-950 to-purple-950 border-b border-amber-500/30 text-white py-2 px-3 sm:px-6 shadow-md dir-rtl font-['Cairo']">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black flex items-center gap-1 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>{language === 'ar' ? 'عروض حالية' : 'CURRENT DEALS'}</span>
          </span>
          <span className="text-white font-extrabold text-xs sm:text-sm">
            {language === 'ar'
              ? 'تصفّح الخصومات الحالية — السعر ومدة العرض يُؤخذان من مصدر المنتج'
              : 'Browse current discounts — price and deal duration come from the product source'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-300 font-bold">
          <BadgeCheck className="w-4 h-4" />
          <span>{language === 'ar' ? 'لا نعرض عدادًا إلا إذا توفر وقت انتهاء حقيقي' : 'No countdown unless a real end time is available'}</span>
        </div>

        <button
          onClick={() => setPage('deals')}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>{language === 'ar' ? 'تصفح العروض' : 'Browse Deals'}</span>
          {language === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
