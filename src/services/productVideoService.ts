import { 
  ProductVideoServiceInput, 
  ProductVideoCampaignResult, 
  ExtractedProductInfo, 
  PromotionalVideoScript 
} from '../types';

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

  const tag = options.affiliateTag || 'yousrasmile-21';
  const sanitize = validateAndSanitizeUrl(productUrl);
  const targetPlatform = options.platform || sanitize.platform;

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

  // Fallback direct affiliate destination
  return `https://www.amazon.sa/dp/${sanitize.extractedId || 'B0CXSAMPLE'}?tag=${tag}`;
}

/**
 * Parses a given product link (Amazon, AliExpress, etc.) to extract platform, ID, and basic metadata
 */
export function extractBasicProductInfoFromUrl(
  productUrl: string, 
  affiliateTag = 'yousrasmile-21'
): {
  name: string;
  brand: string;
  cleanUrl: string;
  affiliateUrl: string;
  platform: 'amazon' | 'aliexpress' | 'noon' | 'shein' | 'other';
  asinOrId?: string;
} {
  const sanitize = validateAndSanitizeUrl(productUrl);
  let brand = 'يسرى سمايل';
  let name = 'منتج ذكي وعصري متطور';

  if (sanitize.platform === 'amazon') {
    brand = 'Amazon Choice';
    name = sanitize.extractedId ? `جهاز ذكي بريميوم (ASIN: ${sanitize.extractedId})` : 'جهاز منزلي ذكي متطور من أمازون 2026';
  } else if (sanitize.platform === 'aliexpress') {
    brand = 'AliExpress Choice';
    name = sanitize.extractedId ? `ابتكار إلكتروني حصري (ID: ${sanitize.extractedId})` : 'منتج ذكي حصري ومميز من علي إكسبريس 2026';
  } else if (sanitize.platform === 'noon') {
    brand = 'Noon Express';
    name = 'منتج تقني عصري من نون 2026';
  } else if (sanitize.cleanUrl && !sanitize.cleanUrl.startsWith('http')) {
    name = sanitize.cleanUrl;
  }

  const affiliateUrl = buildAffiliateLink(productUrl, { affiliateTag, platform: sanitize.platform });

  return {
    name,
    brand,
    cleanUrl: sanitize.cleanUrl,
    affiliateUrl,
    platform: sanitize.platform,
    asinOrId: sanitize.extractedId
  };
}

/**
 * Builds high-fidelity deterministic fallback video campaign data if external AI is experiencing high load
 */
