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
  const helper = [
    "const inferProductCategory = (value: string) => {",
    "  const text = value.toLowerCase();",
    "  if (/kitchen|air fryer|pressure cooker|rice cooker|blender|mixer|coffee|cookware|toaster|oven|microwave|food processor/.test(text)) return 'smart-kitchen';",
    "  if (/vacuum|floor|clean|mop|robot|smart home|security|camera|thermostat|doorbell|home automation/.test(text)) return 'smart-home';",
    "  if (/furniture|decor|sofa|chair|table|bed|lamp|lighting|rug|shelf|storage/.test(text)) return 'furniture-decor';",
    "  if (/fitness|health|exercise|massage|scale|wellness|workout/.test(text)) return 'health-fitness';",
    "  if (/beauty|makeup|cosmetic|perfume|fragrance|fashion|women|hair|skin care|skincare/.test(text)) return 'women-corner';",
    "  return 'smart-gadgets';",
    "};",
    "",
    "const copyText = async (value: string) => {"
  ].join('\n');
  replaceOnce('const copyText = async (value: string) => {', helper, 'category helper insertion point');
}

if (!source.includes('onOpenProducts?: () => void')) {
  replaceOnce(
    'export const SeoTextHub: React.FC = () => {',
    'export const SeoTextHub: React.FC<{ onOpenProducts?: () => void }> = ({ onOpenProducts }) => {',
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
    '  const [copiedAll, setCopiedAll] = useState(false);',
    [
      '  const [copiedAll, setCopiedAll] = useState(false);',
      '  const [savingProduct, setSavingProduct] = useState(false);',
      "  const [saveMessage, setSaveMessage] = useState('');"
    ].join('\n'),
    'save states'
  );
}

if (!source.includes('const existingProduct = useMemo')) {
  const existingBlock = [
    '  const existingProduct = useMemo(() => {',
    "    const identifier = verification?.identifier || '';",
    '    if (!identifier) return null;',
    '    return products.find(product => {',
    "      if (verification?.platform === 'amazon') {",
    '        return [product.amazonUrl, product.sourceProductUrl]',
    '          .filter(Boolean)',
    '          .some(url => amazonAsinFromLongUrl(String(url)) === identifier);',
    '      }',
    "      if (verification?.platform === 'aliexpress') {",
    '        return [product.aliexpressUrl, product.sourceProductUrl]',
    '          .filter(Boolean)',
    '          .some(url => aliItemIdFromLongUrl(String(url)) === identifier);',
    '      }',
    '      return false;',
    '    }) || null;',
    '  }, [products, verification]);',
    '',
    '  const discountPercent = useMemo(() => {'
  ].join('\n');
  replaceOnce('  const discountPercent = useMemo(() => {', existingBlock, 'existing product matcher');
}

