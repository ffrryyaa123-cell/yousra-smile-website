import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NOTIFICATIONS = [
  { nameAr: 'أحمد ن.', nameEn: 'Ahmed N.', cityAr: 'الرياض', cityEn: 'Riyadh', actionAr: 'تحقق من سعر', actionEn: 'checked the price of', item: 'Roborock S8 Pro Ultra', timeAr: 'قبل 3 دقائق', timeEn: '3 minutes ago' },
  { nameAr: 'سارة م.', nameEn: 'Sarah M.', cityAr: 'جدة', cityEn: 'Jeddah', actionAr: 'اشترت من أمازون', actionEn: 'bought on Amazon', item: 'Dyson Airwrap Multi-Styler', timeAr: 'قبل 7 دقائق', timeEn: '7 minutes ago' },
  { nameAr: 'فهد ع.', nameEn: 'Fahad A.', cityAr: 'الدمام', cityEn: 'Dammam', actionAr: 'قارن أسعار', actionEn: 'compared prices for', item: 'Tineco Floor One S5', timeAr: 'قبل 12 دقيقة', timeEn: '12 minutes ago' },
  { nameAr: 'ريم ك.', nameEn: 'Reem K.', cityAr: 'دبي', cityEn: 'Dubai', actionAr: 'شاهدت مراجعة', actionEn: 'watched a review of', item: 'Cosori Dual Blaze 6.8L', timeAr: 'قبل 15 دقيقة', timeEn: '15 minutes ago' },
  { nameAr: 'محمد ح.', nameEn: 'Mohammed H.', cityAr: 'الكويت', cityEn: 'Kuwait', actionAr: 'أضاف للسلة', actionEn: 'added to cart', item: 'Dreame L20 Ultra', timeAr: 'قبل 20 دقيقة', timeEn: '20 minutes ago' },
];

export const RecentPurchaseToast: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { language } = useApp();

  useEffect(() => {
    if (dismissed) return;

    // First show after 4 seconds
    const timer1 = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Loop through notifications every 14 seconds
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % NOTIFICATIONS.length);
        setVisible(true);
      }, 1000);
    }, 14000);

    return () => {
      clearTimeout(timer1);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (!visible || dismissed) return null;

  const current = NOTIFICATIONS[currentIndex];

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-xs sm:max-w-sm bg-slate-900/95 text-slate-100 border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/40 flex items-center justify-center shrink-0">
        <CheckCircle className="w-5 h-5 text-amber-400" />
      </div>

      <div className="flex-1 min-w-0 text-xs">
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold text-amber-300 truncate">
            {language === 'ar' ? current.nameAr : current.nameEn} ({language === 'ar' ? current.cityAr : current.cityEn})
          </span>
          <span className="text-[10px] text-slate-400 shrink-0">{language === 'ar' ? current.timeAr : current.timeEn}</span>
        </div>
        <p className="text-slate-300 truncate mt-0.5 font-['Cairo']">
          {language === 'ar' ? current.actionAr : current.actionEn} <span className="font-semibold text-white">{current.item}</span>
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        title={language === 'ar' ? 'إغلاق الإشعار' : 'Close notification'}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