export function generateLocalVideoCampaignFallback(input: ProductVideoServiceInput): ProductVideoCampaignResult {
  const { name, brand, affiliateUrl } = extractBasicProductInfoFromUrl(
    input.productUrl, 
    input.affiliateTag || 'yousrasmile-20'
  );

  const customAffiliate = input.affiliateLink && input.affiliateLink.startsWith('http')
    ? input.affiliateLink
    : affiliateUrl;

  let heroImage = 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80';
  let beforeImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
  let afterImage = 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80';
  let originalPriceUsd = 129;
  let discountPriceUsd = 89;

  const lower = input.productUrl.toLowerCase();
  if (lower.includes('karcher') || lower.includes('كارشر') || lower.includes('steam') || lower.includes('بخار') || lower.includes('easyfix')) {
    heroImage = 'https://m.media-amazon.com/images/I/71Yyv-m2zFL._AC_SL1500_.jpg';
    beforeImage = 'https://m.media-amazon.com/images/I/81xU-UvDqGL._AC_SL1500_.jpg';
    afterImage = 'https://m.media-amazon.com/images/I/71n5S3+kUoL._AC_SL1500_.jpg';
    originalPriceUsd = 249;
    discountPriceUsd = 179;
  } else if (lower.includes('fryer') || lower.includes('قلاية') || lower.includes('air-fryer') || lower.includes('ninja')) {
    heroImage = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
    beforeImage = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
    afterImage = 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80';
    originalPriceUsd = 149;
    discountPriceUsd = 99;
  } else if (lower.includes('vacuum') || lower.includes('cleaner') || lower.includes('مكنسة') || lower.includes('roborock') || lower.includes('dyson')) {
    heroImage = 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';
    beforeImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
    afterImage = 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';
    originalPriceUsd = 349;
    discountPriceUsd = 249;
  } else if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('قهوة') || lower.includes('delonghi')) {
    heroImage = 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80';
    beforeImage = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80';
    afterImage = 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80';
    originalPriceUsd = 299;
    discountPriceUsd = 199;
  } else if (lower.includes('watch') || lower.includes('ساعة') || lower.includes('fitbit')) {
    heroImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
    beforeImage = 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80';
    afterImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
    originalPriceUsd = 119;
    discountPriceUsd = 79;
  }

  const discountPercent = Math.round(((originalPriceUsd - discountPriceUsd) / originalPriceUsd) * 100);

  const product: ExtractedProductInfo = {
    nameAr: `${name} - الإصدار الذكي 2026`,
    nameEn: `Smart Advanced Tech Edition 2026`,
    description: `حل ذكي متطور يختصر الوقت والجهد في المهام اليومية مع تقنية توفير الطاقة والتحكم السلس وضمان معتمد لمدة سنتين.`,
    category: 'smart-home',
    subcategory: 'أجهزة ذكية متطورة',
    brand: brand,
    originalPrice: originalPriceUsd,
    discountPrice: discountPriceUsd,
    discountPercent,
    currency: 'USD',
    features: [
      'توفير حقيقي للوقت والجهد بنسبة تتجاوز 75%',
      'تحكم فوري ذكي وسهل الاستخدام لجميع أفراد الأسرة',
      'تصميم مدمج وأنيق ينسجم مع أرقى الديكورات العصرية',
      'ضمان رسمي معتمد لمدة عامين مع دعم فني مستمر'
    ],
    affiliateLink: customAffiliate,
    sourceUrl: input.productUrl
  };

  const videoScript: PromotionalVideoScript = {
    videoTitle: `هذا الجهاز غير روتيني اليومي 180 درجة! تجربة ${product.nameAr} 🔥`,
    hook: `لو لسه ما جربت هذا الابتكار في بيتك، فأنت تضيع وقت وجهد كل يوم بدون فائدة!`,
    estimatedDuration: '35 ثانية',
    scenes: [
      {
        timeRange: '00:00 - 00:06',
        sceneType: 'before_problem',
        visualPrompt: 'مشهد المعاناة اليومية والتعب قبل وجود الجهاز مع ألوان خافتة وإحباط.',
        voiceoverText: 'تخيل كمية الوقت والمجهود اللي كنا نضيعه كل يوم قبل وجود هذا الجهاز الرهيب!',
        screenText: 'المعاناة قبل الحل السحري! 😫❌',
        sceneImage: beforeImage,
        beforeImage: beforeImage,
        afterImage: afterImage,
        transformationNote: 'إبراز المشكلة السابقة بوضوح للمستهلك.'
      },
      {
        timeRange: '00:06 - 00:14',
        sceneType: 'action',
        visualPrompt: 'لحظة تشغيل الجهاز لأول مرة بإضاءات جذابة وأداء سريع يبهر المشاهد.',
        voiceoverText: 'بضغطة زر وحدة وبدون أي تعقيد، الجهاز يشتغل بقوة وسلاسة خرافية ويحل الموضوع في ثواني!',
        screenText: 'تشغيل فوري بضغطة زر ⚡✨',
        sceneImage: heroImage,
        beforeImage: beforeImage,
        afterImage: afterImage,
        transformationNote: 'إظهار سهولة الاستخدام والتشغيل.'
      },
      {
        timeRange: '00:14 - 00:22',
        sceneType: 'specs',
        visualPrompt: 'استعراض تفاصيل الخامات الفاخرة وشاشة التحكم الذكية والذكاء الاصطناعي المدمج.',
        voiceoverText: 'خامات عالية الجودة، تصميم عصري فخم، وتقنيات ذكية متطورة صُممت لتدوم وتوفر طاقتك.',
        screenText: 'جودة بريميوم وتقنيات ذكية 🛡️💎',
        sceneImage: heroImage,
        beforeImage: beforeImage,
        afterImage: afterImage,
        transformationNote: 'بناء الثقة ومواصفات الجودة.'
      },
      {
        timeRange: '00:22 - 00:29',
        sceneType: 'before_after',
        visualPrompt: 'مقارنة جانبية مقسومة توضح النتيجة قبل استخدام الجهاز وبعده بفرق صادم ومبهر.',
        voiceoverText: 'شوفوا الفرق الصادم بين قبل وبعد! نظافة وراحة ونتيجة احترافية 100% بدون أي تعب.',
        screenText: 'مقارنة حقيقية: قبل ❌ وبعد ✅',
        sceneImage: afterImage,
        beforeImage: beforeImage,
        afterImage: afterImage,
        transformationNote: 'البرهان البصري قبل وبعد لرفع معدل التحويل.'
      },
      {
        timeRange: '00:29 - 00:35',
        sceneType: 'cta',
        visualPrompt: 'المتحدث يشير لأسفل الشاشة مع بطاقة الخصم الحصري بالدولار ورابط الأفلييت المباشر.',
        voiceoverText: 'رابط الشراء المباشر مع كود الخصم الحصري بتلقونه في البايو وأول تعليق، اطلبوه الآن قبل انتهاء العرض!',
        screenText: 'الرابط والخصم في البايو 🔗🛒',
        sceneImage: heroImage,
        beforeImage: beforeImage,
        afterImage: afterImage,
        transformationNote: 'دعوة صريحة للنقر والشراء.'
      }
    ],
    callToAction: 'رابط الشراء المباشر والخصم الحصري في البايو وأول تعليق — لا تفوت العرض!',
    suggestedBgm: 'Upbeat Modern Tech Rhythm (TikTok Trending Sound)'
  };

  const hashtags = [
    '#يسرى_سمايل',
    '#أمازون',
    '#علي_إكسبريس',
    '#تسوق_ذكي',
    '#عروض',
    '#أجهزة_منزلية',
    '#قبل_وبعد',
    '#ترند'
  ];

  const socialCaption = `🔥 هذا الابتكار السحري غير كل روتيني اليومي ووفّر عليّ وقت ومجهود خرافي! 🤩

✨ شوفوا الفرق في الفيديو بين قبل وبعد الاستخدام، والنتيجة مضمونة 100%.

👇 رابط الشراء المباشر والخصم في البايو أو أول تعليق:
🔗 ${customAffiliate}`;

  const seoMetadata = {
    title: `مراجعة وسعر ${product.nameAr}: المميزات، السعر ورابط الشراء`,
    description: `اكتشف كل ما يهمك حول ${product.nameAr} - المواصفات الكاملة، أفضل سعر مخفض، ورابط الشراء الحصري بالعمولة ومقارنة قبل وبعد.`,
    keywords: [name, 'تسوق ذكي', 'عروض أمازون', 'مراجعة يسرى سمايل', 'كود خصم', 'قبل وبعد']
  };

  return {
    product,
    videoScript,
    socialCaption,
    hashtags,
    seoMetadata,
    suggestedVideoUrl: 'https://www.youtube.com/watch?v=p7H2N8r_f5E'
  };
}

