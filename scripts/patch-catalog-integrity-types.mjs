import fs from 'node:fs';

const file = new URL('../src/context/AppContext.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const needle = "    const currentById = new Map(products.map(product => [product.id, product]));";
const replacement = "    const currentById = new Map<string, Product>(products.map(product => [product.id, product] as [string, Product]));";

if (source.includes(replacement)) {
  console.log('[patch-catalog-integrity-types] Product map typing already applied.');
} else if (source.includes(needle)) {
  source = source.replace(needle, replacement);
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-catalog-integrity-types] Product map typing applied.');
} else {
  throw new Error('[patch-catalog-integrity-types] Expected catalog integrity map was not found.');
}
