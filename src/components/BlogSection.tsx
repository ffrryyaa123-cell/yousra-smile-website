import React, { useState } from 'react';
import { SAMPLE_BLOG_POSTS } from '../data/blogPosts';
import { BlogPost } from '../types';
import { BookOpen, Clock, ArrowLeft, ArrowRight, User, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BlogDetailModal } from './BlogDetailModal';

export const BlogSection: React.FC = () => {
  const { language } = useApp();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <section className="py-12 px-4 sm:px-6 bg-slate-950/60 border-y border-slate-800/80 dir-rtl font-['Cairo']">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'دليل الشراء والمدونة' : 'Buying Guides & Blog'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {language === 'ar' ? 'مقالات وإرشادات تسوق ذكية' : 'Smart Shopping Articles & Guides'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {language === 'ar'
                ? 'مقارنات حقيقية ونصائح الخبراء لاختيار أفضل الأجهزة والحلول المنزلية بكل ثقة'
                : 'Unbiased comparisons and expert tips for choosing smart home electronics'}
            </p>
          </div>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_BLOG_POSTS.map(post => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={language === 'ar' ? post.titleAr : post.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/30">
                  {language === 'en' ? (post.categoryEn || 'Guide') : post.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{language === 'en' ? (post.readTimeEn || 'Read') : post.readTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>{language === 'en' ? (post.authorNameEn || 'Yousra Smile') : post.authorName}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                    {language === 'ar' ? post.titleAr : post.titleEn}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {language === 'ar' ? post.summaryAr : post.summaryEn}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span>{language === 'ar' ? 'اقرأ الدليل الكامل' : 'Read Full Guide'}</span>
                  {language === 'ar' ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Modal View */}
      <BlogDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </section>
  );
};