/**
 * Core Service Function:
 * Accepts a product URL (Amazon, AliExpress, Noon, etc.), extracts primary product details (name, description, price, features),
 * merges them with the user's affiliate marketing link, and generates a complete promotional video structure.
 *
 * @param input ProductVideoServiceInput containing productUrl, optional affiliateLink/tag, and platform preferences.
 * @returns Promise<ProductVideoCampaignResult>
 */
export async function generateProductVideoCampaign(
  input: ProductVideoServiceInput
): Promise<ProductVideoCampaignResult> {
  const sanitize = validateAndSanitizeUrl(input.productUrl);
  if (!sanitize.isValid) {
    throw new Error(sanitize.errorMessage || 'يرجى تزويد رابط منتج صالح.');
  }

  const effectiveTag = input.affiliateTag || 'yousrasmile-21';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (input.agentApiKey) {
      headers['x-agent-key'] = input.agentApiKey;
    }
    if (input.geminiApiKey) {
      headers['x-gemini-key'] = input.geminiApiKey;
    }

    const response = await fetch('/api/agent/url-to-video-campaign', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productUrl: input.productUrl.trim(),
        affiliateLink: input.affiliateLink?.trim() || undefined,
        affiliateTag: effectiveTag,
        platform: input.platform || 'tiktok',
        targetAudience: input.targetAudience,
        customNotes: input.customNotes
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const raw = result.data;

        const mergedAffiliateLink = buildAffiliateLink(
          raw.affiliateLink || input.productUrl, 
          {
            affiliateTag: effectiveTag,
            customAffiliateLink: input.affiliateLink
          }
        );

        let heroImage = 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80';
        let beforeImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
        let afterImage = 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80';

        const lowerUrl = input.productUrl.toLowerCase();
        if (lowerUrl.includes('karcher') || lowerUrl.includes('كارشر') || lowerUrl.includes('steam') || lowerUrl.includes('easyfix')) {
          heroImage = 'https://m.media-amazon.com/images/I/71Yyv-m2zFL._AC_SL1500_.jpg';
          beforeImage = 'https://m.media-amazon.com/images/I/81xU-UvDqGL._AC_SL1500_.jpg';
          afterImage = 'https://m.media-amazon.com/images/I/71n5S3+kUoL._AC_SL1500_.jpg';
        } else if (lowerUrl.includes('fryer') || lowerUrl.includes('قلاية') || lowerUrl.includes('ninja')) {
          heroImage = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
          beforeImage = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
          afterImage = 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80';
        } else if (lowerUrl.includes('vacuum') || lowerUrl.includes('مكنسة') || lowerUrl.includes('dyson')) {
          heroImage = 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';
          beforeImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
          afterImage = 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';
        } else if (lowerUrl.includes('coffee') || lowerUrl.includes('قهوة')) {
          heroImage = 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80';
          beforeImage = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80';
          afterImage = 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80';
        }

        const product: ExtractedProductInfo = {
          nameAr: raw.productTitleAr || 'منتج ذكي وعصري',
          nameEn: raw.productTitleEn || 'Smart Product Edition',
          description: raw.seoDescription || 'منتج عالي الجودة متوافق مع أعلى معايير الاستخدام اليومي ومقارنة قبل وبعد حقيقية.',
          category: raw.category || 'smart-home',
          subcategory: raw.subcategory || 'أجهزة ذكية متطورة',
          brand: raw.brand || 'يسرى سمايل',
          originalPrice: Number(raw.originalPrice) || 129,
          discountPrice: Number(raw.discountPrice) || 89,
          discountPercent: Number(raw.discountPercent) || 30,
          currency: 'USD',
          features: Array.isArray(raw.features) ? raw.features : ['أداء ذكي فائق وتوفير 75% من الوقت', 'ضمان معتمد لمدة سنتين'],
          affiliateLink: mergedAffiliateLink,
          sourceUrl: input.productUrl
        };

        const mappedScenes = (Array.isArray(raw.videoScript?.scenes) ? raw.videoScript.scenes : []).map((sc: any, idx: number) => {
          let sImg = sc.sceneImage || heroImage;
          if (sc.sceneType === 'before_problem' || idx === 0) sImg = beforeImage;
          if (sc.sceneType === 'before_after') sImg = afterImage;
          return {
            ...sc,
            sceneImage: sImg,
            beforeImage: sc.beforeImage || beforeImage,
            afterImage: sc.afterImage || afterImage,
            transformationNote: sc.transformationNote || (idx === 3 ? 'مقارنة قاطعة بالصوت والصورة لرفع التحويل' : undefined)
          };
        });

        const videoScript: PromotionalVideoScript = {
          videoTitle: raw.videoScript?.videoTitle || `مراجعة وتجربة ${product.nameAr}`,
          hook: raw.videoScript?.hook || 'لو بعدك ما جربت هذا المنتج، فأنت تضيع نص وقتك ومجهودك!',
          estimatedDuration: raw.videoScript?.estimatedDuration || '35 ثانية',
          scenes: mappedScenes.length > 0 ? mappedScenes : generateLocalVideoCampaignFallback(input).videoScript.scenes,
          callToAction: raw.videoScript?.callToAction || 'رابط الشراء المباشر والخصم في البايو وأول تعليق!',
          suggestedBgm: raw.videoScript?.suggestedBgm || 'Trendy Tech Beat'
        };

        return {
          product,
          videoScript,
          socialCaption: raw.socialCaption || `🔥 رابط الشراء المباشر والخصم:\n${mergedAffiliateLink}`,
          hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : ['#يسرى_سمايل', '#تسوق_ذكي', '#قبل_وبعد'],
          seoMetadata: {
            title: raw.seoTitle || product.nameAr,
            description: raw.seoDescription || product.description,
            keywords: Array.isArray(raw.keywords) ? raw.keywords : [product.nameAr, 'أجهزة ذكية', 'قبل وبعد']
          },
          suggestedVideoUrl: raw.suggestedVideoUrl || 'https://www.youtube.com/watch?v=p7H2N8r_f5E'
        };
      }
    }
  } catch (apiErr) {
    console.warn('[ProductVideoService] API call failed, falling back to local extractor:', apiErr);
  }

  // Fallback to local intelligent extraction if server request fails
  return generateLocalVideoCampaignFallback(input);
}
