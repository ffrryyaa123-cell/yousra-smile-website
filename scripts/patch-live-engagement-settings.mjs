import fs from 'node:fs';

const patchOnce = (source, needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-live-engagement-settings] Missing ${label}`);
  return source.replace(needle, replacement);
};

// 1) Track cart-add intent client-side. The backend may ignore unknown kinds until
// its report function is extended, so the UI treats cart_adds as optional.
const activityFile = new URL('../src/services/siteActivity.ts', import.meta.url);
let activity = fs.readFileSync(activityFile, 'utf8');
activity = activity.replace("type EventKind = 'page_view' | 'product_view' | 'affiliate_click';", "type EventKind = 'page_view' | 'product_view' | 'affiliate_click' | 'cart_add';");
activity = activity.replace(
  '  totals:{visitors:number;sessions:number;page_views:number;product_views:number;clicks:number};',
  '  totals:{visitors:number;sessions:number;page_views:number;product_views:number;clicks:number;cart_adds?:number};'
);
fs.writeFileSync(activityFile, activity, 'utf8');

const contextFile = new URL('../src/context/AppContext.tsx', import.meta.url);
let context = fs.readFileSync(contextFile, 'utf8');
if (!context.includes("recordSiteActivity('cart_add'")) {
  context = patchOnce(
    context,
    '  const addToCart = (productId: string, quantity: number = 1) => {\n    setCart(prev => {',
    "  const addToCart = (productId: string, quantity: number = 1) => {\n    if (activePage !== 'admin') void recordSiteActivity('cart_add', activePage, productId);\n    setCart(prev => {",
    'cart activity hook'
  );
}
fs.writeFileSync(contextFile, context, 'utf8');

// 2) Make the floating corner card useful: live presence + REAL last-24h counts.
const toastFile = new URL('../src/components/RecentPurchaseToast.tsx', import.meta.url);
const toastSource = `import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, X } from 'lucide-react';
import { supabase } from '../services/adminAccount';
import { ActivityReport, loadActivityReport } from '../services/siteActivity';

export const RecentPurchaseToast = () => {
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
    <aside dir="rtl" aria-label="إحصاءات الإقبال الفعلية" className="fixed bottom-5 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-500/40 bg-slate-900 p-4 text-white shadow-xl">
      <button type="button" aria-label="إغلاق إحصاءات الإقبال" onClick={() => setClosed(true)} className="absolute left-2 top-2 p-1 text-slate-400"><X size={16} /></button>
      <div className="flex items-center justify-between gap-3 pl-7">
        <h2 className="flex items-center gap-2 text-sm font-bold text-amber-300"><BarChart3 size={18} /> نشاط الموقع الفعلي</h2>
        <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10" title="تحديث"><RefreshCw size={14} /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">زوار آخر 24 ساعة</span><strong className="text-base">{report ? report.totals.visitors : '—'}</strong></div>
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">فتح منتجات</span><strong className="text-base">{report ? report.totals.product_views : '—'}</strong></div>
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">نقرات شراء</span><strong className="text-base">{report ? report.totals.clicks : '—'}</strong></div>
        <div className="rounded-xl bg-slate-800 p-2.5"><span className="block text-slate-400">إضافات للسلة</span><strong className="text-base">{typeof cartAdds === 'number' ? cartAdds : '—'}</strong></div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300"><span>تبويبات متصلة الآن</span><strong>{connections ?? '—'}</strong></div>
      {typeof cartAdds !== 'number' && <p className="mt-2 text-[10px] leading-relaxed text-amber-300">قياس «الإضافة للسلة» بدأ من الواجهة الآن، لكن لن أعرض رقمًا مزيفًا قبل أن يعيده تقرير قاعدة البيانات فعليًا.</p>}
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">الأرقام من قياس الموقع، وليست أسماء أشخاص أو بيانات تجريبية.</p>
    </aside>
  );
};
`;
fs.writeFileSync(toastFile, toastSource, 'utf8');

// 3) Overview: remove the two hard-coded/demo blocks and show the real activity panel instead.
const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = fs.readFileSync(adminFile, 'utf8');
const demoStart = '          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4 text-white">\n              <h3 className="text-base font-bold text-white flex items-center gap-2">\n                <TrendingUp className="w-5 h-5 text-purple-400" />\n                <span>المنتجات الأكثر مشاهدة وقرص أداء الأفلييت</span>';
if (admin.includes(demoStart)) {
  const blockStart = admin.indexOf('          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">', admin.indexOf(demoStart));
  const blockEndMarker = '          </div>\n        </div>\n      )}\n\n      {/* TAB 2: PRODUCTS MANAGER */}';
  const blockEnd = admin.indexOf(blockEndMarker, blockStart);
  if (blockStart < 0 || blockEnd < 0) throw new Error('[patch-live-engagement-settings] Could not locate demo overview block end');
  const replacement = '          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-5 text-white shadow-md">\n            <div className="mb-4">\n              <h3 className="text-base font-black text-white">النشاط الحقيقي للزوار والمنتجات</h3>\n              <p className="mt-1 text-xs text-slate-400">لا توجد أسماء أو مشاهدات تجريبية هنا؛ البيانات التالية تُقرأ من قياس الموقع الفعلي.</p>\n            </div>\n            <AdminActivityPanel />\n          </div>\n';
  admin = admin.slice(0, blockStart) + replacement + admin.slice(blockEnd);
}

// Remove sample inbox records so demo names cannot be mistaken for real visitors.
if (admin.includes("{ id: '1', name: 'أحمد العتيبي'")) {
  const start = admin.indexOf('  // Messages State\n  const [messagesList, setMessagesList] = useState([');
  const end = admin.indexOf('  const [selectedMessage, setSelectedMessage]', start);
  if (start >= 0 && end >= 0) {
    const typed = `  // Messages State — no seeded/demo customer identities.\n  type AdminMessage = { id:string; name:string; email:string; subject:string; message:string; date:string; isRead:boolean; isStarred:boolean };\n  const [messagesList, setMessagesList] = useState<AdminMessage[]>([]);\n`;
    admin = admin.slice(0, start) + typed + admin.slice(end).replace('useState<typeof messagesList[0] | null>(null)', 'useState<AdminMessage | null>(null)');
  }
}

