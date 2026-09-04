import {
  ProductVideoServiceInput,
  ProductVideoCampaignResult,
  ExtractedProductInfo,
  PromotionalVideoScript,
  VideoScene
} from '../types';
import { supabase } from './adminAccount';
import { generateOriginalProductImages } from './aiProductMedia';

export type SupportedCommercePlatform = 'amazon' | 'aliexpress' | 'noon' | 'shein' | 'other';

export interface SanitizedProductUrl {
  isValid: boolean;
  cleanUrl: string;
  platform: SupportedCommercePlatform;
  extractedId?: string;
  errorMessage?: string;
}

export function validateAndSanitizeUrl(rawUrl: string): SanitizedProductUrl {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return { isValid: false, cleanUrl: '', platform: 'other', errorMessage: 'رابط المنتج فارغ.' };
  if (/^(javascript:|data:|file:|vbscript:)/i.test(trimmed) || !/^https?:\/\//i.test(trimmed)) {
    return { isValid: false, cleanUrl: '', platform: 'other', errorMessage: 'استخدمي رابط المنتج الكامل من المتجر.' };
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    let platform: SupportedCommercePlatform = 'other';
    let extractedId: string | undefined;
    if (/amazon\.|amzn\.to|amzn\.eu|a\.co$/i.test(host)) {
      platform = 'amazon';
      extractedId = trimmed.match(/(?:\/dp\/|\/gp\/product\/|asin=)([A-Z0-9]{10})/i)?.[1]?.toUpperCase();
    } else if (/aliexpress/i.test(host)) {
      platform = 'aliexpress';
      extractedId = trimmed.match(/\/item\/(\d+)\.html/i)?.[1];
    } else if (/noon\.com/i.test(host)) {
      platform = 'noon';
    } else if (/shein\.com/i.test(host)) {
      platform = 'shein';
    }
    return { isValid: true, cleanUrl: `${parsed.origin}${parsed.pathname}`, platform, extractedId };
  } catch {
    return { isValid: false, cleanUrl: '', platform: 'other', errorMessage: 'رابط المنتج غير صالح.' };
  }
}

