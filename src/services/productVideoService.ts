import {
  ProductVideoServiceInput,
  ProductVideoCampaignResult,
  ExtractedProductInfo,
  PromotionalVideoScript,
  VideoScene
} from '../types';
import { auth } from './googleWorkspace';
import { generateOriginalProductImages } from './aiProductMedia';

export type SupportedCommercePlatform = 'amazon' | 'aliexpress' | 'noon' | 'shein' | 'other';

export interface SanitizedProductUrl {
  isValid: boolean;
  cleanUrl: string;
  platform: SupportedCommercePlatform;
  extractedId?: string;
  errorMessage?: string;
}

/**
 * URL-first product workflow.
 *
 * This module deliberately does NOT invent product data, prices, stock images,
 * product claims, or a generic before/after story. If the server cannot verify
 * the real product from the supplied URL, generation stops and asks for review.
 */
export function validateAndSanitizeUrl(rawUrl: string): SanitizedProductUrl {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return {
      isValid: false,
      cleanUrl: '',
      platform: 'other',
      errorMessage: 'رابط المنتج فارغ.'
    };
  }

  const trimmed = rawUrl.trim();
  if (/^(javascript:|data:|file:|vbscript:)/i.test(trimmed)) {
    return {
      isValid: false,
      cleanUrl: '',
      platform: 'other',
      errorMessage: 'الرابط يحتوي على بروتوكول غير آمن.'
    };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      isValid: false,
      cleanUrl: '',
      platform: 'other',
      errorMessage: 'استخدمي رابط المنتج الكامل من Amazon أو المتجر.'
    };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    let platform: SupportedCommercePlatform = 'other';
    let extractedId: string | undefined;

    if (/amazon\.|amzn\.to|amzn\.eu/i.test(host)) {
      platform = 'amazon';
      const asinMatch = trimmed.match(/(?:\/dp\/|\/gp\/product\/|asin=)([A-Z0-9]{10})/i);
      if (asinMatch?.[1]) extractedId = asinMatch[1].toUpperCase();
    } else if (/aliexpress\.com/i.test(host)) {
      platform = 'aliexpress';
      const itemMatch = trimmed.match(/\/item\/(\d+)\.html/i);
      if (itemMatch?.[1]) extractedId = itemMatch[1];
    } else if (/noon\.com/i.test(host)) {
      platform = 'noon';
      const noonMatch = trimmed.match(/(?:N\d+A|[A-Z0-9_-]{10,})/i);
      if (noonMatch?.[0]) extractedId = noonMatch[0];
    } else if (/shein\.com/i.test(host)) {
      platform = 'shein';
      const sheinMatch = trimmed.match(/-p-(\d+)\.html/i);
      if (sheinMatch?.[1]) extractedId = sheinMatch[1];
    }

    return {
      isValid: true,
      cleanUrl: `${parsed.origin}${parsed.pathname}`,
      platform,
      extractedId
    };
  } catch {
    return {
      isValid: false,
      cleanUrl: '',
      platform: 'other',
      errorMessage: 'رابط المنتج غير صالح.'
    };
  }
}

/**
 * Preserve the owner's affiliate URL when one is supplied. Otherwise add only
 * the configured tracking parameter needed by the detected store.
 */
export function buildAffiliateLink(
  productUrl: string,
  options: {
    affiliateTag?: string;
    customAffiliateLink?: string;
    platform?: SupportedCommercePlatform;
  } = {}
): string {
  const custom = options.customAffiliateLink?.trim();
  if (custom && /^https:\/\//i.test(custom)) return custom;

  const sanitized = validateAndSanitizeUrl(productUrl);
  if (!sanitized.isValid) return productUrl;

  try {
    const url = new URL(productUrl);
    const platform = options.platform || sanitized.platform;
    const tag = options.affiliateTag?.trim();

    if (!tag) return url.toString();

    if (platform === 'amazon') {
      url.searchParams.set('tag', tag);
    } else if (platform === 'aliexpress') {
      url.searchParams.set('aff_platform', 'true');
      url.searchParams.set('sk', tag);
    } else if (platform === 'noon') {
      url.searchParams.set('utm_source', 'affiliate');
      url.searchParams.set('utm_campaign', tag);
    }

    return url.toString();
  } catch {
    return productUrl;
  }
}

/**
 * Lightweight URL parser used by UI helpers. It intentionally returns no fake
 * title, fake price, or fake product photo. The verified server extractor fills
 * those fields during generation.
 */
export function extractBasicProductInfoFromUrl(
  productUrl: string,
  affiliateTag = ''
): {
  name: string;
  brand: string;
  cleanUrl: string;
  affiliateUrl: string;
  platform: SupportedCommercePlatform;
  asinOrId?: string;
} {
  const sanitized = validateAndSanitizeUrl(productUrl);
  const storeName =
    sanitized.platform === 'amazon' ? 'Amazon' :
    sanitized.platform === 'aliexpress' ? 'AliExpress' :
    sanitized.platform === 'noon' ? 'Noon' :
    sanitized.platform === 'shein' ? 'SHEIN' : 'Product';

  return {
    name: sanitized.extractedId ? `${storeName} product ${sanitized.extractedId}` : `${storeName} product`,
    brand: '',
    cleanUrl: sanitized.cleanUrl,
    affiliateUrl: buildAffiliateLink(productUrl, {
      affiliateTag,
      platform: sanitized.platform
    }),
    platform: sanitized.platform,
    asinOrId: sanitized.extractedId
  };
}

const englishWords = (items: unknown[]): string[] =>
  items
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);

