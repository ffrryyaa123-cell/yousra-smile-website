import React, { useState } from 'react';
import { X, Trash2, PlaySquare, Film, AlertCircle, Plus, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { deleteProductVideo } from '../services/videoAssets';

interface ProductVideosManagerProps {
  product: Product | null;
  onClose: () => void;
}

/**
 * Lists every video attached to one product so a single one — or a chosen
 * few — can be removed without touching the rest.
 *
 * The dashboard previously offered only "delete the video", which cleared the
 * product's whole video set at once — fine when a product could hold just one,
 * wrong now that it can hold several. Each entry here is removed on its own
 * (or as part of an explicit multi-select), and every other video, and every
 * other field on the product, is left untouched.
 */
export const ProductVideosManager: React.FC<ProductVideosManagerProps> = ({ product, onClose }) => {
  const { videos, deleteVideo, patchProduct, openImportVideoModal } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  if (!product) return null;

  const linked = videos.filter(v => v.productId === product.id);

  const toggleSelected = (videoId: string) => {
    setSelected(prev => prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]);
  };

  /** Removes one video's stored file + row, and — only if the product's
   * single cover-video field was pointing at exactly this file — hands the
   * cover slot to whichever video remains via patchProduct, which can only
   * ever change that one field and nothing else on the product. */
  const removeOne = async (videoId: string, storagePath?: string, videoUrl?: string) => {
    if (storagePath) await deleteProductVideo(storagePath);
    await deleteVideo(videoId);
    if (videoUrl && product.videoUrl === videoUrl) {
      const remaining = linked.filter(v => v.id !== videoId);
      patchProduct(product.id, {
        videoUrl: remaining[0]?.videoUrl ?? '',
        videoStoragePath: remaining[0]?.storagePath ?? ''
      });
    }
  };

  const handleDelete = async (videoId: string, storagePath?: string, videoUrl?: string) => {
    if (!window.confirm('حذف هذا الفيديو وحده؟ باقي فيديوهات المنتج تبقى كما هي.')) return;
    setBusyId(videoId);
    setError('');
    try {
      await removeOne(videoId, storagePath, videoUrl);
    } catch (deleteError: any) {
      setError(deleteError?.message || 'تعذر حذف الفيديو.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`حذف ${selected.length} فيديو محدد؟ باقي فيديوهات المنتج تبقى كما هي.`)) return;
    setBulkBusy(true);
    setError('');
    try {
      for (const videoId of selected) {
        const v = linked.find(item => item.id === videoId);
        if (!v) continue;
        // eslint-disable-next-line no-await-in-loop
        await removeOne(v.id, v.storagePath, v.videoUrl);
      }
      setSelected([]);
    } catch (deleteError: any) {
      setError(deleteError?.message || 'تعذر حذف بعض الفيديوهات المحددة.');
    } finally {
      setBulkBusy(false);
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

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openImportVideoModal(product.id, 'upload', false)}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة فيديو جديد لهذا المنتج
          </button>

          {selected.length > 0 && (
            <button
              type="button"
              disabled={bulkBusy}
              onClick={handleDeleteSelected}
              className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkBusy ? 'جاري الحذف...' : `حذف المحدد (${selected.length})`}
            </button>
          )}
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
                className={`rounded-2xl border p-3 flex flex-wrap items-center gap-3 ${
                  selected.includes(video.id) ? 'border-amber-400 bg-amber-950/20' : 'border-slate-700 bg-slate-950/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelected(video.id)}
                  title="تحديد للحذف الجماعي"
                  className="shrink-0 text-amber-300"
                >
                  {selected.includes(video.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-600" />}
                </button>

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
