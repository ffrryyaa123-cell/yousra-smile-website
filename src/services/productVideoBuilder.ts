import { Product, VideoScene } from '../types';
import { proxiedImageUrl, resolveAffiliateUrl } from './videoAssets';

const pickImages = (product: Product): { hero: string; alternate: string; alternate2: string } => {
  const pool = [product.image, ...(product.images ?? [])]
    .map(src => (src ?? '').trim())
    .filter(Boolean);
  const unique = Array.from(new Set(pool));
  const hero = unique[0] ?? '';
  return {
    hero,
    alternate: unique[1] ?? hero,
    alternate2: unique[2] ?? unique[1] ?? hero
  };
};

const formatPrice = (value: number, currency: string): string => {
  const rounded = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  if (!rounded) return 'Check current price';
  return currency === 'USD' ? `$${rounded.toFixed(2)}` : `${rounded} ${currency}`;
};

const detectKind = (product: Product): string => {
  const text = [
    product.titleEn,
    product.titleAr,
    product.category,
    product.subcategoryEn,
    product.subcategory,
    ...(product.featuresEn ?? []),
    ...(product.features ?? []),
    ...Object.keys(product.specsEn ?? {}),
    ...Object.keys(product.specs ?? {})
  ].join(' ').toLowerCase();

  if (/tumbler|bottle|cup|mug|drinkware|hydration/.test(text)) return 'drinkware';
  if (/vacuum|mop|cleaner|steam|stain|scrub|floor|window cleaner/.test(text)) return 'cleaning';
  if (/air fryer|pressure cooker|blender|mixer|coffee|espresso|kettle|toaster|kitchen/.test(text)) return 'kitchen';
  if (/fitness|watch|tracker|massage|gym|health/.test(text)) return 'fitness';
  if (/beauty|makeup|hair|skin|perfume|fragrance/.test(text)) return 'beauty';
  if (/lock|camera|sensor|smart home|speaker|switch|light/.test(text)) return 'smart-home';
  return 'general';
};