const normalizePrice = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const productKindFrom = (title: string, category: string, features: string[]): string => {
  const haystack = `${title} ${category} ${features.join(' ')}`.toLowerCase();
  if (/tumbler|bottle|cup|mug|drinkware|hydration/.test(haystack)) return 'drinkware';
  if (/vacuum|mop|cleaner|steam|stain|scrub|floor|window cleaner/.test(haystack)) return 'cleaning';
  if (/air fryer|pressure cooker|blender|mixer|coffee|espresso|kettle|toaster|kitchen/.test(haystack)) return 'kitchen';
  if (/watch|tracker|fitness|massage|gym|health/.test(haystack)) return 'fitness';
  if (/lamp|lock|camera|sensor|smart home|speaker|switch/.test(haystack)) return 'smart-home';
  if (/beauty|makeup|hair|skin|perfume|fragrance/.test(haystack)) return 'beauty';
  if (/chair|table|sofa|furniture|decor|storage/.test(haystack)) return 'home-living';
  return 'general';
};

const lifestylePromptFor = (kind: string, title: string): string => {
  const fidelity = `Keep the exact product design, color, proportions, controls, lid, handle, logo placement and visible details faithful to the verified reference for ${title}. Do not invent accessories or alter the product model.`;
  switch (kind) {
    case 'drinkware':
      return `Premium lifestyle shot of ${title} being naturally used by an adult modest hijabi woman in a bright modern setting such as a garden, car, office, gym or seaside walk. ${fidelity}`;
    case 'cleaning':
      return `Realistic home-use demonstration of ${title} cleaning the surface it is actually designed for. Show believable operation and results only. ${fidelity}`;
    case 'kitchen':
      return `Modern kitchen lifestyle demonstration of ${title} in realistic use, focusing on the product's verified function and controls. ${fidelity}`;
    case 'fitness':
      return `Contemporary fitness or wellness lifestyle scene featuring ${title} in correct, realistic use by an adult. ${fidelity}`;
    case 'beauty':
      return `Premium beauty lifestyle scene featuring ${title} in a clean, elegant setting with an adult modest hijabi woman where appropriate. ${fidelity}`;
    default:
      return `Premium commercial lifestyle demonstration of ${title} in the environment where the verified product is genuinely used. ${fidelity}`;
  }
};

const isBeforeAfterAppropriate = (kind: string): boolean => kind === 'cleaning';

