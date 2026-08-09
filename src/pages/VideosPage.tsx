import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlaySquare, Youtube, Video, Sparkles, ExternalLink, ShoppingBag, Share2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoReview } from '../types';
import { VideoImportModal } from '../components/VideoImportModal';
import { SocialVideoExportModal } from '../components/SocialVideoExportModal';

export const VideosPage: React.FC = () => {
  const { videos, products, openVideoModal, openProductDetail, openThumbnailEditor, logAffiliateClick, language, formatPrice, getAffiliateUrl } = useApp();
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'tiktok' | 'pinterest'>('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedExportVideo, setSelectedExportVideo] = useState<VideoReview | null>(null);
  const videosScrollerRef = React.useRef<HTMLDivElement>(null);

  const scrollVideos = (direction: 'left' | 'right') => {
    if (!videosScrollerRef.current) return;
    const isRtl = document.documentElement.dir === 'rtl' || language === 'ar';
    let offset = direction === 'left' ? -360 : 360;
    if (isRtl) offset = -offset;
    videosScrollerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

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
              {language === 'ar' ? 'مركز مراجعات الفيديو الحصرية والاستيراد' : 'Exclusive Video Review Center'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-['Tajawal']">
              {language === 'ar' ? 'شاهد مراجعات يسرى سمايل قبل الشراء 🎥' : 'Watch Yousra Smile Reviews Before You Buy 🎥'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {language === 'ar'
                ? 'جميع فيديوهات التقييم المنشورة على YouTube وTikTok وPinterest في مكان واحد.'
                : 'All published YouTube, TikTok, and Pinterest product reviews in one place.'}
            </p>
          </div>

          {/* Import Video Trigger Button */}
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 hover:opacity-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'ar' ? 'استيراد فيديو برابط جديد 🚀' : 'Import Video Link 🚀'}</span>
          </button>
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
          {language === 'ar' ? 'جميع المنصات' : 'All Platforms'} ({videos.length})
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
          YouTube
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
          TikTok
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
          Pinterest
        </button>
      </div>

      {/* Videos Grid */}
      <div className="relative group/videos-page-carousel">
        <div
          ref={videosScrollerRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {filteredVideos.map(video => {
          const linkedProd = products.find(p => p.id === video.productId);
          return (
            <div
              key={video.id}
              className="group flex w-[86vw] max-w-[430px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-[420px] lg:w-auto lg:max-w-none"
            >
              {/* Thumbnail Container */}
              <div 
                onClick={() => openVideoModal(video)}
                className="relative h-52 bg-slate-950 cursor-pointer overflow-hidden"
              >
                <img 
                  src={video.thumbnailUrl || video.productImage} 
                  alt={language === 'en' ? (video.titleEn || 'Product video review') : video.title}
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
                  title={language === 'ar' ? 'تصدير ومشاركة الفيديو' : 'Export and share video'}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black">{language === 'ar' ? 'تصدير 🚀' : 'Export 🚀'}</span>
                </button>
              </div>

              {/* Information & Product Link CTA */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {linkedProd
                      ? (language === 'en' ? (linkedProd.titleEn || linkedProd.brand) : linkedProd.titleAr)
                      : video.productTitle}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 font-['Tajawal'] mt-1">
                    {language === 'en' ? (video.titleEn || 'Product Video Review') : video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <span>{language === 'en' ? (video.viewsEn || video.views.replace('مشاهدة', 'views')) : video.views}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedExportVideo(video)}
                      className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      {language === 'ar' ? 'تصدير' : 'Export'}
                    </button>
                  </div>
                </div>

                {/* Direct Purchase Action */}
                {linkedProd && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px]">
                        {language === 'ar' ? 'سعر الشراء المباشر:' : 'Direct purchase price:'}
                      </span>
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
                      {language === 'ar' ? 'شراء من أمازون' : 'Buy on Amazon'}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
        {filteredVideos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollVideos('left')}
              className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-purple-500/40 bg-slate-950/90 text-amber-300 shadow-xl lg:hidden"
              aria-label={language === 'ar' ? 'الفيديو السابق' : 'Previous video'}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => scrollVideos('right')}
              className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-purple-500/40 bg-slate-950/90 text-amber-300 shadow-xl lg:hidden"
              aria-label={language === 'ar' ? 'الفيديو التالي' : 'Next video'}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Import Modal */}
      <VideoImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
      />

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