if (!source.includes('const handleSaveToProducts = async')) {
  const handler = [
    '  const handleSaveToProducts = async () => {',
    '    if (!source || !verification?.identityVerified) {',
    "      setSaveMessage('لا يمكن الحفظ قبل تأكيد هوية المنتج.');",
    '      return;',
    '    }',
    '    if (!bilingual?.titleAr || !bilingual?.descriptionAr || !bilingual?.titleEn || !bilingual?.seoTitleEn || !bilingual?.seoTitleAr) {',
    "      setSaveMessage('النص العربي والإنجليزي وSEO لم يكتمل بعد. أعيدي جلب البيانات حتى لا ينزل المنتج بنص ناقص.');",
    '      return;',
    '    }',
    '',
    '    setSavingProduct(true);',
    "    setSaveMessage('');",
    '    try {',
    "      const categorySeed = [source.title, source.brand, ...(source.breadcrumbs || [])].join(' ');",
    '      const category = inferProductCategory(categorySeed) as any;',
    "      const subcategory = source.breadcrumbs?.[source.breadcrumbs.length - 1] || source.brand || '';",
    "      const currentPrice = typeof source.price === 'number' ? source.price : 0;",
    "      const regularPrice = typeof source.listPrice === 'number' && source.listPrice >= currentPrice ? source.listPrice : currentPrice;",
    '      const sourceImages = (source.images || []).filter(Boolean);',
    '      const coupon = source.coupon ? {',
    "        label: source.coupon.label || '',",
    "        code: source.coupon.code || '',",
    "        terms: source.coupon.terms || '',",
    "        expiresOn: '',",
    '        isPublic: true',
    '      } : undefined;',
    '',
    '      const textPatch = {',
    '        titleAr: bilingual.titleAr,',
    '        titleEn: bilingual.titleEn || source.title,',
    "        description: bilingual.descriptionAr || '',",
    "        descriptionEn: bilingual.descriptionEn || source.description || '',",
    "        longDescription: bilingual.longDescriptionAr || bilingual.descriptionAr || '',",
    "        longDescriptionEn: bilingual.longDescriptionEn || bilingual.descriptionEn || source.description || '',",
    '        category,',
    '        subcategory,',
    '        subcategoryEn: subcategory,',
    "        brand: source.brand || '',",
    "        amazonUrl: verification.platform === 'amazon' ? (affiliateUrl || source.finalUrl || source.sourceUrl) : '',",
    "        aliexpressUrl: verification.platform === 'aliexpress' ? (affiliateUrl || source.finalUrl || source.sourceUrl) : undefined,",
    '        sourceProductUrl: source.sourceUrl,',
    '        originalPrice: regularPrice,',
    '        discountPrice: currentPrice,',
    '        discountPercent,',
    "        currency: source.currency || 'USD',",
    "        rating: typeof source.rating === 'number' ? source.rating : 0,",
    "        reviewCount: typeof source.reviewCount === 'number' ? source.reviewCount : 0,",
    '        features: bilingual.featuresAr?.length ? bilingual.featuresAr : [],',
    '        featuresEn: bilingual.featuresEn?.length ? bilingual.featuresEn : source.features || [],',
    '        specs: bilingual.specsAr && Object.keys(bilingual.specsAr).length ? bilingual.specsAr : {},',
    '        specsEn: bilingual.specsEn && Object.keys(bilingual.specsEn).length ? bilingual.specsEn : source.specs || {},',
    '        keywords: Array.from(new Set([...(bilingual.keywordsAr || []), ...(bilingual.keywordsEn || [])])),',
    '        coupon,',
    '        isActive: true',
    '      };',
    '',
    '      if (existingProduct) {',
    '        const patch = {',
    '          ...textPatch,',
    '          ...((existingProduct.images?.length || existingProduct.image) ? {} : {',
    "            image: sourceImages[0] || '',",
    '            images: sourceImages',
    '          })',
    '        };',
    '        patchProduct(existingProduct.id, patch as any);',
    '        await catalogDatabase.patchProduct(existingProduct.id, patch as Record<string, unknown>);',
    "        setSaveMessage('✓ تم تحديث المنتج وحفظ البيانات في Supabase بدون حذف صوره أو فيديوهاته الحالية.');",
    '      } else {',
    '        const created = addProduct({',
    '          ...textPatch,',
    "          image: sourceImages[0] || '',",
    '          images: sourceImages,',
    "          youtubeUrl: '',",
    "          tiktokUrl: '',",
    "          pinterestUrl: '',",
    '          isFeatured: false,',
    '          isTopSelling: false,',
    '          isHidden: false',
    '        } as any);',
    '        await catalogDatabase.saveProduct(created);',
    "        setSaveMessage('✓ تم إنشاء المنتج وحفظه في Supabase وإضافته إلى منتجات الموقع.');",
    '      }',
    '',
    '      window.setTimeout(() => onOpenProducts?.(), 700);',
    '    } catch (err) {',
    "      setSaveMessage('تعذر تأكيد حفظ المنتج في Supabase: ' + (err instanceof Error ? err.message : String(err)));",
    '    } finally {',
    '      setSavingProduct(false);',
    '    }',
    '  };',
    '',
    '  const downloadJson = () => {'
  ].join('\n');
  replaceOnce('  const downloadJson = () => {', handler, 'save handler insertion point');
}

if (!source.includes("existingProduct ? 'تحديث في المنتجات' : 'حفظ إلى المنتجات'")) {
  const uiBlock = [
    '          {saveMessage && (',
    "            <div className={saveMessage.startsWith('✓') ? 'rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm font-bold text-emerald-100' : 'rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm font-bold text-amber-100'}>",
    '              {saveMessage}',
    '            </div>',
    '          )}',
    '',
    '          <div className="flex flex-wrap gap-2">',
    '            <button',
    '              type="button"',
    '              onClick={() => void handleSaveToProducts()}',
    '              disabled={savingProduct || !verification?.identityVerified}',
    '              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"',
    '            >',
    '              {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}',
    "              {savingProduct ? 'جاري الحفظ في Supabase...' : existingProduct ? 'تحديث في المنتجات' : 'حفظ إلى المنتجات'}",
    '            </button>'
  ].join('\n');
  replaceOnce('          <div className="flex flex-wrap gap-2">', uiBlock, 'save button area');
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
