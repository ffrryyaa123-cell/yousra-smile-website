import fs from 'node:fs';

const replaceOnce = (source, needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-social-export] Missing ${label}`);
  return source.replace(needle, replacement);
};

// ---------------------------------------------------------------------------
// 1) Review/video export hub: keep the UI compact, but prepare COMPLETE
//    publishing metadata from the linked product (title, description,
//    hashtags, affiliate URL). Pinterest gets the affiliate destination
//    directly; TikTok/YouTube/Instagram open their upload surfaces after the
//    full publishing package is copied to the clipboard.
// ---------------------------------------------------------------------------
const socialFile = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
const socialSource = `import React, { useMemo, useState } from 'react';
import { VideoReview } from '../types';
import { useApp } from '../context/AppContext';
import { Check, Copy, ExternalLink, Share2, ShoppingBag, Sparkles, Youtube, Instagram, Video } from 'lucide-react';

interface SocialVideoExportModalProps {
  video: VideoReview | null;
  onClose: () => void;
}

const PinterestIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.229 7.462-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.89 2.884 2.888 2.888 0 0 1-2.888-2.884 2.888 2.888 0 0 1 2.888-2.883c.31 0 .61.052.888.147V9.432a6.327 6.327 0 0 0-.888-.063A6.333 6.333 0 0 0 3.15 15.702a6.333 6.333 0 0 0 6.333 6.333c3.497 0 6.333-2.836 6.333-6.333V9.117a8.217 8.217 0 0 0 5.173 1.802V7.474a4.818 4.818 0 0 1-1.4-.788z" />
  </svg>
);

const CopyRow: React.FC<{ label: string; value: string; copied: string; setCopied: (value: string) => void }> = ({ label, value, copied, setCopied }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
      <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1300); }} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20">
        {copied === label ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        {copied === label ? 'تم' : 'نسخ'}
      </button>
    </div>
    <div dir={label.includes('English') || label.includes('URL') ? 'ltr' : undefined} className="whitespace-pre-wrap break-words text-xs text-slate-100">{value || '—'}</div>
  </div>
);

