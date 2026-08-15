import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calculator, 
  Sparkles, 
  TrendingDown, 
  Clock, 
  Zap, 
  DollarSign, 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ApplianceOption {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  hoursSavedMonthly: number;
  moneySavedMonthlyUSD: number;
  icon: string;
  recommendedProductId: string;
  recommendedTitle: string;
  priceUSD: number;
  discountPriceUSD: number;
}

const APPLIANCE_OPTIONS: ApplianceOption[] = [
  {
    id: 'vacuum',
    nameAr: 'مكنسة روبوت ذكية وممسحة ذاتية',
    nameEn: 'Smart Robot Vacuum & Mop',
    category: 'vacuums',
    hoursSavedMonthly: 18,
    moneySavedMonthlyUSD: 45,
    icon: '🤖',
    recommendedProductId: '1',
    recommendedTitle: 'Roborock Q Revo MaxV',
    priceUSD: 899,
    discountPriceUSD: 699
  },
  {
    id: 'airfryer',
    nameAr: 'قلاية هوائية ذكية متعددة الوظائف',
    nameEn: 'Smart Multi-Function Air Fryer',
    category: 'kitchen',
    hoursSavedMonthly: 12,
    moneySavedMonthlyUSD: 65,
    icon: '🍟',
    recommendedProductId: '4',
    recommendedTitle: 'Philips XXL Smart Sensing Airfryer',
    priceUSD: 299,
    discountPriceUSD: 219
  },
  {
    id: 'smartlock',
    nameAr: 'قفل ذكي بكاميرا وبصمة وسرعة دخول',
    nameEn: 'Smart Fingerprint & Video Door Lock',
    category: 'security',
    hoursSavedMonthly: 5,
    moneySavedMonthlyUSD: 20,
    icon: '🔐',
    recommendedProductId: '7',
    recommendedTitle: 'Aqara Smart Lock U100',
    priceUSD: 249,
    discountPriceUSD: 189
  },
  {
    id: 'purifier',
    nameAr: 'منقي هواء ذكي بفلتر HEPA وترطيب',
    nameEn: 'Smart HEPA Air Purifier & Humidifier',
    category: 'comfort',
    hoursSavedMonthly: 6,
    moneySavedMonthlyUSD: 30,
    icon: '💨',
    recommendedProductId: '8',
    recommendedTitle: 'Dyson Purifier Hot+Cool Gen1',
    priceUSD: 599,
    discountPriceUSD: 479
  },
  {
    id: 'wetdry',
    nameAr: 'مكنسة غسيل أرضيات وسجاد لاسلكية',
    nameEn: 'Wet & Dry Cordless Floor Washer',
    category: 'vacuums',
    hoursSavedMonthly: 14,
    moneySavedMonthlyUSD: 40,
    icon: '✨',
    recommendedProductId: '2',
    recommendedTitle: 'Tineco Floor ONE S5 Wet Dry',
    priceUSD: 499,
    discountPriceUSD: 369
  }
];

export const SmartSavingsCalculator: React.FC = () => {
  const { formatPrice, setPage, setSelectedCategory, openProductDetail, products } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>(['vacuum', 'airfryer']);
  const [familyMembers, setFamilyMembers] = useState<number>(4);

  const toggleOption = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(item => item !== id) : prev) 
        : [...prev, id]
    );
  };

  // Calculations
  const selectedItems = APPLIANCE_OPTIONS.filter(opt => selectedIds.includes(opt.id));
  const familyMultiplier = 1 + (familyMembers - 1) * 0.25;

  const totalMonthlyHours = Math.round(
    selectedItems.reduce((acc, curr) => acc + curr.hoursSavedMonthly, 0) * familyMultiplier
  );

  const totalMonthlySavingsUSD = Math.round(
    selectedItems.reduce((acc, curr) => acc + curr.moneySavedMonthlyUSD, 0) * familyMultiplier
  );

  const totalAnnualSavingsUSD = totalMonthlySavingsUSD * 12;
  const totalAnnualHours = totalMonthlyHours * 12;

  return (
    <section className="bg-gradient-to-br from-slate-900 via-[#1e1035] to-slate-950 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-white my-6">
      {/* Background glow */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-purple-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>حاسبة ذكية تفاعلية • التوفير المالي والزمني</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Tajawal'] text-white">
            كم توفر لك أجهزة المنزل الذكي شهرياً وسنوياً؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            اختر الأجهزة الذكية التي تفكر في اقتنائها واكتشف حجم الساعات والتكاليف التي توفرها لعائلتك شهرياً وسنوياً
          </p>
        </div>

        {/* Family Size Selector */}
        <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-3 shrink-0 flex items-center gap-3">
          <span className="text-xs text-slate-300 font-bold">حجم العائلة:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 4, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setFamilyMembers(num)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  familyMembers === num
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {num === 6 ? '6+' : num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Left: Device Selection Checkboxes */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-slate-400 mb-2">
            اضغط لتحديد الأجهزة المراد حساب توفيرها:
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {APPLIANCE_OPTIONS.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleOption(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-purple-950/60 border-amber-400/80 shadow-lg shadow-purple-950/40' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {item.nameAr}
                        </h4>
                        <span className="text-[10px] text-slate-400">{item.nameEn}</span>
                      </div>
                    </div>
                    
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-amber-400 border-amber-400 text-slate-950' 
                        : 'border-slate-600 bg-slate-800'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      توفير ~${item.moneySavedMonthlyUSD}/شهر
                    </span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      +{item.hoursSavedMonthly} ساعة راحة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Dynamic Results Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-[#190d2e] border border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-300">النتيجة التقديرية المباشرة:</span>
              <span className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                محسوبة بدقة
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">الوقت الموفّر شهرياً</span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-['Tajawal'] flex items-center justify-center gap-1">
                  <span>{totalMonthlyHours}</span>
                  <span className="text-xs font-normal text-slate-300">ساعة</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  ({totalAnnualHours} ساعة/سنة)
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">التوفير المالي السنوي</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-['Tajawal'] flex items-center justify-center gap-1">
                  <span>{formatPrice(totalAnnualSavingsUSD)}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  (~{formatPrice(totalMonthlySavingsUSD)} / شهر)
                </span>
              </div>
            </div>

            {/* Top Picks List */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-bold text-slate-400 block">أفضل العروض المرشحة بأعلى تقييم:</span>
              {selectedItems.slice(0, 2).map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    const foundProd = products.find(p => p.id === item.recommendedProductId);
                    if (foundProd) {
                      openProductDetail(foundProd);
                    } else {
                      setPage('products');
                    }
                  }}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg">{item.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{item.recommendedTitle}</div>
                      <div className="text-[10px] text-emerald-400">وفر خصم يصل حتى 25%</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-amber-400">{formatPrice(item.discountPriceUSD)}</div>
                    <div className="text-[10px] line-through text-slate-500">{formatPrice(item.priceUSD)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => {
              setPage('products');
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>استعرض جميع المنتجات الذكية المخفضة</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

      </div>
    </section>
  );
};
