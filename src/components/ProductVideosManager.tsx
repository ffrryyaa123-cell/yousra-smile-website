import React, { useState } from 'react';
import { X, Trash2, PlaySquare, Film, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { deleteProductVideo } from '../services/videoAssets';

interface ProductVideosManagerProps {
  product: Product | null;
  onClose: () => void;
}

/**
 * Lists every video attached to one product so a single one can be removed.
 *
 * The dashboard previously offered only "delete the video", which cleared the
 * product's whole video set at once — fine when a product could hold just one,
 * wrong now that it can hold several. Each entry here is removed on its own,
 * and the others are left untouched.
 */
export const ProductVideosManager: React.FC<ProductVideosManagerProps> = ({ product, onClose }) => {
  const { videos, deleteVideo, updateProduct } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  if (!product) return null;

  const linked = videos.filter(v => v.productId === product.id);

  const handleDelete = async (videoId: string, storagePath?: string, videoUrl?: string) => {
    if (!window.confirm('حذف هذا الفيديو وحده؟ باقي فيديوهات المنتج تبقى كما هي.')) return;

    setBusyId(videoId);
    setError('');
    try {
      // Remove the stored file first; a leftover file costs storage forever.
      if (storagePath) await deleteProductVideo(storagePath);

      deleteVideo(videoId);

      // If the product pointed at this exact file, hand it over to whichever
      // video remains rather than leaving a dead link on the product page.
      if (videoUrl && product.videoUrl === videoUrl) {
        const remaining = linked.filter(v => v.id !== videoId);
        updateProduct({
          ...product,
          videoUrl: remaining[0]?.videoUrl ?? '',
          videoStoragePath: remaining[0]?.storagePath ?? ''
        });
      }
    } catch (deleteError: any) {
      setError(deleteError?.message || 'تعذر حذف الفيديو.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              فيديوهات المنتج ({linked.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">{product.titleAr}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        {linked.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">
            لا يوجد فيديو مرتبط بهذا المنتج بعد.
          </p>
        ) : (
          <div className="space-y-3">
            {linked.map(video => (
              <div
                key={video.id}
                className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3 flex flex-wrap items-center gap-3"
              >
                <div className="w-28 shrink-0 rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                  {video.videoUrl && /\.(mp4|webm|mov)(\?|$)/i.test(video.videoUrl) ? (
                    <video src={video.videoUrl} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <PlaySquare className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-[160px] space-y-1">
                  <p className="text-xs font-bold text-slate-100 line-clamp-2">{video.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono" dir="ltr">
                    {video.duration} · {video.platform}
                  </p>
                  {video.videoUrl && (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-purple-300 hover:text-purple-200 underline"
                    >
                      فتح الفيديو
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busyId === video.id}
                  onClick={() => handleDelete(video.id, video.storagePath, video.videoUrl)}
                  className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {busyId === video.id ? 'جاري الحذف...' : 'حذف هذا فقط'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
