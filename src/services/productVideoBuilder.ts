import { Product, VideoScene } from '../types';
import { proxiedImageUrl, resolveAffiliateUrl } from './videoAssets';

/**
 * Builds a promotional video storyboard from a product that already exists in
 * the catalog.
 *
 * The old path did the opposite: it threw the product away, sent its URL to a
 * server route that no longer exists, and — when that 404'd — fell back to a
 * block of hard-coded copy (brand "SmartLife", a $79 price, two stock photos).
 * That fallback is identical for every product, which is exactly why every
 * generated video looked the same.
 *
 * Everything below is derived from the product's own saved record: its title,
 * brand, real prices, real photos, real features and the owner's own affiliate
 * link. Nothing is invented, and nothing is shared between products.
 */

const arabicOrEnglish = (ar?: string, en?: string): string => (ar && ar.trim()) || (en && en.trim()) || '';

/** Picks distinct images so "before / after" never shows the same photo twice. */
const pickImages = (product: Product): { hero: string; before: string; after: string } => {
  const pool = [product.image, ...(product.images ?? [])]
    .map(src => (src ?? '').trim())
    .filter(src => src.length > 0);

  const unique: string[] = [];
  pool.forEach(src => {
    if (!unique.includes(src)) unique.push(src);
  });

  const hero = unique[0] ?? '';
  return {
    hero,
    before: unique[1] ?? hero,
    after: unique[2] ?? unique[1] ?? hero
  };
};

const formatPrice = (value: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency;
  const rounded = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  return `${rounded}${symbol === '$' ? ' USD' : ' ' + symbol}`;
};

export interface BuiltProductVideo {
  scenes: VideoScene[];
  videoTitle: string;
  hook: string;
  callToAction: string;
  caption: string;
  hashtags: string[];
  affiliateUrl: string;
  heroImage: string;
  beforeImage: string;
  afterImage: string;
  estimatedDurationSeconds: number;
}

/**
 * Assembles the storyboard. Throws when the product has no usable affiliate link
 * or no image, because a video without either is worse than no video at all.
 */
export const buildVideoFromProduct = (product: Product): BuiltProductVideo => {
  // Resolved first: a product without a real affiliate link must stop here
  // rather than produce a video that sends buyers nowhere.
  const affiliateUrl = resolveAffiliateUrl(product);

  const images = pickImages(product);
  if (!images.hero) {
    throw new Error('لا توجد صورة محفوظة لهذا المنتج. أضيفي صورة واحدة على الأقل قبل توليد الفيديو.');
  }

  const title = arabicOrEnglish(product.titleAr, product.titleEn);
  const titleEn = arabicOrEnglish(product.titleEn, product.titleAr);
  const brand = (product.brand ?? '').trim();
  const category = arabicOrEnglish(product.subcategory, product.subcategoryEn);

  const features = (product.features ?? []).map(f => (f ?? '').trim()).filter(Boolean);
  const specEntries = Object.entries(product.specs ?? {}).filter(([, v]) => Boolean(v));

  const discountPercent =
    product.discountPercent ||
    (product.originalPrice > 0
      ? Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100)
      : 0);

  const priceLine =
    product.discountPrice > 0 && product.discountPrice < product.originalPrice
      ? `${formatPrice(product.discountPrice, product.currency)} بدلاً من ${formatPrice(product.originalPrice, product.currency)}`
      : formatPrice(product.originalPrice || product.discountPrice, product.currency);

  // Scene copy is templated around the product's own words, so two products
  // never produce the same script.
  const hook = category
    ? `تبحثين عن ${category} يستحق فعلاً؟ شوفي ${title}`
    : `شوفي ${title} قبل ما تشتري أي شي غيره`;

  const scenes: VideoScene[] = [
    {
      timeRange: '0-4s',
      sceneType: 'before_problem',
      visualPrompt: `Product hero shot: ${titleEn}`,
      voiceoverText: hook,
      screenText: hook,
      sceneImage: proxiedImageUrl(images.hero)
    },
    {
      timeRange: '4-11s',
      sceneType: 'action',
      visualPrompt: `Close-up of ${titleEn}${brand ? ' by ' + brand : ''}`,
      voiceoverText: brand ? `${title} من ${brand}` : title,
      screenText: brand ? `${title}\n${brand}` : title,
      sceneImage: proxiedImageUrl(images.hero)
    },
    {
      timeRange: '11-19s',
      sceneType: 'specs',
      visualPrompt: `Feature highlights for ${titleEn}`,
      voiceoverText:
        features.length > 0
          ? features.slice(0, 3).join(' • ')
          : specEntries.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' • ') || title,
      screenText:
        features.length > 0
          ? features.slice(0, 3).join('\n')
          : specEntries.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('\n') || title,
      sceneImage: proxiedImageUrl(images.before)
    },
    {
      timeRange: '19-26s',
      sceneType: 'before_after',
      visualPrompt: `Comparison shots of ${titleEn}`,
      voiceoverText: features[3] ?? features[0] ?? title,
      screenText: features[3] ?? features[0] ?? title,
      sceneImage: proxiedImageUrl(images.after),
      beforeImage: proxiedImageUrl(images.before),
      afterImage: proxiedImageUrl(images.after),
      transformationNote: category || brand || ''
    },
    {
      timeRange: '26-32s',
      sceneType: 'cta',
      visualPrompt: `Call to action for ${titleEn}`,
      voiceoverText: `${priceLine} — اطلبيه الآن من الرابط`,
      screenText: discountPercent > 0 ? `خصم ${discountPercent}%\n${priceLine}` : priceLine,
      sceneImage: proxiedImageUrl(images.hero)
    }
  ];

  const hashtagSource = [
    brand,
    category,
    ...(product.keywords ?? []).slice(0, 4)
  ]
    .map(word => (word ?? '').trim())
    .filter(Boolean)
    .map(word => '#' + word.replace(/\s+/g, '_'));

  const hashtags = Array.from(new Set([...hashtagSource, '#يسرى_سمايل', '#تسوق_ذكي'])).slice(0, 10);

  const caption = [
    title,
    brand ? `العلامة: ${brand}` : '',
    features.length > 0 ? features.slice(0, 3).map(f => `• ${f}`).join('\n') : '',
    discountPercent > 0 ? `السعر بعد الخصم: ${priceLine}` : `السعر: ${priceLine}`,
    '',
    `رابط الشراء: ${affiliateUrl}`
  ]
    .filter(Boolean)
    .join('\n');

  return {
    scenes,
    videoTitle: title,
    hook,
    callToAction: 'اطلبيه الآن من الرابط',
    caption,
    hashtags,
    affiliateUrl,
    heroImage: proxiedImageUrl(images.hero),
    beforeImage: proxiedImageUrl(images.before),
    afterImage: proxiedImageUrl(images.after),
    estimatedDurationSeconds: 32
  };
};
