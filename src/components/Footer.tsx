import React from 'react';
import {
  Youtube,
  Video,
  Sparkles,
  Instagram,
  Twitter,
  Heart,
  ShieldCheck,
  Mail,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';
import { subscribeToNewsletter } from '../lib/emailApi';

export const Footer: React.FC = () => {
  const { categories, setPage, setSelectedCategory, language, t, siteSettings } = useApp();
  const [emailInput, setEmailInput] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const [subscribing, setSubscribing] = React.useState(false);
  const [subscribeError, setSubscribeError] = React.useState<string | null>(null);

  const contactEmail =
    !siteSettings.contactEmail || siteSettings.contactEmail === 'contact@yousrasmile.com'
      ? 'info@yousrasmile.com'
      : siteSettings.contactEmail;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setSubscribing(true);
    setSubscribeError(null);
    setSubscribed(false);
    try {
      await subscribeToNewsletter(emailInput.trim());
      setSubscribed(true);
      setEmailInput('');
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : 'تعذر تسجيل الاشتراك الآن.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors pt-12 sm:pt-16 pb-10 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-slate-800">
          {/* Brand Info & Story */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={siteSettings.siteLogo || logoImg}
                alt="Yousra Smile"
                className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xl font-extrabold text-white font-['Tajawal'] tracking-wide">
                  {siteSettings.siteName || t.siteTitle}
                </span>
                <p className="text-xs text-slate-300">{t.footerBrandBio}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-7">
              {t.footerBrandDescription}
            </p>

            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-400/20 hover:text-white transition-colors"
              aria-label={`Email ${contactEmail}`}
            >
              <Mail className="w-4 h-4 text-amber-300" />
              <span dir="ltr">{contactEmail}</span>
            </a>

            <div className="flex flex-wrap items-center gap-3 pt-2" aria-label="Social media links">
              <a
                href={siteSettings.youtubeUrl || 'https://youtube.com'}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-200 hover:text-red-400 border border-slate-700 flex items-center justify-center transition-all"
                title="YouTube Channel"
                aria-label="YouTube Channel"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href={siteSettings.tiktokUrl || 'https://tiktok.com'}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-pink-600/20 text-slate-200 hover:text-pink-300 border border-slate-700 flex items-center justify-center transition-all"
                title="TikTok Account"
                aria-label="TikTok Account"
              >
                <Video className="w-5 h-5" />
              </a>
              <a
                href={siteSettings.pinterestUrl || 'https://pinterest.com'}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-200 hover:text-red-300 border border-slate-700 flex items-center justify-center transition-all"
                title="Pinterest Boards"
                aria-label="Pinterest Boards"
              >
                <Sparkles className="w-5 h-5" />
              </a>
              {siteSettings.instagramUrl && (
                <a
                  href={siteSettings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-fuchsia-600/20 text-slate-200 hover:text-fuchsia-300 border border-slate-700 flex items-center justify-center transition-all"
                  title="Instagram Page"
                  aria-label="Instagram Page"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {siteSettings.xUrl && (
                <a
                  href={siteSettings.xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-sky-600/20 text-slate-200 hover:text-sky-300 border border-slate-700 flex items-center justify-center transition-all"
                  title="X / Twitter Account"
                  aria-label="X / Twitter Account"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Tajawal']">{t.categories}</h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setPage('products');
                    }}
                    className="min-h-10 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-slate-300 text-start"
                  >
                    <ArrowLeft className="w-3 h-3 text-purple-400 rtl:rotate-0 ltr:rotate-180" />
                    {language === 'en' ? cat.nameEn : cat.nameAr}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Static Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Tajawal']">{t.importantLinks}</h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <button onClick={() => setPage('about', 'about')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.aboutUs}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('admin')}
                  className="min-h-10 hover:text-amber-200 text-purple-300 font-bold transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-purple-950/60 border border-purple-700/70 w-fit"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'ar' ? 'إدارة المنتجات والاستيراد' : 'Product & Catalog Admin'}</span>
                </button>
              </li>
              <li>
                <button onClick={() => setPage('videos')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.videoReviews}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('deals')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.deals}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('contact', 'contact')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.contactUs}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('disclosure', 'disclosure')} className="min-h-10 hover:text-amber-300 text-amber-200 transition-colors font-semibold">
                  {t.commissionDisclosure}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('privacy', 'privacy')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.privacyPolicy}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('terms', 'terms')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.termsOfUse}
                </button>
              </li>
              <li>
                <button onClick={() => setPage('cookies', 'cookies')} className="min-h-10 hover:text-amber-300 transition-colors">
                  {t.cookiePolicy}
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Tajawal']">{t.newsletterTitle}</h3>
            <p className="text-xs text-slate-300 leading-6">
              {t.newsletterDesc}
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  maxLength={320}
                  placeholder={t.newsletterPlaceholder}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full min-h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-lg transition-colors font-bold flex items-center justify-center disabled:cursor-wait disabled:opacity-60"
                  aria-label={language === 'ar' ? 'اشتراك' : 'Subscribe'}
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
              {subscribed && (
                <p className="text-xs text-emerald-300 font-semibold">
                  {t.newsletterSuccess}
                </p>
              )}
              {subscribeError && (
                <p className="text-xs text-red-300 font-semibold">
                  {subscribeError}
                </p>
              )}
            </form>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 leading-5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.privacyGuaranteed}</span>
            </div>
          </div>
        </div>

        {/* Affiliate Disclosure Footer Banner */}
        <div className="py-6 border-b border-slate-800/80 text-sm text-slate-300 leading-7 text-center sm:text-right">
          <p className="max-w-4xl">
            <strong className="text-amber-300">{t.affiliateDisclosureHeader}:</strong> {t.affiliateDisclosureFull}
          </p>
        </div>

        {/* Copyright Notice */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 text-center sm:text-start">
          <p>© {new Date().getFullYear()} {siteSettings.siteName || 'Yousra Smile'}. {t.allRightsReserved}.</p>
          <p className="flex items-center gap-1">
            {t.craftedWith} <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> {siteSettings.siteName || 'Yousra Smile'} Reviews
          </p>
        </div>
      </div>
    </footer>
  );
};
