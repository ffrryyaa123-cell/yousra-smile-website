import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/adminAccount';
import { catalogDatabase } from '../services/supabaseCatalog';

type CouponData = {
  label: string;
  code: string;
  terms: string;
} | null;

type ExtractedProduct = {
  sourceUrl: string;
  finalUrl: string;
  platform: string;
  marketplace: string;
  asin: string;
  itemId: string;
  title: string;
  brand: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  images: string[];
  price: number | null;
  listPrice: number | null;
  coupon: CouponData;
  checkedAt: string;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  breadcrumbs: string[];
  warnings: string[];
};

type BilingualCopy = {
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  longDescriptionEn?: string;
  longDescriptionAr?: string;
  featuresEn?: string[];
  featuresAr?: string[];
  specsEn?: Record<string, string>;
  specsAr?: Record<string, string>;
  seoTitleEn?: string;
  seoTitleAr?: string;
  seoDescriptionEn?: string;
  seoDescriptionAr?: string;
  keywordsEn?: string[];
  keywordsAr?: string[];
  hashtagsEn?: string[];
  hashtagsAr?: string[];
};

type ProductVerification = {
  platform: string;
  identityVerified: boolean;
  identifier: string;
  verificationSource: string;
  affiliateVerified: boolean;
  affiliateUrl: string;
  price: number | null;
  currency: string | null;
  pagePrice: number | null;
  pageCurrency?: string | null;
  officialPrice: number | null;
  officialCurrency?: string | null;
  officialTitle: string;
  officialBrand: string;
  warnings: string[];
};

const invokeErrorMessage = async (error: any, fallback: string): Promise<string> => {
  if (!error) return fallback;
  try {
    const context = error?.context;
    if (context && typeof context.json === 'function') {
      const payload = await context.json();
      if (payload?.error) return String(payload.error);
    }
  } catch {
    // Use the normal error message below.
  }
  return error?.message || fallback;
};

const isAmazonHost = (host: string) => /(^|\.)amazon\./i.test(host) || ['amzn.to', 'amzn.eu', 'a.co'].includes(host);
const isAliHost = (host: string) => /aliexpress/i.test(host);

const amazonAsinFromLongUrl = (value: string): string => {
  const match = value.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)
    ?? value.match(/[?&](?:asin|pd_rd_i)=([A-Z0-9]{10})/i);
  return match?.[1]?.toUpperCase() || '';
};

const aliItemIdFromLongUrl = (value: string): string => {
  const match = value.match(/\/(?:item|i)\/(?:[\w-]+\/)?(\d{8,})\.html/i)
    ?? value.match(/[?&](?:productId|itemId)=(\d{8,})/i);
  return match?.[1] || '';
};

const validateLongProductUrl = (raw: string) => {
  const parsed = new URL(raw);
  const host = parsed.hostname.toLowerCase();
  if (['amzn.to', 'amzn.eu', 'a.co'].includes(host)) {
    throw new Error('استخدمي رابط Amazon الطويل من شريط المتصفح، وليس الرابط المختصر، حتى يتم التحقق من ASIN والسعر ورابط الأفلييت.');
  }
  if (/(^|\.)amazon\./i.test(host)) {
    const asin = amazonAsinFromLongUrl(raw);
    if (!asin) throw new Error('هذا ليس رابط صفحة منتج Amazon طويل واضح. افتحي المنتج نفسه وانسخي الرابط من شريط المتصفح بالأعلى.');
    return { platform: 'amazon', identifier: asin };
  }
  if (isAliHost(host)) {
    const itemId = aliItemIdFromLongUrl(raw);
    if (!itemId) throw new Error('هذا ليس رابط صفحة منتج AliExpress طويل واضح. انسخي رابط المنتج نفسه من شريط المتصفح.');
    return { platform: 'aliexpress', identifier: itemId };
  }
  throw new Error('أداة CU والنصوص تقبل حالياً روابط Amazon أو AliExpress الطويلة المباشرة فقط.');
};

