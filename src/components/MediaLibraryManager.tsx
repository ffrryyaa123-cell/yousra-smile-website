import React, { useState } from 'react';
import { Copy, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { deleteMediaLibraryImage, MediaLibraryItem, MediaPlacement, uploadMediaLibraryImage, useMediaLibrary } from '../services/mediaLibrary';

const placements: { value: MediaPlacement; label: string }[] = [
  { value: 'none', label: 'غير مرتبطة بمكان' },
  { value: 'siteLogo', label: 'شعار Smart Home في الهيدر والفوتر' },
  { value: 'heroBanner', label: 'بانر Hero الرئيسي' },
  { value: 'smartHomeBanner', label: 'الصورة المائية Smart Home أعلى الرئيسية' },
  { value: 'creatorAvatar', label: 'الأفاتار الرئيسي YS LUXE' },
];

export const MediaLibraryManager: React.FC = () => {
  const { items, save, isSaving } = useMediaLibrary();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const confirmedSave = async (next: MediaLibraryItem[]) => {
    await save(next);
    setMessage('تم الحفظ والتحقق من ظهوره على الموقع');
  };

  const addImage = async (file?: File) => {
    if (!file) return;
    setBusyId('new'); setMessage('');
    let uploaded: { url: string; storagePath: string } | null = null;
    try {
      uploaded = await uploadMediaLibraryImage(file);
      await confirmedSave([{ id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), url: uploaded.url, storagePath: uploaded.storagePath, type: 'other', placement: 'none' }, ...items]);
    } catch (error: any) {
      if (uploaded) await deleteMediaLibraryImage(uploaded.storagePath).catch(() => undefined);
      setMessage(error?.message || 'تعذر رفع الصورة وحفظها. لم يتغير الموقع.');
    } finally { setBusyId(null); }
  };

  const replaceImage = async (item: MediaLibraryItem, file?: File) => {
    if (!file) return;
    setBusyId(item.id); setMessage('');
    let uploaded: { url: string; storagePath: string } | null = null;
    try {
      uploaded = await uploadMediaLibraryImage(file);
      await confirmedSave(items.map(current => current.id === item.id ? { ...current, url: uploaded!.url, storagePath: uploaded!.storagePath } : current));
      await deleteMediaLibraryImage(item.storagePath).catch(() => undefined);
    } catch (error: any) {
      if (uploaded) await deleteMediaLibraryImage(uploaded.storagePath).catch(() => undefined);
      setMessage(error?.message || 'تعذر استبدال الصورة. بقيت الصورة القديمة فعالة.');
    } finally { setBusyId(null); }
  };

  const removeImage = async (item: MediaLibraryItem) => {
    if (!window.confirm('حذف الصورة من المكتبة؟ إذا كانت مرتبطة بمكان سيعود ذلك المكان للصورة الافتراضية الآمنة.')) return;
    setBusyId(item.id); setMessage('');
    try {
      await confirmedSave(items.filter(current => current.id !== item.id));
      await deleteMediaLibraryImage(item.storagePath).catch(() => undefined);
    } catch (error: any) { setMessage(error?.message || 'تعذر حذف الصورة. لم يتغير الموقع.'); }
    finally { setBusyId(null); }
  };

  const setPlacement = async (item: MediaLibraryItem, placement: MediaPlacement) => {
    setBusyId(item.id); setMessage('');
    try {
      const next = items.map(current => ({ ...current, placement: current.id === item.id ? placement : (placement !== 'none' && current.placement === placement ? 'none' : current.placement) }));
      await confirmedSave(next);
    } catch (error: any) { setMessage(error?.message || 'تعذر حفظ مكان الصورة. بقي الربط السابق كما هو.'); }
    finally { setBusyId(null); }
  };

  const rename = async (item: MediaLibraryItem, name: string) => {
    if (!name.trim() || name.trim() === item.name) return;
    setBusyId(item.id); setMessage('');
    try { await confirmedSave(items.map(current => current.id === item.id ? { ...current, name: name.trim() } : current)); }
    catch (error: any) { setMessage(error?.message || 'تعذر حفظ اسم الصورة.'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-6 text-white shadow-md" dir="rtl">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h3 className="text-lg font-black flex items-center gap-2"><ImageIcon className="w-5 h-5 text-sky-400" />مكتبة الوسائط المشتركة</h3><p className="text-xs text-slate-300 mt-1">الحفظ في Supabase ويظهر على جميع الأجهزة بعد التحقق.</p></div>
        <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />{busyId === 'new' ? 'جاري الرفع والتحقق…' : 'رفع صورة جديدة'}
          <input type="file" accept="image/*" className="hidden" disabled={isSaving || Boolean(busyId)} onChange={event => { const file = event.target.files?.[0]; void addImage(file); event.currentTarget.value = ''; }} />
        </label>
      </div>
      {message && <p className={`rounded-xl border p-3 text-sm font-bold ${message.startsWith('تم ') ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' : 'border-red-500/40 bg-red-950/30 text-red-200'}`}>{message}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <article key={item.id} className="p-3 bg-slate-950 border border-slate-700 rounded-2xl space-y-2">
            <img src={item.url} alt={item.name} loading="lazy" decoding="async" className="w-full h-36 object-cover rounded-xl bg-slate-900" />
            <input defaultValue={item.name} onBlur={event => void rename(item, event.currentTarget.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold" />
            <select value={item.placement || 'none'} disabled={Boolean(busyId) || isSaving} onChange={event => void setPlacement(item, event.target.value as MediaPlacement)} className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-2 py-2 text-xs font-bold">
              {placements.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <label className="py-2 rounded-xl bg-sky-950 border border-sky-800 text-sky-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"><Upload className="w-3.5 h-3.5" />استبدال<input type="file" accept="image/*" className="hidden" disabled={Boolean(busyId) || isSaving} onChange={event => { const file = event.target.files?.[0]; void replaceImage(item, file); event.currentTarget.value = ''; }} /></label>
              <button type="button" disabled={Boolean(busyId) || isSaving} onClick={() => void removeImage(item)} className="py-2 rounded-xl bg-red-950 border border-red-800 text-red-300 font-bold text-[11px] flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" />حذف</button>
            </div>
            <button type="button" onClick={() => void navigator.clipboard.writeText(item.url)} className="w-full py-1.5 rounded-xl bg-slate-800 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5" />نسخ الرابط</button>
          </article>
        ))}
      </div>
    </div>
  );
};
