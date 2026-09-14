import fs from 'node:fs';

const read = (url) => fs.readFileSync(url, 'utf8');
const write = (url, value) => fs.writeFileSync(url, value, 'utf8');

// 1) Extend settings and media item types with placement-aware image slots.
const typesFile = new URL('../src/types.ts', import.meta.url);
let types = read(typesFile);
if (!types.includes('heroBannerUrl?: string;')) {
  types = types.replace(/(\s+siteLogo: string;\r?\n)/, `$1  heroBannerUrl?: string;\n  smartHomeBannerUrl?: string;\n  creatorAvatarUrl?: string;\n`);
}
write(typesFile, types);

const mediaServiceFile = new URL('../src/services/mediaLibrary.ts', import.meta.url);
let mediaService = read(mediaServiceFile);
if (!mediaService.includes('placement?: MediaPlacement;')) {
  mediaService = mediaService.replace(
    "export interface MediaLibraryItem {",
    "export type MediaPlacement = 'none' | 'siteLogo' | 'heroBanner' | 'smartHomeBanner' | 'creatorAvatar';\n\nexport interface MediaLibraryItem {"
  );
  mediaService = mediaService.replace(/(\s+storagePath\?: string;\r?\n)/, `$1  placement?: MediaPlacement;\n`);
}
write(mediaServiceFile, mediaService);

// 2) Public components read their images from settings, with current bundled images as safe fallbacks.
const heroFile = new URL('../src/components/HeroBanner.tsx', import.meta.url);
let hero = read(heroFile);
hero = hero.replace(
  /const \{ setPage, setSelectedCategory, searchQuery, setSearchQuery, language, t, videos, visibleProducts, openVideoModal \} = useApp\(\);/,
  "const { setPage, setSelectedCategory, searchQuery, setSearchQuery, language, t, videos, visibleProducts, openVideoModal, siteSettings } = useApp();"
);
hero = hero.replace(/src=\{bannerImg\}/g, 'src={siteSettings.heroBannerUrl || bannerImg}');
hero = hero.replace(/src=\{logoImg\}/g, 'src={siteSettings.creatorAvatarUrl || siteSettings.siteLogo || logoImg}');
write(heroFile, hero);

const homeFile = new URL('../src/pages/HomePage.tsx', import.meta.url);
let home = read(homeFile);
if (!/\bsiteSettings\b/.test(home.match(/const \{[\s\S]*?\} = useApp\(\);/)?.[0] || '')) {
  home = home.replace(/(\s+formatPrice,\r?\n\s+t\r?\n\s+\} = useApp\(\);)/, (m) => m.replace(/\r?\n\s+t/, '\n    t,\n    siteSettings'));
}
home = home.replace(/src=\{smartHomeBanner\}/g, 'src={siteSettings.smartHomeBannerUrl || smartHomeBanner}');
home = home.replace(/src=\{logoImg\}/g, 'src={siteSettings.creatorAvatarUrl || siteSettings.siteLogo || logoImg}');
write(homeFile, home);

// 3) Media Library can assign each image to a live location.
const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = read(adminFile);

if (!admin.includes('MEDIA_PLACEMENT_OPTIONS')) {
  const marker = "  const MEDIA_LIBRARY_KEY = 'yousra-media-library-v2';";
  if (!admin.includes(marker)) throw new Error('[patch-media-placement-links] media library state marker missing');
  admin = admin.replace(marker, `${marker}\n  const MEDIA_PLACEMENT_OPTIONS = [\n    { value: 'none', label: 'غير مرتبطة بمكان' },\n    { value: 'siteLogo', label: 'شعار الموقع - الهيدر والفوتر' },\n    { value: 'heroBanner', label: 'بانر Hero الرئيسي' },\n    { value: 'smartHomeBanner', label: 'بانر الأجهزة الذكية أعلى الرئيسية' },\n    { value: 'creatorAvatar', label: 'صورة/أفاتار يسرى في الرئيسية' }\n  ] as const;`);
}

