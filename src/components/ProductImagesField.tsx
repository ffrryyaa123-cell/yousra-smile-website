import React, { useRef, useState } from 'react';
import { Upload, X, Star, Loader2, Plus, ImageIcon, AlertCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { uploadLocalImage } from '../services/videoAssets';
import { useApp } from '../context/AppContext';

interface ProductImagesFieldProps {
  productId: string;
  images: string[];
  onChange: (images: string[]) => void;
}

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  tif: 'image/tiff',
  tiff: 'image/tiff'
};

const IMAGE_ACCEPT = '.jpg,.jpeg,.jfif,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff,image/*';

const normalizeImageFile = (file: File): File => {
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const inferred = IMAGE_MIME_BY_EXTENSION[extension];

  // Always prefer the canonical MIME that belongs to the file extension.
  // Windows and some browsers sometimes expose JPEG as image/jpg or with an
  // empty/odd MIME. Supabase accepts the canonical image/jpeg, so normalize
  // before the upload request instead of forwarding the browser's label.
  if (inferred && file.type !== inferred) {
    return new File([file], file.name, { type: inferred, lastModified: file.lastModified });
  }

  if (file.type?.startsWith('image/') && file.type !== 'image/svg+xml') return file;
  if (inferred) return new File([file], file.name, { type: inferred, lastModified: file.lastModified });
  return file;
};

export const ProductImagesField: React.FC<ProductImagesFieldProps> = ({
  productId,
  images,
  onChange
}) => {
  const { patchProduct } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [current, setCurrent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [urlDraft, setUrlDraft] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);

  const commitImages = (nextImages: string[]) => {
    const normalized = Array.from(new Set(nextImages.filter(Boolean)));
    onChange(normalized);

    if (productId && productId !== 'new-product') {
      patchProduct(productId, {
        images: normalized,
        image: normalized[0] || ''
      });
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    setBusy(true);

    const picked = Array.from(fileList);
    const uploaded: string[] = [];
    const failures: string[] = [];

    for (let index = 0; index < picked.length; index++) {
      const originalFile = picked[index];
      const extension = (originalFile.name.split('.').pop() || '').toLowerCase();

      if (extension === 'svg' || originalFile.type === 'image/svg+xml') {
        failures.push(`${originalFile.name}: SVG غير مسموح للمنتجات لأسباب أمان.`);
        continue;
      }

      const file = normalizeImageFile(originalFile);
      setCurrent(`${index + 1} من ${picked.length} — ${file.name}`);
      setProgress(0);

      try {
        const result = await uploadLocalImage(productId || 'new-product', file, setProgress);
        uploaded.push(result.videoUrl);
      } catch (uploadError: any) {
        failures.push(`${file.name}: ${uploadError?.message || 'تعذر رفع الصورة.'}`);
      }
    }

    if (uploaded.length > 0) commitImages([...images, ...uploaded]);
    if (failures.length > 0) setError(failures.join(' — '));

    setBusy(false);
    setCurrent('');
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addUrl = () => {
    const candidate = urlDraft.trim();
    if (!candidate) return;
    if (!/^https?:\/\//i.test(candidate)) {
      setError('الرابط يجب أن يبدأ بـ https://');
      return;
    }
    if (images.includes(candidate)) {
      setError('هذه الصورة مضافة بالفعل.');
      return;
    }
    setError('');
    commitImages([...images, candidate]);
    setUrlDraft('');
  };

  const removeAt = (index: number) => commitImages(images.filter((_, i) => i !== index));

  const toggleSelected = (src: string) => {
    setSelected(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
  };

  const removeSelected = () => {
    if (selected.length === 0) return;
    commitImages(images.filter(src => !selected.includes(src)));
    setSelected([]);
  };

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    commitImages([chosen, ...next]);
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-300" />
          صور المنتج ({images.length})
        </label>
        <span className="text-[11px] text-slate-400">الصورة الأولى هي الرئيسية التي تظهر في القوائم</span>
      </div>

      {selected.length > 0 && (
        <button
          type="button"
          onClick={removeSelected}
          className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-[11px] flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          حذف الصور المحددة ({selected.length})
        </button>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className={`relative group rounded-xl overflow-hidden border aspect-square bg-slate-950 ${index === 0 ? 'border-amber-400' : 'border-slate-700'}`}
            >
              <img src={src} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />

              {index === 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                  رئيسية
                </span>
              )}

              <button
                type="button"
                onClick={() => toggleSelected(src)}
                title="تحديد للحذف الجماعي"
                className="absolute top-1 left-1 p-0.5 rounded bg-slate-950/70"
              >
                {selected.includes(src) ? <CheckSquare className="w-4 h-4 text-amber-300" /> : <Square className="w-4 h-4 text-white/80" />}
              </button>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-4 pb-1 flex items-center justify-center gap-1.5">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    title="اجعليها الصورة الرئيسية"
                    className="p-1.5 rounded-lg bg-amber-500 active:bg-amber-400 hover:bg-amber-400 text-slate-950 shadow"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  title="حذف الصورة"
                  className="p-1.5 rounded-lg bg-red-600 active:bg-red-500 hover:bg-red-500 text-white shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 space-y-2">
        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          ارفعي صورة واحدة أو عدة صور من جهازك
        </p>
        <p className="text-[10px] text-emerald-300">
          JPG, JPEG, PNG, WebP, GIF, BMP, AVIF, HEIC/HEIF, TIFF
        </p>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          disabled={busy}
          onChange={e => handleFiles(e.target.files)}
          className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer disabled:opacity-50"
        />

        {busy && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري الرفع: {current}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          dir="ltr"
          value={urlDraft}
          onChange={e => setUrlDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="أو ألصقي رابط صورة هنا"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white text-xs focus:border-purple-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-400 font-bold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      {images.length === 0 && !busy && (
        <p className="text-[11px] text-amber-300/80">
          لم تُضف أي صورة بعد. المنتج يحتاج صورة واحدة على الأقل.
        </p>
      )}
    </div>
  );
};