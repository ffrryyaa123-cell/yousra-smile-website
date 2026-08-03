import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NOTIFICATIONS = [
  { name: 'أحمد ن.', city: 'الرياض', action: 'تحقق من سعر', item: 'Roborock S8 Pro Ultra', time: 'قبل 3 دقائق' },
  { name: 'سارة م.', city: 'جدة', action: 'اشترت من أمازون', item: 'Dyson Airwrap Multi-Styler', time: 'قبل 7 دقائق' },
  { name: 'فهد ع.', city: 'الدمام', action: 'قارن أسعار', item: 'Tineco Floor One S5', time: 'قبل 12 دقيقة' },
  { name: 'ريم ك.', city: 'دبي', action: 'شاهدت مراجعة', item: 'Cosori Dual Blaze 6.8L', time: 'قبل 15 دقيقة' },
  { name: 'محمد ح.', city: 'الكويت', action: 'أضاف للسلة', item: 'Dreame L20 Ultra', time: 'قبل 20 دقيقة' },
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
            {current.name} ({current.city})
          </span>
          <span className="text-[10px] text-slate-400 shrink-0">{current.time}</span>
        </div>
        <p className="text-slate-300 truncate mt-0.5 font-['Cairo']">
          {current.action} <span className="font-semibold text-white">{current.item}</span>
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        title="إغلاق الإشعار"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
