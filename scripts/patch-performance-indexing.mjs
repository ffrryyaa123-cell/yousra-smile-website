import fs from 'node:fs';

const cardFile = new URL('../src/components/ProductCard.tsx', import.meta.url);
let card = fs.readFileSync(cardFile, 'utf8');

const replaceOnce = (needle, replacement, label) => {
  if (card.includes(replacement)) return;
  if (!card.includes(needle)) throw new Error(`[patch-performance-indexing] Missing ${label}`);
  card = card.replace(needle, replacement);
};

if (!card.includes("from '../utils/productSeo'")) {
  replaceOnce(
    "import { useApp } from '../context/AppContext';",
    "import { useApp } from '../context/AppContext';\nimport { productPath } from '../utils/productSeo';",
    'ProductCard productPath import'
  );
}

// Product card images are below the initial hero on most routes. Lazy decoding
// reduces initial network/CPU work and explicit dimensions reduce layout shift.
card = card.replace(
  /(<img\s+\n\s*src=\{product\.image\}\s+\n\s*alt=\{displayTitle\}\s*\n\s*referrerPolicy="no-referrer")/g,
  '$1\n            loading="lazy"\n            decoding="async"\n            width={640}\n            height={480}'
);

// Give crawlers a real, stable internal link to every product page while
// preserving the existing modal behavior for shoppers.
const titleOpen = `<h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-1.5 font-['Tajawal']">\n              {displayTitle}\n            </h3>`;
const titleLinked = `<h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-1.5 font-['Tajawal']">\n              <a\n                href={productPath(product)}\n                onClick={(event) => { event.preventDefault(); event.stopPropagation(); openProductDetail(product); }}\n              >\n                {displayTitle}\n              </a>\n            </h3>`;
if (card.includes(titleOpen)) card = card.replace(titleOpen, titleLinked);

const gridTitleOpen = `<h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug font-['Tajawal']">\n            {displayTitle}\n          </h3>`;
const gridTitleLinked = `<h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug font-['Tajawal']">\n            <a\n              href={productPath(product)}\n              onClick={(event) => { event.preventDefault(); event.stopPropagation(); openProductDetail(product); }}\n            >\n              {displayTitle}\n            </a>\n          </h3>`;
if (card.includes(gridTitleOpen)) card = card.replace(gridTitleOpen, gridTitleLinked);

fs.writeFileSync(cardFile, card, 'utf8');

const indexFile = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(indexFile, 'utf8');
if (!html.includes('rel="sitemap"')) {
  html = html.replace(
    '<link rel="canonical" href="https://yousrasmile.com/" />',
    '<link rel="canonical" href="https://yousrasmile.com/" />\n    <link rel="sitemap" type="application/xml" href="https://yousrasmile.com/sitemap.xml" />'
  );
}
if (!html.includes('iicvasloytbjotbgbvjt.supabase.co')) {
  html = html.replace(
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://iicvasloytbjotbgbvjt.supabase.co" crossorigin>\n    <link rel="dns-prefetch" href="https://iicvasloytbjotbgbvjt.supabase.co">\n    <link rel="preconnect" href="https://fonts.googleapis.com">'
  );
}
fs.writeFileSync(indexFile, html, 'utf8');

console.log('[patch-performance-indexing] Product links are crawlable and card images are lazy/async decoded.');
