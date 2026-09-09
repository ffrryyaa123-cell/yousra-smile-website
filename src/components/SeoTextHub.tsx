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

export const SeoTextHub: React.FC = () => {
  const { siteSettings } = useApp();
  const [productUrl, setProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [textNotice, setTextNotice] = useState('');
  const [source, setSource] = useState<ExtractedProduct | null>(null);
  const [bilingual, setBilingual] = useState<BilingualCopy | null>(null);
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  const discountPercent = useMemo(() => {
    if (!source?.price || !source?.listPrice || source.listPrice <= source.price) return 0;
    return Math.round(((source.listPrice - source.price) / source.listPrice) * 100);
  }, [source]);

  const buildAffiliateUrl = (raw: string, extracted: ExtractedProduct): string => {
    try {
      const original = new URL(raw);
      const originalHost = original.hostname.toLowerCase();

      if (isAmazonHost(originalHost) && original.searchParams.get('tag')) return raw;
      if (isAliHost(originalHost) && (original.searchParams.get('aff_id') || original.searchParams.get('aff_fcid'))) return raw;

      const target = new URL(extracted.finalUrl || raw);
      const host = target.hostname.toLowerCase();
      if (isAmazonHost(host) && siteSettings.amazonTag) {
        target.searchParams.set('tag', siteSettings.amazonTag);
      } else if (isAliHost(host) && siteSettings.aliexpressTag) {
        target.searchParams.set('aff_id', siteSettings.aliexpressTag);
      }
      return target.toString();
    } catch {
      return raw;
    }
  };

  const handleExtract = async () => {
    const raw = productUrl.trim();
    setError('');
    setTextNotice('');
    setSource(null);
    setBilingual(null);
    setAffiliateUrl('');

    if (!/^https:\/\//i.test(raw)) {
      setError('الصقي رابط المنتج الكامل الذي يبدأ بـ https://');
      return;
    }

    setLoading(true);
    try {
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
      setSource(extracted);
      setAffiliateUrl(buildAffiliateUrl(raw, extracted));

      // Text-only request. This intentionally does NOT call any image/video generator.
      const { data: textResult, error: textError } = await supabase.functions.invoke('product-text-copy', {
        body: { product: extracted }
      });

      if (textError) {
        setTextNotice(await invokeErrorMessage(
          textError,
          'تم استخراج بيانات المنتج الحقيقية، لكن تعذر إنشاء النسخة العربية/SEO.'
        ));
      } else if (textResult?.ok && textResult?.data) {
        setBilingual(textResult.data as BilingualCopy);
      } else if (textResult?.error) {
        setTextNotice(String(textResult.error));
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع أثناء جلب المنتج.');
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
      sourceImageUrls: source.images,
      checkedAt: source.checkedAt,
      warnings: source.warnings
    };
  }, [source, bilingual, affiliateUrl, discountPercent]);

  const downloadJson = () => {
    if (!allData) return;
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${source?.asin || source?.itemId || 'product'}-seo-text.json`;
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
            <h2 className="text-2xl font-black text-white">SEO والنصوص</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              الصقي رابط المنتج لجلب البيانات الحقيقية والسعر والكوبون ورابط الأفلييت والنص العربي والإنجليزي وبيانات SEO.
              هذه الأداة لا تولّد صوراً ولا فيديوهات ولا تستدعي مولدات الميديا.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-200">
            بدون توليد صور أو فيديو
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Globe className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={productUrl}
              onChange={e => setProductUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleExtract(); }}
              placeholder="الصقي رابط Amazon أو AliExpress هنا..."
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
            {loading ? 'جاري الجلب...' : 'جلب البيانات والنصوص'}
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
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
              <Sparkles className="mb-2 h-4 w-4 text-emerald-400" />
              <div className="text-[10px] text-slate-400">صور المصدر</div>
              <div className="mt-1 text-xs font-black text-white">{source.images?.length || 0} رابط</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
                فتح رابط الأفلييت
              </a>
            )}
          </div>

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
