import fs from 'node:fs';

const file = new URL('../src/components/SeoTextHub.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) {
    throw new Error(`[patch-cu-copy-quality] Could not find ${label}. Refusing to guess.`);
  }
  source = source.replace(needle, replacement);
  changed = true;
};

if (!source.includes('const isRetailerBoilerplate =')) {
  replaceOnce(
    "const copyText = async (value: string) => {",
    `const isRetailerBoilerplate = (value: string): boolean => {\n  const text = String(value || '').toLowerCase();\n  if (!text.trim()) return false;\n  return [\n    /shop .{0,80} at the amazon .{0,80} store/,\n    /free shipping on eligible items/,\n    /everyday low prices/,\n    /save up to \\d+%/,\n    /visit the .{0,80} store/,\n    /amazon bakeware store/,\n    /amazon.com: online shopping/\n  ].some(pattern => pattern.test(text));\n};\n\nconst makeSafeEnglishDescription = (product: ExtractedProduct): string => {\n  const raw = String(product.description || '').trim();\n  if (raw && !isRetailerBoilerplate(raw)) return raw;\n\n  const facts = (product.features || [])\n    .map(value => String(value || '').trim())\n    .filter(Boolean)\n    .filter(value => !isRetailerBoilerplate(value))\n    .slice(0, 4);\n\n  if (facts.length) return facts.join(' ');\n  return String(product.title || '').trim();\n};\n\nconst makeSafeLongEnglishDescription = (product: ExtractedProduct): string => {\n  const base = makeSafeEnglishDescription(product);\n  const features = (product.features || [])\n    .map(value => String(value || '').trim())\n    .filter(Boolean)\n    .filter(value => !isRetailerBoilerplate(value))\n    .slice(0, 8);\n  const joined = [base, ...features.filter(value => !base.includes(value))].filter(Boolean).join(' ');\n  return joined || String(product.title || '').trim();\n};\n\nconst compactText = (value: string, max: number) => {\n  const normalized = String(value || '').replace(/\\s+/g, ' ').trim();\n  if (normalized.length <= max) return normalized;\n  return normalized.slice(0, Math.max(0, max - 1)).trimEnd() + '…';\n};\n\nconst keywordSeed = (product: ExtractedProduct): string[] => {\n  const words = [product.brand, ...(product.breadcrumbs || []), product.title]\n    .flatMap(value => String(value || '').split(/[,|/•-]/g))\n    .map(value => value.trim())\n    .filter(value => value.length >= 3 && value.length <= 60);\n  return Array.from(new Set(words)).slice(0, 12);\n};\n\nconst completeBilingualCopy = (generated: BilingualCopy | null | undefined, product: ExtractedProduct): BilingualCopy => {\n  const safeDescription = makeSafeEnglishDescription(product);\n  const safeLongDescription = makeSafeLongEnglishDescription(product);\n  const safeTitle = String(product.title || '').trim();\n  const keys = keywordSeed(product);\n  const hashtags = keys.slice(0, 8).map(value => '#' + value.replace(/[^A-Za-z0-9]+/g, '')).filter(value => value.length > 1);\n  const cleanGeneratedDescription = generated?.descriptionEn && !isRetailerBoilerplate(generated.descriptionEn)\n    ? generated.descriptionEn.trim()\n    : safeDescription;\n  const cleanGeneratedLong = generated?.longDescriptionEn && !isRetailerBoilerplate(generated.longDescriptionEn)\n    ? generated.longDescriptionEn.trim()\n    : safeLongDescription;\n\n  return {\n    ...(generated || {}),\n    titleEn: generated?.titleEn?.trim() || safeTitle,\n    descriptionEn: cleanGeneratedDescription,\n    longDescriptionEn: cleanGeneratedLong,\n    featuresEn: generated?.featuresEn?.length ? generated.featuresEn : (product.features || []),\n    specsEn: generated?.specsEn && Object.keys(generated.specsEn).length ? generated.specsEn : (product.specs || {}),\n    seoTitleEn: generated?.seoTitleEn?.trim() || compactText(safeTitle, 60),\n    seoDescriptionEn: generated?.seoDescriptionEn?.trim() || compactText(cleanGeneratedDescription || safeLongDescription, 155),\n    keywordsEn: generated?.keywordsEn?.length ? generated.keywordsEn : keys,\n    hashtagsEn: generated?.hashtagsEn?.length ? generated.hashtagsEn : hashtags,\n    titleAr: generated?.titleAr?.trim() || '',\n    descriptionAr: generated?.descriptionAr?.trim() || '',\n    longDescriptionAr: generated?.longDescriptionAr?.trim() || '',\n    featuresAr: generated?.featuresAr || [],\n    specsAr: generated?.specsAr || {},\n    seoTitleAr: generated?.seoTitleAr?.trim() || '',\n    seoDescriptionAr: generated?.seoDescriptionAr?.trim() || '',\n    keywordsAr: generated?.keywordsAr || [],\n    hashtagsAr: generated?.hashtagsAr || []\n  };\n};\n\nconst arabicSeoIsComplete = (copy: BilingualCopy | null | undefined): boolean => Boolean(\n  copy?.titleAr?.trim() &&\n  copy?.descriptionAr?.trim() &&\n  copy?.seoTitleAr?.trim() &&\n  copy?.seoDescriptionAr?.trim()\n);\n\nconst copyText = async (value: string) => {`,
    'copy helper insertion point'
  );
}

