import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { uploadLocalVideo, saveVideoRecord, MAX_VIDEO_BYTES } from '../services/videoAssets';
import {
  X,
  ArrowLeft,
  Link as LinkIcon,
  Upload,
  Film,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HardDrive,
  Plus
} from 'lucide-react';

interface VideoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string | null;
  isReplacing?: boolean;
  defaultMode?: 'upload' | 'link';
}

type UploadedResult = {
  id: string;
  videoUrl: string;
  storagePath?: string;
  durationSeconds: number;
  durationLabel: string;
  title: string;
};

const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  ogv: 'video/ogg',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  '3gp': 'video/3gpp',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  ts: 'video/mp2t',
  mts: 'video/mp2t',
  m2ts: 'video/mp2t',
  vob: 'video/mpeg'
};

const ACCEPTED_VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm|ogg|ogv|mkv|avi|mpeg|mpg|3gp|wmv|flv|ts|mts|m2ts|vob)$/i;
const ACCEPT_ATTRIBUTE = '.mp4,.mov,.m4v,.webm,.ogg,.ogv,.mkv,.avi,.mpeg,.mpg,.3gp,.wmv,.flv,.ts,.mts,.m2ts,.vob,video/*';

const getExtension = (file: File): string =>
  (file.name.split('.').pop() || '').toLowerCase();

const isLikelyVideo = (file: File): boolean =>
  Boolean(file.type?.startsWith('video/')) || ACCEPTED_VIDEO_EXTENSIONS.test(file.name);

/**
 * Windows, phone export tools and some video editors occasionally expose a
 * perfectly valid MP4/MOV as application/octet-stream (or with an empty MIME
 * type). Supabase validates MIME types at the bucket level, so normalise the
 * browser File object from its known extension before upload.
 */
const normalizeVideoFile = (file: File): File => {
  const inferred = VIDEO_MIME_BY_EXTENSION[getExtension(file)];
  if (!inferred) return file;

  if (file.type === inferred) return file;
  if (!file.type || !file.type.startsWith('video/') || file.type === 'application/octet-stream') {
    return new File([file], file.name, {
      type: inferred,
      lastModified: file.lastModified
    });
  }

  // Standardise known extensions even when a browser reports a non-standard
  // video MIME spelling. This prevents an allowed extension being rejected by
  // Storage merely because the MIME label differed.
  return new File([file], file.name, {
    type: inferred,
    lastModified: file.lastModified
  });
};

const formatDuration = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const readDurationSeconds = (file: File): Promise<number> =>
  new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    let settled = false;

    const finish = (value: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(value) ? value : 0);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => finish(video.duration || 0);
    video.onerror = () => finish(0);
    video.src = objectUrl;

    // A format can still be uploadable even if this browser cannot decode its
    // metadata. Do not block the upload forever just because preview metadata
    // is unavailable.
    window.setTimeout(() => finish(0), 5000);
  });

