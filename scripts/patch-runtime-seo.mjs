import fs from 'node:fs';

const file = new URL('../src/components/SEOHead.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-runtime-seo] Missing ${label}; refusing to guess.`);
  source = source.replace(needle, replacement);
  changed = true;
};

if (!source.includes("from '../utils/productSeo'")) {
  replaceOnce(
    "import { Product } from '../types';",
    "import { Product } from '../types';\nimport { absoluteProductUrl } from '../utils/productSeo';",
    'SEO URL helper import'
  );
}

if (!source.includes('currentUrl = absoluteProductUrl(currentProduct);')) {
  replaceOnce(
    `    if (currentProduct) {\n      const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.titleAr) : currentProduct.titleAr;`,
    `    if (currentProduct) {\n      currentUrl = absoluteProductUrl(currentProduct);\n      const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.titleAr) : currentProduct.titleAr;`,
    'canonical product URL'
  );
}

if (source.includes("    setMetaTag('name', 'robots', 'index, follow');")) {
  source = source.replace(
    "    setMetaTag('name', 'robots', 'index, follow');",
    "    setMetaTag('name', 'robots', activePage === 'admin' ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');"
  );
  changed = true;
}

if (!source.includes('Runtime schema safety: never publish guessed stock')) {
  const needle = `    // Inject script element for JSON-LD\n`;
  const block = `    // Runtime schema safety: never publish guessed stock, price or rating data.\n    if (currentProduct && schemaObj) {\n      if (!(Number(currentProduct.rating) > 0 && Number(currentProduct.reviewCount) > 0)) {\n        delete schemaObj.review;\n        delete schemaObj.aggregateRating;\n      }\n\n      const currentPrice = Number(currentProduct.discountPrice || currentProduct.originalPrice || 0);\n      const hasRetailerUrl = Boolean(currentProduct.amazonUrl || currentProduct.aliexpressUrl);\n      if (!(currentPrice > 0 && hasRetailerUrl)) {\n        delete schemaObj.offers;\n      } else if (schemaObj.offers?.offers) {\n        schemaObj.offers.offers = schemaObj.offers.offers\n          .filter((offer: any) => Boolean(offer?.url))\n          .map((offer: any) => {\n            const { availability, ...safeOffer } = offer;\n            return safeOffer;\n          });\n      }\n    }\n\n${needle}`;
  replaceOnce(needle, block, 'runtime schema safety insertion');
}

if (changed) {
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-runtime-seo] Runtime canonical, robots and schema safety applied.');
} else {
  console.log('[patch-runtime-seo] Already applied.');
}
