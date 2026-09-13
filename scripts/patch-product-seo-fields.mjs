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

if (!admin.includes('const deriveProductSeoFields =')) {
  admin = patchOnce(
    admin,
    'export const AdminPage: React.FC = () => {',
    `const cleanSeoText = (value?: string, max = 160) => (value || '').replace(/\\s+/g, ' ').trim().slice(0, max);\n\nconst uniqueSeo = (items: Array<string | undefined | null>) => Array.from(new Set(items.map(v => (v || '').trim()).filter(Boolean)));\n\nconst makeHashtag = (value?: string) => {\n  const cleaned = (value || '').trim().replace(/\\s+/g, '_').replace(/[^\\p{L}\\p{N}_-]/gu, '');\n  return cleaned ? '#' + cleaned : '';\n};\n\nconst deriveProductSeoFields = (product: Partial<Product>) => {\n  const titleAr = cleanSeoText(product.titleAr || product.titleEn, 80);\n  const titleEn = cleanSeoText(product.titleEn || product.titleAr, 80);\n  const brand = cleanSeoText(product.brand, 40);\n  const subAr = cleanSeoText(product.subcategory, 60);\n  const subEn = cleanSeoText(product.subcategoryEn || product.subcategory, 60);\n  const descArSource = product.description || product.longDescription || titleAr;\n  const descEnSource = product.descriptionEn || product.longDescriptionEn || product.description || titleEn;\n  const featureAr = (product.features || []).filter(Boolean).slice(0, 4);\n  const featureEn = (product.featuresEn || []).filter(Boolean).slice(0, 4);\n\n  const keywordsAr = uniqueSeo([\n    ...(product.keywordsAr || []),\n    titleAr,\n    brand,\n    subAr,\n    ...featureAr,\n    'مراجعة المنتج',\n    'تسوق ذكي'\n  ]).slice(0, 12);\n\n  const keywordsEn = uniqueSeo([\n    ...(product.keywordsEn || []),\n    titleEn,\n    brand,\n    subEn,\n    ...featureEn,\n    'product review',\n    'smart shopping',\n    'Yousra Smile'\n  ]).slice(0, 12);\n\n  const hashtagsAr = uniqueSeo([\n    ...(product.hashtagsAr || []),\n    makeHashtag(brand),\n    makeHashtag(subAr),\n    '#يسرى_سمايل',\n    '#تسوق_ذكي'\n  ]).filter(Boolean).slice(0, 10);\n\n  const hashtagsEn = uniqueSeo([\n    ...(product.hashtagsEn || []),\n    makeHashtag(brand),\n    makeHashtag(subEn),\n    '#YousraSmile',\n    '#ProductReview',\n    '#SmartShopping'\n  ]).filter(Boolean).slice(0, 10);\n\n  const seoTitleAr = cleanSeoText(product.seoTitleAr || [titleAr, brand].filter(Boolean).join(' | ') + ' | Yousra Smile', 70);\n  const seoTitleEn = cleanSeoText(product.seoTitleEn || [titleEn, brand].filter(Boolean).join(' | ') + ' | Yousra Smile', 70);\n  const seoDescriptionAr = cleanSeoText(product.seoDescriptionAr || descArSource, 160);\n  const seoDescriptionEn = cleanSeoText(product.seoDescriptionEn || descEnSource, 160);\n  const socialCaption = cleanSeoText(product.socialCaption || [titleAr, seoDescriptionAr, ...hashtagsAr].filter(Boolean).join(' '), 320);\n\n  return { seoTitleAr, seoTitleEn, seoDescriptionAr, seoDescriptionEn, keywordsAr, keywordsEn, hashtagsAr, hashtagsEn, socialCaption };\n};\n\nexport const AdminPage: React.FC = () => {`,
    'SEO derivation helper insertion'
  );
}

if (!admin.includes("seoTitleAr: '',")) {
  admin = patchOnce(admin, "    keywordsStr: '',\n    isFeatured:", "    keywordsStr: '',\n    seoTitleAr: '',\n    seoTitleEn: '',\n    seoDescriptionAr: '',\n    seoDescriptionEn: '',\n    keywordsArStr: '',\n    keywordsEnStr: '',\n    hashtagsArStr: '',\n    hashtagsEnStr: '',\n    socialCaption: '',\n    isFeatured:", 'initial form SEO fields');
}