export function buildAffiliateLink(
  productUrl: string,
  options: { affiliateTag?: string; customAffiliateLink?: string; platform?: SupportedCommercePlatform } = {}
): string {
  const custom = String(options.customAffiliateLink || '').trim();
  if (/^https?:\/\//i.test(custom)) return custom;
  const sanitized = validateAndSanitizeUrl(productUrl);
  if (!sanitized.isValid) return productUrl;
  try {
    const url = new URL(productUrl);
    const tag = String(options.affiliateTag || '').trim();
    const platform = options.platform || sanitized.platform;
    if (tag && platform === 'amazon') url.searchParams.set('tag', tag);
    else if (tag && platform === 'aliexpress') {
      url.searchParams.set('aff_platform', 'true');
      url.searchParams.set('sk', tag);
    }
    return url.toString();
  } catch {
    return productUrl;
  }
}

export function extractBasicProductInfoFromUrl(productUrl: string, affiliateTag = '') {
  const sanitized = validateAndSanitizeUrl(productUrl);
  const label = sanitized.platform === 'amazon' ? 'Amazon' : sanitized.platform === 'aliexpress' ? 'AliExpress' : 'Product';
  return {
    name: sanitized.extractedId ? `${label} product ${sanitized.extractedId}` : `${label} product`,
    brand: '',
    cleanUrl: sanitized.cleanUrl,
    affiliateUrl: buildAffiliateLink(productUrl, { affiliateTag, platform: sanitized.platform }),
    platform: sanitized.platform,
    asinOrId: sanitized.extractedId
  };
}

const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
  : [];

const numberOrZero = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const productKindFrom = (title: string, category: string, features: string[]): string => {
  const text = `${title} ${category} ${features.join(' ')}`.toLowerCase();
  if (/tumbler|bottle|cup|mug|drinkware|hydration/.test(text)) return 'drinkware';
  if (/vacuum|mop|cleaner|steam|stain|scrub|floor|window cleaner/.test(text)) return 'cleaning';
  if (/air fryer|pressure cooker|blender|mixer|coffee|espresso|kettle|toaster|kitchen/.test(text)) return 'kitchen';
  if (/watch|tracker|fitness|massage|gym|health/.test(text)) return 'fitness';
  if (/beauty|makeup|hair|skin|perfume|fragrance/.test(text)) return 'beauty';
  if (/lamp|lock|camera|sensor|smart home|speaker|switch/.test(text)) return 'smart-home';
  return 'general';
};

const safeEnglishFeature = (feature: string, fallback: string): string =>
  /[\u0600-\u06ff]/.test(feature) ? fallback : feature;

function buildEnglishVideoScript(
  title: string,
  brand: string,
  category: string,
  rawFeatures: string[],
  generatedImages: string[],
  originalPrice: number,
  currentPrice: number
): PromotionalVideoScript {
  const kind = productKindFrom(title, category, rawFeatures);
  const hero = generatedImages[0];
  const lifestyle1 = generatedImages[1] || hero;
  const lifestyle2 = generatedImages[2] || lifestyle1;
  const features = rawFeatures.map((f, index) => safeEnglishFeature(f, `Verified product feature ${index + 1}`));
  const f1 = features[0] || 'Designed for practical everyday use';
  const f2 = features[1] || 'Built around the verified product design';
  const f3 = features[2] || 'Easy to understand and use';
  const priceText = currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'Check current price';

  const scenes: VideoScene[] = [
    {
      timeRange: '00:00 - 00:05', sceneType: 'action',
      visualPrompt: `Cinematic hero reveal of ${title}. Preserve the exact verified product design.`,
      voiceoverText: `Meet ${title}. Here is what makes this product worth a closer look.`,
      screenText: brand ? `${brand} — Product Spotlight` : 'Product Spotlight', sceneImage: hero
    },
    {
      timeRange: '00:05 - 00:12', sceneType: 'action',
      visualPrompt: `Realistic premium lifestyle demonstration of ${title} in its genuine use environment.`,
      voiceoverText: f1, screenText: f1, sceneImage: lifestyle1
    },
    {
      timeRange: '00:12 - 00:20', sceneType: 'specs',
      visualPrompt: `Detailed close-ups of ${title}, showing only verified materials, controls and functional details.`,
      voiceoverText: `${f2}. ${f3}.`, screenText: `${f2} • ${f3}`, sceneImage: lifestyle2
    }
  ];

  if (kind === 'cleaning') {
    scenes.push({
      timeRange: '00:20 - 00:29', sceneType: 'before_after',
      visualPrompt: `Realistic before-and-after use of ${title} only on the surface it is designed to clean. No exaggerated result.`,
      voiceoverText: 'The difference is easy to see when the product is used for the job it was designed to do.',
      screenText: 'Realistic Before & After', sceneImage: lifestyle2,
      beforeImage: lifestyle1, afterImage: lifestyle2,
      transformationNote: 'Before/after is used only for a verified cleaning use case.'
    });
  } else {
    scenes.push({
      timeRange: '00:20 - 00:29', sceneType: 'action',
      visualPrompt: `Second realistic lifestyle demonstration of ${title}, faithful to the verified product.`,
      voiceoverText: 'It fits naturally into the way this product is meant to be used, without adding unverified claims.',
      screenText: 'Designed for Everyday Use', sceneImage: lifestyle2
    });
  }

  const discount = originalPrice > currentPrice && currentPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;
  scenes.push({
    timeRange: '00:29 - 00:36', sceneType: 'cta',
    visualPrompt: `Premium final pack shot of ${title}. No fake badges or invented claims.`,
    voiceoverText: 'Check the product page for the latest price, availability and full specifications.',
    screenText: discount > 0 ? `${discount}% Off • ${priceText}` : priceText,
    sceneImage: hero
  });

  return {
    videoTitle: `${title} — Product Review & Features`,
    hook: `Meet ${title}. Here is what makes this product worth a closer look.`,
    estimatedDuration: '36 seconds',
    scenes,
    callToAction: 'Check the product page for current price, availability and full specifications.',
    suggestedBgm: 'Clean modern commercial beat, upbeat but unobtrusive'
  };
}

export function generateLocalVideoCampaignFallback(_input: ProductVideoServiceInput): ProductVideoCampaignResult {
  throw new Error('تعذر التحقق من المنتج الحقيقي من الرابط. لن يتم إنشاء فيديو عام أو بيانات وهمية.');
}

export async function generateProductVideoCampaign(input: ProductVideoServiceInput): Promise<ProductVideoCampaignResult> {
  const sanitized = validateAndSanitizeUrl(input.productUrl);
  if (!sanitized.isValid) throw new Error(sanitized.errorMessage || 'رابط المنتج غير صالح.');

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('سجّلي الدخول إلى لوحة التحكم أولاً.');

  // Canonical data source: the production Supabase extractor already used by the
  // catalog. It reads the real listing and reports failure instead of guessing.
  const { data: extraction, error: extractError } = await supabase.functions.invoke('product-extract', {
    body: { url: input.productUrl.trim() }
  });
  if (extractError) {
    let detail = extractError.message;
    try {
      const response = (extractError as any)?.context;
      if (response?.json) detail = (await response.json())?.error || detail;
    } catch { /* use connector message */ }
    throw new Error(`تعذر قراءة المنتج الحقيقي من الرابط: ${detail}`);
  }
  if (!extraction?.ok || !extraction?.data) {
    throw new Error(extraction?.error || 'تعذر قراءة المنتج الحقيقي من الرابط.');
  }

  const real = extraction.data;
  const title = String(real.title || '').trim();
  const brand = String(real.brand || '').trim();
  const description = String(real.description || '').trim();
  const features = strings(real.features);
  const referenceImages = strings(real.images);
  if (!title || referenceImages.length === 0) {
    throw new Error('تم فتح المنتج، لكن لم يتم العثور على عنوان وصور مرجعية موثوقة. أوقفت التوليد حتى لا يخرج منتج مختلف.');
  }

  const breadcrumbs = strings(real.breadcrumbs);
  const category = breadcrumbs[0] || 'products';
  const subcategory = breadcrumbs[breadcrumbs.length - 1] || category;
  const currentPrice = numberOrZero(real.price);
  const listPrice = numberOrZero(real.listPrice);
  const originalPrice = listPrice > currentPrice ? listPrice : currentPrice;
  const currency = String(real.currency || 'USD');
  const storageKey = String(real.asin || real.itemId || sanitized.extractedId || title);
  const kind = productKindFrom(title, `${category} ${subcategory}`, features);

  const generatedMedia = await generateOriginalProductImages({
    storageKey,
    productTitle: title,
    brand,
    category: `${category} ${subcategory}`,
    kind,
    features,
    referenceImages,
    sourceUrl: String(real.finalUrl || input.productUrl)
  });

  const order = ['hero', 'lifestyle_home', 'lifestyle_outdoor', 'before_after', 'feature', 'thumbnail'];
  const sorted = [...generatedMedia].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  const generatedImages = sorted.map(item => item.url).filter(Boolean);
  const heroImage = sorted.find(item => item.type === 'hero')?.url || generatedImages[0];
  if (!heroImage) throw new Error('تم استخراج المنتج ولكن تعذر إنشاء صور أصلية له.');

  const affiliateLink = buildAffiliateLink(input.productUrl, {
    affiliateTag: input.affiliateTag,
    customAffiliateLink: input.affiliateLink,
    platform: sanitized.platform
  });
  const videoScript = buildEnglishVideoScript(title, brand, category, features, generatedImages, originalPrice, currentPrice);
  const discountPercent = originalPrice > currentPrice && currentPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const product: ExtractedProductInfo = {
    nameAr: title,
    nameEn: title,
    description: description || title,
    category,
    subcategory,
    brand,
    originalPrice,
    discountPrice: currentPrice || originalPrice,
    discountPercent,
    currency,
    features,
    affiliateLink,
    sourceUrl: String(real.finalUrl || input.productUrl),
    image: heroImage,
    images: generatedImages,
    youtubeUrl: undefined
  };

  const hashtags = Array.from(new Set([
    brand ? `#${brand.replace(/[^a-zA-Z0-9]+/g, '')}` : '',
    '#ProductReview', '#SmartShopping', '#YousraSmile'
  ].filter(Boolean)));
  const socialCaption = [
    title,
    ...features.slice(0, 3).filter(feature => !/[\u0600-\u06ff]/.test(feature)).map(feature => `• ${feature}`),
    'See the current price, availability and full specifications at the product link.',
    affiliateLink
  ].filter(Boolean).join('\n\n');

  return {
    product,
    videoScript,
    socialCaption,
    hashtags,
    seoMetadata: {
      title: `${title} Review, Features & Current Deal`,
      description: description || `${title}: verified product details, current price and availability.`,
      keywords: [title, brand, category, 'product review', 'Yousra Smile'].filter(Boolean)
    },
    suggestedVideoUrl: undefined,
    heroImage,
    beforeImage: kind === 'cleaning' ? sorted.find(item => item.type === 'lifestyle_home')?.url : undefined,
    afterImage: kind === 'cleaning' ? sorted.find(item => item.type === 'before_after')?.url : undefined
  };
}
