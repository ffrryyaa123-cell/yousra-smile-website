import fs from 'node:fs';

const read = (url) => fs.readFileSync(url, 'utf8');
const write = (url, value) => fs.writeFileSync(url, value, 'utf8');

const publicFiles = [
  '../src/pages/HomePage.tsx',
  '../src/components/Header.tsx',
  '../src/components/Footer.tsx',
  '../src/pages/ProductsPage.tsx',
  '../src/components/ProductFilters.tsx',
  '../src/components/HeroBanner.tsx',
];

for (const relative of publicFiles) {
  const file = new URL(relative, import.meta.url);
  let src = read(file);
  src = src.replace(/import \{ CATEGORIES \} from '\.\.\/data\/categories';\r?\n/g, '');
  if (!src.includes("from '../services/categoryManager'")) {
    const importEnd = src.indexOf('\n', src.indexOf("from '../context/AppContext'"));
    if (importEnd < 0) throw new Error(`[patch-editable-categories] AppContext import not found in ${relative}`);
    src = src.slice(0, importEnd + 1) + "import { useManagedCategories } from '../services/categoryManager';\n" + src.slice(importEnd + 1);
  }
  src = src.replace(/\bCATEGORIES\b/g, 'categories');
  if (!src.includes('const { categories } = useManagedCategories();')) {
    const match = src.match(/export const [A-Za-z0-9_]+(?::[^=]+)?\s*=\s*\([^)]*\)\s*=>\s*\{/);
    if (!match || match.index == null) throw new Error(`[patch-editable-categories] component start not found in ${relative}`);
    const pos = match.index + match[0].length;
    src = src.slice(0, pos) + "\n  const { categories } = useManagedCategories();" + src.slice(pos);
  }
  write(file, src);
}

const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = read(adminFile);
admin = admin.replace(/import \{ CATEGORIES \} from '\.\.\/data\/categories';\r?\n/g, '');
if (!admin.includes("from '../services/categoryManager'")) {
  const marker = "import { MediaLibraryItem, uploadMediaLibraryImage, deleteMediaLibraryImage } from '../services/mediaLibrary';";
  if (!admin.includes(marker)) throw new Error('[patch-editable-categories] media library import marker missing');
  admin = admin.replace(marker, `${marker}\nimport { useManagedCategories, ManagedCategory } from '../services/categoryManager';`);
}
admin = admin.replace(/\bCATEGORIES\b/g, 'categories');

if (!admin.includes('const { categories, saveCategories, isSaving: categoriesSaving } = useManagedCategories();')) {
  const marker = 'export const AdminPage: React.FC = () => {';
  if (!admin.includes(marker)) throw new Error('[patch-editable-categories] AdminPage start missing');
  admin = admin.replace(marker, `${marker}\n  const { categories, saveCategories, isSaving: categoriesSaving } = useManagedCategories();`);
}

if (!admin.includes('handleAddManagedCategory')) {
  const marker = '  // Brands State - Dynamically collect all brands from catalog + defaults';
  if (!admin.includes(marker)) throw new Error('[patch-editable-categories] brands state marker missing');
  const helpers = `  const saveCategoryList = async (next: ManagedCategory[]) => {\n    try { await saveCategories(next); }\n    catch (error: any) { window.alert(error?.message || 'تعذر حفظ الأقسام.'); }\n  };\n\n  const handleAddManagedCategory = async () => {\n    const id = \`category-\${Date.now()}\`;\n    const next: ManagedCategory = {\n      id,\n      nameAr: 'قسم جديد',\n      nameEn: 'New Category',\n      icon: '📦',\n      description: '',\n      subcategories: [],\n      image: ''\n    };\n    await saveCategoryList([...categories, next]);\n  };\n\n  const handleUpdateManagedCategory = async (id: string, patch: Partial<ManagedCategory>) => {\n    await saveCategoryList(categories.map(category => category.id === id ? { ...category, ...patch } : category));\n  };\n\n  const handleDeleteManagedCategory = async (category: ManagedCategory) => {\n    const assigned = products.filter(product => String(product.category) === category.id).length;\n    if (assigned > 0) {\n      window.alert(\`لا يمكن حذف القسم حالياً لأنه مرتبط بـ \${assigned} منتج. انقلي المنتجات لقسم آخر أولاً.\`);\n      return;\n    }\n    if (!window.confirm(\`حذف قسم «\${category.nameAr}»؟\`)) return;\n    if (categories.length <= 1) { window.alert('يجب أن يبقى قسم واحد على الأقل.'); return; }\n    try { await deleteMediaLibraryImage(category.imageStoragePath); } catch { /* category deletion remains valid */ }\n    await saveCategoryList(categories.filter(item => item.id !== category.id));\n  };\n\n  const handleReplaceCategoryImage = async (category: ManagedCategory, file?: File | null) => {\n    if (!file) return;\n    try {\n      const stored = await uploadMediaLibraryImage(file);\n      await handleUpdateManagedCategory(category.id, { image: stored.url, imageStoragePath: stored.storagePath });\n      try { await deleteMediaLibraryImage(category.imageStoragePath); } catch { /* new image already saved */ }\n    } catch (error: any) {\n      window.alert(error?.message || 'تعذر تحديث صورة القسم.');\n    }\n  };\n\n  const moveManagedCategory = async (id: string, direction: -1 | 1) => {\n    const index = categories.findIndex(category => category.id === id);\n    const target = index + direction;\n    if (index < 0 || target < 0 || target >= categories.length) return;\n    const next = [...categories];\n    [next[index], next[target]] = [next[target], next[index]];\n    await saveCategoryList(next);\n  };\n\n`;
  admin = admin.replace(marker, helpers + marker);
}