const inferProductCategory = (value: string) => {
  const text = value.toLowerCase();
  if (/kitchen|air fryer|pressure cooker|rice cooker|blender|mixer|coffee|cookware|toaster|oven|microwave|food processor/.test(text)) return 'smart-kitchen';
  if (/vacuum|floor|clean|mop|robot|smart home|security|camera|thermostat|doorbell|home automation/.test(text)) return 'smart-home';
  if (/furniture|decor|sofa|chair|table|bed|lamp|lighting|rug|shelf|storage/.test(text)) return 'furniture-decor';
  if (/fitness|health|exercise|massage|scale|wellness|workout/.test(text)) return 'health-fitness';
  if (/beauty|makeup|cosmetic|perfume|fragrance|fashion|women|hair|skin care|skincare/.test(text)) return 'women-corner';
  return 'smart-gadgets';
};

const isRetailerBoilerplate = (value: string): boolean => {
  const text = String(value || '').toLowerCase();
  if (!text.trim()) return false;
  return [
    /shop .{0,80} at the amazon .{0,80} store/,
    /free shipping on eligible items/,
    /everyday low prices/,
    /save up to \d+%/,
    /visit the .{0,80} store/,
    /amazon bakeware store/,
    /amazon.com: online shopping/
  ].some(pattern => pattern.test(text));
};

const makeSafeEnglishDescription = (product: ExtractedProduct): string => {
  const raw = String(product.description || '').trim();
  if (raw && !isRetailerBoilerplate(raw)) return raw;

  const facts = (product.features || [])
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .filter(value => !isRetailerBoilerplate(value))
    .slice(0, 4);

  if (facts.length) return facts.join(' ');
  return String(product.title || '').trim();
};

const makeSafeLongEnglishDescription = (product: ExtractedProduct): string => {
  const base = makeSafeEnglishDescription(product);
  const features = (product.features || [])
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .filter(value => !isRetailerBoilerplate(value))
    .slice(0, 8);
  const joined = [base, ...features.filter(value => !base.includes(value))].filter(Boolean).join(' ');
  return joined || String(product.title || '').trim();
};

const compactText = (value: string, max: number) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
};

const keywordSeed = (product: ExtractedProduct): string[] => {
  const words = [product.brand, ...(product.breadcrumbs || []), product.title]
    .flatMap(value => String(value || '').split(/[,|/•-]/g))
    .map(value => value.trim())
    .filter(value => value.length >= 3 && value.length <= 60);
  return Array.from(new Set(words)).slice(0, 12);
};

const completeBilingualCopy = (generated: BilingualCopy | null | undefined, product: ExtractedProduct): BilingualCopy => {
  const safeDescription = makeSafeEnglishDescription(product);
  const safeLongDescription = makeSafeLongEnglishDescription(product);
  const safeTitle = String(product.title || '').trim();
  const keys = keywordSeed(product);
  const hashtags = keys.slice(0, 8).map(value => '#' + value.replace(/[^A-Za-z0-9]+/g, '')).filter(value => value.length > 1);
  const cleanGeneratedDescription = generated?.descriptionEn && !isRetailerBoilerplate(generated.descriptionEn)
    ? generated.descriptionEn.trim()
    : safeDescription;
  const cleanGeneratedLong = generated?.longDescriptionEn && !isRetailerBoilerplate(generated.longDescriptionEn)
    ? generated.longDescriptionEn.trim()
    : safeLongDescription;

  return {
    ...(generated || {}),
    titleEn: generated?.titleEn?.trim() || safeTitle,
    descriptionEn: cleanGeneratedDescription,
    longDescriptionEn: cleanGeneratedLong,
    featuresEn: generated?.featuresEn?.length ? generated.featuresEn : (product.features || []),
    specsEn: generated?.specsEn && Object.keys(generated.specsEn).length ? generated.specsEn : (product.specs || {}),
    seoTitleEn: generated?.seoTitleEn?.trim() || compactText(safeTitle, 60),
    seoDescriptionEn: generated?.seoDescriptionEn?.trim() || compactText(cleanGeneratedDescription || safeLongDescription, 155),
    keywordsEn: generated?.keywordsEn?.length ? generated.keywordsEn : keys,
    hashtagsEn: generated?.hashtagsEn?.length ? generated.hashtagsEn : hashtags,
    titleAr: generated?.titleAr?.trim() || '',
    descriptionAr: generated?.descriptionAr?.trim() || '',
    longDescriptionAr: generated?.longDescriptionAr?.trim() || '',
    featuresAr: generated?.featuresAr || [],
    specsAr: generated?.specsAr || {},
    seoTitleAr: generated?.seoTitleAr?.trim() || '',
    seoDescriptionAr: generated?.seoDescriptionAr?.trim() || '',
    keywordsAr: generated?.keywordsAr || [],
    hashtagsAr: generated?.hashtagsAr || []
  };
};

