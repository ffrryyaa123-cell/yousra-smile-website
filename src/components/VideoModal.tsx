import React, { useState } from 'react';
import { VideoReview } from '../types';
import { useApp } from '../context/AppContext';
import { X, PlaySquare, ShoppingBag, ExternalLink, Share2, Youtube } from 'lucide-react';
import { SocialVideoExportModal } from './SocialVideoExportModal';

interface VideoModalProps {
  video: VideoReview | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const { products, openProductDetail, logAffiliateClick, language, formatPrice } = useApp();
  const [showExportModal, setShowExportModal] = useState(false);

  if (!video) return null;

  const linkedProduct = products.find(p => p.id === video.productId);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div 
          className="bg-slate-900 text-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-red-500" />
              <span className="text-sm font-bold truncate max-w-md">{video.title}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Share / Export Button */}
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>تصدير لمواقع التواصل</span>
              </button>

              <button 
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Player */}
          <div className="aspect-video w-full bg-black relative">
            <iframe 
              className="w-full h-full"
              src={video.platform === 'youtube' ? `https://www.youtube.com/embed/${video.embedId}?autoplay=1` : video.videoUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Linked Product Bar & Multi-Store Pricing */}
          {linkedProduct && (
            <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={linkedProduct.image} 
                    alt={linkedProduct.titleAr} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                  <div>
                    <span className="text-xs text-purple-400 font-semibold">{linkedProduct.brand}</span>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{linkedProduct.titleAr}</h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-base font-black text-emerald-400 font-['Tajawal']">
                        أفضل سعر: {formatPrice(linkedProduct.discountPrice)}
                      </span>
                      {linkedProduct.originalPrice > linkedProduct.discountPrice && (
                        <span className="text-xs text-slate-500 line-through">
                          {formatPrice(linkedProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { onClose(); openProductDetail(linkedProduct); }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    تفاصيل المنتج
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    مشاركة الفيديو
                  </button>
                </div>
              </div>

              {/* Direct Store Price Action Buttons (Amazon vs AliExpress) */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Amazon Direct Link Button */}
                <button
                  onClick={() => {
                    logAffiliateClick(linkedProduct.id, 'amazon');
                    window.open(linkedProduct.amazonUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-between gap-2 shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>شراء من أمازون (Amazon)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/20 px-2 py-0.5 rounded text-[11px]">
                    <span>{formatPrice(linkedProduct.discountPrice)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </button>

                {/* AliExpress Direct Link Button */}
                <button
                  onClick={() => {
                    logAffiliateClick(linkedProduct.id, 'aliexpress');
                    const aliUrl = linkedProduct.aliexpressUrl || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(linkedProduct.titleEn)}`;
                    window.open(aliUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center justify-between gap-2 shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>شراء من علي إكسبريس (AliExpress)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded text-[11px]">
                    <span>{formatPrice(Math.round(linkedProduct.discountPrice * 0.92))}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export / Social Share Modal */}
      {showExportModal && (
        <SocialVideoExportModal 
          video={video} 
          onClose={() => setShowExportModal(false)} 
        />
      )}
    </>
  );
};
