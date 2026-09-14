import fs from 'node:fs';

const read = (url) => fs.readFileSync(url, 'utf8');
const write = (url, value) => fs.writeFileSync(url, value, 'utf8');

// -----------------------------------------------------------------------------
// 1) Public visitor badge: small, factual, monthly count only.
//    The detailed analytics card remains admin-only.
// -----------------------------------------------------------------------------
const badgeFile = new URL('../src/components/PublicVisitorBadge.tsx', import.meta.url);
const badgeSource = `import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { loadActivityReport } from '../services/siteActivity';

export const PublicVisitorBadge: React.FC = () => {
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      void loadActivityReport(30)
        .then(report => { if (active) setVisitors(report.totals.visitors); })
        .catch(() => { if (active) setVisitors(null); });
    };
    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (visitors === null) return null;

  return (
    <div
      dir="rtl"
      aria-label={\`عدد زوار الموقع خلال آخر 30 يومًا: \${visitors}\`}
      className="fixed bottom-5 right-4 z-30 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-amber-400/40 bg-slate-950/90 px-3 py-2 text-[11px] font-bold text-white shadow-lg backdrop-blur-md sm:text-xs"
      title="رقم فعلي من قياس الموقع خلال آخر 30 يومًا"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950">
        <Users className="h-4 w-4" />
      </span>
      <span>زار الموقع هذا الشهر</span>
      <strong className="text-amber-300">{visitors.toLocaleString('ar')}</strong>
    </div>
  );
};
`;
write(badgeFile, badgeSource);

const appFile = new URL('../src/App.tsx', import.meta.url);
let app = read(appFile);
if (!app.includes("PublicVisitorBadge = lazy")) {
  const marker = "const RecentPurchaseToast = lazy(() => import('./components/RecentPurchaseToast').then(m => ({ default: m.RecentPurchaseToast })));";
  if (!app.includes(marker)) throw new Error('[patch-current-priorities] RecentPurchaseToast import marker missing');
  app = app.replace(marker, `${marker}\nconst PublicVisitorBadge = lazy(() => import('./components/PublicVisitorBadge').then(m => ({ default: m.PublicVisitorBadge })));`);
}
if (!app.includes("activePage !== 'admin' && <PublicVisitorBadge />")) {
  const marker = "        {activePage === 'admin' && <RecentPurchaseToast />}";
  if (!app.includes(marker)) throw new Error('[patch-current-priorities] admin activity marker missing');
  app = app.replace(marker, `${marker}\n        {activePage !== 'admin' && <PublicVisitorBadge />}`);
}
write(appFile, app);

