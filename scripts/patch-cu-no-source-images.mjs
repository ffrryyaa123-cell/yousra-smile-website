import fs from 'node:fs';

const file = new URL('../src/components/SeoTextHub.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) return;
  source = source.replace(needle, replacement);
  changed = true;
  console.log(`[patch-cu-no-source-images] ${label}`);
};

// This patch is intentionally scoped ONLY to SeoTextHub (CU والنصوص).
// It does not touch AI Agent Hub, media generators, or any other product workflow.

if (!source.includes('images: [], // CU/text tool: never retain retailer images')) {
  replaceOnce(
    `      const verifiedSource: ExtractedProduct = {\n        ...extracted,`,
    `      const verifiedSource: ExtractedProduct = {\n        ...extracted,\n        images: [], // CU/text tool: never retain retailer images`,
    'retailer images stripped from CU/text state'
  );
}

replaceOnce(
  `      sourceImageUrls: source.images,\n`,
  '',
  'retailer image URLs removed from copied/JSON data'
);

replaceOnce(
  `            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">\n              <Sparkles className="mb-2 h-4 w-4 text-emerald-400" />\n              <div className="text-[10px] text-slate-400">صور المصدر</div>\n              <div className="mt-1 text-xs font-black text-white">{source.images?.length || 0} رابط</div>\n            </div>\n`,
  '',
  'source-image counter removed from CU/text UI'
);

if (source.includes('const sourceImages = (source.images || []).filter(Boolean);')) {
  replaceOnce(
    `      const sourceImages = (source.images || []).filter(Boolean);\n`,
    '',
    'retailer images removed from product-save preparation'
  );
}

replaceOnce(
  `          ...((existingProduct.images?.length || existingProduct.image) ? {} : {\n            image: sourceImages[0] || '',\n            images: sourceImages\n          })\n`,
  '',
  'existing products no longer receive retailer images from CU/text'
);

replaceOnce(
  `          image: sourceImages[0] || '',\n          images: sourceImages,\n`,
  `          image: '',\n          images: [],\n`,
  'new CU/text products are created without retailer images'
);

if (!source.includes('لا يتم جلب أو حفظ صور Amazon من هذه الأداة')) {
  replaceOnce(
    `            بدون توليد صور أو فيديو`,
    `            لا يتم جلب أو حفظ صور Amazon من هذه الأداة`,
    'CU/text scope clarified in UI'
  );
}

if (changed) {
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-cu-no-source-images] Applied only to CU/text tool.');
} else {
  console.log('[patch-cu-no-source-images] Already applied or no matching image paths remain.');
}
