import React, { useState } from 'react';
import { VideoReview } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Share2, 
  Youtube, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface SocialVideoExportModalProps {
  video: VideoReview | null;
  onClose: () => void;
}

// Custom Pinterest SVG Icon
const PinterestIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.229 7.462-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
);

// Custom TikTok SVG Icon
const TikTokIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.89 2.884 2.888 2.888 0 0 1-2.888-2.884 2.888 2.888 0 0 1 2.888-2.883c.31 0 .61.052.888.147V9.432a6.327 6.327 0 0 0-.888-.063A6.333 6.333 0 0 0 3.15 15.702a6.333 6.333 0 0 0 6.333 6.333c3.497 0 6.333-2.836 6.333-6.333V9.117a8.217 8.217 0 0 0 5.173 1.802V7.474a4.818 4.818 0 0 1-1.4-.788z"/>
  </svg>
);

export const SocialVideoExportModal: React.FC<SocialVideoExportModalProps> = ({ video, onClose }) => {
  const { products, language, getAffiliateUrl } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!video) return null;

  const linkedProduct = products.find(p => p.id === video.productId);
  const targetUrl = video.videoUrl || `https://www.youtube.com/watch?v=${video.embedId}`;
  const thumbnail = video.thumbnailUrl || video.productImage;

  // Pinterest Pin URL Creation
  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
    linkedProduct ? getAffiliateUrl(linkedProduct, 'amazon') : targetUrl
  )}&media=${encodeURIComponent(thumbnail)}&description=${encodeURIComponent(
    `${video.title} - ${video.productTitle} | مراجعة شاملة وتجربة منتج`
  )}`;

  // TikTok Share Studio URL
  const tiktokShareUrl = `https://www.tiktok.com/upload?caption=${encodeURIComponent(
    `🔥 ${video.title} | ${video.productTitle} #تسوق_مع_يسرى #مراجعات #تيك_توك`
  )}`;

  // YouTube Export / Shorts link
  const youtubeShareUrl = video.platform === 'youtube' 
    ? `https://www.youtube.com/watch?v=${video.embedId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`;

  // Embed Snippet
  const embedSnippet = `<iframe width="560" height="315" src="${
    video.platform === 'youtube'
      ? `https://www.youtube.com/embed/${video.embedId}`
      : video.videoUrl
  }" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl max-h-[92vh] bg-[#111113] border border-amber-500/30 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-purple-600 h-1.5 w-full shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 left-4 ltr:left-auto ltr:right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable body — same fix as ThumbnailEditorModal: on a short
            browser window this content (all the share buttons + embed
            code box) could run taller than the viewport, and a plain
            overflow-hidden wrapper would clip the bottom of it out of
            view with no way to reach it. */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Share2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-mono-meta text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'en' ? 'EXPORT & SHARE VIDEO HUB' : 'مركز تصدير ومشاركة الفيديو الاجتماعي'}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Tajawal'] text-white">
                {language === 'en' ? 'Export Video to Socials' : 'تصدير الفيديو إلى المنصات الاجتماعية 🚀'}
              </h3>
            </div>
          </div>

          {/* Video Preview Snapshot */}
          <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-2xl border border-white/10">
            <img 
              src={thumbnail} 
              alt={video.title} 
              referrerPolicy="no-referrer"
              className="w-24 h-16 object-cover rounded-xl border border-amber-500/30 shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] text-amber-400 font-bold block uppercase">
                {video.platform} • {video.duration}
              </span>
              <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                {video.title}
              </h4>
            </div>
          </div>

          {/* One-Click Social Export Grid */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 font-['Tajawal']">
              {language === 'en' ? 'EXPORT DIRECTLY TO SOCIAL PLATFORMS:' : 'تصدير ونشر فورياً على المنصات:'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pinterest Export */}
              <a
                href={pinterestShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-[#E60023]/20 hover:bg-[#E60023]/30 border border-[#E60023]/50 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-102 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-[#E60023] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <PinterestIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-white">Pinterest</span>
                <span className="text-[10px] text-red-300">نشر كـ Pin أو لوحة</span>
              </a>

              {/* TikTok Export */}
              <a
                href={tiktokShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-102 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <TikTokIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-white">TikTok</span>
                <span className="text-[10px] text-cyan-300">مشاركة في تيك توك</span>
              </a>

              {/* YouTube Export */}
              <a
                href={youtubeShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-102 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Youtube className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-white">YouTube</span>
                <span className="text-[10px] text-red-300">تصدير ومشاهدة</span>
              </a>
            </div>
          </div>

          {/* Quick Copy Link & Embed Code */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            {/* Direct Link */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400 font-mono-meta">
                {language === 'en' ? 'DIRECT VIDEO URL:' : 'رابط الفيديو المباشر:'}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={targetUrl}
                  className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>نسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Embed Code */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400 font-mono-meta">
                {language === 'en' ? 'EMBED HTML CODE (IFRAME):' : 'كود تضمين الفيديو في موقع خارجي (iFrame):'}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={embedSnippet}
                  className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-slate-400 font-mono truncate focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedEmbed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Code className="w-3.5 h-3.5" />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Linked Product Direct Store Link */}
          {linkedProduct && (
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">
                  المنتج المرتبط بالفيديو
                </span>
                <h5 className="text-xs font-bold text-white line-clamp-1">
                  {linkedProduct.titleAr}
                </h5>
                <p className="text-[11px] text-emerald-400 font-bold">
                  السعر: {linkedProduct.discountPrice} {linkedProduct.currency}
                </p>
              </div>

              <a
                href={getAffiliateUrl(linkedProduct, 'amazon')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>رابط أمازون</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