if (!admin.includes('const seoBackfillDoneRef = React.useRef(false);')) {
  admin = patchOnce(
    admin,
    "  // Finishes a redirect based sign-in when the browser had to fall back to it.\n",
    `  const seoBackfillDoneRef = React.useRef(false);\n\n  React.useEffect(() => {\n    if (!isUnlocked || seoBackfillDoneRef.current || !products.length) return;\n    seoBackfillDoneRef.current = true;\n\n    products.forEach(prod => {\n      const derived = deriveProductSeoFields(prod);\n      const patch: Partial<Product> = {};\n      if (!prod.seoTitleAr) patch.seoTitleAr = derived.seoTitleAr;\n      if (!prod.seoTitleEn) patch.seoTitleEn = derived.seoTitleEn;\n      if (!prod.seoDescriptionAr) patch.seoDescriptionAr = derived.seoDescriptionAr;\n      if (!prod.seoDescriptionEn) patch.seoDescriptionEn = derived.seoDescriptionEn;\n      if (!prod.keywordsAr?.length) patch.keywordsAr = derived.keywordsAr;\n      if (!prod.keywordsEn?.length) patch.keywordsEn = derived.keywordsEn;\n      if (!prod.hashtagsAr?.length) patch.hashtagsAr = derived.hashtagsAr;\n      if (!prod.hashtagsEn?.length) patch.hashtagsEn = derived.hashtagsEn;\n      if (!prod.socialCaption) patch.socialCaption = derived.socialCaption;\n\n      if (Object.keys(patch).length) {\n        patchProduct(prod.id, patch);\n      }\n    });\n  }, [isUnlocked, products, patchProduct]);\n\n  // Finishes a redirect based sign-in when the browser had to fall back to it.\n`,
    'automatic SEO backfill effect'
  );
}

if (!admin.includes('const fallbackSeo = deriveProductSeoFields(prod);')) {
  admin = patchOnce(
    admin,
    "  const handleOpenEditModal = (prod: Product) => {\n    setEditingProduct(prod);\n",
    "  const handleOpenEditModal = (prod: Product) => {\n    const fallbackSeo = deriveProductSeoFields(prod);\n    setEditingProduct(prod);\n",
    'edit fallback SEO'
  );
}

if (!admin.includes('seoTitleAr: prod.seoTitleAr || fallbackSeo.seoTitleAr')) {
  admin = patchOnce(admin,
    "      keywordsStr: prod.keywords ? prod.keywords.join(', ') : '',\n      isFeatured:",
    "      keywordsStr: prod.keywords ? prod.keywords.join(', ') : '',\n      seoTitleAr: prod.seoTitleAr || fallbackSeo.seoTitleAr,\n      seoTitleEn: prod.seoTitleEn || fallbackSeo.seoTitleEn,\n      seoDescriptionAr: prod.seoDescriptionAr || fallbackSeo.seoDescriptionAr,\n      seoDescriptionEn: prod.seoDescriptionEn || fallbackSeo.seoDescriptionEn,\n      keywordsArStr: (prod.keywordsAr?.length ? prod.keywordsAr : fallbackSeo.keywordsAr).join(', '),\n      keywordsEnStr: (prod.keywordsEn?.length ? prod.keywordsEn : fallbackSeo.keywordsEn).join(', '),\n      hashtagsArStr: (prod.hashtagsAr?.length ? prod.hashtagsAr : fallbackSeo.hashtagsAr).join(' '),\n      hashtagsEnStr: (prod.hashtagsEn?.length ? prod.hashtagsEn : fallbackSeo.hashtagsEn).join(' '),\n      socialCaption: prod.socialCaption || fallbackSeo.socialCaption,\n      isFeatured:",
    'edit product SEO mapping');
}

