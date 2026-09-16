import fs from 'node:fs';

const replaceRequired = (source, needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-language-and-sitemap-safety] Missing ${label}`);
  return source.replace(needle, replacement);
};

// 1) Never publish malformed legacy product URLs such as prod-18--prod-18.
// A product without a real title stays available in the app/admin, but is held out
// of static SEO/sitemap until its canonical catalog title has been restored.
const seoFile = new URL('./generate-static-seo.mjs', import.meta.url);
let seo = fs.readFileSync(seoFile, 'utf8');
if (!seo.includes('const seoProducts = products.filter')) {
  seo = replaceRequired(
    seo,
    "if (!products.length) {\n  throw new Error('[generate-static-seo] Public product catalog is empty; refusing to publish an empty sitemap.');\n}\n",
    "if (!products.length) {\n  throw new Error('[generate-static-seo] Public product catalog is empty; refusing to publish an empty sitemap.');\n}\n\nconst hasMeaningfulTitle = product => {\n  const title = String(product.titleEn || product.titleAr || '').trim();\n  if (!title) return false;\n  const id = String(product.id || '').trim().toLowerCase();\n  const normalized = title.toLowerCase();\n  return normalized !== id && normalized !== `product ${id}` && normalized !== 'featured product' && normalized !== 'product';\n};\nconst seoProducts = products.filter(hasMeaningfulTitle);\nconst heldFromSeo = products.length - seoProducts.length;\nif (heldFromSeo > 0) console.warn(`[generate-static-seo] Held ${heldFromSeo} incomplete legacy products out of sitemap until their real titles are restored.`);\n",
    'SEO product validation insertion'
  );
  seo = seo.replace('for (const product of products) {', 'for (const product of seoProducts) {');
  seo = seo.replace('...products.map(product => ({ loc: absoluteProductUrl(product), lastmod: product._updatedAt || nowIso }))', '...seoProducts.map(product => ({ loc: absoluteProductUrl(product), lastmod: product._updatedAt || nowIso }))');
  seo = seo.replace('Generated ${products.length} product pages', 'Generated ${seoProducts.length} product pages');
}
fs.writeFileSync(seoFile, seo, 'utf8');

// 2) Strict public/review language mode.
// English mode must never fall back to Arabic product/review copy or Arabic hashtags.
// Brand/model names are preserved exactly as stored and are never translated.
const socialFile = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
let social = fs.readFileSync(socialFile, 'utf8');

const oldTitle = `  const title = language === 'en'\n    ? (product?.seoTitleEn || product?.titleEn || video.title || video.productTitle)\n    : (product?.seoTitleAr || product?.titleAr || video.productTitle || video.title);`;
const newTitle = `  const title = language === 'en'\n    ? (product?.seoTitleEn || product?.titleEn || [product?.brand, product?.id].filter(Boolean).join(' ') || 'Product Review')\n    : (product?.seoTitleAr || product?.titleAr || product?.titleEn || video.productTitle || video.title);`;
if (social.includes(oldTitle)) social = social.replace(oldTitle, newTitle);

const oldDescription = `  const description = language === 'en'\n    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || video.seoDescription || video.title)\n    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);`;
const newDescription = `  const description = language === 'en'\n    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || (product?.titleEn ? \`Review, features and buying details for \${product.titleEn}.\` : 'Product review, features and buying details.'))\n    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);`;
if (social.includes(oldDescription)) social = social.replace(oldDescription, newDescription);

const oldTags = `    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n    const fallback = video.hashtags || [];\n    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n    return Array.from(new Set([...productTags, ...fallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');`;
const newTags = `    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n    const fallback = video.hashtags || [];\n    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n    const selectedFallback = language === 'en' ? fallback.filter(tag => !/[\\u0600-\\u06FF]/.test(String(tag))) : fallback;\n    return Array.from(new Set([...productTags, ...selectedFallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');`;
if (social.includes(oldTags)) social = social.replace(oldTags, newTags);

// Translate the remaining review/export controls according to the active mode.
social = social
  .replace("{copied === label ? 'تم' : 'نسخ'}", "{copied === label ? (language === 'en' ? 'Copied' : 'تم') : (language === 'en' ? 'Copy' : 'نسخ')}")
  .replace("{copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة'}", "{copied === 'package' ? (language === 'en' ? 'Publishing package copied' : 'تم نسخ الحزمة') : (language === 'en' ? 'Copy complete publishing package' : 'نسخ حزمة النشر كاملة')}")
  .replace('> رابط العمولة <ExternalLink', ">{language === 'en' ? 'Affiliate link' : 'رابط العمولة'} <ExternalLink");

fs.writeFileSync(socialFile, social, 'utf8');
console.log('[patch-language-and-sitemap-safety] Strict language mode + safe sitemap enabled.');
