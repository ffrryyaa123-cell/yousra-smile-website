import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(`[system-contract] ${message}`);
};

const context = read('src/context/AppContext.tsx');
const categories = read('src/services/categoryManager.ts');
const app = read('src/App.tsx');
const productCard = read('src/components/ProductCard.tsx');
const videosPage = read('src/pages/VideosPage.tsx');
const socialExportPatch = read('scripts/patch-social-export-language-mode.mjs');
const types = read('src/types.ts');
const categoryMigration = read('supabase/migrations/20260917091500_categories_and_product_reference.sql');

// Data authority contract: Supabase is the live catalog/category source.
assert(context.includes("from '../services/supabaseCatalog'"), 'AppContext must use Supabase catalog service.');
assert(!context.includes("from '../services/catalogDatabase'"), 'Legacy Firebase catalog service must not be reintroduced into AppContext.');
assert(categories.includes(".from('categories')"), 'Categories must persist in the Supabase categories table.');
assert(categories.includes('saveManagedCategories'), 'Managed categories must have a real persistent save path.');
assert(!categories.includes(".from('categories').delete()"), 'Saving a category list must never implicitly delete existing categories.');
assert(categories.includes('ADD/UPDATE only'), 'Non-destructive category-save invariant is missing.');

// Database relationship contract: products may only be assigned to real categories.
assert(categoryMigration.includes('products_category_reference_guard'), 'Product/category database guard migration is missing.');
assert(categoryMigration.includes('validate_product_category_reference'), 'Product/category validation function is missing.');

// Dynamic category contract: adding a category must not require a code release.
assert(types.includes('export type CategoryId = string'), 'CategoryId must remain dynamic, not a hard-coded union.');

// UI mode contract: Arabic/English and Light/Dark choices persist independently.
assert(context.includes('LOCAL_STORAGE_LANG_KEY'), 'Language mode persistence key is missing.');
assert(context.includes('LOCAL_STORAGE_DARK_KEY'), 'Dark/light mode persistence key is missing.');
assert(context.includes('localStorage.setItem(LOCAL_STORAGE_LANG_KEY'), 'Language selection is not persisted.');
assert(context.includes('localStorage.setItem(LOCAL_STORAGE_DARK_KEY'), 'Dark/light selection is not persisted.');
assert(context.includes("document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'"), 'Public document direction must follow language mode.');
assert(context.includes('document.documentElement.lang = language'), 'Public document language attribute must follow language mode.');

// Public-language contract: storefront, review gallery and export follow selected language.
assert(productCard.includes("language === 'en'"), 'Product cards must render from the selected language.');
assert(videosPage.includes("language === 'en'"), 'Review/video gallery must render from the selected language after build patches.');
assert(socialExportPatch.includes('Social export follows the selected Arabic/English mode'), 'Review/social export language guard is missing.');

// Admin is intentionally Arabic regardless of public mode.
assert(app.includes('dir="rtl" lang="ar"'), 'Admin dashboard must remain Arabic RTL independently of public language mode.');

// Crash containment must stay installed globally.
assert(app.includes('AppErrorBoundary') || read('src/main.tsx').includes('AppErrorBoundary'), 'Global error boundary is missing.');

console.log('[system-contract] Supabase authority, additive categories, category references, bilingual mode, Arabic admin, theme persistence, and crash containment are locked.');