export const VideoImportModal: React.FC<VideoImportModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
  isReplacing = false,
  defaultMode = 'upload'
}) => {
  const {
    products,
    addVideo,
    patchProduct,
    language,
    formatPrice
  } = useApp();

  const [importMode, setImportMode] = useState<'upload' | 'link'>(defaultMode);
  const [selectedProductId, setSelectedProductId] = useState<string>(preselectedProductId || products[0]?.id || '');
  const [files, setFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [hashtagsText, setHashtagsText] = useState('');
  const [replaceExistingVideo, setReplaceExistingVideo] = useState(isReplacing);
  const [syncWithProduct, setSyncWithProduct] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * The old effect reset `files` every time the products array changed. Product
   * state updates happen frequently while the dashboard is open, so 2–3 files
   * could appear for a moment and then vanish before the owner could press
   * Upload. This ref makes the reset happen once per modal opening only.
   */
  const initializedForOpenRef = useRef(false);

  const currentProduct = useMemo(
    () => products.find(product => product.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  const firstPreviewUrl = useMemo(() => {
    if (!files[0]) return '';
    return URL.createObjectURL(files[0]);
  }, [files]);

  useEffect(() => {
    return () => {
      if (firstPreviewUrl) URL.revokeObjectURL(firstPreviewUrl);
    };
  }, [firstPreviewUrl]);

  useEffect(() => {
    if (!isOpen) {
      initializedForOpenRef.current = false;
      return;
    }

    // Do not clear the files again merely because products refreshed or some
    // other dashboard state changed while this modal is still open.
    if (initializedForOpenRef.current) return;
    initializedForOpenRef.current = true;

    const targetId = preselectedProductId || selectedProductId || products[0]?.id || '';
    setSelectedProductId(targetId);
    setImportMode(defaultMode);
    setReplaceExistingVideo(isReplacing);
    setFiles([]);
    setVideoUrl('');
    setFileError('');
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(0);
    setCurrentUploadIndex(0);

    const product = products.find(item => item.id === targetId) || products[0];
    setCustomTitle(product ? `فيديو استعراض وتجربة لـ ${product.titleAr}` : '');
  }, [isOpen, preselectedProductId, defaultMode, isReplacing, products, selectedProductId]);

  if (!isOpen) return null;

  const hashtags = hashtagsText
    .split(/[\s,]+/)
    .map(item => item.replace(/^#/, '').trim())
    .filter(Boolean);

  const validateAndAddFiles = (incoming: File[]) => {
    setFileError('');
    setErrorMessage('');

    if (incoming.length === 0) return;

    const accepted: File[] = [];
    const rejected: string[] = [];

    incoming.forEach(originalFile => {
      if (!isLikelyVideo(originalFile)) {
        rejected.push(`${originalFile.name}: الصيغة لا تبدو كملف فيديو`);
        return;
      }

      if (originalFile.size > MAX_VIDEO_BYTES) {
        rejected.push(
          `${originalFile.name}: ${(originalFile.size / 1048576).toFixed(0)} MB أكبر من الحد ${Math.round(MAX_VIDEO_BYTES / 1048576)} MB`
        );
        return;
      }

      accepted.push(normalizeVideoFile(originalFile));
    });

    if (accepted.length > 0) {
      setFiles(previous => {
        const merged = [...previous];
        accepted.forEach(file => {
          const duplicate = merged.some(
            item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified
          );
          if (!duplicate) merged.push(file);
        });
        return merged;
      });
    }

    if (rejected.length > 0) setFileError(rejected.join(' — '));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    setImportMode('upload');
    validateAndAddFiles(Array.from(event.dataTransfer.files || []));
  };

  const removeFile = (index: number) => {
    setFiles(previous => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const addUploadedVideoToCatalog = async (
    linkedProduct: NonNullable<typeof currentProduct>,
    file: File,
    index: number
  ): Promise<UploadedResult> => {
    setCurrentUploadIndex(index);
    setUploadProgress(0);

    const durationSeconds = await readDurationSeconds(file);
    const durationLabel = formatDuration(durationSeconds);
    const uploaded = await uploadLocalVideo(linkedProduct.id, file, setUploadProgress);
    const id = `vid-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
    const baseTitle = customTitle.trim() || `فيديو استعراض لـ ${linkedProduct.titleAr}`;
    const title = files.length > 1 ? `${baseTitle} (${index + 1}/${files.length})` : baseTitle;

    // Save one independent row per uploaded file. Nothing here replaces a
    // previous video's row, so a product can own any number of videos.
    await saveVideoRecord({
      id,
      productId: linkedProduct.id,
      videoUrl: uploaded.videoUrl,
      storagePath: uploaded.storagePath,
      thumbnailUrl: linkedProduct.image,
      durationSeconds,
      aspectRatio: 'auto',
      title,
      caption: seoDescription,
      hashtags,
      affiliateUrl: linkedProduct.amazonUrl || linkedProduct.aliexpressUrl || '',
      createdAt: new Date().toISOString()
    });

    addVideo({
      id,
      productId: linkedProduct.id,
      productTitle: linkedProduct.titleAr,
      productImage: linkedProduct.image,
      thumbnailUrl: linkedProduct.image,
      platform: 'local',
      embedId: id,
      videoUrl: uploaded.videoUrl,
      storagePath: uploaded.storagePath,
      title,
      duration: durationLabel,
      seoDescription,
      hashtags
    });

    return {
      id,
      videoUrl: uploaded.videoUrl,
      storagePath: uploaded.storagePath,
      durationSeconds,
      durationLabel,
      title
    };
  };

  const handleUploadFiles = async () => {
    if (!currentProduct) {
      setErrorMessage('اختاري المنتج أولاً.');
      return;
    }
    if (files.length === 0) {
      setErrorMessage('اختاري فيديو واحداً أو عدة فيديوهات من جهازك.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const uploadedResults: UploadedResult[] = [];
    const failures: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      try {
        // Sequential uploads are intentional: several large videos uploading in
        // parallel can saturate the browser connection and look frozen.
        // eslint-disable-next-line no-await-in-loop
        const result = await addUploadedVideoToCatalog(currentProduct, files[index], index);
        uploadedResults.push(result);
      } catch (error: any) {
        failures.push(`${files[index].name}: ${error?.message || 'فشل الرفع'}`);
      }
    }

    if (uploadedResults.length > 0 && syncWithProduct) {
      const first = uploadedResults[0];
      if (replaceExistingVideo || !currentProduct.videoUrl) {
        patchProduct(currentProduct.id, {
          videoUrl: first.videoUrl,
          videoStoragePath: first.storagePath || '',
          youtubeUrl: first.videoUrl
        });
      }
    }

    setIsUploading(false);
    setUploadProgress(0);

    if (uploadedResults.length > 0) {
      setSuccessMessage(
        uploadedResults.length === 1
          ? 'تم رفع الفيديو وربطه بالمنتج بنجاح.'
          : `تم رفع ${uploadedResults.length} فيديوهات وربطها بنفس المنتج بنجاح.`
      );
      setFiles([]);
    }

    if (failures.length > 0) setErrorMessage(failures.join(' — '));
  };

  const handleImportLink = () => {
    if (!currentProduct) {
      setErrorMessage('اختاري المنتج أولاً.');
      return;
    }

    const url = videoUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setErrorMessage(language === 'en' ? 'Please enter a valid video URL.' : 'أدخلي رابط فيديو صحيحاً يبدأ بـ http أو https.');
      return;
    }

    const id = `vid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = customTitle.trim() || `فيديو استعراض لـ ${currentProduct.titleAr}`;
    let platform: 'youtube' | 'tiktok' | 'pinterest' | 'instagram' | 'snapchat' | 'direct' = 'direct';

    if (/youtu\.be|youtube\.com/i.test(url)) platform = 'youtube';
    else if (/tiktok\.com/i.test(url)) platform = 'tiktok';
    else if (/pinterest\.com|pin\.it/i.test(url)) platform = 'pinterest';
    else if (/instagram\.com/i.test(url)) platform = 'instagram';
    else if (/snapchat\.com/i.test(url)) platform = 'snapchat';

    addVideo({
      id,
      productId: currentProduct.id,
      productTitle: currentProduct.titleAr,
      productImage: currentProduct.image,
      thumbnailUrl: currentProduct.image,
      platform,
      embedId: id,
      videoUrl: url,
      title,
      duration: '00:00',
      seoDescription,
      hashtags
    });

    if (syncWithProduct && (replaceExistingVideo || !currentProduct.videoUrl)) {
      const patch: Record<string, unknown> = { videoUrl: url };
      if (platform === 'youtube') patch.youtubeUrl = url;
      else if (platform === 'tiktok') patch.tiktokUrl = url;
      else if (platform === 'pinterest') patch.pinterestUrl = url;
      patchProduct(currentProduct.id, patch);
    }

    setVideoUrl('');
    setSuccessMessage('تم ربط رابط الفيديو بالمنتج.');
    setErrorMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
      dir="rtl"
      onClick={onClose}
      onDragOver={event => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={event => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <div className="fixed top-3 left-3 right-3 z-[80] flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto min-h-11 px-4 rounded-xl bg-slate-950 border border-amber-400/70 text-white shadow-2xl flex items-center gap-2 font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5 text-amber-300" />
          رجوع
        </button>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 border-2 border-white text-white shadow-2xl flex items-center justify-center"
          aria-label="إغلاق نافذة الفيديو"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      <div
        className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border bg-slate-900 text-white shadow-2xl p-5 sm:p-6 space-y-5 ${
          isDragging ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-purple-500/40'
        }`}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              رفع فيديوهات المنتج
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك رفع فيديو واحد أو عدة فيديوهات لنفس المنتج. لا يوجد حد 15 أو 20 ثانية.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentProduct && (
          <div className="rounded-2xl border border-purple-800/50 bg-purple-950/25 p-3 flex items-center gap-3">
            <img src={currentProduct.image} alt="" className="w-14 h-14 object-cover rounded-xl border border-slate-700" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{currentProduct.titleAr}</p>
              <p className="text-[11px] text-slate-400">{currentProduct.brand} · {formatPrice(currentProduct.discountPrice)}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-amber-300 block mb-1.5">المنتج المرتبط بالفيديوهات</label>
          <select
            value={selectedProductId}
            onChange={event => setSelectedProductId(event.target.value)}
            disabled={isUploading}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.titleAr} — {product.brand}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setImportMode('upload')}
            disabled={isUploading}
            className={`rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 ${importMode === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
          >
            <HardDrive className="w-4 h-4" />
            من الجهاز
          </button>
          <button
            type="button"
            onClick={() => setImportMode('link')}
            disabled={isUploading}
            className={`rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 ${importMode === 'link' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
          >
            <LinkIcon className="w-4 h-4" />
            من رابط
          </button>
        </div>

        {importMode === 'upload' ? (
          <div className="space-y-4">
            <label
              className={`block rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer ${isDragging ? 'border-amber-400 bg-amber-500/10' : 'border-purple-500/50 bg-slate-950/50 hover:border-purple-400'}`}
            >
              <Upload className="w-8 h-8 mx-auto text-purple-300 mb-2" />
              <p className="font-bold text-sm">اختاري فيديو أو عدة فيديوهات معاً</p>
              <p className="text-[11px] text-slate-400 mt-1">
                MP4 / MOV / M4V / WebM وغيرها — حتى {Math.round(MAX_VIDEO_BYTES / 1048576)}MB لكل ملف.
              </p>
              <p className="text-[11px] text-emerald-300 mt-1 font-bold">
                فيديو 20 أو 30 أو 45 أو 60 ثانية مقبول؛ المدة ليست سبب الرفض.
              </p>
              <input
                type="file"
                multiple
                accept={ACCEPT_ATTRIBUTE}
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-[11px] text-slate-400 mb-2">اختيار مباشر من المتصفح:</p>
              <input
                type="file"
                multiple
                accept={ACCEPT_ATTRIBUTE}
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white file:cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-emerald-300">تم اختيار {files.length} فيديو</p>
                  {!isUploading && (
                    <button type="button" onClick={() => setFiles([])} className="text-[11px] text-red-300 hover:text-red-200">إزالة الكل</button>
                  )}
                </div>

                {firstPreviewUrl && (
                  <div className="rounded-2xl overflow-hidden bg-black border border-slate-700 max-h-64">
                    <video src={firstPreviewUrl} controls className="w-full max-h-64 object-contain" />
                  </div>
                )}

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-950 text-purple-300 flex items-center justify-center font-black text-xs">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" dir="ltr">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1048576).toFixed(1)} MB · {file.type || getExtension(file)}</p>
                      </div>
                      {!isUploading && (
                        <button type="button" onClick={() => removeFile(index)} className="p-2 rounded-lg bg-red-950 text-red-300 hover:bg-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> رفع الفيديو {currentUploadIndex + 1} من {files.length}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-white block">رابط الفيديو</label>
            <input
              type="url"
              value={videoUrl}
              onChange={event => setVideoUrl(event.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-white block mb-1.5">عنوان الفيديو</label>
            <input
              type="text"
              value={customTitle}
              onChange={event => setCustomTitle(event.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-white block mb-1.5">هاشتاغات اختيارية</label>
            <input
              type="text"
              value={hashtagsText}
              onChange={event => setHashtagsText(event.target.value)}
              placeholder="#home #review"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-white block mb-1.5">وصف / كابشن اختياري</label>
          <textarea
            rows={2}
            value={seoDescription}
            onChange={event => setSeoDescription(event.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-3 text-xs font-bold text-emerald-300 cursor-pointer">
            <input type="checkbox" checked={syncWithProduct} onChange={event => setSyncWithProduct(event.target.checked)} />
            ربط الفيديوهات بالمنتج. إذا لديه فيديو رئيسي سابق يبقى كما هو، وتُضاف الفيديوهات الجديدة بجانبه.
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3 text-xs font-bold text-amber-300 cursor-pointer">
            <input type="checkbox" checked={replaceExistingVideo} onChange={event => setReplaceExistingVideo(event.target.checked)} />
            استبدال الفيديو الرئيسي فقط بالفيديو الأول من المجموعة (اختياري)
          </label>
        </div>

        {fileError && (
          <div className="rounded-xl border border-red-800 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fileError}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-800 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-4">
          <button type="button" onClick={onClose} disabled={isUploading} className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold disabled:opacity-50">
            إغلاق
          </button>
          {importMode === 'upload' ? (
            <button
              type="button"
              onClick={handleUploadFiles}
              disabled={isUploading || files.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'جاري الرفع...' : files.length > 1 ? `رفع ${files.length} فيديوهات` : 'رفع الفيديو'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleImportLink}
              disabled={!videoUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              إضافة الرابط
            </button>
          )}
        </div>
      </div>
    </div>
  );
};