import fs from 'node:fs';

const file = new URL('../src/components/SeoTextHub.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) {
    throw new Error(`[patch-cu-product-save] Could not find ${label}. Refusing to guess.`);
  }
  source = source.replace(needle, replacement);
  changed = true;
};

if (!source.includes("import { catalogDatabase } from '../services/supabaseCatalog';")) {
  replaceOnce(
    "import { supabase } from '../services/adminAccount';",
    "import { supabase } from '../services/adminAccount';\nimport { catalogDatabase } from '../services/supabaseCatalog';",
    'catalog database import'
  );
}

if (!source.includes('const inferProductCategory =')) {
  replaceOnce(
    `const copyText = async (value: string) => {`,
    `const inferProductCategory = (value: string) => {\n  const text = value.toLowerCase();\n  if (/kitchen|air fryer|pressure cooker|rice cooker|blender|mixer|coffee|cookware|toaster|oven|microwave|food processor/.test(text)) return 'smart-kitchen';\n  if (/vacuum|floor|clean|mop|robot|smart home|security|camera|thermostat|doorbell|home automation/.test(text)) return 'smart-home';\n  if (/furniture|decor|sofa|chair|table|bed|lamp|lighting|rug|shelf|storage/.test(text)) return 'furniture-decor';\n  if (/fitness|health|exercise|massage|scale|wellness|workout/.test(text)) return 'health-fitness';\n  if (/beauty|makeup|cosmetic|perfume|fragrance|fashion|women|hair|skin care|skincare/.test(text)) return 'women-corner';\n  return 'smart-gadgets';\n};\n\nconst copyText = async (value: string) => {`,
    'category helper insertion point'
  );
}

if (!source.includes('onOpenProducts?: () => void')) {
  replaceOnce(
    `export const SeoTextHub: React.FC = () => {`,
    `export const SeoTextHub: React.FC<{ onOpenProducts?: () => void }> = ({ onOpenProducts }) => {`,
    'component signature'
  );
}

if (source.includes('  const { siteSettings } = useApp();')) {
  replaceOnce(
    '  const { siteSettings } = useApp();',
    '  const { siteSettings, products, addProduct, patchProduct } = useApp();',
    'app context bindings'
  );
}

if (!source.includes('const [savingProduct, setSavingProduct]')) {
  replaceOnce(
    `  const [copiedAll, setCopiedAll] = useState(false);`,
    `  const [copiedAll, setCopiedAll] = useState(false);\n  const [savingProduct, setSavingProduct] = useState(false);\n  const [saveMessage, setSaveMessage] = useState('');`,
    'save states'
  );
}

if (!source.includes('const existingProduct = useMemo')) {
  replaceOnce(
    `  const discountPercent = useMemo(() => {`,
    `  const existingProduct = useMemo(() => {\n    const identifier = verification?.identifier || '';\n    if (!identifier) return null;\n    return products.find(product => {\n      if (verification?.platform === 'amazon') {\n        return [product.amazonUrl, product.sourceProductUrl]\n          .filter(Boolean)\n          .some(url => amazonAsinFromLongUrl(String(url)) === identifier);\n      }\n      if (verification?.platform === 'aliexpress') {\n        return [product.aliexpressUrl, product.sourceProductUrl]\n          .filter(Boolean)\n          .some(url => aliItemIdFromLongUrl(String(url)) === identifier);\n      }\n      return false;\n    }) || null;\n  }, [products, verification]);\n\n  const discountPercent = useMemo(() => {`,
    'existing product matcher'
  );
}

