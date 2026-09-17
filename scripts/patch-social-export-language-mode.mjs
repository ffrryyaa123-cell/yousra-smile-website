import fs from 'node:fs';

const file = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const replaceRegex = (pattern, replacement, label) => {
  if (source.includes(replacement)) return;
  if (!pattern.test(source)) throw new Error(`[patch-social-export-language-mode] Missing ${label}`);
  source = source.replace(pattern, replacement);
};

const languageBlock = "  const hasArabic = (value?: string) => /[\\u0600-\\u06FF]/.test(value || '');\n" +
  "  const isEnglishSafe = (value?: string) => Boolean(value?.trim()) && !hasArabic(value);\n\n" +
  "  // Public/export language follows the selected site mode. Brand/model names\n" +
  "  // remain in their original Latin spelling when they are the canonical name.\n" +
  "  const title = language === 'en'\n" +
  "    ? (product?.seoTitleEn || product?.titleEn || (isEnglishSafe(video.title) ? video.title : '') || (product?.brand ? product.brand + ' Product Review' : 'Yousra Smile Product Review'))\n" +
  "    : (product?.seoTitleAr || product?.titleAr || (hasArabic(video.title) ? video.title : '') || (product?.brand ? 'مراجعة ' + product.brand : 'مراجعة منتج من Yousra Smile'));\n\n" +
  "  const description = language === 'en'\n" +
  "    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || (isEnglishSafe(video.seoDescription) ? video.seoDescription : '') || ('Watch this ' + title + ' review from Yousra Smile. Check the current product details, availability, and affiliate link before purchasing.'))\n" +
  "    : (product?.seoDescriptionAr || product?.description || product?.longDescription || (hasArabic(video.seoDescription) ? video.seoDescription : '') || ('شاهد مراجعة ' + title + ' من Yousra Smile، وتحقق من تفاصيل المنتج والسعر والتوفر الحالي قبل الشراء.'));";

replaceRegex(
  /  const title = language === 'en'[\s\S]*?  const description = language === 'en'[\s\S]*?;(?=\n  const hashtags|\n\n  const hashtags)/,
  languageBlock,
  'title/description block',
);

const hashtagBlock = "  const hashtags = useMemo(() => {\n" +
  "    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);\n" +
  "    const rawVideoTags = video.hashtags || [];\n" +
  "    const fallback = language === 'en'\n" +
  "      ? rawVideoTags.filter(tag => !hasArabic(tag))\n" +
  "      : rawVideoTags.filter(tag => hasArabic(tag) || /^#[A-Za-z0-9_]+$/.test(tag));\n" +
  "    const defaults = language === 'en'\n" +
  "      ? ['#YousraSmile', '#ProductReview', '#SmartShopping']\n" +
  "      : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];\n" +
  "    return Array.from(new Set([...productTags, ...fallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');\n" +
  "  }, [language, product, video.hashtags]);";

replaceRegex(
  /  const hashtags = useMemo\(\(\) => \{[\s\S]*?\n  \}, \[language, product, video\.hashtags\]\);/,
  hashtagBlock,
  'hashtags block',
);

const captionBlock = "  const affiliateLine = affiliateUrl\n" +
  "    ? (language === 'en' ? 'Shop / Affiliate link: ' + affiliateUrl : 'رابط الشراء / رابط العمولة: ' + affiliateUrl)\n" +
  "    : '';\n" +
  "  const videoLine = videoUrl\n" +
  "    ? (language === 'en' ? 'Video: ' + videoUrl : 'الفيديو: ' + videoUrl)\n" +
  "    : '';\n" +
  "  const caption = [title, description, hashtags, affiliateLine, videoLine]\n" +
  "    .filter(Boolean)\n" +
  "    .join('\\n\\n');";

replaceRegex(
  /  const caption = \[[\s\S]*?\n    \.join\('\\n\\n'\);/,
  captionBlock,
  'caption block',
);

source = source
  .replace('<CopyRow label="HASHTAGS"', "<CopyRow label={language === 'en' ? 'HASHTAGS' : 'الهاشتاغات'}")
  .replace('<CopyRow label="AFFILIATE URL"', "<CopyRow label={language === 'en' ? 'AFFILIATE URL' : 'رابط العمولة'}")
  .replace('<CopyRow label="VIDEO URL"', "<CopyRow label={language === 'en' ? 'VIDEO URL' : 'رابط الفيديو'}")
  .replace("{copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة'}", "{language === 'en' ? (copied === 'package' ? 'Publishing package copied' : 'Copy complete publishing package') : (copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة')}")
  .replace('> رابط العمولة <ExternalLink', "> {language === 'en' ? 'Affiliate link' : 'رابط العمولة'} <ExternalLink");

fs.writeFileSync(file, source, 'utf8');
console.log('[patch-social-export-language-mode] Social export follows the selected Arabic/English mode.');
