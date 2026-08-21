import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { catalogDatabase } from '../services/catalogDatabase';
import { 
  X, 
  ArrowLeft,
  Link as LinkIcon, 
  Sparkles, 
  Plus, 
  Youtube, 
  Video, 
  Instagram, 
  Ghost, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Film, 
  FileVideo, 
  Wand2, 
  Play, 
  Globe, 
  RefreshCw, 
  HardDrive, 
  Check, 
  Trash2,
  Sliders
} from 'lucide-react';

interface VideoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string | null;
  isReplacing?: boolean;
  defaultMode?: 'upload' | 'link';
}

export const VideoImportModal: React.FC<VideoImportModalProps> = ({ 
  isOpen, 
  onClose,
  preselectedProductId,
  isReplacing = false,
  defaultMode = 'upload'
}) => {
  const { products, addVideo, updateProduct, replaceProductVideo, language, formatPrice } = useApp();

  const [importMode, setImportMode] = useState<'link' | 'upload'>(defaultMode);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(preselectedProductId || products[0]?.id || '');
  const [customTitle, setCustomTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [platform, setPlatform] = useState<'youtube' | 'tiktok' | 'pinterest' | 'instagram' | 'snapchat' | 'direct' | 'local'>('local');
  const [customDuration, setCustomDuration] = useState('00:45');
  const [syncWithProduct, setSyncWithProduct] = useState(true);
  const [replaceExistingVideo, setReplaceExistingVideo] = useState(isReplacing);
  
  // Local File Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoPreviewUrl, setUploadedVideoPreviewUrl] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync props when opening
  useEffect(() => {
    if (isOpen) {
      if (preselectedProductId) {
        setSelectedProductId(preselectedProductId);
      } else if (!selectedProductId && products[0]?.id) {
        setSelectedProductId(products[0].id);
      }
      setImportMode(defaultMode);
      setReplaceExistingVideo(isReplacing);
      setErrorMessage('');
      setFileError('');

      const curProd = products.find(p => p.id === (preselectedProductId || selectedProductId || products[0]?.id));
      if (curProd && !customTitle) {
        setCustomTitle(`مراجعة وتجربة حقيقية لـ ${curProd.titleAr}`);
      }
    }
  }, [isOpen, preselectedProductId, defaultMode, isReplacing, products]);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Auto detect platform and embedId from URL input
  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setErrorMessage('');

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setPlatform('youtube');
    } else if (url.includes('tiktok.com')) {
      setPlatform('tiktok');
    } else if (url.includes('instagram.com')) {
      setPlatform('instagram');
    } else if (url.includes('snapchat.com')) {
      setPlatform('snapchat');
    } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
      setPlatform('pinterest');
    } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.m3u8')) {
      setPlatform('direct');
    }
  };

  const processSelectedFile = (file: File) => {
    setFileError('');
    if (!file.type.startsWith('video/')) {
      setFileError('يرجى اختيار ملف فيديو صالح (MP4, WebM, MOV, Ogg)');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setFileError('حجم ملف الفيديو يتجاوز الحد الأقصى المسموح (200 ميجابايت)');
      return;
    }

    setUploadedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadedVideoPreviewUrl(objectUrl);
    setPlatform('local');
    setVideoUrl(objectUrl);

    if (currentProduct) {
      setCustomTitle(`فيديو استعراض وتجربة شاملة لـ ${currentProduct.titleAr}`);
    }
  };

  // Handle local video file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImportMode('upload');
      processSelectedFile(file);
    }
  };

  // Handle video loaded metadata to extract duration
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const totalSec = Math.round(videoRef.current.duration);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      setCustomDuration(formatted);
    }
  };

  // AI SEO Generator
  const handleGenerateSeo = () => {
    if (!currentProduct) return;
    setIsGeneratingSeo(true);

    setTimeout(() => {
      const brand = currentProduct.brand || 'العلامة الأصلية';
      const subcategory = currentProduct.subcategory || 'الأجهزة الذكية';
      
      const generatedTitle = `تجربة حقيقية ومراجعة شاملة لـ ${currentProduct.titleAr} (${brand})`;
      const generatedDesc = `استعراض واقعي وعملي لكافة مميزات وعيوب ${currentProduct.titleAr} من ${brand}. تعرف على طريقة الاستخدام وكيف تضمن الحصول على أفضل كود خصم بالدولار ($) وضمان معتمد.`;
      const generatedTags = [
        brand.replace(/\s+/g, '_'),
        subcategory.replace(/\s+/g, '_'),
        'مراجعة_منتجات',
        'يسرى_سمايل',
        'تخفيضات_أمازون',
        'smart_choice',
        'viral'
      ];

      setCustomTitle(generatedTitle);
      setSeoDescription(generatedDesc);
      setHashtags(generatedTags);
      setIsGeneratingSeo(false);
    }, 600);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (importMode === 'link' && !videoUrl.trim()) {
      setErrorMessage(language === 'en' ? 'Please paste a valid video URL' : 'يرجى إدخال رابط الفيديو بشكل صحيح');
      return;
    }

    if (importMode === 'upload' && !uploadedFile && !uploadedVideoPreviewUrl) {
      setErrorMessage('يرجى اختيار أو رفع ملف فيديو من جهازك أولاً');
      return;
    }

    const linkedProd = currentProduct;
    if (!linkedProd) {
      setErrorMessage('يرجى اختيار منتج لربطه بالفيديو');
      return;
    }

    // Extract embed ID if Youtube
    let embedId = `vid-${Date.now()}`;
    if (platform === 'youtube') {
      const match = videoUrl.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        embedId = match[1];
      }
    }

    let finalVideoUrl = importMode === 'upload' ? uploadedVideoPreviewUrl : videoUrl.trim();
    let storagePath: string | undefined;
    const finalTitle = customTitle.trim() || `مراجعة شاملة لـ ${linkedProd.titleAr}`;

    try {
      if (importMode === 'upload' && uploadedFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const uploaded = await catalogDatabase.uploadVideo(linkedProd.id, uploadedFile, setUploadProgress);
        finalVideoUrl = uploaded.url;
        storagePath = uploaded.storagePath;
      }

    if (replaceExistingVideo) {
      // Direct replace helper keeping all product attributes completely intact
      replaceProductVideo(linkedProd.id, finalVideoUrl, platform, finalTitle);
      if (storagePath) updateProduct({ ...linkedProd, videoUrl: finalVideoUrl, videoStoragePath: storagePath });
    } else {
      // 1. Add video to VideoReviews state
      addVideo({
        productId: linkedProd.id,
        productTitle: linkedProd.titleAr,
        productImage: linkedProd.image,
        thumbnailUrl: linkedProd.image,
        platform,
        embedId,
        videoUrl: finalVideoUrl,
        storagePath,
        title: finalTitle,
        duration: customDuration || '00:45',
        seoDescription,
        hashtags
      });

      // 2. Sync with product entry
      if (syncWithProduct && linkedProd) {
        const updated: any = { ...linkedProd, videoUrl: finalVideoUrl, videoStoragePath: storagePath };
        if (platform === 'youtube') updated.youtubeUrl = finalVideoUrl;
        else if (platform === 'tiktok') updated.tiktokUrl = finalVideoUrl;
        else if (platform === 'pinterest') updated.pinterestUrl = finalVideoUrl;
        else {
          updated.youtubeUrl = finalVideoUrl;
        }
        updateProduct(updated);
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setVideoUrl('');
      setCustomTitle('');
      setSeoDescription('');
      setUploadedFile(null);
      setUploadedVideoPreviewUrl('');
      onClose();
    }, 1200);
    } catch (error: any) {
      setErrorMessage(error?.message || 'فشل رفع الفيديو إلى التخزين. تأكدي من تسجيل الدخول بحساب المالك.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="fixed top-3 left-3 right-3 z-[80] flex items-center justify-between pointer-events-none">
        <button type="button" onClick={onClose} className="pointer-events-auto min-h-11 px-4 rounded-xl bg-slate-950 border border-amber-400/70 text-white shadow-2xl flex items-center gap-2 font-bold text-sm">
          <ArrowLeft className="w-5 h-5 text-amber-300" />
          <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
        </button>
        <button type="button" onClick={onClose} className="pointer-events-auto w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 border-2 border-white text-white shadow-2xl flex items-center justify-center" aria-label={language === 'ar' ? 'إغلاق نافذة الفيديو' : 'Close video window'}>
          <X className="w-7 h-7" />
        </button>
      </div>
      <div 
        className={`relative w-full max-w-2xl bg-[#111113] border rounded-3xl shadow-2xl text-white overflow-hidden my-auto max-h-[92vh] flex flex-col transition-all ${
          isDragging ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-purple-500/40'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-600 via-amber-500 to-emerald-500 h-1.5 w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-amber-500/30 border border-purple-500/40 flex items-center justify-center shrink-0">
              {isReplacing ? (
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin-slow" />
              ) : (
                <Film className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isReplacing 
                    ? 'استبدال الفيديو بفيديو حقيقي من جهازك' 
                    : 'مركز استيراد ورفع الفيديوهات من الجهاز (Video Hub)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black font-['Tajawal'] text-white">
                {isReplacing ? 'استبدال الفيديو الافتراضي بملف فيديو من الكمبيوتر / الهاتف' : 'استيراد أو رفع فيديو للمنتج وربطه ببيانات المتجر'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Product Summary Card */}
        {currentProduct && (
          <div className="px-4 sm:px-6 pt-3 shrink-0">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 flex items-center gap-3">
              <img 
                src={currentProduct.image} 
                alt={currentProduct.titleAr} 
                className="w-12 h-12 rounded-xl object-cover border border-purple-700/50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-bold uppercase">{currentProduct.brand}</span>
                  <span className="text-[10px] text-emerald-400 font-black font-mono">
                    {formatPrice(currentProduct.discountPrice)}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate font-['Tajawal']">
                  {currentProduct.titleAr}
                </h4>
                <span className="text-[10px] text-slate-400 block truncate">
                  {currentProduct.features?.slice(0, 2).join(' • ') || currentProduct.description}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Link vs Upload) */}
        <div className="px-4 sm:px-6 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setImportMode('upload')}
              className={`py-2.5 px-4 rounded-xl font-['Tajawal'] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                importMode === 'upload'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>1. رفع فيديو من جهازك (كمبيوتر / هاتف)</span>
            </button>

            <button
              type="button"
              onClick={() => setImportMode('link')}
              className={`py-2.5 px-4 rounded-xl font-['Tajawal'] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                importMode === 'link'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-amber-400" />
              <span>2. استيراد عبر رابط (YouTube / TikTok)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleImport} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Product Selection */}
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-amber-300 font-['Tajawal'] flex items-center justify-between">
              <span>المنتج المرتبط بالفيديو:</span>
              <span className="text-[10px] text-slate-400">تظل كل تفاصيل المنتج والمميزات محفوظة بالكامل</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-['Tajawal'] font-bold cursor-pointer"
            >
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                  {p.titleAr} — ({p.brand}) [${p.discountPrice || p.originalPrice}]
                </option>
              ))}
            </select>
          </div>

          {/* Mode 1: Local Video File Upload */}
          {importMode === 'upload' && (
            <div className="space-y-3">
              <input 
                type="file" 
                ref={fileInputRef}
                accept="video/*,video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group ${
                  isDragging 
                    ? 'border-amber-400 bg-amber-500/10 scale-102' 
                    : 'border-purple-500/40 hover:border-purple-400 bg-slate-900/60 hover:bg-slate-900'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-700/60 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {uploadedFile ? uploadedFile.name : 'انقر هنا لاختيار ملف فيديو أو اسحبه إلى هنا مباشرة'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    يدعم جميع صيغ الفيديو: MP4, WebM, QuickTime MOV (حتى 200 ميجابايت)
                  </p>
                </div>
                {uploadedFile && (
                  <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-mono font-bold">
                    حجم الملف: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB ✓
                  </span>
                )}
              </div>

              {fileError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Local Video Live Player Preview */}
              {uploadedVideoPreviewUrl && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>معاينة الفيديو المرفوع من جهازك:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedVideoPreviewUrl('');
                      }}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      إزالة واختيار ملف آخر
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video max-h-52 mx-auto relative shadow-lg">
                    <video 
                      ref={videoRef}
                      src={uploadedVideoPreviewUrl} 
                      controls 
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: URL Input */}
          {importMode === 'link' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white font-['Tajawal']">
                  رابط الفيديو من يوتيوب، تيك توك، انستغرام، سناب شات، أو رابط MP4 مباشر:
                </label>
                <input 
                  type="url" 
                  required={importMode === 'link'}
                  value={videoUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... أو https://www.tiktok.com/@... أو https://instagram.com/reel/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 font-medium"
                />
              </div>

              {/* Platform Selector Buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 font-['Tajawal']">
                  منصة الفيديو:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400' },
                    { id: 'tiktok', label: 'TikTok', icon: Video, color: 'text-pink-400' },
                    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-purple-400' },
                    { id: 'snapchat', label: 'Snapchat', icon: Ghost, color: 'text-yellow-400' },
                    { id: 'pinterest', label: 'Pinterest', icon: Sparkles, color: 'text-red-500' },
                    { id: 'direct', label: 'Direct MP4', icon: Globe, color: 'text-emerald-400' },
                  ].map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id as any)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          platform === p.id
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${p.color}`} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AI SEO Generator Quick Button */}
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-950/60 to-indigo-950/60 p-3 rounded-2xl border border-purple-500/30">
            <div className="text-xs text-purple-200">
              <span className="font-bold block">مساعد الـ SEO والوصف الذكي:</span>
              <span className="text-[11px] text-slate-300">توليد عنوان جذاب وكابشن تسويقي مع هاشتاقات للمنتج بضغطة واحدة</span>
            </div>
            <button
              type="button"
              onClick={handleGenerateSeo}
              disabled={isGeneratingSeo}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-90 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5 text-slate-950" />
              <span>{isGeneratingSeo ? 'جاري التوليد...' : '✨ توليد SEO تلقائي'}</span>
            </button>
          </div>

          {/* Custom Title & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                عنوان الفيديو أو المراجعة:
              </label>
              <input 
                type="text" 
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثال: تجربة عملية واستعراض لأهم مميزات الجهاز"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-['Tajawal'] font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white font-['Tajawal']">
                مدة الفيديو (MM:SS):
              </label>
              <input 
                type="text" 
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="01:30"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* SEO Description & Hashtags (if generated) */}
          {seoDescription && (
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-amber-300 block">وصف SEO الترويجي للمنشور:</span>
              <p className="text-slate-200 text-xs leading-relaxed">{seoDescription}</p>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {hashtags.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono">
                      #{h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Replacement & Sync Checkboxes */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-950/40 border border-purple-700/50 text-xs font-bold text-amber-300 cursor-pointer">
              <input 
                type="checkbox"
                checked={replaceExistingVideo}
                onChange={(e) => setReplaceExistingVideo(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <span>🔄 استبدال أي فيديو افتراضي حالي لهذا المنتج بالفيديو الجديد من جهازي</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-emerald-300 cursor-pointer">
              <input 
                type="checkbox"
                checked={syncWithProduct}
                onChange={(e) => setSyncWithProduct(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <span>حفظ وتثبيت الفيديو مباشرة في بطاقة وتفاصيل المنتج بالمتجر</span>
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {isUploading && (
            <div className="space-y-2 rounded-xl border border-purple-500/40 bg-purple-950/40 p-3">
              <div className="flex justify-between text-xs font-bold text-white"><span>جاري رفع الفيديو فعليًا</span><span>{uploadProgress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-purple-500 transition-all" style={{ width: `${uploadProgress}%` }} /></div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              {importMode === 'upload' ? 'جاهز للرفع والتثبيت من جهازك' : 'جاهز للاستيراد والربط'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSuccess || isUploading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>تم التثبيت والاستبدال بنجاح!</span>
                  </>
                ) : (
                  <>
                    {replaceExistingVideo ? (
                      <RefreshCw className="w-4 h-4 text-slate-950" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-950" />
                    )}
                    <span>
                      {replaceExistingVideo 
                        ? 'تأكيد واستبدال الفيديو الآن 🚀' 
                        : (importMode === 'upload' ? 'رفع وتثبيت الفيديو 🚀' : 'استيراد وربط الفيديو 🚀')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
