import fs from 'node:fs';

const file = new URL('../src/components/Header.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const unsafe = /const searchResults = searchQuery\.trim\(\)\.length >= 2\s*\? products\.filter\(p =>\s*p\.titleAr\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\s*p\.titleEn\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\s*p\.brand\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\s*p\.category\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\s*\)\s*:\s*\[\];/m;

const safe = `const searchResults = searchQuery.trim().length >= 2
    ? products.filter(p => {
        // Legacy/incomplete rows can temporarily miss text fields. Search must
        // never crash the whole React tree because one catalog row is partial.
        const needle = String(searchQuery || '').toLocaleLowerCase();
        return [p?.titleAr, p?.titleEn, p?.brand, p?.category, p?.subcategory]
          .some(value => String(value ?? '').toLocaleLowerCase().includes(needle));
      })
    : [];`;

if (unsafe.test(source)) {
  source = source.replace(unsafe, safe);
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-safe-product-search] hardened header search');
} else if (source.includes("String(value ?? '').toLocaleLowerCase().includes(needle)")) {
  console.log('[patch-safe-product-search] already applied');
} else {
  throw new Error('[patch-safe-product-search] search block not found');
}
