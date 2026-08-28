import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VideoReview } from '../types';
import { uploadLocalImage } from '../services/videoAssets';
import { 
  Pencil, 
  X, 
  Image as ImageIcon, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  PlaySquare, 
  Youtube,
  CheckCircle2
} from 'lucide-react';

interface ThumbnailEditorModalProps {
  video: VideoReview | null;
  onClose: () => void;
}

const PRESET_THUMBNAILS = [
  {
    nameAr: 'استعراض تقني فاخر',
    nameEn: 'Tech Unboxing',
    url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80'
  },
  {
    nameAr: 'تجربة مكنسة روبوتية',
    nameEn: 'Smart Vacuum',
    url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=1200&q=80'
  },
  {
    nameAr: 'طبخ وقلاية هوائية',
    nameEn: 'Air Fryer Cooking',
    url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=1200&q=80'
  },
  {
    nameAr: 'قهوة واسبريسو منزلية',
    nameEn: 'Coffee Espresso',
    url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    nameAr: 'تجميل وتصفيف شعر',
    nameEn: 'Hair Styling',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    nameAr: 'تنظيف وغسيل سجاد',
    nameEn: 'Carpet Spot Cleaner',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'
  }
];

export const ThumbnailEditorModal: React.FC<ThumbnailEditorModalProps> = ({ video, onClose }) => {
  const { updateVideoThumbnail, language } = useApp();
  
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    if (!video) return '';
    return video.thumbnailUrl || video.productImage;
  });
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'presets' | 'upload'>('presets');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  if (!video) return null;

  const handleSelectPreset = (url: string) => {
    setCurrentUrl(url);
    setCustomInputUrl('');
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputUrl.trim()) {
      setCurrentUrl(customInputUrl.trim());
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // This used to read the file into a base64 data: URL and store that
    // whole giant string directly inside the video's database row. That
    // "worked" for a tiny test image but silently failed to save for any
    // real photo — a normal phone photo becomes several megabytes of
    // base64 text, which the database call would reject or time out on,
    // and the failure was only ever logged to the console. Uploading the
    // actual file to Supabase Storage (same helper the product photos use)
    // and saving only its short URL is what the site should have been
    // doing here all along.
    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadLocalImage(video.productId, file, setUploadProgress);
      setCurrentUrl(uploaded.videoUrl);
    } catch (err: any) {
      setUploadError(err?.message || 'تعذر رفع الصورة. حاولي مرة أخرى.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleResetToDefault = () => {
    setCurrentUrl(video.productImage);
    setCustomInputUrl('');
  };

  const handleSave = () => {
    updateVideoThumbnail(video.id, currentUrl);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#111113] border border-[#FDFCFB]/15 rounded-3xl shadow-2xl text-[#FDFCFB] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* YouTube Studio Gold Header Decor */}
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 h-1.5 w-full shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 ltr:left-auto ltr:right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable body — on a short browser window (or a laptop at
            a large zoom level) the preview + tabs + upload area could be
            taller than the viewport. This div used to be part of a
            plain overflow-hidden container, which clipped the bottom
            Save/Cancel bar completely out of view with no way to reach
            it. Now the header strip stays put and only this area scrolls. */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
              <Pencil className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <div className="font-mono-meta text-xs text-amber-400 flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5 text-red-500 inline" />
                {language === 'en' ? 'YOUTUBE THUMBNAIL EDITOR' : 'محرر الصورة المصغرة (YouTube Style)'}
              </div>
              <h3 className="font-serif-editorial text-xl sm:text-2xl text-white">
                {language === 'en' ? 'Customize Video Thumbnail' : 'تغيير الصورة المصغرة للفيديو'}
              </h3>
            </div>
          </div>

          {/* Live YouTube-style Preview Card */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-meta text-slate-400">
              <span>{language === 'en' ? 'LIVE THUMBNAIL PREVIEW' : 'معاينة حية للصورة المصغرة'}</span>
              <span className="text-red-400 font-bold">{video.platform.toUpperCase()}</span>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl group bg-slate-950">
              <img 
                src={currentUrl} 
                alt="Thumbnail Preview" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = video.productImage;
                }}
              />
              
              {/* YouTube Overlay Badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md flex items-center gap-1">
                    <PlaySquare className="w-3 h-3" />
                    {video.platform}
                  </span>
                  
                  {/* YouTube Pencil Badge */}
                  <div className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    {language === 'en' ? 'CUSTOM THUMBNAIL' : 'صورة مصغرة مخصصة'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-300 block line-clamp-1 drop-shadow-md">
                    {video.productTitle}
                  </span>
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-white line-clamp-1 drop-shadow-md">
                      {video.title}
                    </h4>
                    <span className="bg-black/90 text-white text-[10px] font-mono-meta px-2 py-0.5 rounded text-amber-400 border border-white/10 shrink-0">
                      {video.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Source Selection Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'en' ? 'Preset HD Images' : 'صور احترافية جاهزة'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{language === 'en' ? 'Custom URL' : 'رابط صورة مباشر'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{language === 'en' ? 'Upload Image' : 'رفع صورة من الجهاز'}</span>
              </button>
            </div>

            {/* Tab 1: Presets Grid */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                {PRESET_THUMBNAILS.map((preset, idx) => {
                  const isSelected = currentUrl === preset.url;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]' 
                          : 'border-white/10 hover:border-amber-400/60 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.nameAr}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex items-end justify-between">
                        <span className="text-[10px] text-white font-bold line-clamp-1">
                          {language === 'en' ? preset.nameEn : preset.nameAr}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-400 bg-black/80 rounded-full p-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Custom URL */}
            {activeTab === 'url' && (
              <form onSubmit={handleApplyCustomUrl} className="space-y-3">
                <label className="block text-xs text-slate-400 font-mono-meta">
                  {language === 'en' ? 'Enter Direct Image Link (JPEG/PNG/WebP):' : 'أدخل رابط الصورة مباشرة:'}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 py-2.5 px-4 bg-[#18181B] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Apply' : 'تطبيق الرابط'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Upload */}
            {activeTab === 'upload' && (
              <div className="bg-[#18181B] border border-dashed border-white/20 rounded-2xl p-6 text-center space-y-3">
                <Upload className={`w-8 h-8 text-amber-400 mx-auto ${isUploading ? 'animate-spin' : 'animate-bounce'}`} />
                <div className="space-y-1">
                  <p className="text-xs text-white font-bold">
                    {isUploading
                      ? (language === 'en' ? 'Uploading…' : 'جاري الرفع...')
                      : (language === 'en' ? 'Click to select an image file from your device' : 'اضغط لاختيار صورة مصغرة من جهازك')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    JPG, PNG, WebP (16:9 Aspect ratio recommended)
                  </p>
                </div>
                {isUploading && (
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden max-w-xs mx-auto">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="thumbnail-file-input"
                />
                <label
                  htmlFor="thumbnail-file-input"
                  className={`inline-block px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                >
                  {language === 'en' ? 'Browse Files' : 'استعراض الملفات'}
                </label>
                {uploadError && (
                  <p className="text-[11px] text-red-400 font-bold">{uploadError}</p>
                )}
              </div>
            )}
          </div>

          {/* Modal Bottom Actions */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Reset to Default Image' : 'إعادة الصورة الأصلية للمنتج'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaved || isUploading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:opacity-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>{language === 'en' ? 'Saved!' : 'تم الحفظ!'}</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>{language === 'en' ? 'Save Thumbnail' : 'حفظ الصورة المصغرة 🎬'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
