import fs from 'node:fs';

const file = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const replaceRequired = (needle, replacement, label) => {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) throw new Error(`[patch-social-export-language-mode] Missing ${label}`);
  source = source.replace(needle, replacement);
};

replaceRequired(
  "  const title = language === 'en'\n    ? (product?.seoTitleEn || product?.titleEn || video.title || video.productTitle)\n    : (product?.seoTitleAr || product?.titleAr || video.productTitle || video.title);\n  const description = language === 'en'\n    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || video.seoDescription || video.title)\n    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);\n",
  `  const hasArabic = (value?: string) => /[\\u0600-\\u06FF]/.test(value || '');\n  const isEnglishSafe = (value?: string) => Boolean(value?.trim()) && !hasArabic(value);\n\n  // Public/export language follows the selected site mode. Brand/model names\n  // remain in their original Latin spelling when they are the canonical name.\n  const title = language === 'en'\n    ? (product?.seoTitleEn || product?.titleEn || (isEnglishSafe(video.title) ? video.title : '') || (product?.brand ? \\`\\${product.brand} Product Review\\` : 'Yousra Smile Product Review'))\n    : (product?.seoTitleAr || product?.titleAr || (hasArabic(video.title) ? video.title : '') || (product?.brand ? \\`مراجعة \\${product.brand}\\` : 'مراجعة منتج من Yousra Smile'));\n\n  const description = language === 'en'\n    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || (isEnglishSafe(video.seoDescription) ? video.seoDescription : '') || \\`Watch this \\${title} review from Yousra Smile. Check the current product details, availability, and affiliate link before purchasing.\\`)\n    : (product?.seoDescriptionAr || product?.description || product?.longDescription || (hasArabic(video.seoDescription) ? video.seoDescription : '') || \\`شاهد مراجعة \\${title} من Yousra Smile، وتحقق من تفاصيل المنتج والسعر والتوفر الحالي قبل الشراء.\\`);\n`,
  'language-safe title/description block',
);

replaceRequired(
  "    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n    const fallback = video.hashtags || [];\n    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n    return Array.from(new Set([...productTags, ...fallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');\n",
  `    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n    const rawVideoTags = video.hashtags || [];\n    const fallback = language === 'en'\n      ? rawVideoTags.filter(tag => !hasArabic(tag))\n      : rawVideoTags.filter(tag => hasArabic(tag) || /^#[A-Za-z0-9_]+$/.test(tag));\n    const defaults = language === 'en'\n      ? ['#YousraSmile', '#ProductReview', '#SmartShopping']\n      : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n    return Array.from(new Set([...productTags, ...fallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');\n`,
  'language-filtered hashtags block',
);

replaceRequired(
  "  const caption = [title, description, hashtags, affiliateUrl ? `Shop / Affiliate link: ${affiliateUrl}` : '', videoUrl ? `Video: ${videoUrl}` : '']\n    .filter(Boolean)\n    .join('\\n\\n');\n",
  `  const affiliateLine = affiliateUrl\n    ? (language === 'en' ? \\`Shop / Affiliate link: \\${affiliateUrl}\\` : \\`رابط الشراء / رابط العمولة: \\${affiliateUrl}\\`)\n    : '';\n  const videoLine = videoUrl\n    ? (language === 'en' ? \\`Video: \\${videoUrl}\\` : \\`الفيديو: \\${videoUrl}\\`)\n    : '';\n  const caption = [title, description, hashtags, affiliateLine, videoLine]\n    .filter(Boolean)\n    .join('\\n\\n');\n`,
  'localized publishing package labels',
);

replaceRequired(
  "          <CopyRow label=\"HASHTAGS\" value={hashtags} copied={copied} setCopied={setCopied} />\n          <CopyRow label=\"AFFILIATE URL\" value={affiliateUrl} copied={copied} setCopied={setCopied} />\n          <CopyRow label=\"VIDEO URL\" value={videoUrl} copied={copied} setCopied={setCopied} />",
  "          <CopyRow label={language === 'en' ? 'HASHTAGS' : 'الهاشتاغات'} value={hashtags} copied={copied} setCopied={setCopied} />\n          <CopyRow label={language === 'en' ? 'AFFILIATE URL' : 'رابط العمولة'} value={affiliateUrl} copied={copied} setCopied={setCopied} />\n          <CopyRow label={language === 'en' ? 'VIDEO URL' : 'رابط الفيديو'} value={videoUrl} copied={copied} setCopied={setCopied} />",
  'localized export field labels',
);

replaceRequired(
  "{copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة'}",
  "{language === 'en' ? (copied === 'package' ? 'Publishing package copied' : 'Copy complete publishing package') : (copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة')}",
  'localized copy package button',
);

replaceRequired(
  "<ShoppingBag className=\"h-4 w-4\" /> رابط العمولة <ExternalLink className=\"h-3 w-3\" />",
  "<ShoppingBag className=\"h-4 w-4\" /> {language === 'en' ? 'Affiliate link' : 'رابط العمولة'} <ExternalLink className=\"h-3 w-3\" />",
  'localized affiliate button',
);

fs.writeFileSync(file, source, 'utf8');
console.log('[patch-social-export-language-mode] Social export follows the selected Arabic/English mode.');