if (!source.includes('description: makeSafeEnglishDescription(extracted)')) {
  replaceOnce(
    `      const verifiedSource: ExtractedProduct = {\n        ...extracted,\n        price: typeof verified.price === 'number' ? verified.price : extracted.price,`,
    `      const verifiedSource: ExtractedProduct = {\n        ...extracted,\n        description: makeSafeEnglishDescription(extracted),\n        price: typeof verified.price === 'number' ? verified.price : extracted.price,`,
    'verified source description sanitation'
  );
}

if (!source.includes('const requestTextCopy = async')) {
  replaceOnce(
    `  const handleExtract = async () => {`,
    `  const requestTextCopy = async (product: ExtractedProduct): Promise<BilingualCopy> => {\n    let lastError = '';\n    for (let attempt = 1; attempt <= 2; attempt += 1) {\n      const { data: textResult, error: textError } = await supabase.functions.invoke('product-text-copy', {\n        body: { product }\n      });\n\n      if (!textError && textResult?.ok && textResult?.data) {\n        const completed = completeBilingualCopy(textResult.data as BilingualCopy, product);\n        if (arabicSeoIsComplete(completed) || attempt === 2) return completed;\n        lastError = 'رجعت خدمة النصوص نتيجة ناقصة، وتمت إعادة المحاولة تلقائياً.';\n      } else {\n        lastError = textError\n          ? await invokeErrorMessage(textError, 'تعذر إنشاء العربي وSEO.')\n          : String(textResult?.error || 'تعذر إنشاء العربي وSEO.');\n      }\n\n      if (attempt < 2) await new Promise(resolve => window.setTimeout(resolve, 650));\n    }\n\n    const fallback = completeBilingualCopy(null, product);\n    throw Object.assign(new Error(lastError || 'تعذر إنشاء العربي وSEO.'), { fallback });\n  };\n\n  const handleExtract = async () => {`,
    'text request helper insertion point'
  );
}

if (!source.includes('const completedCopy = await requestTextCopy(verifiedSource)')) {
  const oldBlock = `      // Text-only request. This intentionally does NOT call any image/video generator.\n      const { data: textResult, error: textError } = await supabase.functions.invoke('product-text-copy', {\n        body: { product: verifiedSource }\n      });\n\n      if (textError) {\n        setTextNotice(await invokeErrorMessage(\n          textError,\n          'تم استخراج بيانات المنتج الحقيقية، لكن تعذر إنشاء النسخة العربية/SEO.'\n        ));\n      } else if (textResult?.ok && textResult?.data) {\n        setBilingual(textResult.data as BilingualCopy);\n      } else if (textResult?.error) {\n        setTextNotice(String(textResult.error));\n      }`;

  const newBlock = `      // Text-only request. This intentionally does NOT call any image/video generator.\n      try {\n        const completedCopy = await requestTextCopy(verifiedSource);\n        setBilingual(completedCopy);\n        if (!arabicSeoIsComplete(completedCopy)) {\n          setTextNotice('تم تعبئة الإنجليزي وSEO الإنجليزي، لكن خدمة الترجمة رجعت بعض الحقول العربية ناقصة. اضغطي «إعادة توليد العربي وSEO».');\n        }\n      } catch (textFailure: any) {\n        setBilingual(completeBilingualCopy(textFailure?.fallback || null, verifiedSource));\n        setTextNotice((textFailure?.message || 'تعذر إنشاء العربي وSEO.') + ' تم الاحتفاظ بالبيانات الإنجليزية الموثقة بدون اختراع معلومات.');\n      }`;

  replaceOnce(oldBlock, newBlock, 'text generation handling block');
}

if (!source.includes('const handleRetryText = async')) {
  replaceOnce(
    `  const allData = useMemo(() => {`,
    `  const handleRetryText = async () => {\n    if (!source) return;\n    setLoading(true);\n    setTextNotice('');\n    try {\n      const copy = await requestTextCopy({ ...source, description: makeSafeEnglishDescription(source) });\n      setBilingual(copy);\n      setTextNotice(arabicSeoIsComplete(copy)\n        ? '✓ تم تحديث العربي والإنجليزي وSEO من البيانات الموثقة.'\n        : 'تمت إعادة المحاولة، لكن بعض حقول العربي ما زالت ناقصة. لن يتم حفظ منتج ناقص.');\n    } catch (retryError: any) {\n      setBilingual(previous => completeBilingualCopy(previous, source));\n      setTextNotice(retryError?.message || 'تعذر إعادة توليد العربي وSEO.');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const allData = useMemo(() => {`,
    'retry handler insertion point'
  );
}

if (!source.includes('إعادة توليد العربي وSEO')) {
  replaceOnce(
    `        {textNotice && (\n          <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">\n            {textNotice}\n          </div>\n        )}`,
    `        {textNotice && (\n          <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">\n            <div>{textNotice}</div>\n            {source && (\n              <button\n                type="button"\n                onClick={() => void handleRetryText()}\n                disabled={loading}\n                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"\n              >\n                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}\n                إعادة توليد العربي وSEO\n              </button>\n            )}\n          </div>\n        )}`,
    'text notice retry button'
  );
}

if (changed) {
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-cu-copy-quality] CU text sanitation, fallback, and retry enabled.');
} else {
  console.log('[patch-cu-copy-quality] Already applied.');
}
