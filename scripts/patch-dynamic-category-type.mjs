import fs from 'node:fs';

const file = new URL('../src/types.ts', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const fixedUnion = `export type CategoryId = \n  | 'smart-home'\n  | 'smart-kitchen'\n  | 'furniture-decor'\n  | 'smart-gadgets'\n  | 'women-corner'\n  | 'health-fitness';`;

if (source.includes(fixedUnion)) {
  source = source.replace(fixedUnion, `/** Category IDs are database-managed. New admin-created categories must not require a code release. */\nexport type CategoryId = string;`);
  fs.writeFileSync(file, source, 'utf8');
}

console.log('[patch-dynamic-category-type] Category IDs accept database-managed categories.');
