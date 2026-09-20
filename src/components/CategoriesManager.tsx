import React, { useState } from 'react';
import { FolderTree, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ManagedCategory, useManagedCategories } from '../services/categoryManager';
import { deleteMediaLibraryImage, uploadMediaLibraryImage } from '../services/mediaLibrary';

const slugify = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

export const CategoriesManager: React.FC = () => {
  const { products } = useApp();
  const { categories, saveCategories, isSaving } = useManagedCategories();
  const [draft, setDraft] = useState({ nameAr: '', nameEn: '', image: '', subcategories: '', subcategoriesEn: '' });
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const confirmedSave = async (next: ManagedCategory[]) => {
    await saveCategories(next);
    setMessage('تم الحفظ والتحقق من ظهوره على الموقع');
  };

  const addCategory = async () => {
    const id = slugify(draft.nameEn);
    if (!draft.nameAr.trim() || !draft.nameEn.trim() || !id) { setMessage('اكتبي اسم القسم بالعربي والإنجليزي.'); return; }
    if (categories.some(item => item.id === id || item.nameAr.trim() === draft.nameAr.trim() || item.nameEn.toLowerCase() === draft.nameEn.trim().toLowerCase())) { setMessage('هذا القسم موجود مسبقًا بالاسم أو المعرّف نفسه.'); return; }
    const category: ManagedCategory = { id, nameAr: draft.nameAr.trim(), nameEn: draft.nameEn.trim(), icon: 'Package', description: '', image: draft.image.trim(), subcategories: draft.subcategories.split(',').map(value => value.trim()).filter(Boolean), subcategoriesEn: draft.subcategoriesEn.split(',').map(value => value.trim()).filter(Boolean) } as ManagedCategory;
    setBusyId('new'); setMessage('');
    try { await confirmedSave([...categories, category]); setDraft({ nameAr: '', nameEn: '', image: '', subcategories: '', subcategoriesEn: '' }); }
    catch (error: any) { setMessage(error?.message || 'تعذر حفظ القسم. لم تتغير القائمة.'); }
    finally { setBusyId(null); }
  };

  const updateCategory = async (id: string, patch: Partial<ManagedCategory>) => {
    setBusyId(id); setMessage('');
    try { await confirmedSave(categories.map(item => item.id === id ? { ...item, ...patch } : item)); }
    catch (error: any) { setMessage(error?.message || 'تعذر حفظ تعديل القسم.'); }
    finally { setBusyId(null); }
  };

  const replaceImage = async (category: ManagedCategory, file?: File) => {
    if (!file) return;
    setBusyId(category.id); setMessage('');
    let uploaded: { url: string; storagePath: string } | null = null;
    try { uploaded = await uploadMediaLibraryImage(file); await confirmedSave(categories.map(item => item.id === category.id ? { ...item, image: uploaded!.url, imageStoragePath: uploaded!.storagePath } : item)); await deleteMediaLibraryImage(category.imageStoragePath).catch(() => undefined); }
    catch (error: any) { if (uploaded) await deleteMediaLibraryImage(uploaded.storagePath).catch(() => undefined); setMessage(error?.message || 'تعذر استبدال صورة القسم. بقيت الصورة السابقة.'); }
    finally { setBusyId(null); }
  };

  const removeCategory = async (category: ManagedCategory) => {
    const count = products.filter(product => product.category === category.id).length;
    if (count) { setMessage(`لا يمكن حذف القسم لأنه مرتبط بـ ${count} منتج. انقلي المنتجات أولًا إلى قسم بديل.`); return; }
    if (!window.confirm(`حذف قسم ${category.nameAr}؟`)) return;
    setBusyId(category.id); setMessage('');
    try { await confirmedSave(categories.filter(item => item.id !== category.id)); await deleteMediaLibraryImage(category.imageStoragePath).catch(() => undefined); }
    catch (error: any) { setMessage(error?.message || 'تعذر حذف القسم.'); }
    finally { setBusyId(null); }
  };

  return <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-5 text-white" dir="rtl">
    <div><h3 className="text-lg font-black flex items-center gap-2"><FolderTree className="w-5 h-5 text-emerald-400" />إدارة الأقسام المشتركة</h3><p className="text-xs text-slate-300">أي قسم محفوظ هنا يظهر في الرئيسية والقائمة والفلاتر ونموذج المنتجات.</p></div>
    {message && <p className={`rounded-xl border p-3 text-sm font-bold ${message.startsWith('تم ') ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' : 'border-amber-500/40 bg-amber-950/30 text-amber-100'}`}>{message}</p>}
    <section className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl bg-slate-950 p-4 border border-slate-700">
      <input value={draft.nameAr} onChange={e => setDraft({ ...draft, nameAr: e.target.value })} placeholder="اسم القسم بالعربي" className="rounded-xl bg-slate-900 border border-slate-700 p-2.5" />
      <input dir="ltr" value={draft.nameEn} onChange={e => setDraft({ ...draft, nameEn: e.target.value })} placeholder="Category name in English" className="rounded-xl bg-slate-900 border border-slate-700 p-2.5" />
      <input value={draft.subcategories} onChange={e => setDraft({ ...draft, subcategories: e.target.value })} placeholder="الأقسام الفرعية بالعربي، مفصولة بفاصلة" className="rounded-xl bg-slate-900 border border-slate-700 p-2.5" />
      <input dir="ltr" value={draft.subcategoriesEn} onChange={e => setDraft({ ...draft, subcategoriesEn: e.target.value })} placeholder="English subcategories, comma separated" className="rounded-xl bg-slate-900 border border-slate-700 p-2.5" />
      <input dir="ltr" value={draft.image} onChange={e => setDraft({ ...draft, image: e.target.value })} placeholder="رابط صورة القسم (اختياري)" className="rounded-xl bg-slate-900 border border-slate-700 p-2.5 md:col-span-2" />
      <button type="button" disabled={isSaving || Boolean(busyId)} onClick={() => void addCategory()} className="md:col-span-2 rounded-xl bg-emerald-600 p-3 font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" />إضافة القسم وحفظه في Supabase</button>
    </section>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{categories.map(category => <article key={category.id} className="rounded-2xl bg-slate-950 border border-slate-700 p-4 space-y-3">
      {category.image && <img src={category.image} alt={category.nameAr} className="w-full h-32 object-cover rounded-xl" />}
      <div className="grid grid-cols-2 gap-2"><input defaultValue={category.nameAr} onBlur={e => void updateCategory(category.id, { nameAr: e.currentTarget.value.trim() || category.nameAr })} className="rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-bold" /><input dir="ltr" defaultValue={category.nameEn} onBlur={e => void updateCategory(category.id, { nameEn: e.currentTarget.value.trim() || category.nameEn })} className="rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-bold" /></div>
      <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{category.id}</p>
      <div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-sky-950 border border-sky-800 p-2 text-xs font-bold text-sky-300 flex items-center justify-center gap-1 cursor-pointer"><Upload className="w-3.5 h-3.5" />تغيير الصورة<input type="file" accept="image/*" className="hidden" disabled={isSaving || Boolean(busyId)} onChange={e => { const file = e.target.files?.[0]; void replaceImage(category, file); e.currentTarget.value = ''; }} /></label><button type="button" disabled={isSaving || Boolean(busyId)} onClick={() => void removeCategory(category)} className="rounded-xl bg-red-950 border border-red-800 p-2 text-xs font-bold text-red-300 flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" />حذف</button></div>
    </article>)}</div>
  </div>;
};
