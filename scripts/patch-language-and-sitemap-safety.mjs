import fs from 'node:fs';

const replaceRequired = (source, needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-language-and-sitemap-safety] Missing ${label}`);
  return source.replace(needle, replacement);
};

// 1) Recover canonical legacy titles for static SEO from the checked-in catalog,
// then keep any still-incomplete rows out of the sitemap. This prevents URLs such
// as /product/prod-18--prod-18 while preserving the real product slug when the
// canonical title is available in src/data/initialProducts.ts.
const seoFile = new URL('./generate-static-seo.mjs', import.meta.url);
let seo = fs.readFileSync(seoFile, 'utf8');

if (!seo.includes('const canonicalLegacyProducts =')) {
  const needle = "const products = (rows || [])\n  .map(row => ({ ...(row.data || {}), id: row.id, _updatedAt: row.updated_at || nowIso }))\n  .filter(product => product && product.id && product.isActive !== false && !product.isHidden);";
  const replacement = `const canonicalLegacyProducts = (() => {\n  try {\n    const sourcePath = path.join(ROOT, 'src', 'data', 'initialProducts.ts');\n    const source = fs.readFileSync(sourcePath, 'utf8');\n    const marker = 'export const INITIAL_PRODUCTS';\n    const markerPos = source.indexOf(marker);\n    const equalsPos = markerPos >= 0 ? source.indexOf('=', markerPos) : -1;\n    const arrayEnd = source.lastIndexOf('];');\n    if (equalsPos < 0 || arrayEnd < equalsPos) return new Map();\n    const arraySource = source.slice(equalsPos + 1, arrayEnd + 1);\n    const items = Function(\`\"use strict\"; return (\${arraySource});\`)();\n    return new Map((Array.isArray(items) ? items : []).filter(item => item?.id).map(item => [String(item.id), item]));\n  } catch (error) {\n    console.warn('[generate-static-seo] Could not load canonical legacy titles:', error?.message || error);\n    return new Map();\n  }\n})();\n\nconst isPlaceholderTitle = (value, id = '') => {\n  const text = String(value || '').trim();\n  if (!text) return true;\n  const normalized = text.toLowerCase();\n  const normalizedId = String(id || '').trim().toLowerCase();\n  return normalized === normalizedId || normalized === \`product \${normalizedId}\` || normalized === 'featured product' || normalized === 'product';\n};\n\nconst recoverCanonicalLegacyFields = product => {\n  const canonical = canonicalLegacyProducts.get(String(product.id || ''));\n  if (!canonical) return product;\n  return {\n    ...product,\n    titleEn: isPlaceholderTitle(product.titleEn, product.id) ? (canonical.titleEn || product.titleEn) : product.titleEn,\n    titleAr: isPlaceholderTitle(product.titleAr, product.id) ? (canonical.titleAr || product.titleAr) : product.titleAr,\n    brand: String(product.brand || '').trim() || canonical.brand || '',\n    descriptionEn: String(product.descriptionEn || '').trim() || canonical.descriptionEn || '',\n    description: String(product.description || '').trim() || canonical.description || '',\n  };\n};\n\nconst products = (rows || [])\n  .map(row => ({ ...(row.data || {}), id: row.id, _updatedAt: row.updated_at || nowIso }))\n  .map(recoverCanonicalLegacyFields)\n  .filter(product => product && product.id && product.isActive !== false && !product.isHidden);`;
  seo = replaceRequired(seo, needle, replacement, 'canonical legacy SEO recovery');
}

if (!seo.includes('const seoProducts = products.filter')) {
  seo = replaceRequired(
    seo,
    "if (!products.length) {\n  throw new Error('[generate-static-seo] Public product catalog is empty; refusing to publish an empty sitemap.');\n}\n",
    "if (!products.length) {\n  throw new Error('[generate-static-seo] Public product catalog is empty; refusing to publish an empty sitemap.');\n}\n\nconst hasMeaningfulTitle = product => {\n  const title = String(product.titleEn || product.titleAr || '').trim();\n  if (!title) return false;\n  const id = String(product.id || '').trim().toLowerCase();\n  const normalized = title.toLowerCase();\n  return normalized !== id && normalized !== `product ${id}` && normalized !== 'featured product' && normalized !== 'product';\n};\nconst seoProducts = products.filter(hasMeaningfulTitle);\nconst heldFromSeo = products.length - seoProducts.length;\nif (heldFromSeo > 0) console.warn(`[generate-static-seo] Held ${heldFromSeo} incomplete products out of sitemap until their real titles are restored.`);\n",
    'SEO product validation insertion'
  );
  seo = seo.replace('for (const product of products) {', 'for (const product of seoProducts) {');
  seo = seo.replace('...products.map(product => ({ loc: absoluteProductUrl(product), lastmod: product._updatedAt || nowIso }))', '...seoProducts.map(product => ({ loc: absoluteProductUrl(product), lastmod: product._updatedAt || nowIso }))');
  seo = seo.replace('Generated ${products.length} product pages', 'Generated ${seoProducts.length} product pages');
}
fs.writeFileSync(seoFile, seo, 'utf8');

// 2) Strict review/export language mode.
// English mode must never fall back to Arabic copy or Arabic hashtags.
const socialFile = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
let social = fs.readFileSync(socialFile, 'utf8');

const oldCopyRow = "const CopyRow: React.FC<{ label: string; value: string; copied: string; setCopied: (value: string) => void }> = ({ label, value, copied, setCopied }) => (";
const newCopyRow = "const CopyRow: React.FC<{ label: string; value: string; copied: string; setCopied: (value: string) => void; language: 'ar' | 'en' }> = ({ label, value, copied, setCopied, language }) => (";
if (social.includes(oldCopyRow)) social = social.replace(oldCopyRow, newCopyRow);
if (!social.includes('<CopyRow language={language} label=')) {
  social = social.replace(/<CopyRow label=/g, '<CopyRow language={language} label=');
}

const oldTitle = `  const title = language === 'en'\n    ? (product?.seoTitleEn || product?.titleEn || video.title || video.productTitle)\n    : (product?.seoTitleAr || product?.titleAr || video.productTitle || video.title);`;
const newTitle = `  const title = language === 'en'\n    ? (product?.seoTitleEn || product?.titleEn || [product?.brand, product?.id].filter(Boolean).join(' ') || 'Product Review')\n    : (product?.seoTitleAr || product?.titleAr || product?.titleEn || video.productTitle || video.title);`;
if (social.includes(oldTitle)) social = social.replace(oldTitle, newTitle);

const oldDescription = `  const description = language === 'en'\n    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || video.seoDescription || video.title)\n    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);`;
const newDescription = `  const description = language === 'en'\n    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || (product?.titleEn ? \`Review, features and buying details for \${product.titleEn}.\` : 'Product review, features and buying details.'))\n    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);`;
if (social.includes(oldDescription)) social = social.replace(oldDescription, newDescription);

const oldTags = `    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n    const fallback = video.hashtags || [];\n    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n    return Array.from(new Set([...productTags, ...fallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');`;
const newTags = `    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n    const fallback = video.hashtags || [];\n    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n    const selectedFallback = language === 'en' ? fallback.filter(tag => !/[\\u0600-\\u06FF]/.test(String(tag))) : fallback;\n    return Array.from(new Set([...productTags, ...selectedFallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');`;
if (social.includes(oldTags)) social = social.replace(oldTags, newTags);

social = social
  .replace("{copied === label ? 'تم' : 'نسخ'}", "{copied === label ? (language === 'en' ? 'Copied' : 'تم') : (language === 'en' ? 'Copy' : 'نسخ')}")
  .replace("{copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة'}", "{copied === 'package' ? (language === 'en' ? 'Publishing package copied' : 'تم نسخ الحزمة') : (language === 'en' ? 'Copy complete publishing package' : 'نسخ حزمة النشر كاملة')}")
  .replace('> رابط العمولة <ExternalLink', ">{language === 'en' ? 'Affiliate link' : 'رابط العمولة'} <ExternalLink");

fs.writeFileSync(socialFile, social, 'utf8');

// 3) Strict language on public product surfaces. Brand/model values are left
// untouched because they are proper names and should not be translated.
const cardFile = new URL('../src/components/ProductCard.tsx', import.meta.url);
let card = fs.readFileSync(cardFile, 'utf8');
card = card
  .replace("const displayTitle = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;", "const displayTitle = language === 'en' ? (product.titleEn || product.brand || 'Product') : (product.titleAr || product.titleEn || product.brand || 'منتج');")
  .replace("const displayDesc = language === 'en' ? (product.descriptionEn || product.description) : product.description;", "const displayDesc = language === 'en' ? (product.descriptionEn || product.longDescriptionEn || '') : (product.description || product.longDescription || '');");
fs.writeFileSync(cardFile, card, 'utf8');

const detailFile = new URL('../src/components/ProductDetailModal.tsx', import.meta.url);
let detail = fs.readFileSync(detailFile, 'utf8');
detail = detail
  .replace("const displayTitle = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;", "const displayTitle = language === 'en' ? (product.titleEn || product.brand || 'Product') : (product.titleAr || product.titleEn || product.brand || 'منتج');")
  .replace('title: product.titleAr,', 'title: displayTitle,');
fs.writeFileSync(detailFile, detail, 'utf8');

const headerFile = new URL('../src/components/Header.tsx', import.meta.url);
let header = fs.readFileSync(headerFile, 'utf8');
header = header.replace("{language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr}", "{language === 'en' ? (product.titleEn || product.brand || 'Product') : (product.titleAr || product.titleEn || product.brand || 'منتج')}");
fs.writeFileSync(headerFile, header, 'utf8');

// 4) Reviews page follows the active language. In English mode, old Arabic
// review titles are replaced inline by the linked product's English title.
const videosFile = new URL('../src/pages/VideosPage.tsx', import.meta.url);
let videos = fs.readFileSync(videosFile, 'utf8');
videos = videos.replace(
  "const { videos, visibleProducts: products, openVideoModal, removeVideoThumbnail, deleteVideo, logAffiliateClick, formatPrice, getAffiliateUrl, openImportVideoModal } = useApp();",
  "const { videos, visibleProducts: products, openVideoModal, removeVideoThumbnail, deleteVideo, logAffiliateClick, formatPrice, getAffiliateUrl, openImportVideoModal, language } = useApp();"
);
videos = videos
  .replace('مكتبة فيديوهات المراجعات', "{language === 'en' ? 'Video Review Library' : 'مكتبة فيديوهات المراجعات'}")
  .replace('شاهد مراجعات يسرى سمايل قبل الشراء 🎥', "{language === 'en' ? 'Watch Yousra Smile reviews before you buy 🎥' : 'شاهد مراجعات يسرى سمايل قبل الشراء 🎥'}")
  .replace('شاهد فيديوهات المراجعات وتصفّح تفاصيل المنتجات وروابط المتاجر.', "{language === 'en' ? 'Watch product reviews and browse product details and retailer links.' : 'شاهد فيديوهات المراجعات وتصفّح تفاصيل المنتجات وروابط المتاجر.'}")
  .replace('جميع المنصات ({videos.length})', "{language === 'en' ? `All platforms (${videos.length})` : `جميع المنصات (${videos.length})`}")
  .replace('يوتيوب (YouTube)', "{language === 'en' ? 'YouTube' : 'يوتيوب (YouTube)'}")
  .replace('تيك توك (TikTok)', "{language === 'en' ? 'TikTok' : 'تيك توك (TikTok)'}")
  .replace('بنترست (Pinterest)', "{language === 'en' ? 'Pinterest' : 'بنترست (Pinterest)'}")
  .replace('                    {video.productTitle}', "                    {language === 'en' ? (linkedProd?.titleEn || linkedProd?.brand || 'Product') : (linkedProd?.titleAr || video.productTitle || linkedProd?.titleEn || 'منتج')}")
  .replace('                    {video.title}', "                    {language === 'en' ? (linkedProd?.titleEn ? `Yousra Smile Review: ${linkedProd.titleEn}` : (!/[\\u0600-\\u06FF]/.test(String(video.title || '')) ? (video.title || 'Product Review') : 'Product Review')) : video.title}")
  .replace('سعر الشراء المباشر:', "{language === 'en' ? 'Current buying price:' : 'سعر الشراء المباشر:'}")
  .replace('شراء من أمازون', "{language === 'en' ? 'Buy on Amazon' : 'شراء من أمازون'}");
fs.writeFileSync(videosFile, videos, 'utf8');

console.log('[patch-language-and-sitemap-safety] Strict bilingual public mode + canonical sitemap recovery enabled.');
