import fs from 'node:fs';

const patchOnce = (source, needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-product-seo-fields] Missing ${label}`);
  return source.replace(needle, replacement);
};

const typesFile = new URL('../src/types.ts', import.meta.url);
let types = fs.readFileSync(typesFile, 'utf8');
if (!types.includes('seoTitleAr?: string;')) {
  types = patchOnce(
    types,
    '  keywords: string[];\r\n',
    '  keywords: string[];\r\n  seoTitleAr?: string;\r\n  seoTitleEn?: string;\r\n  seoDescriptionAr?: string;\r\n  seoDescriptionEn?: string;\r\n  keywordsAr?: string[];\r\n  keywordsEn?: string[];\r\n  hashtagsAr?: string[];\r\n  hashtagsEn?: string[];\r\n  socialCaption?: string;\r\n',
    'Product SEO type fields'
  );
  fs.writeFileSync(typesFile, types, 'utf8');
}

const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = fs.readFileSync(adminFile, 'utf8');
if (!admin.includes("seoTitleAr: '',")) {
  admin = patchOnce(admin, "    keywordsStr: '',\n    isFeatured:", "    keywordsStr: '',\n    seoTitleAr: '',\n    seoTitleEn: '',\n    seoDescriptionAr: '',\n    seoDescriptionEn: '',\n    keywordsArStr: '',\n    keywordsEnStr: '',\n    hashtagsArStr: '',\n    hashtagsEnStr: '',\n    socialCaption: '',\n    isFeatured:", 'initial form SEO fields');
}

if (!admin.includes('seoTitleAr: prod.seoTitleAr')) {
  admin = patchOnce(admin,
    "      keywordsStr: prod.keywords ? prod.keywords.join(', ') : '',\n      isFeatured:",
    "      keywordsStr: prod.keywords ? prod.keywords.join(', ') : '',\n      seoTitleAr: prod.seoTitleAr || '',\n      seoTitleEn: prod.seoTitleEn || '',\n      seoDescriptionAr: prod.seoDescriptionAr || '',\n      seoDescriptionEn: prod.seoDescriptionEn || '',\n      keywordsArStr: (prod.keywordsAr || []).join(', '),\n      keywordsEnStr: (prod.keywordsEn || []).join(', '),\n      hashtagsArStr: (prod.hashtagsAr || []).join(' '),\n      hashtagsEnStr: (prod.hashtagsEn || []).join(' '),\n      socialCaption: prod.socialCaption || '',\n      isFeatured:",
    'edit product SEO mapping');
}

if (!admin.includes('seoTitleAr: generatedTitleAr')) {
  admin = patchOnce(admin,
    "        keywordsStr: `${brand}, ${sub}, عروض_أمازون, أجهزة_منزلية, تسويق_أفلييت, يسرى_سمايل`,\n        rating:",
    "        keywordsStr: `${brand}, ${sub}, عروض_أمازون, أجهزة_منزلية, تسويق_أفلييت, يسرى_سمايل`,\n        seoTitleAr: generatedTitleAr,\n        seoTitleEn: generatedTitleEn,\n        seoDescriptionAr: `أفضل ${brand} ${sub} مع أهم المواصفات والمميزات وروابط الشراء الموثوقة من Yousra Smile.`,\n        seoDescriptionEn: `Discover ${brand} ${sub}, key features, specifications and trusted buying links from Yousra Smile.`,\n        keywordsArStr: `${brand}, ${sub}, أجهزة ذكية, عروض أمازون, يسرى سمايل`,\n        keywordsEnStr: `${brand}, ${sub}, smart home, product review, Yousra Smile`,\n        hashtagsArStr: `#يسرى_سمايل #أجهزة_ذكية #تسوق_ذكي`,\n        hashtagsEnStr: `#YousraSmile #SmartHome #ProductReview`,\n        socialCaption: `${generatedTitleAr} — اكتشفي المواصفات والمميزات وروابط الشراء.`,\n        rating:",
    'AI generated SEO mapping');
}

if (!admin.includes('const keywordsArArray =')) {
  admin = patchOnce(admin,
    "    const keywordsArray = formData.keywordsStr \n      ? formData.keywordsStr.split(',').map(s => s.trim()).filter(Boolean) \n      : [];\n",
    "    const keywordsArray = formData.keywordsStr \n      ? formData.keywordsStr.split(',').map(s => s.trim()).filter(Boolean) \n      : [];\n\n    const keywordsArArray = formData.keywordsArStr ? formData.keywordsArStr.split(',').map(s => s.trim()).filter(Boolean) : [];\n    const keywordsEnArray = formData.keywordsEnStr ? formData.keywordsEnStr.split(',').map(s => s.trim()).filter(Boolean) : [];\n    const hashtagsArArray = formData.hashtagsArStr ? formData.hashtagsArStr.split(/[\\s,]+/).map(s => s.trim()).filter(Boolean) : [];\n    const hashtagsEnArray = formData.hashtagsEnStr ? formData.hashtagsEnStr.split(/[\\s,]+/).map(s => s.trim()).filter(Boolean) : [];\n    const mergedKeywords = Array.from(new Set([...keywordsArray, ...keywordsArArray, ...keywordsEnArray]));\n",
    'SEO array parsing');
}

