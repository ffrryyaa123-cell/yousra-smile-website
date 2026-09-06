import React, { useEffect, useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { supabase } from '../services/adminAccount';

export const RecentPurchaseToast = () => {
  const [connections, setConnections] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    let active = true;
    const channel = supabase.channel('yousra-public-presence-v1');
    channel.on('presence', { event: 'sync' }, () => {
      if (active) setConnections(Object.values(channel.presenceState()).reduce((sum, entries) => sum + entries.length, 0));
    }).subscribe(async status => {
      if (!active) return;
      if (status === 'SUBSCRIBED') {
        // No name, email, URL, or persistent visitor identifier is shared.
        const result = await channel.track({ connected: true });
        if (active && result !== 'ok') setConnections(null);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnections(null);
      }
    });
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  if (closed) return null;
  return (
    <aside dir="rtl" aria-label="إحصاءات الإقبال" className="fixed bottom-5 right-4 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-500/40 bg-slate-900 p-4 text-white shadow-xl">
      <button type="button" aria-label="إغلاق إحصاءات الإقبال" onClick={() => setClosed(true)} className="absolute left-2 top-2 p-1 text-slate-400"><X size={16} /></button>
      <h2 className="flex items-center gap-2 text-sm font-bold text-amber-300"><BarChart3 size={18} /> إحصاءات الإقبال</h2>
      {connections !== null ? <>
        <p className="mt-2 text-sm">صفحات متصلة الآن: {connections}</p>
        <p className="mt-2 text-xs text-slate-400">عدد تبويبات الموقع المتصلة، ويشمل صفحتك. ليس عدد أشخاص فريدين ولا مبيعات أو سجل زيارات سابق.</p>
      </> : <p className="mt-2 text-xs text-slate-300">بانتظار اتصال خدمة قياس الإقبال؛ لا تتوفر أرقام موثوقة للعرض.</p>}
    </aside>
  );
};
