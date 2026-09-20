import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, X } from 'lucide-react';
import { supabase } from '../services/adminAccount';
import { ActivityReport, loadActivityReport } from '../services/siteActivity';
import { useApp } from '../context/AppContext';

export const RecentPurchaseToast = () => {
  const { language } = useApp();
  const [connections, setConnections] = useState<number | null>(null);
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [closed, setClosed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const channel = supabase.channel('yousra-public-presence-v1');
    channel.on('presence', { event: 'sync' }, () => {
      if (active) setConnections(Object.values(channel.presenceState()).reduce((sum, entries) => sum + entries.length, 0));
    }).subscribe(async status => {
      if (!active) return;
      if (status === 'SUBSCRIBED') {
        const result = await channel.track({ connected: true });
        if (active && result !== 'ok') setConnections(null);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnections(null);
      }
    });
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => loadActivityReport(1).then(value => { if (active) setReport(value); }).catch(() => { if (active) setReport(null); });
    void load();
    const timer = window.setInterval(load, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refreshKey]);

  if (closed) return null;
  const cartAdds = report?.totals.cart_adds;
  return (
    <aside dir={language === 'ar' ? 'rtl' : 'ltr'} aria-label={language === 'en' ? 'Live site activity' : 'إحصاءات الإقبال الفعلية'} className="fixed bottom-5 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-500/40 bg-slate-900 p-4 text-white shadow-xl">
      <button type="button" aria-label={language === 'en' ? 'Close activity statistics' : 'إغلاق إحصاءات الإقبال'} onClick={() => setClosed(true)} className="absolute left-2 top-2 p-1 text-slate-400"><X size={16} /></button>
      <div className="flex items-center justify-between gap-3 pl-7">
        <h2 className="flex items-center gap-2 text-sm font-bold text-amber-300"><BarChart3 size={18} /> {language === 'en' ? 'Live site activity' : 'نشاط الموقع الفعلي'}</h2>
        <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10" title={language === 'en' ? 'Refresh' : 'تحديث'}><RefreshCw size={14} /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">{language === 'en' ? 'Visitors, last 24h' : 'زوار آخر 24 ساعة'}</span><strong className="text-base">{report ? report.totals.visitors : '—'}</strong></div>
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">{language === 'en' ? 'Product opens' : 'فتح منتجات'}</span><strong className="text-base">{report ? report.totals.product_views : '—'}</strong></div>
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">{language === 'en' ? 'Purchase clicks' : 'نقرات شراء'}</span><strong className="text-base">{report ? report.totals.clicks : '—'}</strong></div>
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">{language === 'en' ? 'Cart additions' : 'إضافات للسلة'}</span><strong className="text-base">{typeof cartAdds === 'number' ? cartAdds : '—'}</strong></div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300"><span>{language === 'en' ? 'Connected tabs now' : 'تبويبات متصلة الآن'}</span><strong>{connections ?? '—'}</strong></div>
      {typeof cartAdds !== 'number' && <p className="mt-2 text-[10px] leading-relaxed text-amber-300">{language === 'en' ? 'Cart-add measurement is active, but no number is shown until the database reports it.' : 'قياس «الإضافة للسلة» بدأ من الواجهة الآن، لكن لن أعرض رقمًا مزيفًا قبل أن يعيده تقرير قاعدة البيانات فعليًا.'}</p>}
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{language === 'en' ? 'These numbers come from site measurement, not sample users or test data.' : 'الأرقام من قياس الموقع، وليست أسماء أشخاص أو بيانات تجريبية.'}</p>
    </aside>
  );
};
