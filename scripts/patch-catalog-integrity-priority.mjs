import fs from 'node:fs';

const read = (url) => fs.readFileSync(url, 'utf8');
const write = (url, value) => fs.writeFileSync(url, value, 'utf8');

const replaceRequired = (source, needle, replacement, label) => {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) throw new Error(`[patch-catalog-integrity-priority] Missing ${label}`);
  // Important: callback replacement keeps literal "$" text intact (for example
  // the CSV header "currency $") instead of treating it as a replace token.
  return source.replace(needle, () => replacement);
};

const catalogFile = new URL('../src/services/supabaseCatalog.ts', import.meta.url);
let catalog = read(catalogFile);

catalog = replaceRequired(
  catalog,
  `const directSaveProduct = async (product: Product) => {\n  const { data, error } = await supabase\n    .from('products')\n    .upsert({ id: product.id, data: product, updated_at: new Date().toISOString() })\n    .select('id')\n    .single();\n  if (error || !data) throw error || new Error('لم تؤكد قاعدة البيانات حفظ المنتج.');\n};`,
  `const stripUndefined = (value: unknown): unknown => {\n  if (Array.isArray(value)) return value.map(stripUndefined);\n  if (!value || typeof value !== 'object') return value;\n  return Object.fromEntries(\n    Object.entries(value as Record<string, unknown>)\n      .filter(([, field]) => field !== undefined)\n      .map(([key, field]) => [key, stripUndefined(field)])\n  );\n};\n\nconst directSaveProduct = async (product: Product) => {\n  const clean = stripUndefined(product) as Product;\n  const { data: existing, error: lookupError } = await supabase\n    .from('products')\n    .select('id')\n    .eq('id', product.id)\n    .maybeSingle();\n  if (lookupError) throw lookupError;\n\n  if (existing?.id) {\n    await directPatchProduct(product.id, clean as unknown as Record<string, unknown>);\n    return;\n  }\n\n  const { data, error } = await supabase\n    .from('products')\n    .insert({ id: product.id, data: clean, updated_at: new Date().toISOString() })\n    .select('id')\n    .single();\n  if (error || !data) throw error || new Error('لم تؤكد قاعدة البيانات إنشاء المنتج.');\n};`,
  'safe directSaveProduct',
);

write(catalogFile, catalog);

const contextFile = new URL('../src/context/AppContext.tsx', import.meta.url);
let context = read(contextFile);

context = replaceRequired(
  context,
  `  const importProductsBulk = (importedList: Product[]) => {\n    if (!importedList || importedList.length === 0) return;\n    setProducts(prev => {\n      const importedById = new Map(importedList.map(product => [product.id, product]));\n      const updatedExisting = prev.map(product => importedById.get(product.id) || product);\n      const existingIds = new Set(prev.map(product => product.id));\n      const newItems = importedList.filter(product => !existingIds.has(product.id));\n      return [...newItems, ...updatedExisting];\n    });\n    importedList.forEach(product => void catalogDatabase.saveProduct(product).catch(console.error));\n  };`,
  `  const importProductsBulk = (importedList: Product[]) => {\n    if (!importedList || importedList.length === 0) return;\n\n    const currentById = new Map<string, Product>(products.map(product => [product.id, product] as [string, Product]));\n    const mergedList = importedList.map(incoming => {\n      const existing = currentById.get(incoming.id);\n      return existing ? ({ ...existing, ...incoming, id: existing.id } as Product) : incoming;\n    });\n\n    setProducts(prev => {\n      const importedById = new Map<string, Product>(mergedList.map(product => [product.id, product] as [string, Product]));\n      const updatedExisting = prev.map(product => importedById.get(product.id) || product);\n      const existingIds = new Set(prev.map(product => product.id));\n      const newItems = mergedList.filter(product => !existingIds.has(product.id));\n      return [...newItems, ...updatedExisting];\n    });\n\n    mergedList.forEach(product => {\n      const existing = currentById.get(product.id);\n      if (!existing) {\n        void catalogDatabase.saveProduct(product).catch(console.error);\n        return;\n      }\n      const patch = Object.fromEntries(\n        Object.entries(product).filter(([key, value]) =>\n          key !== 'id' && value !== undefined && JSON.stringify((existing as any)[key]) !== JSON.stringify(value)\n        )\n      );\n      if (Object.keys(patch).length > 0) {\n        void catalogDatabase.patchProduct(product.id, patch).catch(console.error);\n      }\n    });\n  };`,
  'safe importProductsBulk',
);

context = replaceRequired(
  context,
  `  const updateProduct = (updatedProduct: Product) => {\n    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));\n    void catalogDatabase.saveProduct(updatedProduct).catch(console.error);\n  };`,
  `  const updateProduct = (updatedProduct: Product) => {\n    const existing = products.find(product => product.id === updatedProduct.id);\n    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));\n\n    if (!existing) {\n      void catalogDatabase.saveProduct(updatedProduct).catch(console.error);\n      return;\n    }\n\n    const patch = Object.fromEntries(\n      Object.entries(updatedProduct).filter(([key, value]) =>\n        key !== 'id' && value !== undefined && JSON.stringify((existing as any)[key]) !== JSON.stringify(value)\n      )\n    );\n    if (Object.keys(patch).length > 0) {\n      void catalogDatabase.patchProduct(updatedProduct.id, patch).catch(console.error);\n    }\n  };`,
  'diff-only updateProduct',
);

write(contextFile, context);

const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = read(adminFile);

