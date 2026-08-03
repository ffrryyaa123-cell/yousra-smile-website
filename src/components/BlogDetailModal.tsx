import React from 'react';
import { BlogPost } from '../types';
import { X, Calendar, Clock, User, Share2, Sparkles, ShoppingBag, ExternalLink, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BlogDetailModalProps {
  post: BlogPost | null;
  onClose: () => void;
}

export const BlogDetailModal: React.FC<BlogDetailModalProps> = ({ post, onClose }) => {
  const { language, products, openProductDetail, formatPrice } = useApp();

  if (!post) return null;

  const relatedProducts = products.filter(p => post.relatedProductIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 dir-rtl font-['Cairo']">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="relative h-48 sm:h-64 overflow-hidden shrink-0">
          <img 
            src={post.image} 
            alt={language === 'ar' ? post.titleAr : post.titleEn} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-900 text-white p-2 rounded-full border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Meta */}
          <div className="absolute bottom-4 right-4 left-4">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full inline-block mb-2">
              {post.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {language === 'ar' ? post.titleAr : post.titleEn}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{post.authorName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{post.readTime}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{post.publishedDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6">
          <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-amber-200 text-sm font-semibold leading-relaxed">
            {language === 'ar' ? post.summaryAr : post.summaryEn}
          </div>

          <div className="prose prose-invert max-w-none text-slate-200 leading-loose text-sm sm:text-base whitespace-pre-line">
            {language === 'ar' ? post.contentAr : post.contentEn}
          </div>

          {/* Recommended Products inside article */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>{language === 'ar' ? 'المنتجات الموصى بها في هذا المقال:' : 'Products Mentioned in This Guide:'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedProducts.map(product => (
                  <div 
                    key={product.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex gap-3 items-center hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => {
                      onClose();
                      openProductDetail(product);
                    }}
                  >
                    <img src={product.image} alt={product.titleAr} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white line-clamp-2">{product.titleAr}</h4>
                      <p className="text-amber-300 font-extrabold text-sm mt-1">{formatPrice(product.discountPrice)}</p>
                      <button className="mt-2 text-[11px] bg-amber-400 text-slate-950 font-extrabold px-3 py-1 rounded-lg flex items-center gap-1">
                        <span>تفاصيل المنتج والشراء</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: post.titleAr, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('تم نسخ رابط المقال!');
              }
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'مشاركة المقال' : 'Share Article'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-2 rounded-xl transition-all cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق المقال' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