if (!source.includes('const handleSaveToProducts = async')) {
  replaceOnce(
    `  const downloadJson = () => {`,
    `  const handleSaveToProducts = async () => {\n    if (!source || !verification?.identityVerified) {\n      setSaveMessage('لا يمكن الحفظ قبل تأكيد هوية المنتج.');\n      return;\n    }\n    if (!bilingual?.titleAr || !bilingual?.descriptionAr || !bilingual?.titleEn) {\n      setSaveMessage('النص العربي والإنجليزي لم يكتمل بعد. أعيدي جلب البيانات قبل الحفظ حتى لا ينزل المنتج بنص ناقص.');\n      return;\n    }\n\n    setSavingProduct(true);\n    setSaveMessage('');\n    try {\n      const categorySeed = [source.title, source.brand, ...(source.breadcrumbs || [])].join(' ');\n      const category = inferProductCategory(categorySeed) as any;\n      const subcategory = source.breadcrumbs?.[source.breadcrumbs.length - 1] || source.brand || '';\n      const currentPrice = typeof source.price === 'number' ? source.price : 0;\n      const regularPrice = typeof source.listPrice === 'number' && source.listPrice >= currentPrice\n        ? source.listPrice\n        : currentPrice;\n      const sourceImages = (source.images || []).filter(Boolean);\n      const coupon = source.coupon ? {\n        label: source.coupon.label || '',\n        code: source.coupon.code || '',\n        terms: source.coupon.terms || '',\n        expiresOn: '',\n        isPublic: true\n      } : undefined;\n\n      const textPatch = {\n        titleAr: bilingual.titleAr,\n        titleEn: bilingual.titleEn || source.title,\n        description: bilingual.descriptionAr || '',\n        descriptionEn: bilingual.descriptionEn || source.description || '',\n        longDescription: bilingual.longDescriptionAr || bilingual.descriptionAr || '',\n        longDescriptionEn: bilingual.longDescriptionEn || bilingual.descriptionEn || source.description || '',\n        category,\n        subcategory,\n        subcategoryEn: subcategory,\n        brand: source.brand || '',\n        amazonUrl: verification.platform === 'amazon' ? (affiliateUrl || source.finalUrl || source.sourceUrl) : '',\n        aliexpressUrl: verification.platform === 'aliexpress' ? (affiliateUrl || source.finalUrl || source.sourceUrl) : undefined,\n        sourceProductUrl: source.sourceUrl,\n        originalPrice: regularPrice,\n        discountPrice: currentPrice,\n        discountPercent,\n        currency: source.currency || 'USD',\n        rating: typeof source.rating === 'number' ? source.rating : 0,\n        reviewCount: typeof source.reviewCount === 'number' ? source.reviewCount : 0,\n        features: bilingual.featuresAr?.length ? bilingual.featuresAr : [],\n        featuresEn: bilingual.featuresEn?.length ? bilingual.featuresEn : source.features || [],\n        specs: bilingual.specsAr && Object.keys(bilingual.specsAr).length ? bilingual.specsAr : {},\n        specsEn: bilingual.specsEn && Object.keys(bilingual.specsEn).length ? bilingual.specsEn : source.specs || {},\n        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),\n        coupon,\n        isActive: true\n      };\n\n      if (existingProduct) {\n        const patch = {\n          ...textPatch,\n          ...((existingProduct.images?.length || existingProduct.image) ? {} : {\n            image: sourceImages[0] || '',\n            images: sourceImages\n          })\n        };\n        patchProduct(existingProduct.id, patch as any);\n        await catalogDatabase.patchProduct(existingProduct.id, patch as Record<string, unknown>);\n        setSaveMessage('✓ تم تحديث المنتج وحفظ البيانات في Supabase بدون حذف صوره أو فيديوهاته الحالية.');\n      } else {\n        const created = addProduct({\n          ...textPatch,\n          image: sourceImages[0] || '',\n          images: sourceImages,\n          youtubeUrl: '',\n          tiktokUrl: '',\n          pinterestUrl: '',\n          isFeatured: false,\n          isTopSelling: false,\n          isHidden: false\n        } as any);\n        await catalogDatabase.saveProduct(created);\n        setSaveMessage('✓ تم إنشاء المنتج وحفظه في Supabase وإضافته إلى منتجات الموقع.');\n      }\n\n      window.setTimeout(() => onOpenProducts?.(), 700);\n    } catch (err) {\n      setSaveMessage(`تعذر تأكيد حفظ المنتج في Supabase: ${err instanceof Error ? err.message : String(err)}`);\n    } finally {\n      setSavingProduct(false);\n    }\n  };\n\n  const downloadJson = () => {`,
    'save handler insertion point'
  );
}

if (!source.includes('حفظ إلى المنتجات') && !source.includes('تحديث في المنتجات')) {
  replaceOnce(
    `          <div className="flex flex-wrap gap-2">`,
    `          {saveMessage && (\n            <div className={\`rounded-2xl border p-4 text-sm font-bold \${saveMessage.startsWith('✓') ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100' : 'border-amber-500/40 bg-amber-950/30 text-amber-100'}\`}>\n              {saveMessage}\n            </div>\n          )}\n\n          <div className="flex flex-wrap gap-2">\n            <button\n              type="button"\n              onClick={() => void handleSaveToProducts()}\n              disabled={savingProduct || !verification?.identityVerified}\n              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"\n            >\n              {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}\n              {savingProduct ? 'جاري الحفظ في Supabase...' : existingProduct ? 'تحديث في المنتجات' : 'حفظ إلى المنتجات'}\n            </button>`,
    'save button area'
  );
}

if (changed) {
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-cu-product-save] Direct product save/update enabled.');
} else {
  console.log('[patch-cu-product-save] Already applied.');
}

const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = fs.readFileSync(adminFile, 'utf8');
if (admin.includes('<SeoTextHub />')) {
  admin = admin.replace('<SeoTextHub />', "<SeoTextHub onOpenProducts={() => setActiveTab('products')} />");
  fs.writeFileSync(adminFile, admin, 'utf8');
  console.log('[patch-cu-product-save] Products navigation wired.');
} else if (admin.includes('<SeoTextHub onOpenProducts=')) {
  console.log('[patch-cu-product-save] Products navigation already wired.');
} else {
  throw new Error('[patch-cu-product-save] SeoTextHub render not found in AdminPage.');
}