const arabicSeoIsComplete = (copy: BilingualCopy | null | undefined): boolean => Boolean(
  copy?.titleAr?.trim() &&
  copy?.descriptionAr?.trim() &&
  copy?.seoTitleAr?.trim() &&
  copy?.seoDescriptionAr?.trim()
);

const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
};

const CopyFieldButton: React.FC<{ value?: string }> = ({ value = '' }) => {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500 hover:text-white"
    >
      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'تم' : 'نسخ'}
    </button>
  );
};

const TextCard: React.FC<{ title: string; value?: string; dir?: 'rtl' | 'ltr' }> = ({ title, value = '', dir = 'rtl' }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h4 className="text-xs font-black text-amber-300">{title}</h4>
      <CopyFieldButton value={value} />
    </div>
    <div dir={dir} className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">
      {value || '—'}
    </div>
  </div>
);

export const SeoTextHub: React.FC<{ onOpenProducts?: () => void }> = ({ onOpenProducts }) => {
  const { siteSettings, products, addProduct, patchProduct } = useApp();
  const [productUrl, setProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [textNotice, setTextNotice] = useState('');
  const [source, setSource] = useState<ExtractedProduct | null>(null);
  const [bilingual, setBilingual] = useState<BilingualCopy | null>(null);
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [verification, setVerification] = useState<ProductVerification | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const existingProduct = useMemo(() => {
    const identifier = verification?.identifier || '';
    if (!identifier) return null;
    return products.find(product => {
      if (verification?.platform === 'amazon') {
        return [product.amazonUrl, product.sourceProductUrl]
          .filter(Boolean)
          .some(url => amazonAsinFromLongUrl(String(url)) === identifier);
      }
      if (verification?.platform === 'aliexpress') {
        return [product.aliexpressUrl, product.sourceProductUrl]
          .filter(Boolean)
          .some(url => aliItemIdFromLongUrl(String(url)) === identifier);
      }
      return false;
    }) || null;
  }, [products, verification]);

  const discountPercent = useMemo(() => {
    if (!source?.price || !source?.listPrice || source.listPrice <= source.price) return 0;
    return Math.round(((source.listPrice - source.price) / source.listPrice) * 100);
  }, [source]);

  // Affiliate links are returned only after server-side product verification.


  const requestTextCopy = async (product: ExtractedProduct): Promise<BilingualCopy> => {
    let lastError = '';
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const { data: textResult, error: textError } = await supabase.functions.invoke('product-text-copy', {
        body: { product }
      });

      if (!textError && textResult?.ok && textResult?.data) {
        const completed = completeBilingualCopy(textResult.data as BilingualCopy, product);
        if (arabicSeoIsComplete(completed) || attempt === 2) return completed;
        lastError = 'رجعت خدمة النصوص نتيجة ناقصة، وتمت إعادة المحاولة تلقائياً.';
      } else {
        lastError = textError
          ? await invokeErrorMessage(textError, 'تعذر إنشاء العربي وSEO.')
          : String(textResult?.error || 'تعذر إنشاء العربي وSEO.');
      }

      if (attempt < 2) await new Promise(resolve => window.setTimeout(resolve, 650));
    }

    const fallback = completeBilingualCopy(null, product);
    throw Object.assign(new Error(lastError || 'تعذر إنشاء العربي وSEO.'), { fallback });
  };

  const handleExtract = async () => {
    const raw = productUrl.trim();
    setError('');
    setTextNotice('');
    setSource(null);
    setBilingual(null);
    setAffiliateUrl('');
    setVerification(null);

    if (!/^https:\/\//i.test(raw)) {
      setError('الصقي رابط المنتج الكامل الذي يبدأ بـ https://');
      return;
    }

    setLoading(true);
    try {
      validateLongProductUrl(raw);

      const { data: extractResult, error: extractError } = await supabase.functions.invoke('product-extract', {
        body: { url: raw }
      });

      if (extractError) {
        throw new Error(await invokeErrorMessage(extractError, 'تعذر الاتصال بخدمة استخراج المنتج.'));
      }
      if (!extractResult?.ok || !extractResult?.data) {
        throw new Error(extractResult?.error || 'تعذر قراءة بيانات المنتج من الصفحة.');
      }

      const extracted = extractResult.data as ExtractedProduct;

      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('product-verify', {
        body: {
          url: raw,
          extracted,
          amazonTag: siteSettings.amazonTag || '',
          aliexpressTag: siteSettings.aliexpressTag || ''
        }
      });

      if (verifyError) {
        throw new Error(await invokeErrorMessage(verifyError, 'تعذر التحقق من هوية المنتج. لم يتم اعتماد السعر أو رابط الأفلييت.'));
      }
      if (!verifyResult?.ok || !verifyResult?.data) {
        throw new Error(verifyResult?.error || 'تعذر التحقق من هوية المنتج.');
      }

      const verified = verifyResult.data as ProductVerification;
      if (!verified.identityVerified) {
        throw new Error('لم يتم تأكيد تطابق المنتج مع الرابط. لم يتم عرض البيانات.');
      }

      const verifiedSource: ExtractedProduct = {
        ...extracted,
        images: [], // CU/text tool: never retain retailer images
        description: makeSafeEnglishDescription(extracted),
        price: typeof verified.price === 'number' ? verified.price : extracted.price,
        currency: verified.currency || extracted.currency,
        warnings: [...(extracted.warnings || []), ...(verified.warnings || [])]
      };

      setVerification(verified);
      setSource(verifiedSource);
      setAffiliateUrl(verified.affiliateUrl || '');

      // Text-only request. This intentionally does NOT call any image/video generator.
      try {
        const completedCopy = await requestTextCopy(verifiedSource);
        setBilingual(completedCopy);
        if (!arabicSeoIsComplete(completedCopy)) {
          setTextNotice('تم تعبئة الإنجليزي وSEO الإنجليزي، لكن خدمة الترجمة رجعت بعض الحقول العربية ناقصة. اضغطي «إعادة توليد العربي وSEO».');
        }
      } catch (textFailure: any) {
        setBilingual(completeBilingualCopy(textFailure?.fallback || null, verifiedSource));
        setTextNotice((textFailure?.message || 'تعذر إنشاء العربي وSEO.') + ' تم الاحتفاظ بالبيانات الإنجليزية الموثقة بدون اختراع معلومات.');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع أثناء جلب المنتج.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryText = async () => {
    if (!source) return;
    setLoading(true);
    setTextNotice('');
    try {
      const copy = await requestTextCopy({ ...source, description: makeSafeEnglishDescription(source) });
      setBilingual(copy);
      setTextNotice(arabicSeoIsComplete(copy)
        ? '✓ تم تحديث العربي والإنجليزي وSEO من البيانات الموثقة.'
        : 'تمت إعادة المحاولة، لكن بعض حقول العربي ما زالت ناقصة. لن يتم حفظ منتج ناقص.');
    } catch (retryError: any) {
      setBilingual(previous => completeBilingualCopy(previous, source));
      setTextNotice(retryError?.message || 'تعذر إعادة توليد العربي وSEO.');
    } finally {
      setLoading(false);
    }
  };

  const allData = useMemo(() => {
    if (!source) return null;
    return {
      sourceUrl: source.sourceUrl,
      finalUrl: source.finalUrl,
      affiliateUrl,
      identityVerified: verification?.identityVerified ?? false,
      verificationSource: verification?.verificationSource || '',
      affiliateVerified: verification?.affiliateVerified ?? false,
      pagePrice: verification?.pagePrice ?? null,
      officialPrice: verification?.officialPrice ?? null,
      platform: source.platform,
      marketplace: source.marketplace,
      asin: source.asin,
      itemId: source.itemId,
      brand: source.brand,
      titleEn: bilingual?.titleEn || source.title,
      titleAr: bilingual?.titleAr || '',
      descriptionEn: bilingual?.descriptionEn || source.description,
      descriptionAr: bilingual?.descriptionAr || '',
      longDescriptionEn: bilingual?.longDescriptionEn || '',
      longDescriptionAr: bilingual?.longDescriptionAr || '',
      featuresEn: bilingual?.featuresEn?.length ? bilingual.featuresEn : source.features,
      featuresAr: bilingual?.featuresAr || [],
      specsEn: Object.keys(bilingual?.specsEn || {}).length ? bilingual?.specsEn : source.specs,
      specsAr: bilingual?.specsAr || {},
      price: source.price,
      listPrice: source.listPrice,
      discountPercent,
      currency: source.currency,
      coupon: source.coupon,
      rating: source.rating,
      reviewCount: source.reviewCount,
      breadcrumbs: source.breadcrumbs,
      seoTitleEn: bilingual?.seoTitleEn || '',
      seoTitleAr: bilingual?.seoTitleAr || '',
      seoDescriptionEn: bilingual?.seoDescriptionEn || '',
      seoDescriptionAr: bilingual?.seoDescriptionAr || '',
      keywordsEn: bilingual?.keywordsEn || [],
      keywordsAr: bilingual?.keywordsAr || [],
      hashtagsEn: bilingual?.hashtagsEn || [],
      hashtagsAr: bilingual?.hashtagsAr || [],
      checkedAt: source.checkedAt,
      warnings: source.warnings
    };
  }, [source, bilingual, affiliateUrl, discountPercent, verification]);

  const handleSaveToProducts = async () => {
    if (!source || !verification?.identityVerified) {
      setSaveMessage('لا يمكن الحفظ قبل تأكيد هوية المنتج.');
      return;
    }
    if (!bilingual?.titleAr || !bilingual?.descriptionAr || !bilingual?.titleEn || !bilingual?.seoTitleEn || !bilingual?.seoTitleAr) {
      setSaveMessage('النص العربي والإنجليزي وSEO لم يكتمل بعد. أعيدي جلب البيانات حتى لا ينزل المنتج بنص ناقص.');
      return;
    }

    setSavingProduct(true);
    setSaveMessage('');
    try {
      const categorySeed = [source.title, source.brand, ...(source.breadcrumbs || [])].join(' ');
      const category = inferProductCategory(categorySeed) as any;
      const subcategory = source.breadcrumbs?.[source.breadcrumbs.length - 1] || source.brand || '';
      const currentPrice = typeof source.price === 'number' ? source.price : 0;
      const regularPrice = typeof source.listPrice === 'number' && source.listPrice >= currentPrice ? source.listPrice : currentPrice;
      const coupon = source.coupon ? {
        label: source.coupon.label || '',
        code: source.coupon.code || '',
        terms: source.coupon.terms || '',
        expiresOn: '',
        isPublic: true
      } : undefined;

      const textPatch = {
        titleAr: bilingual.titleAr,
        titleEn: bilingual.titleEn || source.title,
        description: bilingual.descriptionAr || '',
        descriptionEn: bilingual.descriptionEn || source.description || '',
        longDescription: bilingual.longDescriptionAr || bilingual.descriptionAr || '',
        longDescriptionEn: bilingual.longDescriptionEn || bilingual.descriptionEn || source.description || '',
        category,
        subcategory,
        subcategoryEn: subcategory,
        brand: source.brand || '',
        amazonUrl: verification.platform === 'amazon' ? (affiliateUrl || source.finalUrl || source.sourceUrl) : '',
        aliexpressUrl: verification.platform === 'aliexpress' ? (affiliateUrl || source.finalUrl || source.sourceUrl) : undefined,
        sourceProductUrl: source.sourceUrl,
        originalPrice: regularPrice,
        discountPrice: currentPrice,
        discountPercent,
        currency: source.currency || 'USD',
        rating: typeof source.rating === 'number' ? source.rating : 0,
        reviewCount: typeof source.reviewCount === 'number' ? source.reviewCount : 0,
        features: bilingual.featuresAr?.length ? bilingual.featuresAr : [],
        featuresEn: bilingual.featuresEn?.length ? bilingual.featuresEn : source.features || [],
        specs: bilingual.specsAr && Object.keys(bilingual.specsAr).length ? bilingual.specsAr : {},
        specsEn: bilingual.specsEn && Object.keys(bilingual.specsEn).length ? bilingual.specsEn : source.specs || {},
        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),
        seoTitleAr: bilingual.seoTitleAr || bilingual.titleAr || '',
        seoTitleEn: bilingual.seoTitleEn || bilingual.titleEn || source.title || '',
        seoDescriptionAr: bilingual.seoDescriptionAr || bilingual.descriptionAr || '',
        seoDescriptionEn: bilingual.seoDescriptionEn || bilingual.descriptionEn || source.description || '',
        keywordsAr: bilingual.keywordsAr || [],
        keywordsEn: bilingual.keywordsEn || [],
        hashtagsAr: bilingual.hashtagsAr || [],
        hashtagsEn: bilingual.hashtagsEn || [],
        socialCaption: [bilingual.titleAr, bilingual.descriptionAr, ...(bilingual.hashtagsAr || [])].filter(Boolean).join(' ' ),
        coupon,
        isActive: true
      };

      if (existingProduct) {
        const patch = {
          ...textPatch,
        };
        patchProduct(existingProduct.id, patch as any);
        await catalogDatabase.patchProduct(existingProduct.id, patch as Record<string, unknown>);
        setSaveMessage('✓ تم تحديث المنتج وحفظ البيانات في Supabase بدون حذف صوره أو فيديوهاته الحالية.');
      } else {
        const created = addProduct({
          ...textPatch,
          image: '',
          images: [],
          youtubeUrl: '',
          tiktokUrl: '',
          pinterestUrl: '',
          isFeatured: false,
          isTopSelling: false,
          isHidden: false
        } as any);
        await catalogDatabase.saveProduct(created);
        setSaveMessage('✓ تم إنشاء المنتج وحفظه في Supabase وإضافته إلى منتجات الموقع.');
      }

      window.setTimeout(() => onOpenProducts?.(), 700);
    } catch (err) {
      setSaveMessage('تعذر تأكيد حفظ المنتج في Supabase: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingProduct(false);
    }
  };

  const downloadJson = () => {
    if (!allData) return;
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${source?.asin || source?.itemId || 'product'}-cu-text.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const featuresEn = (bilingual?.featuresEn?.length ? bilingual.featuresEn : source?.features || []).join('\n• ');
  const featuresAr = (bilingual?.featuresAr || []).join('\n• ');
  const specsEn = Object.entries(Object.keys(bilingual?.specsEn || {}).length ? bilingual?.specsEn || {} : source?.specs || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const specsAr = Object.entries(bilingual?.specsAr || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-300">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-black">أداة مستقلة وخفيفة</span>
            </div>
            <h2 className="text-2xl font-black text-white">CU والنصوص</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              الصقي رابط المنتج الطويل من شريط المتصفح لجلب CU وبيانات المنتج الحقيقية والسعر والكوبون ورابط الأفلييت والنص العربي والإنجليزي وبيانات SEO.
              هذه الأداة لا تولّد صوراً ولا فيديوهات ولا تستدعي مولدات الميديا.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-200">
            لا يتم جلب أو حفظ صور Amazon من هذه الأداة
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Globe className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={productUrl}
              onChange={e => setProductUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleExtract(); }}
              placeholder="الصقي رابط المنتج الطويل من شريط المتصفح هنا..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3.5 pr-12 pl-4 text-sm text-white outline-none transition focus:border-emerald-500"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleExtract()}
            disabled={loading}
            className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? 'جاري التحقق والجلب...' : 'جلب CU والبيانات والنصوص'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}
        {textNotice && (
          <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
            {textNotice}
          </div>
        )}
      </div>

      {source && (
        <>
          {verification?.identityVerified && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-100">
              <div className="font-black text-emerald-300">✓ هوية المنتج مؤكدة</div>
              <div className="mt-1 text-xs">
                تم مطابقة {verification.platform === 'amazon' ? 'ASIN' : 'Item ID'}: <span className="font-mono font-black text-white">{verification.identifier}</span>.
                مصدر التحقق: <span className="text-white">{verification.verificationSource}</span>.
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <ShoppingBag className="mb-2 h-4 w-4 text-emerald-400" />
              <div className="text-[10px] text-slate-400">المنصة</div>
              <div className="mt-1 text-xs font-black text-white">{source.platform || '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <DollarSign className="mb-2 h-4 w-4 text-amber-400" />
              <div className="text-[10px] text-slate-400">السعر الحالي</div>
              <div className="mt-1 text-xs font-black text-white">{source.price ?? '—'} {source.currency}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <Tag className="mb-2 h-4 w-4 text-pink-400" />
              <div className="text-[10px] text-slate-400">الخصم</div>
              <div className="mt-1 text-xs font-black text-white">{discountPercent ? `${discountPercent}%` : '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <Star className="mb-2 h-4 w-4 text-yellow-400" />
              <div className="text-[10px] text-slate-400">التقييم</div>
              <div className="mt-1 text-xs font-black text-white">{source.rating ?? '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <FileText className="mb-2 h-4 w-4 text-sky-400" />
              <div className="text-[10px] text-slate-400">المميزات</div>
              <div className="mt-1 text-xs font-black text-white">{source.features?.length || 0}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <FileText className="mb-2 h-4 w-4 text-indigo-400" />
              <div className="text-[10px] text-slate-400">المواصفات</div>
              <div className="mt-1 text-xs font-black text-white">{Object.keys(source.specs || {}).length}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <Tag className="mb-2 h-4 w-4 text-purple-400" />
              <div className="text-[10px] text-slate-400">الكوبون</div>
              <div className="mt-1 text-xs font-black text-white">{source.coupon?.label || '—'}</div>
            </div>
          </div>

          {saveMessage && (
            <div className={saveMessage.startsWith('✓') ? 'rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm font-bold text-emerald-100' : 'rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm font-bold text-amber-100'}>
              {saveMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSaveToProducts()}
              disabled={savingProduct || !verification?.identityVerified}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              {savingProduct ? 'جاري الحفظ في Supabase...' : existingProduct ? 'تحديث في المنتجات' : 'حفظ إلى المنتجات'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!allData) return;
                await copyText(JSON.stringify(allData, null, 2));
                setCopiedAll(true);
                window.setTimeout(() => setCopiedAll(false), 1500);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-black text-emerald-200 hover:bg-emerald-500/20"
            >
              {copiedAll ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedAll ? 'تم نسخ الكل' : 'نسخ كل البيانات'}
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-xs font-black text-sky-200 hover:bg-sky-500/20"
            >
              <FileText className="h-4 w-4" />
              تنزيل JSON
            </button>
            {affiliateUrl && (
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-black text-amber-200 hover:bg-amber-500/20"
              >
                <ExternalLink className="h-4 w-4" />
                {verification?.affiliateVerified ? 'فتح رابط الأفلييت المؤكد' : 'فتح رابط المنتج'}
              </a>
            )}
          </div>
          {saveMessage && <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-sm font-bold text-amber-100">{saveMessage}</div>}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TextCard title="اسم المنتج — English" value={bilingual?.titleEn || source.title} dir="ltr" />
            <TextCard title="اسم المنتج — عربي" value={bilingual?.titleAr || ''} />
            <TextCard title="الوصف — English" value={bilingual?.descriptionEn || source.description} dir="ltr" />
            <TextCard title="الوصف — عربي" value={bilingual?.descriptionAr || ''} />
            <TextCard title="الوصف الطويل — English" value={bilingual?.longDescriptionEn || ''} dir="ltr" />
            <TextCard title="الوصف الطويل — عربي" value={bilingual?.longDescriptionAr || ''} />
            <TextCard title="المميزات — English" value={featuresEn ? `• ${featuresEn}` : ''} dir="ltr" />
            <TextCard title="المميزات — عربي" value={featuresAr ? `• ${featuresAr}` : ''} />
            <TextCard title="المواصفات — English" value={specsEn} dir="ltr" />
            <TextCard title="المواصفات — عربي" value={specsAr} />
            <TextCard title="SEO Title — English" value={bilingual?.seoTitleEn || ''} dir="ltr" />
            <TextCard title="عنوان SEO — عربي" value={bilingual?.seoTitleAr || ''} />
            <TextCard title="SEO Description — English" value={bilingual?.seoDescriptionEn || ''} dir="ltr" />
            <TextCard title="وصف SEO — عربي" value={bilingual?.seoDescriptionAr || ''} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TextCard title="رابط المصدر" value={source.sourceUrl} dir="ltr" />
            <TextCard title="رابط المنتج النهائي" value={source.finalUrl} dir="ltr" />
            <TextCard title="رابط الأفلييت" value={affiliateUrl} dir="ltr" />
            <TextCard title="الكوبون / الخصم" value={source.coupon?.label || ''} />
            <TextCard title="كود الكوبون" value={source.coupon?.code || ''} dir="ltr" />
            <TextCard title="شروط الكوبون" value={source.coupon?.terms || ''} />
            <TextCard title="Keywords — English" value={(bilingual?.keywordsEn || []).join(', ')} dir="ltr" />
            <TextCard title="الكلمات المفتاحية — عربي" value={(bilingual?.keywordsAr || []).join('، ')} />
            <TextCard title="Hashtags" value={[...(bilingual?.hashtagsEn || []), ...(bilingual?.hashtagsAr || [])].join(' ')} dir="ltr" />
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-xs leading-6 text-slate-300">
            <div className="mb-2 font-black text-white">بيانات المصدر الإضافية</div>
            <div>Brand: <span className="text-white">{source.brand || '—'}</span></div>
            <div>ASIN / Item ID: <span className="font-mono text-white">{source.asin || source.itemId || '—'}</span></div>
            <div>Marketplace: <span className="text-white">{source.marketplace || '—'}</span></div>
            <div>List Price: <span className="text-white">{source.listPrice ?? '—'} {source.currency}</span></div>
            <div>Reviews: <span className="text-white">{source.reviewCount ?? '—'}</span></div>
            <div>Page Price: <span className="text-white">{verification?.pagePrice ?? '—'} {verification?.pageCurrency || source.currency}</span></div>
            <div>Official/API Price: <span className="text-white">{verification?.officialPrice ?? '—'} {verification?.officialCurrency || ''}</span></div>
            <div>Affiliate link: <span className={verification?.affiliateVerified ? 'text-emerald-300' : 'text-amber-300'}>{verification?.affiliateVerified ? 'مؤكد من Affiliate API' : 'غير مؤكد من API — راجعي التحذير'}</span></div>
            <div>Category path: <span className="text-white">{(source.breadcrumbs || []).join(' › ') || '—'}</span></div>
            <div className="mt-2 text-slate-400">
              روابط صور المصدر محفوظة داخل نتيجة JSON فقط ({source.images?.length || 0})، ولم يتم توليد أو رفع أي صورة أو فيديو من هذه الأداة.
            </div>
            {!!source.warnings?.length && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-amber-100">
                {source.warnings.map((warning, index) => <div key={`${warning}-${index}`}>• {warning}</div>)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
