import React, {useEffect,useState} from 'react';
import {ActivityReport,loadActivityReport} from '../services/siteActivity';
import {useApp} from '../context/AppContext';

const percent = (numerator:number, denominator:number) => denominator > 0 ? `${((numerator / denominator) * 100).toFixed(1)}%` : '0.0%';

export function AdminActivityPanel() {
  const {products}=useApp();
  const [days,setDays]=useState(7);
  const [report,setReport]=useState<ActivityReport|null>(null);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let cancelled=false; setReport(null); setError('');
    loadActivityReport(days).then(value=>{if(!cancelled)setReport(value);}).catch(()=>{if(!cancelled)setError('تعذر تحميل القياس من قاعدة البيانات. تأكدي من تسجيل الدخول الإداري بالبريد وكلمة المرور.');});
    return ()=>{cancelled=true;};
  },[days,refresh]);
  return <section className="space-y-4" aria-label="إحصائيات فعلية من قاعدة البيانات">
    <div className="flex flex-wrap gap-2">
      {[1,7,30].map(value=><button key={value} onClick={()=>setDays(value)} className={'rounded-xl px-4 py-2 text-xs '+(days===value?'bg-purple-600':'bg-slate-800')}>{value===1?'آخر 24 ساعة':`آخر ${value} يومًا`}</button>)}
      <button onClick={()=>setRefresh(value=>value+1)} className="rounded-xl px-4 py-2 bg-slate-800 text-xs">تحديث من قاعدة البيانات</button>
    </div>
    {error && <p role="alert" className="text-amber-300">{error}</p>}
    {!report && !error && <p>جارٍ تحميل القياس…</p>}
    {report && <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Object.entries({'زوّار تقديريون':report.totals.visitors,'جلسات تبويب':report.totals.sessions,'فتح صفحات':report.totals.page_views,'فتح منتجات':report.totals.product_views,'نقرات روابط الشراء':report.totals.clicks,'CTR المنتج ← الشراء':percent(report.totals.clicks, report.totals.product_views)}).map(([label,value])=><div key={label} className="bg-slate-950 border border-slate-700 rounded-xl p-4"><p className="text-xs text-slate-300">{label}</p><strong className="text-xl">{typeof value==='number'?Number(value).toLocaleString('ar'):value}</strong></div>)}
      </div>
      <p className="text-xs text-slate-300">السجلات الحالية من قاعدة البيانات: {report.catalog.products} منتجًا إجمالًا، منها {report.catalog.public_products} ظاهرًا؛ {report.catalog.reviews} مراجعة إجمالًا. عدد المراجعات ليس عدد المشاهدات.</p>
      <p className="text-xs text-slate-400">{report.first_event?`أول حدث محفوظ: ${new Date(report.first_event).toLocaleString('ar')}`:'لا توجد أحداث مقاسة محفوظة بعد.'} لا يوجد سجل زيارات قديم مستورد.</p>
      <div className="overflow-x-auto"><table className="w-full text-xs text-right"><thead><tr><th className="p-2">المنتج — حسب مرات فتحه</th><th>فتح المنتج</th><th>نقرات أمازون</th><th>نقرات علي إكسبريس</th><th>CTR</th></tr></thead><tbody>{report.products.map(row=>{const clicks=row.amazon_clicks+row.aliexpress_clicks;return <tr key={row.product_id} className="border-t border-slate-700"><td className="p-3">{products.find(product=>product.id===row.product_id)?.titleAr || row.product_id}</td><td>{row.views}</td><td>{row.amazon_clicks}</td><td>{row.aliexpress_clicks}</td><td className="font-bold text-emerald-300">{percent(clicks,row.views)}</td></tr>;})}</tbody></table></div>
      {!report.products.length && <p className="text-sm text-slate-400">لا توجد مشاهدات منتجات أو نقرات مسجّلة في هذه الفترة.</p>}
    </>}
    <p className="rounded-xl border border-amber-700 p-3 text-sm text-amber-300">المبيعات والعمولات: غير مربوط بتقارير الأفلييت. الضغط على رابط الشراء ليس بيعًا، ولن نضيف أرباحًا تقديرية.</p>
    <p className="text-xs text-slate-400">الزوّار تقدير بمعرّف متصفح لمدة 30 يومًا؛ الأجهزة المختلفة قد تُحسب منفصلة. نستبعد صفحة الإدارة والحسابات الإدارية المعروفة قدر الإمكان ونحترم عدم التتبع. هذه أحداث متصفح وليست إثباتًا لهوية أشخاص؛ حجب القياس أو انقطاع الاتصال قد يقلل الأرقام. يحتفظ هذا القياس بآخر 90 يومًا فقط.</p>
  </section>;
}