export const SocialVideoExportModal: React.FC<SocialVideoExportModalProps> = ({ video, onClose }) => {
  const { products, language, getAffiliateUrl } = useApp();
  const [copied, setCopied] = useState('');
  if (!video) return null;

  const product = products.find(item => item.id === video.productId);
  const affiliateUrl = product ? getAffiliateUrl(product, 'amazon') : '';
  const videoUrl = video.videoUrl || (video.embedId ? \`https://www.youtube.com/watch?v=\${video.embedId}\` : '');
  const thumbnail = video.hideThumbnail ? '' : (video.thumbnailUrl || video.productImage || product?.image || '');

  const title = language === 'en'
    ? (product?.seoTitleEn || product?.titleEn || video.title || video.productTitle)
    : (product?.seoTitleAr || product?.titleAr || video.productTitle || video.title);
  const description = language === 'en'
    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || video.seoDescription || video.title)
    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);
  const hashtags = useMemo(() => {
    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);
    const fallback = video.hashtags || [];
    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];
    return Array.from(new Set([...productTags, ...fallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');
  }, [language, product, video.hashtags]);

  const caption = [title, description, hashtags, affiliateUrl ? \`Shop / Affiliate link: \${affiliateUrl}\` : '', videoUrl ? \`Video: \${videoUrl}\` : '']
    .filter(Boolean)
    .join('\\n\\n');

  const pinterestShareUrl = \`https://pinterest.com/pin/create/button/?url=\${encodeURIComponent(affiliateUrl || videoUrl)}&media=\${encodeURIComponent(thumbnail)}&description=\${encodeURIComponent(caption)}\`;

  const openUpload = async (platform: 'tiktok' | 'youtube' | 'instagram') => {
    await navigator.clipboard.writeText(caption);
    setCopied('package');
    window.setTimeout(() => setCopied(''), 1500);
    const url = platform === 'tiktok'
      ? 'https://www.tiktok.com/upload'
      : platform === 'youtube'
        ? 'https://www.youtube.com/upload'
        : 'https://www.instagram.com/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#111113] p-5 text-white shadow-2xl sm:p-7" onClick={event => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15"><Share2 className="h-5 w-5 text-amber-400" /></div>
            <div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400"><Sparkles className="h-3 w-3" /> SOCIAL EXPORT HUB</div>
              <h3 className="text-lg font-black">{language === 'en' ? 'Publish review with complete product data' : 'نشر المراجعة مع بيانات المنتج كاملة'}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">{language === 'en' ? 'Close' : 'إغلاق'}</button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-3">
          {thumbnail ? <img src={thumbnail} alt="" className="h-16 w-24 rounded-xl object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-800"><Video className="h-6 w-6 text-slate-500" /></div>}
          <div className="min-w-0"><div className="line-clamp-2 text-sm font-black">{title}</div><div className="mt-1 text-[10px] text-slate-400">{product?.brand || video.platform}</div></div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a href={pinterestShareUrl} target="_blank" rel="noopener noreferrer" onClick={async () => navigator.clipboard.writeText(title)} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/15 px-3 py-3 text-xs font-black hover:bg-red-600/25"><PinterestIcon className="h-4 w-4" /> Pinterest</a>
          <button type="button" onClick={() => void openUpload('tiktok')} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-3 text-xs font-black hover:bg-cyan-500/20"><TikTokIcon className="h-4 w-4" /> TikTok</button>
          <button type="button" onClick={() => void openUpload('youtube')} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/15 px-3 py-3 text-xs font-black hover:bg-red-600/25"><Youtube className="h-4 w-4" /> YouTube</button>
          <button type="button" onClick={() => void openUpload('instagram')} className="flex items-center justify-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-3 py-3 text-xs font-black hover:bg-pink-500/20"><Instagram className="h-4 w-4" /> Instagram</button>
        </div>

        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-100">
          {language === 'en' ? 'TikTok, YouTube and Instagram do not provide a public browser URL that can fill every upload field automatically. The complete publishing package is copied before the upload page opens. Pinterest receives the affiliate destination, image and description directly.' : 'تيك توك ويوتيوب وإنستغرام لا توفر روابط ويب عامة تسمح بتعبئة كل حقول الرفع تلقائياً. لذلك يتم نسخ حزمة النشر كاملة تلقائياً قبل فتح صفحة الرفع. أما Pinterest فيستقبل رابط العمولة والصورة والوصف مباشرة.'}
        </div>

        <div className="space-y-2">
          <CopyRow label={language === 'en' ? 'TITLE — English' : 'العنوان'} value={title} copied={copied} setCopied={setCopied} />
          <CopyRow label={language === 'en' ? 'DESCRIPTION — English' : 'الوصف'} value={description} copied={copied} setCopied={setCopied} />
          <CopyRow label="HASHTAGS" value={hashtags} copied={copied} setCopied={setCopied} />
          <CopyRow label="AFFILIATE URL" value={affiliateUrl} copied={copied} setCopied={setCopied} />
          <CopyRow label="VIDEO URL" value={videoUrl} copied={copied} setCopied={setCopied} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(caption); setCopied('package'); window.setTimeout(() => setCopied(''), 1500); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400">{copied === 'package' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === 'package' ? 'تم نسخ الحزمة' : 'نسخ حزمة النشر كاملة'}</button>
          {affiliateUrl && <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300"><ShoppingBag className="h-4 w-4" /> رابط العمولة <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(socialFile, socialSource, 'utf8');

// ---------------------------------------------------------------------------
// 2) Product page sharing: use the SEO fields + affiliate link, add the three
//    priority channels, and keep the image overlay uncluttered (one Share
//    control instead of a row of platform names).
// ---------------------------------------------------------------------------
const detailFile = new URL('../src/components/ProductDetailModal.tsx', import.meta.url);
let detail = fs.readFileSync(detailFile, 'utf8');

if (!detail.includes('const socialShareBundle =')) {
  const start = `  const productUrl = window.location.href;\n  const shareTitle = product.titleAr || product.titleEn;\n  const shareText = \`مراجعة وتفاصيل \${shareTitle} عبر يسرى سمايل Yousra Smile:\`;\n`;
  const replacement = `  const productUrl = window.location.href;\n  const affiliateShareUrl = getAffiliateUrl(product, 'amazon');\n  const shareTitle = language === 'en'\n    ? (product.seoTitleEn || product.titleEn || product.titleAr)\n    : (product.seoTitleAr || product.titleAr || product.titleEn);\n  const shareDescription = language === 'en'\n    ? (product.seoDescriptionEn || product.descriptionEn || product.longDescriptionEn || product.description)\n    : (product.seoDescriptionAr || product.description || product.longDescription);\n  const shareHashtags = (language === 'en' ? (product.hashtagsEn || []) : (product.hashtagsAr || [])).join(' ');\n  const socialShareBundle = [shareTitle, shareDescription, shareHashtags, affiliateShareUrl ? \`Shop / Affiliate link: \${affiliateShareUrl}\` : '', \`Product page: \${productUrl}\`]\n    .filter(Boolean)\n    .join('\\n\\n');\n  const shareText = socialShareBundle;\n`;
  detail = replaceOnce(detail, start, replacement, 'product share metadata');
}

if (!detail.includes("const openPrioritySocial =")) {
  const needle = `  const shareToTwitter = () => {\n    const url = \`https://twitter.com/intent/tweet?url=\${encodeURIComponent(productUrl)}&text=\${encodeURIComponent(shareText)}\`;\n    window.open(url, '_blank', 'noopener,noreferrer');\n  };\n`;
  const replacement = `${needle}\n  const openPrioritySocial = async (platform: 'instagram' | 'youtube' | 'tiktok') => {\n    if (navigator.clipboard) await navigator.clipboard.writeText(socialShareBundle);\n    const url = platform === 'youtube'\n      ? 'https://www.youtube.com/upload'\n      : platform === 'tiktok'\n        ? 'https://www.tiktok.com/upload'\n        : 'https://www.instagram.com/';\n    window.open(url, '_blank', 'noopener,noreferrer');\n  };\n`;
  detail = replaceOnce(detail, needle, replacement, 'priority social upload helper');
}

if (!detail.includes('Shop / Affiliate link') || detail.includes('&description=${encodeURIComponent(shareTitle)}`;')) {
  detail = detail.replace(
    `  const shareToPinterest = () => {\n    const url = \`https://pinterest.com/pin/create/button/?url=\${encodeURIComponent(productUrl)}&media=\${encodeURIComponent(product.image)}&description=\${encodeURIComponent(shareTitle)}\`;\n    window.open(url, '_blank', 'noopener,noreferrer');\n  };`,
    `  const shareToPinterest = () => {\n    const url = \`https://pinterest.com/pin/create/button/?url=\${encodeURIComponent(affiliateShareUrl || productUrl)}&media=\${encodeURIComponent(product.image)}&description=\${encodeURIComponent(socialShareBundle)}\`;\n    window.open(url, '_blank', 'noopener,noreferrer');\n  };`
  );
}

if (!detail.includes('Instagram — نسخ البيانات وفتح النشر')) {
  const marker = `                  <button\n                    onClick={() => { shareToWhatsApp(); setShowShareMenu(false); }}`;
  const extra = `                  <button\n                    onClick={() => { void openPrioritySocial('instagram'); setShowShareMenu(false); }}\n                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-pink-950/40 text-pink-300 font-bold text-xs transition-colors"\n                    title="Instagram — نسخ البيانات وفتح النشر"\n                  >\n                    <Globe className="w-4 h-4" />\n                    <span>إنستغرام (Instagram)</span>\n                  </button>\n\n                  <button\n                    onClick={() => { void openPrioritySocial('youtube'); setShowShareMenu(false); }}\n                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-950/40 text-red-300 font-bold text-xs transition-colors"\n                    title="YouTube — نسخ البيانات وفتح الرفع"\n                  >\n                    <Youtube className="w-4 h-4" />\n                    <span>يوتيوب (YouTube)</span>\n                  </button>\n\n                  <button\n                    onClick={() => { void openPrioritySocial('tiktok'); setShowShareMenu(false); }}\n                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cyan-950/40 text-cyan-300 font-bold text-xs transition-colors"\n                    title="TikTok — نسخ البيانات وفتح الرفع"\n                  >\n                    <Video className="w-4 h-4" />\n                    <span>تيك توك (TikTok)</span>\n                  </button>\n\n${marker}`;
  detail = replaceOnce(detail, marker, extra, 'priority share buttons');
}

// Compact the image overlay: one share action instead of several platform names.
const quickStart = `                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">\n                    <button\n                      onClick={shareToWhatsApp}`;
if (detail.includes(quickStart)) {
  const quickEnd = `                  </div>\n                </div>}`;
  const startIndex = detail.indexOf(quickStart);
  const endIndex = detail.indexOf(quickEnd, startIndex);
  if (endIndex === -1) throw new Error('[patch-social-export] Could not locate quick share bar end.');
  const replacement = `                  <div className="flex items-center gap-1.5">\n                    <button\n                      type="button"\n                      onClick={() => setShowShareMenu(true)}\n                      className="flex items-center gap-1.5 text-[11px] font-black bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"\n                      title={language === 'en' ? 'Share product' : 'مشاركة المنتج'}\n                    >\n                      <Share2 className="w-3.5 h-3.5" />\n                      <span>{language === 'en' ? 'Share' : 'مشاركة'}</span>\n                    </button>\n                    <button\n                      onClick={copyToClipboard}\n                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors shrink-0 cursor-pointer"\n                      title={language === 'en' ? 'Copy page link' : 'نسخ الرابط'}\n                    >\n                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}\n                    </button>\n                  </div>\n                </div>}`;
  detail = detail.slice(0, startIndex) + replacement + detail.slice(endIndex + quickEnd.length);
}

// Fix prominent product identity text when the English mode is selected.
detail = detail.replace('{product.titleAr}\n                </h1>\n                <p className="text-xs text-slate-400 mb-3">{product.titleEn}</p>', `{displayTitle}\n                </h1>\n                {language === 'ar' && product.titleEn && <p className="text-xs text-slate-400 mb-3">{product.titleEn}</p>}`);
detail = detail.replace('<span className="text-slate-200 truncate max-w-xs">{product.titleAr}</span>', '<span className="text-slate-200 truncate max-w-xs">{displayTitle}</span>');
detail = detail.replace('alt={product.titleAr}', 'alt={displayTitle}');

fs.writeFileSync(detailFile, detail, 'utf8');
console.log('[patch-social-export] Social publishing metadata, priority channels and compact share UI enabled.');