// -----------------------------------------------------------------------------
// 2) Product manager: Amazon + AliExpress affiliate verification buttons.
//    Each button is active only when that product actually has the saved URL.
// -----------------------------------------------------------------------------
const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = read(adminFile);
if (!admin.includes('ADMIN_AFFILIATE_DUAL_LINKS')) {
  const hrefMarker = 'href={prod.amazonUrl}';
  const hrefPos = admin.indexOf(hrefMarker);
  if (hrefPos < 0) throw new Error('[patch-current-priorities] Amazon admin link marker missing');
  const anchorStart = admin.lastIndexOf('<a', hrefPos);
  const anchorClose = admin.indexOf('</a>', hrefPos);
  if (anchorStart < 0 || anchorClose < 0) throw new Error('[patch-current-priorities] Amazon admin anchor boundaries missing');
  const anchorEnd = anchorClose + 4;
  let amazonAnchor = admin.slice(anchorStart, anchorEnd);
  amazonAnchor = amazonAnchor
    .replace('href={prod.amazonUrl}', 'href={prod.amazonUrl || undefined}')
    .replace('rel="noreferrer"', 'rel="noreferrer"\n                            aria-disabled={!prod.amazonUrl}\n                            onClick={(event) => { if (!prod.amazonUrl) { event.preventDefault(); event.stopPropagation(); } }}\n                            title={prod.amazonUrl ? \'فتح رابط Amazon المحفوظ والتحقق منه\' : \'لا يوجد رابط Amazon لهذا المنتج\'}')
    .replace('className="p-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors"', "className={\`px-2 py-1.5 rounded-lg border text-[10px] font-black inline-flex items-center gap-1 transition-colors \${prod.amazonUrl ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' : 'bg-slate-800/60 text-slate-600 border-slate-700 cursor-not-allowed opacity-60'}\`}")
    .replace('</a>', '<span>Amazon</span></a>');

  const aliAnchor = `\n                          {/* ADMIN_AFFILIATE_DUAL_LINKS */}\n                          <a\n                            href={prod.aliexpressUrl || undefined}\n                            target="_blank"\n                            rel="noreferrer"\n                            aria-disabled={!prod.aliexpressUrl}\n                            onClick={(event) => { if (!prod.aliexpressUrl) { event.preventDefault(); event.stopPropagation(); } }}\n                            title={prod.aliexpressUrl ? 'فتح رابط AliExpress المحفوظ والتحقق منه' : 'لا يوجد رابط AliExpress لهذا المنتج'}\n                            className={\`px-2 py-1.5 rounded-lg border text-[10px] font-black inline-flex items-center gap-1 transition-colors \${prod.aliexpressUrl ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30' : 'bg-slate-800/60 text-slate-600 border-slate-700 cursor-not-allowed opacity-60'}\`}\n                          >\n                            <ExternalLink className="w-3 h-3" />\n                            <span>AliExpress</span>\n                          </a>`;

  admin = admin.slice(0, anchorStart) + amazonAnchor + aliAnchor + admin.slice(anchorEnd);
}
write(adminFile, admin);

// -----------------------------------------------------------------------------
// 3) Mobile performance: prioritize the LCP hero; lazy-decode product and
//    below-fold imagery so mobile does not fetch the whole visual catalog first.
// -----------------------------------------------------------------------------
const homeFile = new URL('../src/pages/HomePage.tsx', import.meta.url);
let home = read(homeFile);
if (!home.includes('src={smartHomeBanner}\n            fetchPriority="high"')) {
  home = home.replace(/(src=\{smartHomeBanner\}\s*\r?\n)(\s*alt=)/, '$1            fetchPriority="high"\n            decoding="async"\n$2');
}
write(homeFile, home);

const cardFile = new URL('../src/components/ProductCard.tsx', import.meta.url);
let card = read(cardFile);
card = card.replace(/(<img\s*\r?\n\s*src=\{product\.image\}\s*\r?\n)(?!\s*loading=)/g, '$1            loading="lazy"\n            decoding="async"\n            fetchPriority="low"\n');
write(cardFile, card);

const footerFile = new URL('../src/components/Footer.tsx', import.meta.url);
let footer = read(footerFile);
footer = footer.replace(/<img src=\{siteSettings\.siteLogo \|\| logoImg\} alt="Yousra Smile"(?![^>]*loading=)/g, '<img src={siteSettings.siteLogo || logoImg} alt="Yousra Smile" loading="lazy" decoding="async" fetchPriority="low"');
write(footerFile, footer);

const blogFile = new URL('../src/components/BlogSection.tsx', import.meta.url);
let blog = read(blogFile);
blog = blog.replace(/(<img\s*\r?\n\s*src=\{post\.image\}\s*\r?\n)(?!\s*loading=)/g, '$1                loading="lazy"\n                decoding="async"\n                fetchPriority="low"\n');
write(blogFile, blog);

const videosFile = new URL('../src/pages/VideosPage.tsx', import.meta.url);
let videos = read(videosFile);
videos = videos.replace(/(<img\s*\r?\n\s*src=\{video\.thumbnailUrl \|\| video\.productImage\}\s*\r?\n)(?!\s*loading=)/g, '$1                    loading="lazy"\n                    decoding="async"\n                    fetchPriority="low"\n');
write(videosFile, videos);

console.log('[patch-current-priorities] Public monthly visitor badge, dual affiliate admin links and mobile image loading applied.');
