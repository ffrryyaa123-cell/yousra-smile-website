import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Link as LinkIcon, 
  Sparkles, 
  Plus, 
  Youtube, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface VideoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoImportModal: React.FC<VideoImportModalProps> = ({ isOpen, onClose }) => {
  const { products, addVideo, language } = useApp();

  const [videoUrl, setVideoUrl] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [customTitle, setCustomTitle] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'tiktok' | 'pinterest'>('youtube');
  const [customDuration, setCustomDuration] = useState('02:45');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Auto detect platform and embedId from URL input
  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setErrorMessage('');

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setPlatform('youtube');
    } else if (url.includes('tiktok.com')) {
      setPlatform('tiktok');
    } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
      setPlatform('pinterest');
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      setErrorMessage(language === 'en' ? 'Please paste a valid video URL' : 'يرجى إدخال رابط الفيديو بشكل صحيح');
      return;
    }

    const linkedProd = products.find(p => p.id === selectedProductId) || products[0];

    // Extract embed ID if Youtube
    let embedId = 'sample-embed';
    if (platform === 'youtube') {
      const match = videoUrl.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        embedId = match[1];
      } else {
        embedId = 'dQw4w9WgXcQ';
      }
    }

    addVideo({
      productId: linkedProd.id,
      productTitle: linkedProd.titleAr,
      productImage: linkedProd.image,
      thumbnailUrl: linkedProd.image,
      platform,
      embedId,
      videoUrl: videoUrl.trim(),
      title: customTitle.trim() || `مراجعة شاملة لمنتج ${linkedProd.titleAr}`,
      duration: customDuration || '03:15'
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setVideoUrl('');
      setCustomTitle('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#111113] border border-purple-500/30 rounded-3xl shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-600 via-amber-500 to-red-600 h-1.5 w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 left-4 ltr:left-auto ltr:right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleImport} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <LinkIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-mono-meta text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'en' ? 'SOCIAL VIDEO IMPORTER' : 'استيراد فيديو برابط مباشر'}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Tajawal'] text-white">
                {language === 'en' ? 'Import Video from Pinterest, TikTok or YouTube' : 'ربط واستيراد فيديو من يوتيوب / تيك توك / بينترست 🎬'}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {/* Paste Video Link */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                {language === 'en' ? 'Paste Video Link (YouTube / TikTok / Pinterest):' : 'ضع رابط الفيديو من (YouTube, TikTok, Pinterest):'}
              </label>
              <input 
                type="url" 
                required
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... OR https://pinterest.com/pin/..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 transition-colors font-medium"
              />
            </div>

            {/* Platform Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                {language === 'en' ? 'Platform:' : 'المنصة المكتشفة:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('youtube')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    platform === 'youtube'
                      ? 'bg-red-600/30 border-red-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <Youtube className="w-4 h-4 text-red-400" />
                  YouTube
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('tiktok')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    platform === 'tiktok'
                      ? 'bg-cyan-500/30 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  TikTok
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('pinterest')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    platform === 'pinterest'
                      ? 'bg-red-500/30 border-red-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  Pinterest
                </button>
              </div>
            </div>

            {/* Associate Product */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                {language === 'en' ? 'Link to Store Product:' : 'ربط الفيديو بمنتج من المتجر:'}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-400 font-['Tajawal'] font-bold"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.titleAr} ({p.brand}) - {p.discountPrice} {p.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                {language === 'en' ? 'Video Review Title (Optional):' : 'عنوان الفيديو أو المراجعة (اختياري):'}
              </label>
              <input 
                type="text" 
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثال: تجربة عملية واستعراض لأهم مميزات الجهاز"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 font-['Tajawal']"
              />
            </div>

            {/* Video Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                {language === 'en' ? 'Duration (MM:SS):' : 'مدة الفيديو:'}
              </label>
              <input 
                type="text" 
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="02:30"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSuccess}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 hover:opacity-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>تمت إضافته بنجاح!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>استيراد وربط الفيديو 🚀</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