function buildEnglishVideoScript(
  title: string,
  brand: string,
  category: string,
  features: string[],
  heroImage: string,
  generatedImages: string[],
  price: number,
  discountPrice: number
): PromotionalVideoScript {
  const kind = productKindFrom(title, category, features);
  const hero = generatedImages[0] || heroImage;
  const alternate = generatedImages[1] || hero;
  const alternate2 = generatedImages[2] || alternate;
  const featureOne = features[0] || 'Designed for practical everyday use';
  const featureTwo = features[1] || features[0] || 'Built around the product’s verified features';
  const featureThree = features[2] || features[1] || features[0] || 'Easy to understand and use';
  const priceText = discountPrice > 0
    ? `$${discountPrice.toFixed(2)}`
    : price > 0 ? `$${price.toFixed(2)}` : 'Check current price';

  const scenes: VideoScene[] = [
    {
      timeRange: '00:00 - 00:05',
      sceneType: 'action',
      visualPrompt: `Cinematic hero reveal of ${title}. Preserve the verified product exactly. Clean premium lighting, crisp e-commerce commercial look.`,
      voiceoverText: `Meet ${title}. Here is what makes this product worth a closer look.`,
      screenText: brand ? `${brand} — Product Spotlight` : 'Product Spotlight',
      sceneImage: hero
    },
    {
      timeRange: '00:05 - 00:12',
      sceneType: 'action',
      visualPrompt: lifestylePromptFor(kind, title),
      voiceoverText: featureOne,
      screenText: featureOne,
      sceneImage: alternate
    },
    {
      timeRange: '00:12 - 00:20',
      sceneType: 'specs',
      visualPrompt: `Detailed close-ups of the real ${title}, showing only verified controls, materials, dimensions and functional details. No invented attachments.`,
      voiceoverText: `${featureTwo}. ${featureThree}.`,
      screenText: [featureTwo, featureThree].join(' • '),
      sceneImage: alternate2
    }
  ];

  if (isBeforeAfterAppropriate(kind)) {
    scenes.push({
      timeRange: '00:20 - 00:29',
      sceneType: 'before_after',
      visualPrompt: `A realistic before-and-after demonstration for ${title}, only if the verified product is intended to clean or restore this exact surface. Keep lighting and camera angle consistent and avoid exaggerated results.`,
      voiceoverText: `The result is easy to see when the product is used for the job it was designed to do.`,
      screenText: 'Realistic Before & After',
      sceneImage: generatedImages[2] || alternate2,
      beforeImage: generatedImages[1] || alternate,
      afterImage: generatedImages[2] || alternate2,
      transformationNote: 'Use before/after only for a verified cleaning use case. Never fabricate a transformation.'
    });
  } else {
    scenes.push({
      timeRange: '00:20 - 00:29',
      sceneType: 'action',
      visualPrompt: lifestylePromptFor(kind, title),
      voiceoverText: `It fits naturally into the way this product is meant to be used, without adding claims that are not in the verified listing.`,
      screenText: 'Designed for Everyday Use',
      sceneImage: generatedImages[2] || alternate2
    });
  }

  scenes.push({
    timeRange: '00:29 - 00:36',
    sceneType: 'cta',
    visualPrompt: `Premium final pack shot of ${title}. Keep the verified product completely unchanged. Add a clean call-to-action layout without fake badges or fake discounts.`,
    voiceoverText: `Want the full details? Check the product page for the latest price, availability and specifications.`,
    screenText: `Check Product Details — ${priceText}`,
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

function buildEnglishMarketing(
  title: string,
  brand: string,
  category: string,
  features: string[],
  affiliateLink: string
): { caption: string; hashtags: string[]; seoTitle: string; seoDescription: string; keywords: string[] } {
  const hashtags = Array.from(new Set([
    brand ? `#${brand.replace(/[^a-zA-Z0-9]+/g, '')}` : '',
    category ? `#${category.replace(/[^a-zA-Z0-9]+/g, '')}` : '',
    '#ProductReview',
    '#SmartShopping',
    '#YousraSmile'
  ].filter(Boolean)));

  const featureLines = features.slice(0, 3).map(feature => `• ${feature}`).join('\n');
  const caption = [
    title,
    featureLines,
    'See the current price, availability and full specifications at the product link.',
    affiliateLink
  ].filter(Boolean).join('\n\n');

  return {
    caption,
    hashtags,
    seoTitle: `${title} Review, Features & Current Deal`,
    seoDescription: `${title}: review the verified product features, current price and availability before buying.`,
    keywords: englishWords([title, brand, category, ...features.slice(0, 3), 'product review', 'current deal'])
  };
}

/**
 * Kept for backwards compatibility with older callers. A fabricated local
 * campaign is intentionally no longer produced.
 */
export function generateLocalVideoCampaignFallback(_input: ProductVideoServiceInput): ProductVideoCampaignResult {
  throw new Error('تعذر التحقق من المنتج الحقيقي من الرابط. لن يتم إنشاء فيديو عام أو بيانات وهمية.');
}

export async function generateProductVideoCampaign(
  input: ProductVideoServiceInput
): Promise<ProductVideoCampaignResult> {
  const sanitized = validateAndSanitizeUrl(input.productUrl);
  if (!sanitized.isValid) {
    throw new Error(sanitized.errorMessage || 'رابط المنتج غير صالح.');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('سجّلي الدخول إلى لوحة التحكم أولاً حتى يتم تحليل رابط المنتج الحقيقي.');
  }

  const idToken = await currentUser.getIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`
  };
  if (input.geminiApiKey) headers['x-gemini-key'] = input.geminiApiKey;

  const response = await fetch('/api/agent/url-to-video-campaign', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productUrl: input.productUrl.trim(),
      affiliateLink: input.affiliateLink?.trim() || undefined,
      affiliateTag: input.affiliateTag?.trim() || undefined,
      platform: input.platform || 'tiktok',
      targetAudience: input.targetAudience || 'online shoppers interested in the actual product',
      customNotes: [
        input.customNotes || '',
        'All video narration, on-screen text, captions and hashtags must be English only.',
        'Do not invent product claims, prices, accessories or results.',
        'Do not use before/after unless the verified product genuinely supports that use case.',
        'Store/source images are temporary references only; final Yousra Smile media must be original generated assets.'
      ].filter(Boolean).join(' ')
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !payload?.data) {
    const serverMessage = payload?.error || payload?.message || `HTTP ${response.status}`;
    throw new Error(`تعذر استخراج المنتج الحقيقي من الرابط: ${serverMessage}`);
  }

  const raw = payload.data;
  const title = String(raw.productTitleEn || raw.productTitleAr || '').trim();
  const brand = String(raw.brand || '').trim();
  const category = String(raw.category || 'products').trim();
  const features = englishWords(Array.isArray(raw.features) ? raw.features : []);
  const referenceImages = englishWords(Array.isArray(raw.images) ? raw.images : []);
  const sourceHeroImage = String(raw.heroImage || raw.imageUrl || raw.image || referenceImages[0] || '').trim();

  if (!title || !sourceHeroImage.startsWith('https://')) {
    throw new Error('تم الوصول للرابط، لكن لم أتمكن من مطابقة عنوان المنتج وصورته الحقيقية. أوقفت التوليد حتى لا يخرج فيديو خاطئ.');
  }

  const originalPrice = normalizePrice(raw.originalPrice);
  const discountPrice = normalizePrice(raw.discountPrice) || originalPrice;
  const affiliateLink = buildAffiliateLink(
    String(raw.affiliateLink || input.productUrl),
    {
      affiliateTag: input.affiliateTag,
      customAffiliateLink: input.affiliateLink || raw.affiliateLink,
      platform: sanitized.platform
    }
  );

  const allReferenceImages = Array.from(new Set([sourceHeroImage, ...referenceImages].filter(Boolean)));
  const kind = productKindFrom(title, category, features);

  // The commerce/store images above are temporary references only. This call
  // generates NEW assets and stores only those generated images in Yousra Smile.
  const generatedMedia = await generateOriginalProductImages({
    storageKey: String(raw.sourceProductId || sanitized.extractedId || title),
    productTitle: title,
    brand,
    category,
    kind,
    features,
    referenceImages: allReferenceImages,
    sourceUrl: String(raw.sourceUrl || input.productUrl),
    geminiApiKey: input.geminiApiKey
  });

  const imagePriority = ['hero', 'lifestyle_home', 'lifestyle_outdoor', 'before_after', 'feature', 'thumbnail'];
  const sortedGenerated = [...generatedMedia].sort((a, b) => {
    const ai = imagePriority.indexOf(a.type);
    const bi = imagePriority.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const generatedImages = sortedGenerated.map(item => item.url).filter(Boolean);
  const heroImage = sortedGenerated.find(item => item.type === 'hero')?.url || generatedImages[0];

  if (!heroImage || generatedImages.length === 0) {
    throw new Error('تم استخراج المنتج، لكن لم يتم إنشاء صور أصلية قابلة للحفظ. لم يتم استخدام صور المتجر كبديل نهائي.');
  }

  const videoScript = buildEnglishVideoScript(
    title,
    brand,
    category,
    features,
    heroImage,
    generatedImages,
    originalPrice,
    discountPrice
  );
  const marketing = buildEnglishMarketing(title, brand, category, features, affiliateLink);

  const product: ExtractedProductInfo = {
    nameAr: String(raw.productTitleAr || title),
    nameEn: title,
    description: String(raw.seoDescription || title),
    category,
    subcategory: String(raw.subcategory || ''),
    brand,
    originalPrice,
    discountPrice,
    discountPercent: originalPrice > 0 && discountPrice > 0 && discountPrice < originalPrice
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0,
    currency: 'USD',
    features,
    affiliateLink,
    sourceUrl: String(raw.sourceUrl || input.productUrl),
    image: heroImage,
    images: generatedImages,
    youtubeUrl: undefined
  };

  const cleaningBefore = sortedGenerated.find(item => item.type === 'lifestyle_home')?.url;
  const cleaningAfter = sortedGenerated.find(item => item.type === 'before_after')?.url;

  return {
    product,
    videoScript,
    socialCaption: marketing.caption,
    hashtags: marketing.hashtags,
    seoMetadata: {
      title: marketing.seoTitle,
      description: marketing.seoDescription,
      keywords: marketing.keywords
    },
    suggestedVideoUrl: undefined,
    heroImage,
    beforeImage: isBeforeAfterAppropriate(kind) ? cleaningBefore : undefined,
    afterImage: isBeforeAfterAppropriate(kind) ? cleaningAfter : undefined
  };
}
