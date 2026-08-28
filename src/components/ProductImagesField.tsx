import React, { useRef, useState } from 'react';
import { Upload, X, Star, Loader2, Plus, ImageIcon, AlertCircle } from 'lucide-react';
import { uploadLocalImage } from '../services/videoAssets';

interface ProductImagesFieldProps {
  /** The product's id — used to group its images inside storage. */
  productId: string;
  /** Every image, primary first. */
  images: string[];
  onChange: (images: string[]) => void;
}

/**
 * Manages the whole set of photos for one product.
 *
 * The form used to offer a single "main image URL" box, so a product could
 * never show more than one photo, and every photo had to already be hosted
 * somewhere else. This lets the owner upload several from her own computer,
 * see them, reorder which one leads, and drop the ones she does not want.
 */
export const ProductImagesField: React.FC<ProductImagesFieldProps> = ({
  productId,
  images,
  onChange
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [current, setCurrent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [urlDraft, setUrlDraft] = useState<string>('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    setBusy(true);

    const picked = Array.from(fileList);
    const uploaded: string[] = [];

    for (let index = 0; index < picked.length; index++) {
      const file = picked[index];
      setCurrent(`${index + 1} من ${picked.length} — ${file.name}`);
      setProgress(0);
      try {
        const result = await uploadLocalImage(productId || 'new-product', file, setProgress);
        uploaded.push(result.videoUrl);
      } catch (uploadError: any) {
        // One bad file must not discard the ones that already succeeded.
        setError(uploadError?.message || 'تعذر رفع إحدى الصور.');
      }
    }

    if (uploaded.length > 0) onChange([...images, ...uploaded]);
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
    onChange([...images, candidate]);
    setUrlDraft('');
  };

  const removeAt = (index: number) => onChange(images.filter((_, i) => i !== index));

  /** Moves an image to the front — the first one is the product's main photo. */
  const makePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    onChange([chosen, ...next]);
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

      {/* thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className={`relative group rounded-xl overflow-hidden border aspect-square bg-slate-950 ${
                index === 0 ? 'border-amber-400' : 'border-slate-700'
              }`}
            >
              <img src={src} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />

              {index === 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                  رئيسية
                </span>
              )}

              {/* Controls are always visible (not hover-only) so this works on
                  touchscreens — a phone or tablet has no hover state, so a
                  group-hover-only overlay would leave no way to see, let
                  alone tap, the delete button at all. */}
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

      {/* upload from device */}
      <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 space-y-2">
        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          ارفعي صوراً من جهازك — يمكنك اختيار عدة صور معاً
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
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

      {/* add by URL */}
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