if (!admin.includes('seoTitleAr: generatedTitleAr')) {
  admin = patchOnce(admin,
    "        keywordsStr: `${brand}, ${sub}, عروض_أمازون, أجهزة_منزلية, تسويق_أفلييت, يسرى_سمايل`,\n        rating:",
    "        keywordsStr: `${brand}, ${sub}, عروض_أمازون, أجهزة_منزلية, تسويق_أفلييت, يسرى_سمايل`,\n        seoTitleAr: generatedTitleAr,\n        seoTitleEn: generatedTitleEn,\n        seoDescriptionAr: `أفضل ${brand} ${sub} مع أهم المواصفات والمميزات وروابط الشراء الموثوقة من Yousra Smile.`,\n        seoDescriptionEn: `Discover ${brand} ${sub}, key features, specifications and trusted buying links from Yousra Smile.`,\n        keywordsArStr: `${brand}, ${sub}, أجهزة ذكية, عروض أمازون, يسرى سمايل`,\n        keywordsEnStr: `${brand}, ${sub}, smart home, product review, Yousra Smile`,\n        hashtagsArStr: `#يسرى_سمايل #أجهزة_ذكية #تسوق_ذكي`,\n        hashtagsEnStr: `#YousraSmile #SmartHome #ProductReview`,\n        socialCaption: `${generatedTitleAr} — اكتشفي المواصفات والمميزات وروابط الشراء.`,\n        rating:",
    'AI generated SEO mapping');
}

if (!admin.includes('const derivedSeo = deriveProductSeoFields({')) {
  admin = patchOnce(admin,
    "    const keywordsArray = formData.keywordsStr \n      ? formData.keywordsStr.split(',').map(s => s.trim()).filter(Boolean) \n      : [];\n",
    "    const keywordsArray = formData.keywordsStr \n      ? formData.keywordsStr.split(',').map(s => s.trim()).filter(Boolean) \n      : [];\n\n    const keywordsArArray = formData.keywordsArStr ? formData.keywordsArStr.split(',').map(s => s.trim()).filter(Boolean) : [];\n    const keywordsEnArray = formData.keywordsEnStr ? formData.keywordsEnStr.split(',').map(s => s.trim()).filter(Boolean) : [];\n    const hashtagsArArray = formData.hashtagsArStr ? formData.hashtagsArStr.split(/[\\s,]+/).map(s => s.trim()).filter(Boolean) : [];\n    const hashtagsEnArray = formData.hashtagsEnStr ? formData.hashtagsEnStr.split(/[\\s,]+/).map(s => s.trim()).filter(Boolean) : [];\n    const mergedKeywords = Array.from(new Set([...keywordsArray, ...keywordsArArray, ...keywordsEnArray]));\n    const derivedSeo = deriveProductSeoFields({\n      titleAr: formData.titleAr,\n      titleEn: formData.titleEn,\n      description: formData.description,\n      longDescription: formData.longDescription,\n      category: formData.category,\n      subcategory: formData.subcategory,\n      brand: formData.brand,\n      features: featuresArray,\n      keywords: mergedKeywords,\n      seoTitleAr: formData.seoTitleAr,\n      seoTitleEn: formData.seoTitleEn,\n      seoDescriptionAr: formData.seoDescriptionAr,\n      seoDescriptionEn: formData.seoDescriptionEn,\n      keywordsAr: keywordsArArray,\n      keywordsEn: keywordsEnArray,\n      hashtagsAr: hashtagsArArray,\n      hashtagsEn: hashtagsEnArray,\n      socialCaption: formData.socialCaption\n    });\n",
    'SEO array parsing and fallback derivation');
}

if (!admin.includes('seoTitleAr: formData.seoTitleAr || derivedSeo.seoTitleAr')) {
  admin = admin.replaceAll(
    '        keywords: keywordsArray,\n        isFeatured:',
    '        keywords: mergedKeywords.length ? mergedKeywords : [...derivedSeo.keywordsAr, ...derivedSeo.keywordsEn],\n        seoTitleAr: formData.seoTitleAr || derivedSeo.seoTitleAr,\n        seoTitleEn: formData.seoTitleEn || derivedSeo.seoTitleEn,\n        seoDescriptionAr: formData.seoDescriptionAr || derivedSeo.seoDescriptionAr,\n        seoDescriptionEn: formData.seoDescriptionEn || derivedSeo.seoDescriptionEn,\n        keywordsAr: keywordsArArray.length ? keywordsArArray : derivedSeo.keywordsAr,\n        keywordsEn: keywordsEnArray.length ? keywordsEnArray : derivedSeo.keywordsEn,\n        hashtagsAr: hashtagsArArray.length ? hashtagsArArray : derivedSeo.hashtagsAr,\n        hashtagsEn: hashtagsEnArray.length ? hashtagsEnArray : derivedSeo.hashtagsEn,\n        socialCaption: formData.socialCaption || derivedSeo.socialCaption,\n        isFeatured:'
  );
}

