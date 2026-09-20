// PUBLIC_LANGUAGE_V4
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users } from 'lucide-react';
import { loadActivityReport } from '../services/siteActivity';

export const PublicVisitorBadge: React.FC = () => {
  const { language } = useApp();
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      void loadActivityReport(30)
        .then(report => { if (active) setVisitors(report.totals.visitors); })
        .catch(() => { if (active) setVisitors(null); });
    };
    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (visitors === null) return null;

  return (
    <div
      dir="rtl"
      aria-label={`عدد زوار الموقع خلال آخر 30 يومًا: ${visitors}`}
      className="fixed bottom-5 right-4 z-30 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-amber-400/40 bg-slate-950/90 px-3 py-2 text-[11px] font-bold text-white shadow-lg backdrop-blur-md sm:text-xs"
      title="رقم فعلي من قياس الموقع خلال آخر 30 يومًا"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950">
        <Users className="h-4 w-4" />
      </span>
      <span>{language === 'ar' ? 'زار الموقع هذا الشهر' : 'Visitors this month'}</span>
      <strong className="text-amber-300">{visitors.toLocaleString(language === 'ar' ? 'ar' : 'en-US')}</strong>
    </div>
  );
};