if (!admin.includes('إدارة الأقسام الظاهرة في الموقع')) {
  const marker = '          <div className="space-y-4">\n            <h4 className="text-xs font-bold text-slate-200">قائمة العلامات التجارية المسجلة حالياً:</h4>';
  if (!admin.includes(marker)) throw new Error('[patch-editable-categories] brands list marker missing');
  const editor = `          <div className="space-y-4 border-b border-slate-800 pb-6">\n            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">\n              <div>\n                <h4 className="text-sm font-black text-white">إدارة الأقسام الظاهرة في الموقع</h4>\n                <p className="text-xs text-slate-300 mt-1">عدّلي الاسم والصورة والترتيب، أضيفي قسماً جديداً أو احذفي قسماً غير مستخدم. التغيير ينعكس على الرئيسية والقوائم والفلاتر.</p>\n              </div>\n              <button type="button" onClick={() => void handleAddManagedCategory()} disabled={categoriesSaving} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs disabled:opacity-60">\n                <Plus className="w-4 h-4 inline-block ml-1" /> إضافة قسم\n              </button>\n            </div>\n\n            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">\n              {categories.map((category, index) => {\n                const assigned = products.filter(product => String(product.category) === category.id).length;\n                return (\n                  <div key={category.id} className="rounded-2xl border border-slate-700 bg-slate-950 p-3 space-y-3">\n                    <div className="relative h-32 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">\n                      {category.image ? <img src={category.image} alt={category.nameAr} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">لا توجد صورة</div>}\n                      <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-amber-300">{assigned} منتج</span>\n                    </div>\n                    <div className="grid grid-cols-2 gap-2">\n                      <input defaultValue={category.nameAr} onBlur={(event) => { if (event.target.value.trim() !== category.nameAr) void handleUpdateManagedCategory(category.id, { nameAr: event.target.value.trim() || category.nameAr }); }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" aria-label="اسم القسم بالعربية" />\n                      <input defaultValue={category.nameEn} onBlur={(event) => { if (event.target.value.trim() !== category.nameEn) void handleUpdateManagedCategory(category.id, { nameEn: event.target.value.trim() || category.nameEn }); }} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" aria-label="اسم القسم بالإنجليزية" />\n                    </div>\n                    <input defaultValue={category.description} onBlur={(event) => { if (event.target.value !== category.description) void handleUpdateManagedCategory(category.id, { description: event.target.value }); }} placeholder="وصف مختصر للقسم" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" />\n                    <div className="grid grid-cols-2 gap-2">\n                      <label className="py-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-300 text-[11px] font-bold text-center cursor-pointer">\n                        تغيير صورة القسم\n                        <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; void handleReplaceCategoryImage(category, file); event.currentTarget.value=''; }} />\n                      </label>\n                      <button type="button" onClick={() => void handleDeleteManagedCategory(category)} className="py-2 rounded-lg bg-red-950 border border-red-800 text-red-300 text-[11px] font-bold">حذف القسم</button>\n                    </div>\n                    <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">\n                      <span className="text-[10px] text-slate-400">ترتيب العرض: {index + 1}</span>\n                      <div className="flex gap-1">\n                        <button type="button" disabled={index === 0 || categoriesSaving} onClick={() => void moveManagedCategory(category.id, -1)} className="px-2 py-1 rounded bg-slate-800 text-white text-[11px] disabled:opacity-30">يمين/أعلى</button>\n                        <button type="button" disabled={index === categories.length - 1 || categoriesSaving} onClick={() => void moveManagedCategory(category.id, 1)} className="px-2 py-1 rounded bg-slate-800 text-white text-[11px] disabled:opacity-30">يسار/أسفل</button>\n                      </div>\n                    </div>\n                  </div>\n                );\n              })}\n            </div>\n          </div>\n\n`;
  admin = admin.replace(marker, editor + marker);
}

write(adminFile, admin);
console.log('[patch-editable-categories] Editable persistent categories wired across storefront and admin.');
