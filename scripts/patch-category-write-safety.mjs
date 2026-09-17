import fs from 'node:fs';

const file = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const oldHook = 'const { categories, saveCategories, isSaving: categoriesSaving } = useManagedCategories();';
const newHook = 'const { categories, saveCategories, addCategory, updateCategory, isSaving: categoriesSaving } = useManagedCategories();';

// The editable-categories patch can run again during `build` after `lint`.
// If it re-adds the legacy hook beside the protected hook, remove the duplicate
// before continuing. This keeps the patch chain idempotent across repeated runs.
if (source.includes(newHook) && source.includes(oldHook)) {
  source = source.replace(`  ${oldHook}\n`, '');
}

const replaceRequired = (needle, replacement, label) => {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) throw new Error(`[patch-category-write-safety] Missing ${label}`);
  source = source.replace(needle, () => replacement);
};

replaceRequired(oldHook, newHook, 'managed categories hook actions');

replaceRequired(
  '    await saveCategoryList([...categories, next]);',
  '    await addCategory(next);',
  'single-row category add',
);

replaceRequired(
  "  const handleUpdateManagedCategory = async (id: string, patch: Partial<ManagedCategory>) => {\n    await saveCategoryList(categories.map(category => category.id === id ? { ...category, ...patch } : category));\n  };",
  "  const handleUpdateManagedCategory = async (id: string, patch: Partial<ManagedCategory>) => {\n    const current = categories.find(category => category.id === id);\n    if (!current) return;\n    await updateCategory({ ...current, ...patch });\n  };",
  'single-row category update',
);

// Existing categories are intentionally protected from deletion in Admin.
const deleteHandler = /  const handleDeleteManagedCategory = async \(category: ManagedCategory\) => \{[\s\S]*?\n  \};\n\n  const handleReplaceCategoryImage/;
if (deleteHandler.test(source)) {
  source = source.replace(deleteHandler, `  const handleDeleteManagedCategory = async (_category: ManagedCategory) => {\n    window.alert('الأقسام الحالية محمية من الحذف. يمكنك إضافة أقسام جديدة أو تعديل بيانات القسم عند الحاجة.');\n  };\n\n  const handleReplaceCategoryImage`);
} else if (!source.includes('الأقسام الحالية محمية من الحذف')) {
  throw new Error('[patch-category-write-safety] Missing category delete handler');
}

const deleteButton = /<button type="button" onClick=\{\(\) => void handleDeleteManagedCategory\(category\)\} className="py-2 rounded-lg bg-red-950 border border-red-800 text-red-300 text-\[11px\] font-bold">حذف القسم<\/button>/;
if (deleteButton.test(source)) {
  source = source.replace(deleteButton, '<button type="button" disabled className="py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-500 text-[11px] font-bold cursor-not-allowed">القسم محمي من الحذف</button>');
} else if (!source.includes('القسم محمي من الحذف')) {
  throw new Error('[patch-category-write-safety] Missing category delete button');
}

fs.writeFileSync(file, source, 'utf8');
console.log('[patch-category-write-safety] Category add/update/reorder writes are scoped, deletion-protected, and repeat-safe.');
