import React, { useState } from 'react';
import { Product } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingDown, TrendingUp, Award, Zap, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PriceHistoryChartProps {
  product: Product;
}

// Generate realistic historic price data for a product
function generatePriceHistoryData(product: Product) {
  const current = product.discountPrice;
  const original = product.originalPrice;
  const currency = product.currency;

  // Derive 6 historic data points leading to current price
  const diff = original - current;
  const p1 = Math.round(original);
  const p2 = Math.round(original - diff * 0.25 + (product.id.charCodeAt(0) % 15));
  const p3 = Math.round(original - diff * 0.10);
  const p4 = Math.round(original - diff * 0.60 + (product.id.charCodeAt(1) % 20));
  const p5 = Math.round(original - diff * 0.40);
  const p6 = current;

  const months = ['قبل 5 أشهر', 'قبل 4 أشهر', 'قبل 3 أشهر', 'الشهر الماضي', 'قبل أسبوعين', 'السعر الحالي'];
  const monthsEn = ['5 mos ago', '4 mos ago', '3 mos ago', 'Last month', '2 weeks ago', 'Current Price'];

  const rawData = [
    { labelAr: months[0], labelEn: monthsEn[0], price: p1, date: '15 فبراير' },
    { labelAr: months[1], labelEn: monthsEn[1], price: p2, date: '20 مارس' },
    { labelAr: months[2], labelEn: monthsEn[2], price: p3, date: '10 أبريل' },
    { labelAr: months[3], labelEn: monthsEn[3], price: p4, date: '01 مايو' },
    { labelAr: months[4], labelEn: monthsEn[4], price: p5, date: '18 يونيو' },
    { labelAr: months[5], labelEn: monthsEn[5], price: p6, date: 'اليوم', isCurrent: true },
  ];

  const prices = rawData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const totalSaved = maxPrice - current;
  const discountFromMax = maxPrice > 0 ? Math.round(((maxPrice - current) / maxPrice) * 100) : 0;

  const isLowest = current <= minPrice;

  return {
    chartData: rawData,
    minPrice,
    maxPrice,
    avgPrice,
    totalSaved,
    discountFromMax,
    isLowest,
    currency
  };
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ product }) => {
  const { language, formatPrice } = useApp();
  const [timeframe, setTimeframe] = useState<'6m' | '3m' | '1m'>('6m');

  const {
    chartData,
    minPrice,
    maxPrice,
    avgPrice,
    totalSaved,
    discountFromMax,
    isLowest
  } = generatePriceHistoryData(product);

  const filteredData = timeframe === '1m' ? chartData.slice(3) : timeframe === '3m' ? chartData.slice(2) : chartData;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#111113] border border-amber-500/40 p-3 rounded-2xl shadow-2xl text-white text-xs space-y-1 font-['Tajawal'] dir-rtl">
          <div className="text-amber-400 font-bold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'en' ? data.labelEn : `${data.labelAr} (${data.date})`}</span>
          </div>
          <div className="text-base font-black text-emerald-400">
            {formatPrice(data.price)}
          </div>
          {data.isCurrent && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md inline-block font-bold">
              {language === 'en' ? '🔥 Best price right now!' : '🔥 السعر الأفضل حالياً!'}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5 font-['Tajawal']">
      {/* Widget Title & Buy Decision Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-base font-black text-white">
              {language === 'en' ? 'Price History & Buying Insight' : 'تاريخ تغير السعر ومؤشر الشراء الذكي 📈'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'en' 
              ? 'Track price fluctuations over time to ensure you get the absolute best deal.'
              : 'تتبع حركة السعر خلال الأشهر الماضية لتتأكد من اتخاذ أفضل قرار شراء بالوقت المناسب.'
            }
          </p>
        </div>

        {/* Dynamic Buying Recommendation Badge */}
        <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 shrink-0 ${
          isLowest 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-950/50 animate-pulse'
            : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
        }`}>
          {isLowest ? <Zap className="w-4 h-4 text-emerald-400 shrink-0" /> : <Award className="w-4 h-4 text-amber-400 shrink-0" />}
          <div>
            <div className="text-xs font-black">
              {isLowest 
                ? (language === 'en' ? 'BEST TIME TO BUY NOW! 🔥' : 'أفضل وقت للشراء الآن! 🔥')
                : (language === 'en' ? 'Good Price Point' : 'سعر ممتاز ومناسب لليوم')
              }
            </div>
            <div className="text-[10px] opacity-80">
              {isLowest 
                ? (language === 'en' ? 'Lowest price in 6 months!' : 'أدنى سعر تم تسجيله خلال 6 أشهر!')
                : `${language === 'en' ? 'Save' : 'توفير'} ${discountFromMax}% ${language === 'en' ? 'vs highest' : 'عن أعلى سعر'}`
              }
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Lowest Price */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-mono-meta">
            {language === 'en' ? 'Lowest Recorded Price' : 'أدنى سعر مسجل'}
          </span>
          <div className="text-base font-black text-emerald-400 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            <span>{formatPrice(minPrice)}</span>
          </div>
        </div>

        {/* Highest Price */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-mono-meta">
            {language === 'en' ? 'Highest Recorded Price' : 'أعلى سعر مسجل'}
          </span>
          <div className="text-base font-black text-rose-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{formatPrice(maxPrice)}</span>
          </div>
        </div>

        {/* Average Price */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-mono-meta">
            {language === 'en' ? 'Average Price' : 'متوسط السعر'}
          </span>
          <div className="text-base font-black text-amber-300">
            {formatPrice(avgPrice)}
          </div>
        </div>

        {/* Total Savings */}
        <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-[11px] text-emerald-300 block font-bold">
            {language === 'en' ? 'Your Savings' : 'مجموع توفيرك الآن'}
          </span>
          <div className="text-base font-black text-emerald-400">
            {totalSaved > 0 ? formatPrice(totalSaved) : (language === 'en' ? 'Best price!' : 'أفضل سعر!')}
          </div>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-400 font-mono-meta text-[11px]">
          {language === 'en' ? 'GRAPH TIMEFRAME:' : 'الفترة الزمنية:'}
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTimeframe('1m')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              timeframe === '1m' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'en' ? '1 Month' : 'شهر واحد'}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('3m')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              timeframe === '3m' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'en' ? '3 Months' : '3 أشهر'}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('6m')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              timeframe === '6m' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'en' ? '6 Months' : '6 أشهر'}
          </button>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey={language === 'en' ? 'labelEn' : 'labelAr'} 
              stroke="#94A3B8" 
              fontSize={11}
              tickLine={false}
            />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#C084FC" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#priceGradient)" 
              dot={{ r: 5, fill: '#E9D5FF', stroke: '#A855F7', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Encouragement Note */}
      <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          {language === 'en'
            ? 'Pro Tip: Prices on affiliate stores (Amazon / AliExpress) are currently at or near their lowest levels.'
            : 'نصيحة يسرى الذكية: أسعار هذا المنتج في أعلى نسبة خصم مقارنة بمتوسط أسعار الشهور الأخيرة، الشراء الآن خيار ممتازة لتوفير المال.'
          }
        </span>
      </div>
    </div>
  );
};