if (!admin.includes('SEO والتسويق — مطابق لبيانات SEO Text')) {
  admin = patchOnce(admin,
    '              {/* Toggles */}',
    `              {/* SEO & Marketing fields aligned with CU / SEO Text */}\n              <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">\n                <div>\n                  <h4 className="font-black text-emerald-300">SEO والتسويق — مطابق لبيانات SEO Text</h4>\n                  <p className="mt-1 text-[10px] text-slate-400">هذه الحقول تُحفظ مع المنتج وتبقى قابلة للتعديل بعد النشر. إذا كانت فارغة يتم توليدها تلقائياً من بيانات نفس المنتج.</p>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-white block mb-1">SEO Title — عربي</label><input type="text" value={formData.seoTitleAr} onChange={e => setFormData({ ...formData, seoTitleAr: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-white block mb-1">SEO Title — English</label><input dir="ltr" type="text" value={formData.seoTitleEn} onChange={e => setFormData({ ...formData, seoTitleEn: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-white block mb-1">SEO Description — عربي</label><textarea rows={3} value={formData.seoDescriptionAr} onChange={e => setFormData({ ...formData, seoDescriptionAr: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-white block mb-1">SEO Description — English</label><textarea dir="ltr" rows={3} value={formData.seoDescriptionEn} onChange={e => setFormData({ ...formData, seoDescriptionEn: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-sky-300 block mb-1">الكلمات المفتاحية — عربي</label><textarea rows={2} value={formData.keywordsArStr} onChange={e => setFormData({ ...formData, keywordsArStr: e.target.value })} className="w-full bg-slate-800 border border-sky-700/60 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-sky-300 block mb-1">Keywords — English</label><textarea dir="ltr" rows={2} value={formData.keywordsEnStr} onChange={e => setFormData({ ...formData, keywordsEnStr: e.target.value })} className="w-full bg-slate-800 border border-sky-700/60 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                  <div><label className="font-bold text-pink-300 block mb-1">الهاشتاغات — عربي</label><textarea rows={2} value={formData.hashtagsArStr} onChange={e => setFormData({ ...formData, hashtagsArStr: e.target.value })} className="w-full bg-slate-800 border border-pink-700/60 rounded-xl p-2.5 text-white" /></div>\n                  <div><label className="font-bold text-pink-300 block mb-1">Hashtags — English</label><textarea dir="ltr" rows={2} value={formData.hashtagsEnStr} onChange={e => setFormData({ ...formData, hashtagsEnStr: e.target.value })} className="w-full bg-slate-800 border border-pink-700/60 rounded-xl p-2.5 text-white" /></div>\n                </div>\n                <div><label className="font-bold text-amber-300 block mb-1">Social Caption / النص التسويقي للنشر</label><textarea rows={3} value={formData.socialCaption} onChange={e => setFormData({ ...formData, socialCaption: e.target.value })} className="w-full bg-slate-800 border border-amber-700/60 rounded-xl p-2.5 text-white" /></div>\n              </div>\n\n              {/* Toggles */}`,
    'SEO form section');
}

fs.writeFileSync(adminFile, admin, 'utf8');

const seoFile = new URL('../src/components/SeoTextHub.tsx', import.meta.url);
let seo = fs.readFileSync(seoFile, 'utf8');
if (seo.includes('keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),') && !seo.includes('seoTitleAr: bilingual.seoTitleAr')) {
  seo = patchOnce(seo,
    '        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),\n        coupon,',
    '        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),\n        seoTitleAr: bilingual.seoTitleAr || bilingual.titleAr || \'\',\n        seoTitleEn: bilingual.seoTitleEn || bilingual.titleEn || source.title || \'\',\n        seoDescriptionAr: bilingual.seoDescriptionAr || bilingual.descriptionAr || \'\',\n        seoDescriptionEn: bilingual.seoDescriptionEn || bilingual.descriptionEn || source.description || \'\',\n        keywordsAr: bilingual.keywordsAr || [],\n        keywordsEn: bilingual.keywordsEn || [],\n        hashtagsAr: bilingual.hashtagsAr || [],\n        hashtagsEn: bilingual.hashtagsEn || [],\n        socialCaption: [bilingual.titleAr, bilingual.descriptionAr, ...(bilingual.hashtagsAr || [])].filter(Boolean).join(\' \' ),\n        coupon,',
    'SEO Text save mapping');
  fs.writeFileSync(seoFile, seo, 'utf8');
}

console.log('[patch-product-seo-fields] Product manager aligned with SEO Text, with automatic backfill.');
