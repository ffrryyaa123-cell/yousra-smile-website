import fs from 'node:fs';

const read = url => fs.readFileSync(url, 'utf8').replace(/\r\n/g, '\n');
const write = (url, value) => fs.writeFileSync(url, value, 'utf8');

// The live Supabase catalog is the source of truth. Historical seed products
// must never be re-added, merged back into deleted products, or used to repair
// current product data.
const appFile = new URL('../src/context/AppContext.tsx', import.meta.url);
let app = read(appFile);

// Remove any legacy-field recovery block injected by an earlier build patch.
const legacyStart = app.indexOf('    // CATALOG_RECOVERY_SAFE_MERGE:');
if (legacyStart >= 0) {
  const nextMarker = app.indexOf('    const englishTitle =', legacyStart);
  if (nextMarker < 0) throw new Error('[current-catalog] Could not remove legacy recovery block safely.');
  app = app.slice(0, legacyStart) + app.slice(nextMarker);
}

// If a browser already has a saved catalog, use exactly that saved catalog
// until Supabase returns the current live rows. Do not append INITIAL_PRODUCTS.
const oldSavedMerge = `          // Always merge newly published catalog products without removing products
          // the administrator has already saved in this browser.
          const activeSaved = parsed.filter((p: Product) => !deletedIds.has(p.id));
          const existingIds = new Set(activeSaved.map((p: Product) => p.id));
          const newDefaults = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id) && !deletedIds.has(p.id));
          return [...activeSaved.map(normalizeProduct), ...newDefaults.map(normalizeProduct)];`;
const newSavedMerge = `          // CURRENT_CATALOG_AUTHORITY: never resurrect deleted historical seed products.
          const activeSaved = parsed.filter((p: Product) => !deletedIds.has(p.id));
          return activeSaved.map(normalizeProduct);`;
if (app.includes(oldSavedMerge)) app = app.replace(oldSavedMerge, newSavedMerge);

// On a first/clean browser load, wait for the live Supabase catalog instead of
// showing historical seed products that the owner has already removed.
const oldFallback = `    const deletedIdsRaw = localStorage.getItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
    const deletedIds = new Set<string>(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
    return INITIAL_PRODUCTS.filter(p => !deletedIds.has(p.id)).map(normalizeProduct);`;
if (app.includes(oldFallback)) app = app.replace(oldFallback, `    // CURRENT_CATALOG_AUTHORITY: Supabase will populate the current catalog.\n    return [];`);

// Also neutralize equivalent fallback formatting left by older patches.
app = app.replace(/return\s+INITIAL_PRODUCTS\.filter\([\s\S]*?\)\.map\(normalizeProduct\);/g,
  `// CURRENT_CATALOG_AUTHORITY: never restore historical seed products.\n    return [];`);

// Reset means "reload the current live catalog", never "restore old seeds".
app = app.replace(/setProducts\(INITIAL_PRODUCTS\);/g,
  `// CURRENT_CATALOG_AUTHORITY: do not restore historical seeds.`);

const oldReset = `  const resetCatalog = () => {
    const confirmMsg = language === 'ar' 
      ? 'هل أنت تأكيد من إعادة ضبط قائمة المنتجات إلى الوضع الافتراضي الأصلي؟'
      : 'Are you sure you want to reset product catalog to original defaults?';
    if (window.confirm(confirmMsg)) {
      // CURRENT_CATALOG_AUTHORITY: do not restore historical seeds.
      localStorage.removeItem(LOCAL_STORAGE_PRODUCTS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
    }
  };`;
const newReset = `  const resetCatalog = () => {
    const confirmMsg = language === 'ar'
      ? 'إعادة تحميل قائمة المنتجات الحالية المحفوظة في قاعدة البيانات؟ لن تتم استعادة أي منتجات قديمة.'
      : 'Reload the current saved catalog from the database? No historical products will be restored.';
    if (window.confirm(confirmMsg)) {
      localStorage.removeItem(LOCAL_STORAGE_PRODUCTS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_DELETED_PRODUCTS_KEY);
      window.location.reload();
    }
  };`;
if (app.includes(oldReset)) app = app.replace(oldReset, newReset);

// Some older patch scripts remove this import before this final authority patch
// runs. If any compile-only legacy references remain, restore the import; all
// actual restore/merge paths above are neutralized and cannot resurrect seeds.
if (app.includes('INITIAL_PRODUCTS') && !app.includes("import { INITIAL_PRODUCTS } from '../data/initialProducts';")) {
  app = app.replace(
    "import { Product, PageView, VideoReview, PriceAlert, CartItem, SiteSettings, BlogPost } from '../types';",
    "import { Product, PageView, VideoReview, PriceAlert, CartItem, SiteSettings, BlogPost } from '../types';\nimport { INITIAL_PRODUCTS } from '../data/initialProducts';"
  );
}
write(appFile, app);

// The SEO build must also use current Supabase rows only. An older patch used
// initialProducts.ts to repair placeholder titles, which could revive data the
// owner intentionally deleted or replaced. Strip that recovery if present;
// the existing seoProducts validation will simply omit incomplete current rows.
const seoFile = new URL('./generate-static-seo.mjs', import.meta.url);
let seo = read(seoFile);
const canonicalStart = seo.indexOf('const canonicalLegacyProducts = (() => {');
if (canonicalStart >= 0) {
  const productsStart = seo.indexOf('const products = (rows || [])', canonicalStart);
  const productsEndMarker = '  .filter(product => product && product.id && product.isActive !== false && !product.isHidden);';
  const productsEndStart = seo.indexOf(productsEndMarker, productsStart);
  if (productsStart < 0 || productsEndStart < 0) throw new Error('[current-catalog] Could not remove SEO legacy recovery safely.');
  const productsEnd = productsEndStart + productsEndMarker.length;
  const currentOnlyProducts = `const products = (rows || [])
  .map(row => ({ ...(row.data || {}), id: row.id, _updatedAt: row.updated_at || nowIso }))
  .filter(product => product && product.id && product.isActive !== false && !product.isHidden);`;
  seo = seo.slice(0, canonicalStart) + currentOnlyProducts + seo.slice(productsEnd);
}
write(seoFile, seo);

console.log('[current-catalog] Current Supabase products are authoritative; historical seed recovery disabled.');
