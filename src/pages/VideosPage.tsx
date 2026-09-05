import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlaySquare, Youtube, Video, Sparkles, ExternalLink, ShoppingBag, Pencil, Share2, Plus, Upload, RefreshCw, HardDrive } from 'lucide-react';
import { VideoReview } from '../types';
import { SocialVideoExportModal } from '../components/SocialVideoExportModal';

export const VideosPage: React.FC = () => {
  const { videos, visibleProducts: products, openVideoModal, openProductDetail, openThumbnailEditor, logAffiliateClick, language, formatPrice, getAffiliateUrl, openImportVideoModal } = useApp();
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'tiktok' | 'pinterest'>('all');
  const [selectedExportVideo, setSelectedExportVideo] = useState<VideoReview | null>(null);

  const filteredVideos = videos.filter(vid => {
    if (platformFilter !== 'all' && vid.platform !== platformFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-6">
      
      {/* Page Title Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-purple-950 text-white rounded-2xl p-4 sm:p-6 border border-red-900/40 shadow-lg space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-red-600/30 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <PlaySquare className="w-4 h-4 text-red-400" />
              مركز مراجعات الفيديو ورفع الملفات
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-['Tajawal']">
              شاهد مراجعات يسرى سمايل قبل الشراء 🎥
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ارفع فيديوهاتك الخاصة من جهازك أو استورد روابط من YouTube وTikTok مع الحفاظ الكامل على كافة تفاصيل وأسعار المنتجات.
            </p>
          </div>

          {/* Import / Upload Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openImportVideoModal(undefined, 'upload', false)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>📁 رفع فيديو من جهازي</span>
            </button>

            <button
              type="button"
              onClick={() => openImportVideoModal(undefined, 'link', false)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>🔗 استيراد رابط</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setPlatformFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            platformFilter === 'all'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          جميع المنصات ({videos.length})
        </button>

        <button
          onClick={() => setPlatformFilter('youtube')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            platformFilter === 'youtube'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Youtube className="w-4 h-4 text-red-500" />
          يوتيوب (YouTube)
        </button>

        <button
          onClick={() => setPlatformFilter('tiktok')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            platformFilter === 'tiktok'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Video className="w-4 h-4 text-pink-500" />
          تيك توك (TikTok)
        </button>

        <button
          onClick={() => setPlatformFilter('pinterest')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            platformFilter === 'pinterest'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-red-400" />
          بنترست (Pinterest)
        </button>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => {
          const linkedProd = products.find(p => p.id === video.productId);
          return (
            <div
              key={video.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div 
                onClick={() => openVideoModal(video)}
                className="relative h-52 bg-slate-950 cursor-pointer overflow-hidden"
              >
                <img 
                  src={video.thumbnailUrl || video.productImage} 
                  alt={video.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <PlaySquare className="w-8 h-8 fill-white text-white" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/10">
                  {video.duration}
                </span>

                {/* Platform Badge */}
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shadow-md">
                  {video.platform}
                </span>

                {/* Social Share / Export Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedExportVideo(video);
                  }}
                  className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-1 cursor-pointer z-10"
                  title="تصدير ومشاركة الفيديو على Pinterest / TikTok / YouTube"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black">تصدير 🚀</span>
                </button>
              </div>

              {/* Information & Product Link CTA */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {video.productTitle}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 font-['Tajawal'] mt-1">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <span className="font-mono">{video.views} مشاهدة</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImportVideoModal(video.productId, 'upload', true);
                        }}
                        className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        title="استبدال هذا الفيديو بفيديو من جهازك"
                      >
                        <RefreshCw className="w-3 h-3" />
                        استبدال من جهازي
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportVideo(video)}
                        className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" />
                        تصدير
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Purchase Action */}
                {linkedProd && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px]">سعر الشراء المباشر:</span>
                      <strong className="text-purple-600 dark:text-purple-400 text-sm font-black font-['Tajawal']">
                        {formatPrice(linkedProd.discountPrice)}
                      </strong>
                    </div>

                    <button
                      onClick={() => {
                        logAffiliateClick(linkedProd.id, 'amazon');
                        const url = getAffiliateUrl(linkedProd, 'amazon');
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      شراء من أمازون
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Modal */}
      {selectedExportVideo && (
        <SocialVideoExportModal 
          video={selectedExportVideo} 
          onClose={() => setSelectedExportVideo(null)} 
        />
      )}

    </div>
  );
};

