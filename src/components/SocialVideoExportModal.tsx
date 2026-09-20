import React, { useMemo, useState } from 'react';
import { VideoReview } from '../types';
import { useApp } from '../context/AppContext';
import { Check, Copy, ExternalLink, Share2, ShoppingBag, Sparkles, Youtube, Instagram, Video } from 'lucide-react';
import { publishVideoToYouTube } from '../services/youtubePublisher';

interface SocialVideoExportModalProps {
  video: VideoReview | null;
  onClose: () => void;
}

type SocialPlatform = 'youtube' | 'pinterest' | 'instagram' | 'tiktok' | 'twitter' | 'snapchat' | 'threads';

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

const CopyRow: React.FC<{ label: string; value: string; copied: string; setCopied: (value: string) => void; language: 'ar' | 'en' }> = ({ label, value, copied, setCopied, language }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
      <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1300); }} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20">
        {copied === label ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        {copied === label ? (language === 'en' ? 'Copied' : 'تم') : (language === 'en' ? 'Copy' : 'نسخ')}
      </button>
    </div>
    <div dir={label.includes('English') || label.includes('URL') ? 'ltr' : undefined} className="whitespace-pre-wrap break-words text-xs text-slate-100">{value || '—'}</div>
  </div>
);

export const SocialVideoExportModal: React.FC<SocialVideoExportModalProps> = ({ video, onClose }) => {
  const { products, language, getAffiliateUrl, siteSettings } = useApp();
  const [copied, setCopied] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('youtube');
  const [youtubePublishState, setYoutubePublishState] = useState<{ status: 'idle' | 'working' | 'success' | 'error'; message: string; url?: string }>({ status: 'idle', message: '' });
  if (!video) return null;

  const product = products.find(item => item.id === video.productId);
  const affiliateUrl = product?.amazonUrl
    ? getAffiliateUrl(product, 'amazon')
    : product?.aliexpressUrl
      ? getAffiliateUrl(product, 'aliexpress')
      : '';
  const videoUrl = video.videoUrl || (video.embedId ? `https://www.youtube.com/watch?v=${video.embedId}` : '');
  const thumbnail = video.hideThumbnail ? '' : (video.thumbnailUrl || video.productImage || product?.image || '');

  const title = language === 'en'
    ? (product?.seoTitleEn || product?.titleEn || [product?.brand, product?.id].filter(Boolean).join(' ') || 'Product Review')
    : (product?.seoTitleAr || product?.titleAr || product?.titleEn || video.productTitle || video.title);
  const description = language === 'en'
    ? (product?.seoDescriptionEn || product?.descriptionEn || product?.longDescriptionEn || (product?.titleEn ? `Review, features and buying details for ${product.titleEn}.` : 'Product review, features and buying details.'))
    : (product?.seoDescriptionAr || product?.description || product?.longDescription || video.seoDescription || video.title);
  const hashtags = useMemo(() => {
    const productTags = language === 'en' ? (product?.hashtagsEn || []) : (product?.hashtagsAr || []);
    const fallback = video.hashtags || [];
    const defaults = language === 'en' ? ['#YousraSmile', '#ProductReview', '#SmartShopping'] : ['#يسرى_سمايل', '#مراجعة_منتج', '#تسوق_ذكي'];
    const selectedFallback = language === 'en' ? fallback.filter(tag => !/[\u0600-\u06FF]/.test(String(tag))) : fallback;
    return Array.from(new Set([...productTags, ...selectedFallback, ...defaults])).filter(Boolean).slice(0, 12).join(' ');
  }, [language, product, video.hashtags]);
  const keywords = useMemo(() => {
    const localized = language === 'en' ? (product?.keywordsEn || []) : (product?.keywordsAr || []);
    const fallback = product?.keywords || [];
    return Array.from(new Set([...localized, ...fallback]))
      .map(item => String(item).trim())
      .filter(item => item && (language === 'ar' || !/[\u0600-\u06FF]/.test(item)))
      .slice(0, 20);
  }, [language, product]);
  const disclosure = language === 'en'
    ? 'Affiliate disclosure: I may earn a commission from qualifying purchases at no extra cost to you.'
    : 'إفصاح: قد أحصل على عمولة من المشتريات المؤهلة دون أي تكلفة إضافية عليك.';
  const shopLine = affiliateUrl
    ? `${language === 'en' ? 'Shop / affiliate link' : 'رابط الشراء بالعمولة'}: ${affiliateUrl}`
    : '';
  const keywordText = keywords.join(', ');
  const shortHashtags = hashtags.split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  const platformPackages: Record<SocialPlatform, { title: string; caption: string; keywords: string }> = {
    youtube: {
      title: title.slice(0, 100),
      caption: [description, shopLine, disclosure, keywordText ? `${language === 'en' ? 'Keywords' : 'الكلمات المفتاحية'}: ${keywordText}` : '', hashtags].filter(Boolean).join('\n\n'),
      keywords: keywordText,
    },
    pinterest: {
      title: title.slice(0, 100),
      caption: [description, shopLine, disclosure, keywordText, shortHashtags].filter(Boolean).join('\n\n').slice(0, 500),
      keywords: keywordText,
    },
    instagram: {
      title: title.slice(0, 125),
      caption: [title, description, language === 'en' ? 'See the product link in bio or copy the link below.' : 'رابط المنتج في البايو أو انسخي الرابط أدناه.', shopLine, disclosure, hashtags].filter(Boolean).join('\n\n').slice(0, 2200),
      keywords: keywordText,
    },
    tiktok: {
      title: title.slice(0, 100),
      caption: [title, language === 'en' ? 'Full product details and affiliate link in bio.' : 'تفاصيل المنتج ورابط العمولة في البايو.', disclosure, shortHashtags].filter(Boolean).join('\n\n').slice(0, 2200),
      keywords: keywordText,
    },
    twitter: {
      title: title.slice(0, 80),
      caption: [title, shopLine, disclosure, shortHashtags].filter(Boolean).join('\n').slice(0, 280),
      keywords: keywordText,
    },
    threads: {
      title: title.slice(0, 100),
      caption: [title, description, shopLine, disclosure, shortHashtags].filter(Boolean).join('\n\n').slice(0, 500),
      keywords: keywordText,
    },
    snapchat: {
      title: title.slice(0, 80),
      caption: [title, language === 'en' ? 'Product link in bio.' : 'رابط المنتج في البايو.', disclosure, shortHashtags].filter(Boolean).join('\n').slice(0, 250),
      keywords: keywordText,
    },
  };
  const selectedPackage = platformPackages[selectedPlatform];
  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(affiliateUrl || videoUrl)}&media=${encodeURIComponent(thumbnail)}&description=${encodeURIComponent(platformPackages.pinterest.caption)}`;

  const handleDirectYouTubePublish = async () => {
    const clientId = siteSettings.youtubeOAuthClientId?.trim() || '';
    if (!clientId) {
      setYoutubePublishState({ status: 'error', message: 'أضيفي YouTube OAuth Client ID من لوحة التحكم ← الإعدادات العامة، ثم حاولي مرة أخرى.' });
      return;
    }
    if (!videoUrl) {
      setYoutubePublishState({ status: 'error', message: 'لا يوجد ملف فيديو مرتبط بهذه المراجعة.' });
      return;
    }
    try {
      setYoutubePublishState({ status: 'working', message: 'جاري تجهيز النشر المباشر إلى YouTube...' });
      const result = await publishVideoToYouTube({
        clientId,
        videoUrl,
        title: platformPackages.youtube.title,
        description: platformPackages.youtube.caption,
        tags: Array.from(new Set([...keywords, ...hashtags.split(/\s+/).map(tag => tag.replace(/^#/, ''))])).filter(Boolean).slice(0, 30),
        privacyStatus: 'public',
        onProgress: (message) => setYoutubePublishState({ status: 'working', message }),
      });
      setYoutubePublishState({ status: 'success', message: 'تم رفع الفيديو إلى YouTube مباشرة.', url: result.url });
    } catch (error: any) {
      setYoutubePublishState({ status: 'error', message: error?.message || 'تعذر النشر المباشر إلى YouTube.' });
    }
  };

  const openUpload = async (platform: 'tiktok' | 'youtube' | 'instagram') => {
    setSelectedPlatform(platform);
    await navigator.clipboard.writeText(platformPackages[platform].caption);
    setCopied('package');
    window.setTimeout(() => setCopied(''), 1500);
    const url = platform === 'tiktok'
      ? 'https://www.tiktok.com/upload'
      : platform === 'youtube'
        ? 'https://www.youtube.com/upload'
        : 'https://www.instagram.com/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openExtraChannel = async (platform: 'twitter' | 'snapchat' | 'threads') => {
    setSelectedPlatform(platform);
    if (navigator.clipboard) await navigator.clipboard.writeText(platformPackages[platform].caption);
    setCopied('package');
    window.setTimeout(() => setCopied(''), 1500);
    const url = platform === 'twitter'
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(platformPackages.twitter.caption)}`
      : platform === 'threads'
        ? 'https://www.threads.com/'
        : 'https://web.snapchat.com/';
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

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a href={pinterestShareUrl} target="_blank" rel="noopener noreferrer" onClick={async () => { setSelectedPlatform('pinterest'); await navigator.clipboard.writeText(platformPackages.pinterest.caption); }} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/15 px-3 py-3 text-xs font-black hover:bg-red-600/25"><PinterestIcon className="h-4 w-4" /> Pinterest</a>
          <button type="button" onClick={() => void openUpload('tiktok')} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-3 text-xs font-black hover:bg-cyan-500/20"><TikTokIcon className="h-4 w-4" /> TikTok</button>
          <button type="button" onClick={() => void handleDirectYouTubePublish()} disabled={youtubePublishState.status === 'working'} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/15 px-3 py-3 text-xs font-black hover:bg-red-600/25 disabled:cursor-wait disabled:opacity-60"><Youtube className="h-4 w-4" /> {youtubePublishState.status === 'working' ? 'جاري النشر...' : 'YouTube مباشر'}</button>
          <button type="button" onClick={() => void openUpload('instagram')} className="flex items-center justify-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-3 py-3 text-xs font-black hover:bg-pink-500/20"><Instagram className="h-4 w-4" /> Instagram</button>
          <button type="button" onClick={() => void openExtraChannel('twitter')} className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-3 text-xs font-black hover:bg-sky-500/20"><span className="text-sm font-black">X</span> X / Twitter</button>
          <button type="button" onClick={() => void openExtraChannel('snapchat')} className="flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-3 py-3 text-xs font-black hover:bg-yellow-400/20"><span className="text-sm">👻</span> Snapchat</button>
          <button type="button" onClick={() => void openExtraChannel('threads')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-400/40 bg-slate-500/10 px-3 py-3 text-xs font-black hover:bg-slate-500/20"><span className="text-sm font-black">@</span> Threads</button>
        </div>

        {youtubePublishState.status !== 'idle' && (
          <div className={`mb-4 rounded-2xl border p-3 text-[11px] ${youtubePublishState.status === 'success' ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100' : youtubePublishState.status === 'error' ? 'border-red-500/40 bg-red-950/30 text-red-100' : 'border-amber-500/40 bg-amber-950/30 text-amber-100'}`}>
            <div className="font-bold">{youtubePublishState.message}</div>
            {youtubePublishState.url && <a href={youtubePublishState.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-black text-emerald-300 underline">فتح الفيديو على YouTube <ExternalLink className="h-3 w-3" /></a>}
          </div>
        )}

        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-100">
          {language === 'en' ? 'YouTube now supports direct publishing from Yousra Smile after connecting your Google OAuth Client ID. TikTok and Instagram still use their upload surfaces until their direct APIs are connected. Pinterest receives the affiliate destination, image and description directly.' : 'YouTube صار يدعم النشر المباشر من Yousra Smile بعد ربط Google OAuth Client ID. تيك توك وإنستغرام ما زالا يفتحان شاشة الرفع إلى أن نربط API المباشر لكل منصة. أما Pinterest فيستقبل رابط العمولة والصورة والوصف مباشرة.'}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-slate-950/70 p-2">
            {(Object.keys(platformPackages) as SocialPlatform[]).map(platform => <button key={platform} type="button" onClick={() => setSelectedPlatform(platform)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase ${selectedPlatform === platform ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-300'}`}>{platform}</button>)}
          </div>
          <CopyRow language={language} label={`${selectedPlatform.toUpperCase()} — ${language === 'en' ? 'TITLE' : 'العنوان'}`} value={selectedPackage.title} copied={copied} setCopied={setCopied} />
          <CopyRow language={language} label={`${selectedPlatform.toUpperCase()} — ${language === 'en' ? 'CAPTION' : 'النص الجاهز'}`} value={selectedPackage.caption} copied={copied} setCopied={setCopied} />
          <CopyRow language={language} label={language === 'en' ? 'KEYWORDS / TAGS' : 'الكلمات المفتاحية / Tags'} value={selectedPackage.keywords} copied={copied} setCopied={setCopied} />
          <CopyRow language={language} label="HASHTAGS" value={hashtags} copied={copied} setCopied={setCopied} />
          <CopyRow language={language} label="AFFILIATE URL" value={affiliateUrl} copied={copied} setCopied={setCopied} />
          <CopyRow language={language} label="VIDEO URL" value={videoUrl} copied={copied} setCopied={setCopied} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(selectedPackage.caption); setCopied('package'); window.setTimeout(() => setCopied(''), 1500); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400">{copied === 'package' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === 'package' ? (language === 'en' ? 'Publishing package copied' : 'تم نسخ الحزمة') : (language === 'en' ? `Copy ${selectedPlatform} package` : `نسخ حزمة ${selectedPlatform}`)}</button>
          {affiliateUrl && <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300"><ShoppingBag className="h-4 w-4" />{language === 'en' ? 'Affiliate link' : 'رابط العمولة'} <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
    </div>
  );
};
