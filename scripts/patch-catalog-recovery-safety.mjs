import fs from 'node:fs';

const read = (url) => fs.readFileSync(url, 'utf8');
const write = (url, value) => fs.writeFileSync(url, value, 'utf8');

// 1) Repair incomplete legacy products at runtime from their canonical source.
// Existing non-empty live values always win; this only fills holes/placeholders.
const appFile = new URL('../src/context/AppContext.tsx', import.meta.url);
let app = read(appFile);
const normalizeMarker = '  const normalizeProduct = (p: any): Product => {';
if (!app.includes('CATALOG_RECOVERY_SAFE_MERGE')) {
  if (!app.includes(normalizeMarker)) throw new Error('[catalog-recovery] normalizeProduct marker missing');
  const recovery = `\n    // CATALOG_RECOVERY_SAFE_MERGE: restore only missing legacy fields from the original catalog.\n    const canonical = INITIAL_PRODUCTS.find(item => String(item.id) === String(p?.id));\n    if (canonical) {\n      const live = p && typeof p === 'object' ? p : {};\n      const merged: any = { ...canonical, ...live };\n      const textFields = ['titleAr','titleEn','description','descriptionEn','longDescription','longDescriptionEn','brand','category','subcategory','subcategoryEn','image','currency'];\n      for (const key of textFields) {\n        const value = live[key];\n        const missing = value == null || String(value).trim() === '' || (key === 'titleEn' && String(value).trim().toLowerCase() === 'featured product');\n        if (missing && (canonical as any)[key] != null) merged[key] = (canonical as any)[key];\n      }\n      const arrayFields = ['images','features','featuresEn','keywords','tags'];\n      for (const key of arrayFields) {\n        if ((!Array.isArray(live[key]) || live[key].length === 0) && Array.isArray((canonical as any)[key])) merged[key] = (canonical as any)[key];\n      }\n      for (const key of ['specs','specsEn']) {\n        if ((!live[key] || typeof live[key] !== 'object' || Object.keys(live[key]).length === 0) && (canonical as any)[key]) merged[key] = (canonical as any)[key];\n      }\n      for (const key of ['originalPrice','discountPrice']) {\n        if ((!Number.isFinite(Number(live[key])) || Number(live[key]) <= 0) && Number((canonical as any)[key]) > 0) merged[key] = (canonical as any)[key];\n      }\n      // Never replace valid live media, affiliate links, SEO, videos, or newer values.\n      p = merged;\n    }\n`;
  app = app.replace(normalizeMarker, normalizeMarker + recovery);
  write(appFile, app);
}

// 2) Keep canonical IDs when a built-in category is deleted then recreated with the same name.
// This automatically reconnects products such as smart-gadgets without rewriting product records.
const categoryFile = new URL('../src/services/categoryManager.ts', import.meta.url);
let category = read(categoryFile);
if (!category.includes('CANONICAL_CATEGORY_ID_RECOVERY')) {
  const mapMarker = "const defaults: ManagedCategory[] = CATEGORIES.map(category => ({ ...category, id: String(category.id) }));";
  if (!category.includes(mapMarker)) throw new Error('[catalog-recovery] category defaults marker missing');
  category = category.replace(mapMarker, `${mapMarker}\n// CANONICAL_CATEGORY_ID_RECOVERY: preserve product/category relationships after a category is recreated.\nconst canonicalCategoryId = (item: any): string | null => {\n  const ar = String(item?.nameAr || '').trim().toLocaleLowerCase();\n  const en = String(item?.nameEn || '').trim().toLocaleLowerCase();\n  const match = defaults.find(candidate =>\n    (ar && String(candidate.nameAr).trim().toLocaleLowerCase() === ar) ||\n    (en && String(candidate.nameEn).trim().toLocaleLowerCase() === en)\n  );\n  return match ? String(match.id) : null;\n};`);
  category = category.replace("id: String(item.id || `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),", "id: canonicalCategoryId(item) || String(item.id || `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),");
  write(categoryFile, category);
}

// 3) Harden the products filter against any future partial/imported record.
const productsFile = new URL('../src/pages/ProductsPage.tsx', import.meta.url);
let products = read(productsFile);
products = products.replace(/product\.([A-Za-z0-9_]+)\.toLowerCase\(\)/g, "String(product.$1 ?? '').toLowerCase()");
products = products.replace(/\bk\.toLowerCase\(\)/g, "String(k ?? '').toLowerCase()");
write(productsFile, products);

console.log('[catalog-recovery] Legacy field recovery, stable category IDs, and safe filtering applied.');
