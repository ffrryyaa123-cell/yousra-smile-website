import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STATIC_CONTENT, STATIC_CONTENT_EN } from '../data/staticContent';
import { 
  ShieldCheck, 
  Info, 
  Mail, 
  FileText, 
  Cookie, 
  CheckCircle2, 
  Send,
  Youtube,
  Video,
  Sparkles,
  Instagram
} from 'lucide-react';
import logoImg from '../assets/images/yousra_smile_avatar_1785601313942.jpg';
import { submitContactMessage } from '../lib/emailApi';

interface StaticPageProps {
  type: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure';
}

export const StaticPage: React.FC<StaticPageProps> = ({ type }) => {
  const { activeStaticTab, setPage, language } = useApp();
  const currentTab = type || activeStaticTab;
  const content = language === 'en' ? STATIC_CONTENT_EN : STATIC_CONTENT;

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactWebsite, setContactWebsite] = useState('');
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSending(true);
    setFormError(null);
    setFormSent(false);

    try {
      await submitContactMessage({
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage,
        website: contactWebsite,
      });
      setFormSent(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setContactWebsite('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : (language === 'ar' ? 'تعذر إرسال الرسالة الآن.' : 'Unable to send your message right now.'));
    } finally {
      setFormSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Subnav Tabs for Static Pages */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setPage('about', 'about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'about' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'من نحن' : 'About'}
        </button>
        <button
          onClick={() => setPage('contact', 'contact')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'contact' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'اتصل بنا' : 'Contact'}
        </button>
        <button
          onClick={() => setPage('disclosure', 'disclosure')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'disclosure' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'إفصاح الأفلييت' : 'Affiliate Disclosure'}
        </button>
        <button
          onClick={() => setPage('privacy', 'privacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'privacy' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy'}
        </button>
        <button
          onClick={() => setPage('terms', 'terms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'terms' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'شروط الاستخدام' : 'Terms'}
        </button>
        <button
          onClick={() => setPage('cookies', 'cookies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'cookies' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {language === 'ar' ? 'سياسة ملفات الكوكيز' : 'Cookies'}
        </button>
      </div>

      {/* Render Tab Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* ABOUT US */}
        {currentTab === 'about' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <img src={logoImg} alt="Yousra Smile" className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/40" />
              <div>
                <h1 className="text-2xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
                  {content.about.title}
                </h1>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">
                  {content.about.subtitle}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {content.about.bio}
            </p>

            <div className="bg-purple-50 dark:bg-purple-950/40 p-5 rounded-2xl border border-purple-100 dark:border-purple-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {language === 'ar' ? 'رسالتنا وهدفنا الرئيسي:' : 'Our Mission:'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {content.about.mission}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'ما الذي يميّز يسرى سمايل؟' : 'Why Yousra Smile?'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.about.features.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTACT US */}
        {currentTab === 'contact' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h1 className="text-2xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
                {content.contact.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {content.contact.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Form */}
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                {formSent && (
                  <div className="bg-emerald-500 text-white font-bold p-3 rounded-xl text-center">
                    {language === 'ar' ? '✓ تم إرسال رسالتك بنجاح! وسوف نرد عليك في أقرب وقت.' : '✓ Your message was sent successfully. We will reply as soon as possible.'}
                  </div>
                )}
                {formError && (
                  <div className="bg-red-950/70 text-red-200 font-bold p-3 rounded-xl text-center">
                    {formError}
                  </div>
                )}

                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={contactWebsite}
                      onChange={(e) => setContactWebsite(e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الاسم الكامل *' : 'Full name *'}
                  </label>
                  <input 
                    type="text" 
                    required
                    maxLength={120}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني *' : 'Email address *'}
                  </label>
                  <input 
                    type="email" 
                    required
                    maxLength={320}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'موضوع الرسالة *' : 'Subject *'}
                  </label>
                  <input 
                    type="text" 
                    required
                    maxLength={200}
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: استفسار عن منتج، طلب مراجعة، تعاون...' : 'Example: Product question, review request, partnership...'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تفاصيل الرسالة *' : 'Message *'}
                  </label>
                  <textarea 
                    rows={4}
                    required
                    maxLength={5000}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب نص الرسالة هنا...' : 'Type your message here...'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formSending}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {formSending
                    ? (language === 'ar' ? 'جاري إرسال الرسالة...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال الرسالة الآن' : 'Send Message')}
                </button>
              </form>

              {/* Social Channels List */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'قنوات التواصل الاجتماعية الرسمية:' : 'Official Social Channels:'}
                </h3>
                
                <div className="space-y-3 text-xs">
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl hover:border-red-500 border border-transparent transition-all">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold">YouTube Channel</strong>
                      <span className="text-slate-400">@YousraSmileReviews</span>
                    </div>
                  </a>

                  <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl hover:border-pink-500 border border-transparent transition-all">
                    <Video className="w-5 h-5 text-pink-500" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold">TikTok Account</strong>
                      <span className="text-slate-400">@yousrasmile</span>
                    </div>
                  </a>

                  <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl hover:border-red-400 border border-transparent transition-all">
                    <Sparkles className="w-5 h-5 text-red-500" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold">Pinterest Boards</strong>
                      <span className="text-slate-400">YousraSmileHome</span>
                    </div>
                  </a>

                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl hover:border-purple-500 border border-transparent transition-all">
                    <Instagram className="w-5 h-5 text-purple-600" />
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-bold">Instagram Page</strong>
                      <span className="text-slate-400">@yousra.smile.official</span>
                    </div>
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AFFILIATE DISCLOSURE */}
        {currentTab === 'disclosure' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
                  {content.disclosure.title}
                </h1>
                <span className="text-xs text-slate-400">
                  {language === 'ar' ? 'آخر تحديث' : 'Last updated'}: {content.disclosure.updatedAt}
                </span>
              </div>
            </div>

            <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/60 dark:bg-amber-950/30 p-6 rounded-2xl border border-amber-200 dark:border-amber-900">
              {content.disclosure.text}
            </div>
          </div>
        )}

        {/* PRIVACY POLICY */}
        {currentTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h1 className="text-2xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
                {content.privacy.title}
              </h1>
              <span className="text-xs text-slate-400">{language === 'ar' ? 'آخر تحديث' : 'Last updated'}: {content.privacy.updatedAt}</span>
            </div>

            <div className="space-y-4">
              {content.privacy.sections.map((sec, i) => (
                <div key={i} className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sec.heading}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{sec.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TERMS OF USE */}
        {currentTab === 'terms' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h1 className="text-2xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
                {content.terms.title}
              </h1>
              <span className="text-xs text-slate-400">{language === 'ar' ? 'آخر تحديث' : 'Last updated'}: {content.terms.updatedAt}</span>
            </div>

            <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {content.terms.text}
            </div>
          </div>
        )}

        {/* COOKIES POLICY */}
        {currentTab === 'cookies' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Cookie className="w-7 h-7 text-amber-500" />
              <div>
                <h1 className="text-2xl font-black font-['Tajawal'] text-slate-900 dark:text-white">
                  {content.cookies.title}
                </h1>
                <span className="text-xs text-slate-400">{language === 'ar' ? 'آخر تحديث' : 'Last updated'}: {content.cookies.updatedAt}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {content.cookies.text}
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
