import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const fail = message => { throw new Error(`[validate-persistence] ${message}`); };

const context = read('src/context/AppContext.tsx');
const supabaseCatalog = read('src/services/supabaseCatalog.ts');
const packageJson = JSON.parse(read('package.json'));

if (!context.includes("from '../services/supabaseCatalog'")) {
  fail('AppContext must use the Supabase catalog service.');
}
if (context.includes("from '../services/catalogDatabase'")) {
  fail('AppContext still imports the legacy Firebase catalog service.');
}
if (!supabaseCatalog.includes("rpc('patch_catalog_product'")) {
  fail('Atomic PostgreSQL product patch RPC is missing.');
}
if (!supabaseCatalog.includes('queueProductPatch')) {
  fail('Durable product patch outbox is missing.');
}
if (!supabaseCatalog.includes("from('products')")) {
  fail('Supabase products table integration is missing.');
}
if (!String(packageJson.scripts?.build || '').includes('patch-catalog-integrity-priority.mjs')) {
  fail('Catalog integrity patch is not enforced in the production build.');
}
if (!String(packageJson.scripts?.build || '').includes('patch-dynamic-category-type.mjs')) {
  fail('Dynamic category typing patch is not enforced in the production build.');
}

console.log('[validate-persistence] Supabase catalog + atomic patch safeguards are configured.');
