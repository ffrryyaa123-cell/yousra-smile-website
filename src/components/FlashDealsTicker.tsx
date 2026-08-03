import React, { useState, useEffect } from 'react';
import { Flame, Clock, Sparkles, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FlashDealsTicker: React.FC = () => {
  const { language, setPage } = useApp();

  // 24-hour countdown simulator
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 20,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-red-950 to-purple-950 border-b border-amber-500/30 text-white py-2 px-3 sm:px-6 shadow-md dir-rtl font-['Cairo']">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left message & badge */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black animate-pulse flex items-center gap-1 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>{language === 'ar' ? 'صفقة سريعة' : 'FLASH SALE'}</span>
          </span>
          <span className="text-white font-extrabold text-xs sm:text-sm">
            {language === 'ar'
              ? 'خصومات حصرية تصل إلى 60% على أفضل الأجهزة الذكية'
              : 'Exclusive discounts up to 60% on smart devices'}
          </span>
        </div>

        {/* Center Live Countdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'تنتهي خلال:' : 'Ends in:'}</span>
          </span>

          <div className="flex items-center gap-1 dir-ltr text-xs font-black">
            <div className="bg-slate-900 border border-amber-500/40 text-amber-300 px-2 py-1 rounded-md min-w-[32px] text-center shadow-inner">
              {formatDigit(timeLeft.hours)}h
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-slate-900 border border-amber-500/40 text-amber-300 px-2 py-1 rounded-md min-w-[32px] text-center shadow-inner">
              {formatDigit(timeLeft.minutes)}m
            </div>
            <span className="text-amber-400 font-bold">:</span>
            <div className="bg-slate-900 border border-amber-500/40 text-amber-300 px-2 py-1 rounded-md min-w-[32px] text-center shadow-inner">
              {formatDigit(timeLeft.seconds)}s
            </div>
          </div>
        </div>

        {/* Right CTA Button */}
        <button
          onClick={() => setPage('deals')}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>{language === 'ar' ? 'تصفح صفقات اليوم' : 'Browse Today Deals'}</span>
          {language === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