const lifestylePrompt = (kind: string, title: string): string => {
  const fidelity = `Use the verified product references only. Preserve the exact ${title} model, color, proportions, controls, lid, handle, logo placement and visible design details. Do not invent accessories or change the product.`;

  switch (kind) {
    case 'drinkware':
      return `Create a premium lifestyle scene with ${title} used naturally by an adult modest hijabi woman in a modern garden, car, office, gym or seaside setting. ${fidelity}`;
    case 'cleaning':
      return `Show ${title} in a realistic home cleaning demonstration on the exact surface it is designed for. Keep the result believable and product-faithful. ${fidelity}`;
    case 'kitchen':
      return `Show ${title} in a bright modern kitchen during its real intended use. Focus on verified controls and function. ${fidelity}`;
    case 'fitness':
      return `Show ${title} in a clean contemporary fitness or wellness scene, used correctly by an adult. ${fidelity}`;
    case 'beauty':
      return `Show ${title} in an elegant lifestyle scene with an adult modest hijabi woman where appropriate. Keep the product design exact. ${fidelity}`;
    default:
      return `Create a realistic premium commercial lifestyle scene showing ${title} in its genuine use environment. ${fidelity}`;
  }
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

export const buildVideoFromProduct = (product: Product): BuiltProductVideo => {
  const affiliateUrl = resolveAffiliateUrl(product);
  const images = pickImages(product);
  if (!images.hero) {
    throw new Error('لا توجد صورة محفوظة لهذا المنتج. أضيفي صورة واحدة على الأقل قبل توليد الفيديو.');
  }

  const title = (product.titleEn || product.titleAr || '').trim();
  if (!title) throw new Error('عنوان المنتج غير متوفر.');

  const brand = (product.brand || '').trim();
  const kind = detectKind(product);
  const features = (product.featuresEn?.length ? product.featuresEn : product.features ?? [])
    .map(feature => (feature || '').trim())
    .filter(Boolean);
  const specs = Object.entries(product.specsEn && Object.keys(product.specsEn).length > 0 ? product.specsEn : product.specs ?? {})
    .filter(([, value]) => Boolean(value));

  const featureOne = features[0] || specs[0]?.[1] || 'Designed for practical everyday use';
  const featureTwo = features[1] || specs[1]?.[1] || featureOne;
  const featureThree = features[2] || specs[2]?.[1] || featureTwo;

  const currentPrice = product.discountPrice > 0 ? product.discountPrice : product.originalPrice;
  const priceLine = formatPrice(currentPrice, product.currency || 'USD');
  const discountPercent = product.discountPercent || (
    product.originalPrice > 0 && product.discountPrice > 0 && product.discountPrice < product.originalPrice
      ? Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100)
      : 0
  );

  const hook = `Meet ${title}. Here is what makes this product worth a closer look.`;

  const scenes: VideoScene[] = [
    {
      timeRange: '00:00 - 00:05',
      sceneType: 'action',
      visualPrompt: `Cinematic hero reveal of ${title}. Preserve the exact verified product design and color. Premium e-commerce lighting.`,
      voiceoverText: hook,
      screenText: brand ? `${brand} — Product Spotlight` : 'Product Spotlight',
      sceneImage: proxiedImageUrl(images.hero)
    },
    {
      timeRange: '00:05 - 00:12',
      sceneType: 'action',
      visualPrompt: lifestylePrompt(kind, title),
      voiceoverText: featureOne,
      screenText: featureOne,
      sceneImage: proxiedImageUrl(images.alternate)
    },
    {
      timeRange: '00:12 - 00:20',
      sceneType: 'specs',
      visualPrompt: `Detailed close-ups of ${title}, showing only verified materials, controls, construction and functional details. No invented attachments.`,
      voiceoverText: `${featureTwo}. ${featureThree}.`,
      screenText: `${featureTwo} • ${featureThree}`,
      sceneImage: proxiedImageUrl(images.alternate2)
    }
  ];

  if (kind === 'cleaning') {
    scenes.push({
      timeRange: '00:20 - 00:29',
      sceneType: 'before_after',
      visualPrompt: `Realistic before-and-after demonstration for ${title}, only on the surface the verified product is designed to clean. Keep camera angle and lighting consistent; never exaggerate the result.`,
      voiceoverText: 'The difference is easy to see when the product is used for the job it was designed to do.',
      screenText: 'Realistic Before & After',
      sceneImage: proxiedImageUrl(images.alternate2),
      beforeImage: proxiedImageUrl(images.alternate),
      afterImage: proxiedImageUrl(images.alternate2),
      transformationNote: 'Before/after is allowed only for a genuine cleaning use case.'
    });
  } else {
    scenes.push({
      timeRange: '00:20 - 00:29',
      sceneType: 'action',
      visualPrompt: lifestylePrompt(kind, title),
      voiceoverText: 'It fits naturally into the way this product is meant to be used, without adding claims that are not in the verified listing.',
      screenText: 'Designed for Everyday Use',
      sceneImage: proxiedImageUrl(images.alternate2)
    });
  }

  scenes.push({
    timeRange: '00:29 - 00:36',
    sceneType: 'cta',
    visualPrompt: `Premium final pack shot of ${title}, faithful to the verified reference. Clean call-to-action layout with no fake badges or fake discount claims.`,
    voiceoverText: 'Check the product page for the latest price, availability and full specifications.',
    screenText: discountPercent > 0 ? `${discountPercent}% Off • ${priceLine}` : priceLine,
    sceneImage: proxiedImageUrl(images.hero)
  });

  const hashtagSource = [brand, product.category, product.subcategoryEn || product.subcategory, ...(product.keywords ?? []).slice(0, 4)]
    .map(value => (value || '').trim())
    .filter(Boolean)
    .map(value => `#${value.replace(/[^a-zA-Z0-9]+/g, '')}`)
    .filter(value => value.length > 1);
  const hashtags = Array.from(new Set([...hashtagSource, '#ProductReview', '#SmartShopping', '#YousraSmile'])).slice(0, 10);

  const caption = [
    title,
    brand ? `Brand: ${brand}` : '',
    ...features.slice(0, 3).map(feature => `• ${feature}`),
    `Current price: ${priceLine}`,
    'Check current availability and full specifications at the product link.',
    affiliateUrl
  ].filter(Boolean).join('\n');

  return {
    scenes,
    videoTitle: `${title} — Product Review & Features`,
    hook,
    callToAction: 'Check the product page for current price, availability and full specifications.',
    caption,
    hashtags,
    affiliateUrl,
    heroImage: proxiedImageUrl(images.hero),
    beforeImage: kind === 'cleaning' ? proxiedImageUrl(images.alternate) : '',
    afterImage: kind === 'cleaning' ? proxiedImageUrl(images.alternate2) : '',
    estimatedDurationSeconds: 36
  };
};