admin = replaceRequired(
  admin,
  `          const id = getColumn(cols, ['id'], 0) || \`prod-\${Date.now()}-\${i}\`;\n          const titleAr = getColumn(cols, ['titleAr'], 1) || 'منتج جديد';\n          const titleEn = getColumn(cols, ['titleEn'], 2) || 'New Product';\n          const category = (getColumn(cols, ['category'], 3) || 'smart-home') as any;\n          const subcategory = getColumn(cols, ['subcategory'], 4) || 'المنتجات';\n          const brand = getColumn(cols, ['brand'], 5) || 'ماركة ممتازة';\n          const originalPrice = parseNumber(getColumn(cols, ['originalPrice'], 6), 1000);\n          const discountPrice = parseNumber(getColumn(cols, ['discountPrice'], 7), 800);\n          const currency = getColumn(cols, ['currency', 'currency $'], 8) || 'USD';`,
  `          const id = getColumn(cols, ['id'], 0) || \`prod-\${Date.now()}-\${i}\`;\n          const existingProduct = products.find(product => product.id === id);\n          const titleAr = getColumn(cols, ['titleAr'], 1) || existingProduct?.titleAr || 'منتج جديد';\n          const titleEn = getColumn(cols, ['titleEn'], 2) || existingProduct?.titleEn || 'New Product';\n          const category = (getColumn(cols, ['category'], 3) || existingProduct?.category || 'smart-home') as any;\n          const subcategory = getColumn(cols, ['subcategory'], 4) || existingProduct?.subcategory || 'المنتجات';\n          const brand = getColumn(cols, ['brand'], 5) || existingProduct?.brand || 'ماركة ممتازة';\n          const originalPrice = parseNumber(getColumn(cols, ['originalPrice'], 6), existingProduct?.originalPrice ?? 1000);\n          const discountPrice = parseNumber(getColumn(cols, ['discountPrice'], 7), existingProduct?.discountPrice ?? 800);\n          const currency = getColumn(cols, ['currency', 'currency $'], 8) || existingProduct?.currency || 'USD';`,
  'CSV existing-product fallbacks',
);

admin = replaceRequired(
  admin,
  `          ], 9) || 'https://www.amazon.com';`,
  `          ], 9) || existingProduct?.amazonUrl || 'https://www.amazon.com';`,
  'CSV Amazon fallback',
);

admin = replaceRequired(
  admin,
  `          ], 10);\n          const image = getColumn(cols, ['image'], 11) || 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';\n          const rating = parseNumber(getColumn(cols, ['rating'], 12), 4.8);\n          const reviewCount = parseNumber(getColumn(cols, ['reviewCount'], 13), 50);`,
  `          ], 10) || existingProduct?.aliexpressUrl || '';\n          const image = getColumn(cols, ['image'], 11) || existingProduct?.image || 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=800&q=80';\n          const rating = parseNumber(getColumn(cols, ['rating'], 12), existingProduct?.rating ?? 4.8);\n          const reviewCount = parseNumber(getColumn(cols, ['reviewCount'], 13), existingProduct?.reviewCount ?? 50);`,
  'CSV media/rating fallbacks',
);

admin = replaceRequired(
  admin,
  `            description: titleAr,\n            longDescription: titleAr,`,
  `            description: existingProduct?.description || titleAr,\n            descriptionEn: existingProduct?.descriptionEn,\n            longDescription: existingProduct?.longDescription || titleAr,\n            longDescriptionEn: existingProduct?.longDescriptionEn,`,
  'CSV descriptions preservation',
);

admin = replaceRequired(
  admin,
  `            image,\n            images: [image],`,
  `            image,\n            images: existingProduct?.images?.length ? existingProduct.images : [image],`,
  'CSV images preservation',
);

admin = replaceRequired(
  admin,
  `            features: ['جودة ممتازة', 'ضمان سنتين'],\n            specs: { 'الحالة': 'جديد' },\n            keywords: ['منتج', 'عروض'],\n            viewsCount: 1,\n            createdAt: new Date().toISOString().split('T')[0]`,
  `            features: existingProduct?.features || ['جودة ممتازة', 'ضمان سنتين'],\n            featuresEn: existingProduct?.featuresEn,\n            specs: existingProduct?.specs || { 'الحالة': 'جديد' },\n            specsEn: existingProduct?.specsEn,\n            keywords: existingProduct?.keywords || ['منتج', 'عروض'],\n            seoTitleAr: existingProduct?.seoTitleAr,\n            seoTitleEn: existingProduct?.seoTitleEn,\n            seoDescriptionAr: existingProduct?.seoDescriptionAr,\n            seoDescriptionEn: existingProduct?.seoDescriptionEn,\n            hashtagsAr: existingProduct?.hashtagsAr,\n            hashtagsEn: existingProduct?.hashtagsEn,\n            videoUrl: existingProduct?.videoUrl,\n            videoThumbnailUrl: existingProduct?.videoThumbnailUrl,\n            videoStoragePath: existingProduct?.videoStoragePath,\n            youtubeUrl: existingProduct?.youtubeUrl,\n            tiktokUrl: existingProduct?.tiktokUrl,\n            pinterestUrl: existingProduct?.pinterestUrl,\n            viewsCount: existingProduct?.viewsCount ?? 1,\n            createdAt: existingProduct?.createdAt || new Date().toISOString().split('T')[0]`,
  'CSV metadata preservation',
);

write(adminFile, admin);

console.log('[patch-catalog-integrity-priority] Existing products are patch-only; CSV/import edits preserve untouched catalog fields.');