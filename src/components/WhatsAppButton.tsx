import React, { useState } from 'react';
import { MessageCircle, X, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WhatsAppButton: React.FC = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  // WhatsApp phone number
  const whatsappNumber = '966500000000'; // Replace or customize as needed

  const defaultMsgAr = 'مرحباً يسرى سمايل 👋، أرغب في استشارة مجانية لاختيار الجهاز الذكي الأفضل لمنزلي وميزانيتي.';
  const defaultMsgEn = 'Hello Yousra Smile 👋, I would like a free recommendation for the best smart home appliance for my needs.';

  const handleSend = () => {
    const textToSend = message.trim() || (language === 'ar' ? defaultMsgAr : defaultMsgEn);
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start font-['Cairo'] dir-rtl">
      {/* Floating Dialog Popup */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
                  <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1">
                  <span>{language === 'ar' ? 'استشارة الأجهزة الذكية' : 'Smart Appliance Consultation'}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {language === 'ar' ? 'متصل الآن — رد سريع عبر الواتساب' : 'Online now — Fast WhatsApp reply'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-3 space-y-2">
            <div className="bg-slate-800/80 rounded-xl p-3 text-xs leading-relaxed text-slate-200 border border-slate-700">
              <p>
                {language === 'ar'
                  ? 'أهلاً بك! محتار بين الموديلات والماركات؟ أرسل لنا ميزانيتك واحتياجاتك ونساعدك باختيار أفضل جهاز بشرائها بأفضل سعر!'
                  : 'Welcome! Confused between models? Send us your requirements and we will guide you to the best choice!'}
              </p>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب استفسارك هنا...' : 'Type your question here...'}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none h-20 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ar' ? 'استشارة مجانية 100%' : '100% Free Guidance'}</span>
            </span>
            <button
              onClick={handleSend}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{language === 'ar' ? 'إرسال عبر الواتساب' : 'Send via WhatsApp'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Circle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-full shadow-2xl border border-emerald-300/30 transition-all duration-300 active:scale-95 cursor-pointer"
        aria-label="WhatsApp Support"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 fill-white/20 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-emerald-700 animate-ping"></span>
        </div>
        <span className="text-xs font-extrabold tracking-wide hidden sm:inline font-['Cairo']">
          {language === 'ar' ? 'استشارة الواتساب المجانية' : 'WhatsApp Consultation'}
        </span>
        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
          💬
        </span>
      </button>
    </div>
  );
};
