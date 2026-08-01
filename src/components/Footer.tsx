import React from 'react';
import { Youtube, Video, Sparkles, Heart, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';

export const Footer: React.FC = () => {
  const { setPage, setSelectedCategory, language, t } = useApp();
  const [emailInput, setEmailInput] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info & Story */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Yousra Smile" className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500/40" />
              <div>
                <span className="text-xl font-extrabold text-white font-['Tajawal'] tracking-wide">
                  {t.siteTitle}
                </span>
                <p className="text-xs text-slate-400">{t.footerBrandBio}</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {t.footerBrandDescription}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-300 hover:text-red-500 border border-slate-800 flex items-center justify-center transition-all"
                title="YouTube Channel"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-pink-600/20 text-slate-300 hover:text-pink-400 border border-slate-800 flex items-center justify-center transition-all"
                title="TikTok Account"
              >
                <Video className="w-5 h-5" />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-slate-800 flex items-center justify-center transition-all"
                title="Pinterest Boards"
              >
                <Sparkles className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Tajawal']">{t.categories}</h3>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => { setSelectedCategory(cat.id); setPage('products'); }}
                    className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-slate-400"
                  >
                    <ArrowLeft className="w-3 h-3 text-purple-500 rtl:rotate-0 ltr:rotate-180" />
                    {language === 'en' ? cat.nameEn : cat.nameAr}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Static Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Tajawal']">{t.importantLinks}</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => setPage('about', 'about')} className="hover:text-amber-400 transition-colors">
                  {t.aboutUs}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('videos')} className="hover:text-amber-400 transition-colors">
                  {t.videoReviews}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('deals')} className="hover:text-amber-400 transition-colors">
                  {t.deals}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('contact', 'contact')} className="hover:text-amber-400 transition-colors">
                  {t.contactUs}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('disclosure', 'disclosure')} className="hover:text-amber-400 text-amber-300 transition-colors font-semibold">
                  {t.commissionDisclosure}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('privacy', 'privacy')} className="hover:text-amber-400 transition-colors">
                  {t.privacyPolicy}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('terms', 'terms')} className="hover:text-amber-400 transition-colors">
                  {t.termsOfUse}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('cookies', 'cookies')} className="hover:text-amber-400 transition-colors">
                  {t.cookiePolicy}
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Tajawal']">{t.newsletterTitle}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.newsletterDesc}
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input 
                  type="email"
                  required
                  placeholder={t.newsletterPlaceholder}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button 
                  type="submit"
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 p-1.5 rounded-lg transition-colors font-bold"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
              {subscribed && (
                <p className="text-[11px] text-emerald-400 font-semibold animate-bounce">
                  {t.newsletterSuccess}
                </p>
              )}
            </form>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{t.privacyGuaranteed}</span>
            </div>
          </div>

        </div>

        {/* Affiliate Disclosure Footer Banner */}
        <div className="py-6 border-b border-slate-800/80 text-xs text-slate-400 leading-relaxed text-center sm:text-right">
          <p className="max-w-4xl">
            <strong className="text-amber-400">{t.affiliateDisclosureHeader}:</strong> {t.affiliateDisclosureFull}
          </p>
        </div>

        {/* Copyright Notice */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Yousra Smile. {t.allRightsReserved}.</p>
          <p className="flex items-center gap-1">
            {t.craftedWith} <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Yousra Smile Reviews
          </p>
        </div>
      </div>
    </footer>
  );
};
