import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(`[system-contract] ${message}`);
};

const context = read('src/context/AppContext.tsx');
const categories = read('src/services/categoryManager.ts');
const app = read('src/App.tsx');
const productCard = read('src/components/ProductCard.tsx');
const socialExportPatch = read('scripts/patch-social-export-language-mode.mjs');
const types = read('src/types.ts');

// Data authority contract: Supabase is the live catalog/category source.
assert(context.includes("from '../services/supabaseCatalog'"), 'AppContext must use Supabase catalog service.');
assert(!context.includes("from '../services/catalogDatabase'"), 'Legacy Firebase catalog service must not be reintroduced into AppContext.');
assert(categories.includes(".from('categories')"), 'Categories must persist in the Supabase categories table.');
assert(categories.includes("saveManagedCategories"), 'Managed categories must have a real persistent save path.');

// Dynamic category contract: adding a category must not require a code release.
assert(types.includes('export type CategoryId = string'), 'CategoryId must remain dynamic, not a hard-coded union.');

// UI mode contract: Arabic/English and Light/Dark choices persist.
assert(context.includes('LOCAL_STORAGE_LANG_KEY'), 'Language mode persistence key is missing.');
assert(context.includes('LOCAL_STORAGE_DARK_KEY'), 'Dark/light mode persistence key is missing.');
assert(context.includes('localStorage.setItem(LOCAL_STORAGE_LANG_KEY'), 'Language selection is not persisted.');
assert(context.includes('localStorage.setItem(LOCAL_STORAGE_DARK_KEY'), 'Dark/light selection is not persisted.');

// Public-language contract: storefront/reviews export follows selected language.
assert(productCard.includes("language === 'en'"), 'Product cards must render from the selected language.');
assert(socialExportPatch.includes('Social export follows the selected Arabic/English mode'), 'Review/social export language guard is missing.');

// Crash containment must stay installed globally.
assert(app.includes('AppErrorBoundary') || read('src/main.tsx').includes('AppErrorBoundary'), 'Global error boundary is missing.');

console.log('[system-contract] Supabase authority, dynamic categories, language/theme persistence, and crash containment are locked.');
