import { 
  ProductVideoServiceInput, 
  ProductVideoCampaignResult, 
  ExtractedProductInfo, 
  PromotionalVideoScript 
} from '../types';
import { auth } from './googleWorkspace';

/**
 * Validates, cleans, and sanitizes an incoming product URL to prevent security issues.
 * Strips tracking parameters while preserving necessary platform identifiers (ASIN, Item IDs).
 */
export function validateAndSanitizeUrl(rawUrl: string): {
  isValid: boolean;
  cleanUrl: string;
  platform: 'amazon' | 'aliexpress' | 'noon' | 'shein' | 'other';
  extractedId?: string;
  errorMessage?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return {
      isValid: false,
      cleanUrl: '',
      platform: 'other',
      errorMessage: 'رابط المنتج فارغ.'
    };
  }

  const trimmed = rawUrl.trim();

  // Block dangerous schemes
  if (/^(javascript:|data:|file:|vbscript:)/i.test(trimmed)) {
    return {
      isValid: false,
      cleanUrl: '',
      platform: 'other',
      errorMessage: 'الرابط يحتوي على بروتوكول غير آمن.'
    };
  }

  // Handle plain product queries/names entered instead of URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      isValid: true,
      cleanUrl: trimmed,
      platform: 'other',
    };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    let platform: 'amazon' | 'aliexpress' | 'noon' | 'shein' | 'other' = 'other';
    let extractedId: string | undefined;

    if (/amazon\.|amzn\.to|amzn\.eu/i.test(host) || /amzn\.to/i.test(trimmed)) {
      platform = 'amazon';
      const asinMatch = trimmed.match(/(?:\/dp\/|\/gp\/product\/|amzn\.to\/|asin=)([A-Z0-9]{10})/i);
      if (asinMatch && asinMatch[1]) {
        extractedId = asinMatch[1].toUpperCase();
      }
    } else if (/aliexpress\.com/i.test(host)) {
      platform = 'aliexpress';
      const idMatch = trimmed.match(/\/item\/(\d+)\.html/i);
      if (idMatch && idMatch[1]) {
        extractedId = idMatch[1];
      }
    } else if (/noon\.com/i.test(host)) {
      platform = 'noon';
      const noonMatch = trimmed.match(/(?:N\d+A|[A-Z0-9_-]{10,})/i);
      if (noonMatch) {
        extractedId = noonMatch[0];
      }
    } else if (/shein\.com/i.test(host)) {
      platform = 'shein';
      const sheinMatch = trimmed.match(/-p-(\d+)\.html/i);
      if (sheinMatch && sheinMatch[1]) {
        extractedId = sheinMatch[1];
      }
    }

    return {
      isValid: true,
      cleanUrl: parsed.origin + parsed.pathname,
      platform,
      extractedId
    };
  } catch {
    return {
      isValid: true,
      cleanUrl: trimmed,
      platform: 'other'
    };
  }
}

/**
 * Combines a sanitized product link with the user's affiliate marketing tag or custom link
 */
export function buildAffiliateLink(
  productUrl: string, 
  options: {
    affiliateTag?: string;
    customAffiliateLink?: string;
    platform?: 'amazon' | 'aliexpress' | 'noon' | 'shein' | 'other';
  } = {}
): string {
  if (options.customAffiliateLink && options.customAffiliateLink.trim().startsWith('http')) {
    return options.customAffiliateLink.trim();
  }

  const tag = options.affiliateTag?.trim();
  const sanitize = validateAndSanitizeUrl(productUrl);
  const targetPlatform = options.platform || sanitize.platform;

  if (!tag) {
    return sanitize.cleanUrl || productUrl.trim();
  }

  if (productUrl.startsWith('http')) {
    try {
      const urlObj = new URL(productUrl);
      if (targetPlatform === 'amazon') {
        urlObj.searchParams.set('tag', tag);
        return urlObj.toString();
      } else if (targetPlatform === 'aliexpress') {
        urlObj.searchParams.set('aff_platform', 'true');
        urlObj.searchParams.set('sk', tag);
        return urlObj.toString();
      } else if (targetPlatform === 'noon') {
        urlObj.searchParams.set('utm_source', 'affiliate');
        urlObj.searchParams.set('utm_campaign', tag);
        return urlObj.toString();
      } else {
        urlObj.searchParams.set('ref', tag);
        return urlObj.toString();
      }
    } catch {
      return `${productUrl}${productUrl.includes('?') ? '&' : '?'}tag=${tag}`;
    }
  }

  // A product name is not enough to construct a trustworthy affiliate URL.
  return productUrl.trim();
}

/**
 * Parses a given product link (Amazon, AliExpress, etc.) to extract platform, ID, and basic metadata
 */