if (!admin.includes('seoTitleAr: formData.seoTitleAr')) {
  admin = admin.replaceAll(
    '        keywords: keywordsArray,\n        isFeatured:',
    '        keywords: mergedKeywords,\n        seoTitleAr: formData.seoTitleAr,\n        seoTitleEn: formData.seoTitleEn,\n        seoDescriptionAr: formData.seoDescriptionAr,\n        seoDescriptionEn: formData.seoDescriptionEn,\n        keywordsAr: keywordsArArray,\n        keywordsEn: keywordsEnArray,\n        hashtagsAr: hashtagsArArray,\n        hashtagsEn: hashtagsEnArray,\n        socialCaption: formData.socialCaption,\n        isFeatured:'
  );
}

if (!admin.includes('SEO والتسويق — مطابق لبيانات SEO Text')) {
  admin = patchOnce(admin,
    '              {/* Toggles */}',
    `              {/* SEO & Marketing fields aligned with CU / SEO Text */}\n              <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">\n                <div>\n                  <h4 className="font-black text-emerald-300">SEO والتسويق — مطابق لبيانات SEO Text</h4>\n                  <p className="mt-1 text-[10px] text-slate-400">هذه الحقول تُحفظ مع المنتج وتبقى قابلة للتعديل بعد النشر.</p>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-white block mb-1">SEO Title — عربي</label><input type="text" value={formData.seoTitleAr} onChange={e => setFormData({ ...formData, seoTitleAr: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-white block mb-1">SEO Title — English</label><input dir="ltr" type="text" value={formData.seoTitleEn} onChange={e => setFormData({ ...formData, seoTitleEn: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-white block mb-1">SEO Description — عربي</label><textarea rows={3} value={formData.seoDescriptionAr} onChange={e => setFormData({ ...formData, seoDescriptionAr: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-white block mb-1">SEO Description — English</label><textarea dir="ltr" rows={3} value={formData.seoDescriptionEn} onChange={e => setFormData({ ...formData, seoDescriptionEn: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-sky-300 block mb-1">الكلمات المفتاحية — عربي</label><textarea rows={2} value={formData.keywordsArStr} onChange={e => setFormData({ ...formData, keywordsArStr: e.target.value })} placeholder="مكنسة ذكية, تنظيف أرضيات, عروض أمازون" className="w-full bg-slate-800 border border-sky-700/60 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-sky-300 block mb-1">Keywords — English</label><textarea dir="ltr" rows={2} value={formData.keywordsEnStr} onChange={e => setFormData({ ...formData, keywordsEnStr: e.target.value })} placeholder="robot vacuum, floor cleaner, Amazon deals" className="w-full bg-slate-800 border border-sky-700/60 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-pink-300 block mb-1">الهاشتاغات — عربي</label><textarea rows={2} value={formData.hashtagsArStr} onChange={e => setFormData({ ...formData, hashtagsArStr: e.target.value })} placeholder="#يسرى_سمايل #تسوق_ذكي" className="w-full bg-slate-800 border border-pink-700/60 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-pink-300 block mb-1">Hashtags — English</label><textarea dir="ltr" rows={2} value={formData.hashtagsEnStr} onChange={e => setFormData({ ...formData, hashtagsEnStr: e.target.value })} placeholder="#YousraSmile #SmartShopping" className="w-full bg-slate-800 border border-pink-700/60 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div><label className="font-bold text-amber-300 block mb-1">Social Caption / النص التسويقي للنشر</label><textarea rows={3} value={formData.socialCaption} onChange={e => setFormData({ ...formData, socialCaption: e.target.value })} className="w-full bg-slate-800 border border-amber-700/60 rounded-xl p-2.5 text-white" /></div>\n              </div>\n\n              {/* Toggles */}`,
    'SEO form section');
}

fs.writeFileSync(adminFile, admin, 'utf8');

const seoFile = new URL('../src/components/SeoTextHub.tsx', import.meta.url);
let seo = fs.readFileSync(seoFile, 'utf8');
if (seo.includes('keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),') && !seo.includes('seoTitleAr: bilingual.seoTitleAr')) {
  seo = patchOnce(seo,
    '        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),\n        coupon,',
    '        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),\n        seoTitleAr: bilingual.seoTitleAr || \'\',\n        seoTitleEn: bilingual.seoTitleEn || \'\',\n        seoDescriptionAr: bilingual.seoDescriptionAr || \'\',\n        seoDescriptionEn: bilingual.seoDescriptionEn || \'\',\n        keywordsAr: bilingual.keywordsAr || [],\n        keywordsEn: bilingual.keywordsEn || [],\n        hashtagsAr: bilingual.hashtagsAr || [],\n        hashtagsEn: bilingual.hashtagsEn || [],\n        socialCaption: [bilingual.titleAr, bilingual.descriptionAr, ...(bilingual.hashtagsAr || [])].filter(Boolean).join(\' \' ),\n        coupon,',
    'SEO Text save mapping');
  fs.writeFileSync(seoFile, seo, 'utf8');
}

console.log('[patch-product-seo-fields] Product manager aligned with SEO Text.');