if (!admin.includes('applyMediaPlacement')) {
  const marker = `  const persistMediaItems = (items: MediaLibraryItem[]) => {\n    setMediaItems(items);\n    localStorage.setItem(MEDIA_LIBRARY_KEY, JSON.stringify(items));\n  };`;
  if (!admin.includes(marker)) throw new Error('[patch-media-placement-links] persist marker missing');
  const addition = `${marker}\n\n  const placementPatch = (placement: MediaLibraryItem['placement'], url: string) => {\n    if (!placement || placement === 'none') return {};\n    if (placement === 'siteLogo') return { siteLogo: url };\n    if (placement === 'heroBanner') return { heroBannerUrl: url };\n    if (placement === 'smartHomeBanner') return { smartHomeBannerUrl: url };\n    if (placement === 'creatorAvatar') return { creatorAvatarUrl: url };\n    return {};\n  };\n\n  const clearPlacementPatch = (placement: MediaLibraryItem['placement']) => {\n    if (placement === 'siteLogo') return { siteLogo: '' };\n    if (placement === 'heroBanner') return { heroBannerUrl: '' };\n    if (placement === 'smartHomeBanner') return { smartHomeBannerUrl: '' };\n    if (placement === 'creatorAvatar') return { creatorAvatarUrl: '' };\n    return {};\n  };\n\n  const applyMediaPlacement = (item: MediaLibraryItem, placement: MediaLibraryItem['placement']) => {\n    const next = mediaItems.map(current => ({\n      ...current,\n      placement: current.id === item.id ? placement : (placement && placement !== 'none' && current.placement === placement ? 'none' : current.placement)\n    }));\n    persistMediaItems(next);\n    if (item.placement && item.placement !== 'none' && item.placement !== placement) updateSiteSettings(clearPlacementPatch(item.placement));\n    if (placement && placement !== 'none') updateSiteSettings(placementPatch(placement, item.url));\n  };`;
  admin = admin.replace(marker, addition);
}

// Replacement should immediately update the live placement.
admin = admin.replace(
  /const next = mediaItems\.map\(current => current\.id === item\.id \? \{ \.\.\.current, url: stored\.url, storagePath: stored\.storagePath \} : current\);\n\s+persistMediaItems\(next\);/,
  `const next = mediaItems.map(current => current.id === item.id ? { ...current, url: stored.url, storagePath: stored.storagePath } : current);\n      persistMediaItems(next);\n      if (item.placement && item.placement !== 'none') updateSiteSettings(placementPatch(item.placement, stored.url));`
);

// Deleting an assigned image clears that slot back to its bundled fallback.
admin = admin.replace(
  /await deleteMediaLibraryImage\(item\.storagePath\);\n\s+persistMediaItems\(mediaItems\.filter\(current => current\.id !== item\.id\)\);/,
  `await deleteMediaLibraryImage(item.storagePath);\n      if (item.placement && item.placement !== 'none') updateSiteSettings(clearPlacementPatch(item.placement));\n      persistMediaItems(mediaItems.filter(current => current.id !== item.id));`
);

// Add placement selector under each image name.
if (!admin.includes('مكان استخدام الصورة')) {
  const marker = `                  <input\n                    value={item.name}\n                    onChange={(event) => persistMediaItems(mediaItems.map(current => current.id === item.id ? { ...current, name: event.target.value } : current))}\n                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"\n                    aria-label="اسم الصورة"\n                  />`;
  if (!admin.includes(marker)) throw new Error('[patch-media-placement-links] media name input marker missing');
  const selector = `${marker}\n                  <div className="space-y-1">\n                    <label className="block text-[10px] font-bold text-amber-300">مكان استخدام الصورة</label>\n                    <select\n                      value={item.placement || 'none'}\n                      onChange={(event) => applyMediaPlacement(item, event.target.value as MediaLibraryItem['placement'])}\n                      className="w-full rounded-lg border border-amber-500/30 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-white focus:border-amber-400 focus:outline-none"\n                    >\n                      {MEDIA_PLACEMENT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}\n                    </select>\n                    {item.placement && item.placement !== 'none' && <p className="text-[10px] text-emerald-300">مرتبطة الآن بالموقع وتُحدَّث تلقائيًا عند الاستبدال.</p>}\n                  </div>`;
  admin = admin.replace(marker, selector);
}

// Explain the live-link behavior in the library header.
admin = admin.replace(
  'ارفعي صورة جديدة أو استبدلي أي صورة أو احذفيها. التغيير يتم من لوحة التحكم مباشرة.',
  'ارفعي أو استبدلي أو احذفي الصور، وحددي مكان استخدامها. الصورة المرتبطة تتغير تلقائيًا في مكانها على الموقع.'
);

write(adminFile, admin);
console.log('[patch-media-placement-links] Media Library images are linked to live logo/banner/avatar placements.');