export async function generateProductVideoCampaign(
  input: ProductVideoServiceInput
): Promise<ProductVideoCampaignResult> {
  const sanitized = validateAndSanitizeUrl(input.productUrl);
  if (!sanitized.isValid || !sanitized.cleanUrl.startsWith('http')) {
    throw new Error(sanitized.errorMessage || 'يلزم رابط HTTPS صالح للمنتج.');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('يلزم تسجيل الدخول إلى لوحة التحكم قبل تشغيل الوكيل.');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch('/api/agent/url-to-video-campaign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      productUrl: sanitized.cleanUrl,
      affiliateLink: input.affiliateLink?.trim() || undefined,
      affiliateTag: input.affiliateTag?.trim() || undefined,
      platform: input.platform || 'tiktok',
      targetAudience: input.targetAudience,
      customNotes: input.customNotes
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || 'تعذر التحقق من بيانات المنتج. لم يتم إنشاء بيانات بديلة.');
  }

  const raw = payload.data;
  if (raw.verificationStatus !== 'source_match_confirmed') {
    throw new Error('تعذر مطابقة البيانات مع رابط المنتج. أوقفت العملية لمنع إنشاء منتج أو فيديو غير مطابق.');
  }

  const heroImage = String(raw.image || raw.imageUrl || raw.heroImage || '');
  if (!heroImage.startsWith('https://')) {
    throw new Error('لا توجد صورة موثقة للمنتج من المصدر. أوقفت العملية لمنع استخدام صورة عامة غير مطابقة.');
  }

  const mergedAffiliateLink = buildAffiliateLink(raw.sourceUrl || sanitized.cleanUrl, {
    affiliateTag: input.affiliateTag,
    customAffiliateLink: input.affiliateLink,
    platform: sanitized.platform
  });

  const originalPrice = Number(raw.originalPrice) || 0;
  const discountPrice = Number(raw.discountPrice) || originalPrice;
  const needsVerification = Array.isArray(raw.needsVerification)
    ? raw.needsVerification.map(String)
    : [];

  if (!originalPrice) needsVerification.push('price');
  if (!input.affiliateLink && !input.affiliateTag) needsVerification.push('affiliate_link');
  if (!raw.suggestedVideoUrl) needsVerification.push('product_video');

  const scenes = Array.isArray(raw.videoScript?.scenes)
    ? raw.videoScript.scenes.map((scene: any) => ({
        ...scene,
        sceneImage: heroImage,
        beforeImage: undefined,
        afterImage: undefined,
        transformationNote: 'يلزم إثبات بصري قبل اعتماد أي ادعاء قبل/بعد.'
      }))
    : [];

  const product: ExtractedProductInfo = {
    nameAr: String(raw.productTitleAr || raw.productTitleEn),
    nameEn: String(raw.productTitleEn || raw.productTitleAr),
    description: String(raw.seoDescription || ''),
    category: String(raw.category || 'products'),
    subcategory: raw.subcategory ? String(raw.subcategory) : undefined,
    brand: raw.brand ? String(raw.brand) : undefined,
    originalPrice,
    discountPrice,
    discountPercent: originalPrice > discountPrice
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0,
    currency: 'USD',
    features: Array.isArray(raw.features) ? raw.features.map(String) : [],
    affiliateLink: mergedAffiliateLink,
    sourceUrl: sanitized.cleanUrl,
    image: heroImage,
    images: Array.isArray(raw.images)
      ? raw.images.filter((url: unknown) => typeof url === 'string' && url.startsWith('https://'))
      : [heroImage],
    youtubeUrl: raw.suggestedVideoUrl ? String(raw.suggestedVideoUrl) : ''
  };

  return {
    product,
    videoScript: {
      videoTitle: String(raw.videoScript?.videoTitle || `مراجعة ${product.nameAr}`),
      hook: String(raw.videoScript?.hook || ''),
      estimatedDuration: String(raw.videoScript?.estimatedDuration || ''),
      scenes,
      callToAction: String(raw.videoScript?.callToAction || ''),
      suggestedBgm: raw.videoScript?.suggestedBgm
    },
    socialCaption: String(raw.socialCaption || ''),
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.map(String) : [],
    seoMetadata: {
      title: String(raw.seoTitle || product.nameAr),
      description: String(raw.seoDescription || ''),
      keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : []
    },
    suggestedVideoUrl: raw.suggestedVideoUrl ? String(raw.suggestedVideoUrl) : '',
    heroImage,
    verificationStatus: needsVerification.length === 0
      ? 'source_match_confirmed'
      : 'needs_owner_review',
    needsVerification: [...new Set(needsVerification)]
  };
}