// 4) Complete general social settings with X/Twitter in addition to existing channels.
admin = admin.replace('    snapchatUrl: siteSettings.snapchatUrl,\n    amazonTag:', '    snapchatUrl: siteSettings.snapchatUrl,\n    twitterUrl: siteSettings.twitterUrl,\n    amazonTag:');
admin = admin.replace('      snapchatUrl: siteSettings.snapchatUrl,\n      amazonTag:', '      snapchatUrl: siteSettings.snapchatUrl,\n      twitterUrl: siteSettings.twitterUrl,\n      amazonTag:');
if (!admin.includes('رابط X / Twitter')) {
  const marker = `            <div>\n              <label className="font-bold text-amber-300 block mb-1">معرف Amazon US (Amazon Tag):</label>`;
  const twitterField = `            <div>\n              <label className="font-bold text-sky-300 block mb-1">رابط X / Twitter:</label>\n              <input\n                type="url"\n                value={settingsForm.twitterUrl || ''}\n                onChange={(e) => setSettingsForm({ ...settingsForm, twitterUrl: e.target.value })}\n                placeholder="https://x.com/yousrasmile"\n                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-sky-400 focus:outline-none"\n              />\n            </div>\n\n`;
  admin = patchOnce(admin, marker, twitterField + marker, 'Twitter settings field');
}
fs.writeFileSync(adminFile, admin, 'utf8');

// 5) SiteSettings type + defaults + SEO sameAs.
const typesFile = new URL('../src/types.ts', import.meta.url);
let types = fs.readFileSync(typesFile, 'utf8');
if (!types.includes('twitterUrl?: string;')) {
  types = types.replace('  snapchatUrl?: string;\r\n', '  snapchatUrl?: string;\r\n  twitterUrl?: string;\r\n').replace('  snapchatUrl?: string;\n', '  snapchatUrl?: string;\n  twitterUrl?: string;\n');
}
fs.writeFileSync(typesFile, types, 'utf8');

let ctx = fs.readFileSync(contextFile, 'utf8');
if (!ctx.includes("twitterUrl: 'https://x.com/yousrasmile'")) {
  ctx = ctx.replace("  snapchatUrl: 'https://snapchat.com/add/yousrasmile',", "  snapchatUrl: 'https://snapchat.com/add/yousrasmile',\n  twitterUrl: 'https://x.com/yousrasmile',");
}
fs.writeFileSync(contextFile, ctx, 'utf8');

const seoFile = new URL('../src/components/SEOHead.tsx', import.meta.url);
let seo = fs.readFileSync(seoFile, 'utf8');
if (!seo.includes('siteSettings.twitterUrl')) {
  seo = seo.replace('              siteSettings.pinterestUrl || "https://pinterest.com"', '              siteSettings.pinterestUrl || "https://pinterest.com",\n              siteSettings.instagramUrl || "https://instagram.com",\n              siteSettings.snapchatUrl || "https://snapchat.com",\n              siteSettings.twitterUrl || "https://x.com"');
}
fs.writeFileSync(seoFile, seo, 'utf8');

console.log('[patch-live-engagement-settings] Real engagement UI + complete social settings applied.');
