import fs from 'node:fs';

const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let source = fs.readFileSync(adminFile, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) {
    throw new Error(`[patch-seo-text-hub] Could not find ${label}. AdminPage changed; refusing to guess.`);
  }
  source = source.replace(needle, replacement);
  changed = true;
};

if (!source.includes("import { SeoTextHub } from '../components/SeoTextHub';")) {
  replaceOnce(
    "import { AgentAutomationHub } from '../components/AgentAutomationHub';",
    "import { AgentAutomationHub } from '../components/AgentAutomationHub';\nimport { SeoTextHub } from '../components/SeoTextHub';",
    'AgentAutomationHub import'
  );
}

if (!source.includes("'seo-text'")) {
  replaceOnce(
    "'ai-assistant' | 'agent-hub' | 'workspace' | 'users'",
    "'ai-assistant' | 'seo-text' | 'agent-hub' | 'workspace' | 'users'",
    'activeTab union'
  );
}

if (!source.includes("setActiveTab('seo-text')")) {
  const workspaceButton = `        <button\n          onClick={() => setActiveTab('workspace')}`;
  const cuButton = `        <button\n          onClick={() => setActiveTab('seo-text')}\n          className={\`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border \${\n            activeTab === 'seo-text'\n              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border-emerald-400 font-black'\n              : 'bg-slate-900 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 hover:text-white'\n          }\`}\n          title=\"CU وبيانات المنتج والنصوص فقط — بدون توليد صور أو فيديو\"\n        >\n          <FileText className=\"w-4 h-4 text-emerald-400\" />\n          <span className=\"font-black\">📝 CU والنصوص</span>\n          <span className=\"px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] text-emerald-200 font-black\">TEXT ONLY</span>\n        </button>\n\n`;
  replaceOnce(workspaceButton, `${cuButton}${workspaceButton}`, 'workspace tab button');
}

// The navigation button and the content renderer are separate. Check the actual
// component, not merely the tab expression, so a visible button can never open
// an empty area again.
if (!source.includes('<SeoTextHub />')) {
  const agentRender = `      {activeTab === 'agent-hub' && (\n        <AgentAutomationHub />\n      )}`;
  const cuRender = `${agentRender}\n\n      {activeTab === 'seo-text' && (\n        <SeoTextHub />\n      )}`;
  replaceOnce(agentRender, cuRender, 'AgentAutomationHub render block');
}

if (changed) {
  fs.writeFileSync(adminFile, source, 'utf8');
  console.log('[patch-seo-text-hub] CU/text-only tab wired into AdminPage.');
} else {
  console.log('[patch-seo-text-hub] AdminPage already patched.');
}

// ---------------------------------------------------------------------------
// CU + text accuracy guardrails
// ---------------------------------------------------------------------------

const cuFile = new URL('../src/components/SeoTextHub.tsx', import.meta.url);
let cu = fs.readFileSync(cuFile, 'utf8');
let cuChanged = false;

const replaceCuOnce = (needle, replacement, label) => {
  if (!cu.includes(needle)) {
    throw new Error(`[patch-seo-text-hub] Could not find ${label}. SeoTextHub changed; refusing to guess.`);
  }
  cu = cu.replace(needle, replacement);
  cuChanged = true;
};

if (!cu.includes('type ProductVerification =')) {
  replaceCuOnce(
    `const invokeErrorMessage = async (error: any, fallback: string): Promise<string> => {`,
    `type ProductVerification = {\n  platform: string;\n  identityVerified: boolean;\n  identifier: string;\n  verificationSource: string;\n  affiliateVerified: boolean;\n  affiliateUrl: string;\n  price: number | null;\n  currency: string | null;\n  pagePrice: number | null;\n  pageCurrency?: string | null;\n  officialPrice: number | null;\n  officialCurrency?: string | null;\n  officialTitle: string;\n  officialBrand: string;\n  warnings: string[];\n};\n\nconst invokeErrorMessage = async (error: any, fallback: string): Promise<string> => {`,
    'ProductVerification type'
  );
}

if (!cu.includes('const amazonAsinFromLongUrl')) {
  replaceCuOnce(
    `const isAliHost = (host: string) => /aliexpress/i.test(host);`,
    `const isAliHost = (host: string) => /aliexpress/i.test(host);\n\nconst amazonAsinFromLongUrl = (value: string): string => {\n  const match = value.match(/\\/(?:dp|gp\\/product|gp\\/aw\\/d)\\/([A-Z0-9]{10})/i)\n    ?? value.match(/[?&](?:asin|pd_rd_i)=([A-Z0-9]{10})/i);\n  return match?.[1]?.toUpperCase() || '';\n};\n\nconst aliItemIdFromLongUrl = (value: string): string => {\n  const match = value.match(/\\/(?:item|i)\\/(?:[\\w-]+\\/)?(\\d{8,})\\.html/i)\n    ?? value.match(/[?&](?:productId|itemId)=(\\d{8,})/i);\n  return match?.[1] || '';\n};\n\nconst validateLongProductUrl = (raw: string) => {\n  const parsed = new URL(raw);\n  const host = parsed.hostname.toLowerCase();\n  if (['amzn.to', 'amzn.eu', 'a.co'].includes(host)) {\n    throw new Error('استخدمي رابط Amazon الطويل من شريط المتصفح، وليس الرابط المختصر، حتى يتم التحقق من ASIN والسعر ورابط الأفلييت.');\n  }\n  if (/(^|\\.)amazon\\./i.test(host)) {\n    const asin = amazonAsinFromLongUrl(raw);\n    if (!asin) throw new Error('هذا ليس رابط صفحة منتج Amazon طويل واضح. افتحي المنتج نفسه وانسخي الرابط من شريط المتصفح بالأعلى.');\n    return { platform: 'amazon', identifier: asin };\n  }\n  if (isAliHost(host)) {\n    const itemId = aliItemIdFromLongUrl(raw);\n    if (!itemId) throw new Error('هذا ليس رابط صفحة منتج AliExpress طويل واضح. انسخي رابط المنتج نفسه من شريط المتصفح.');\n    return { platform: 'aliexpress', identifier: itemId };\n  }\n  throw new Error('أداة CU والنصوص تقبل حالياً روابط Amazon أو AliExpress الطويلة المباشرة فقط.');\n};`,
    'long URL validation helpers'
  );
}

if (!cu.includes('const [verification, setVerification]')) {
  replaceCuOnce(
    `  const [affiliateUrl, setAffiliateUrl] = useState('');`,
    `  const [affiliateUrl, setAffiliateUrl] = useState('');\n  const [verification, setVerification] = useState<ProductVerification | null>(null);`,
    'verification state'
  );
}

if (cu.includes('  const buildAffiliateUrl = (raw: string, extracted: ExtractedProduct): string => {')) {
  const start = cu.indexOf('  const buildAffiliateUrl = (raw: string, extracted: ExtractedProduct): string => {');
  const endMarker = '\n\n  const handleExtract = async () => {';
  const end = cu.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('[patch-seo-text-hub] Could not isolate old affiliate builder.');
  cu = cu.slice(0, start) + '  // Affiliate links are now returned only after server-side product verification.\n' + cu.slice(end);
  cuChanged = true;
}

if (!cu.includes('setVerification(null);')) {
  replaceCuOnce(
    `    setAffiliateUrl('');`,
    `    setAffiliateUrl('');\n    setVerification(null);`,
    'verification reset'
  );
}

if (!cu.includes("supabase.functions.invoke('product-verify'")) {
  replaceCuOnce(
    `    setLoading(true);\n    try {\n      const { data: extractResult, error: extractError } = await supabase.functions.invoke('product-extract', {`,
    `    setLoading(true);\n    try {\n      // The new CU tool intentionally accepts the full direct product URL from\n      // the browser address bar. Short/ambiguous links are rejected before any\n      // price or affiliate URL is shown.\n      validateLongProductUrl(raw);\n\n      const { data: extractResult, error: extractError } = await supabase.functions.invoke('product-extract', {`,
    'pre-extraction URL validation'
  );

  replaceCuOnce(
    `      const extracted = extractResult.data as ExtractedProduct;\n      setSource(extracted);\n      setAffiliateUrl(buildAffiliateUrl(raw, extracted));\n\n      // Text-only request. This intentionally does NOT call any image/video generator.\n      const { data: textResult, error: textError } = await supabase.functions.invoke('product-text-copy', {\n        body: { product: extracted }\n      });`,
    `      const extracted = extractResult.data as ExtractedProduct;\n\n      // Second independent pass: prove that the ASIN / Item ID in the pasted\n      // browser URL is the exact same identifier returned by the extractor.\n      // When affiliate APIs are configured, they also verify the official offer\n      // and return the official promotion/detail URL. A mismatch stops here.\n      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('product-verify', {\n        body: {\n          url: raw,\n          extracted,\n          amazonTag: siteSettings.amazonTag || '',\n          aliexpressTag: siteSettings.aliexpressTag || ''\n        }\n      });\n\n      if (verifyError) {\n        throw new Error(await invokeErrorMessage(verifyError, 'تعذر التحقق من هوية المنتج. لم يتم اعتماد السعر أو رابط الأفلييت.'));\n      }\n      if (!verifyResult?.ok || !verifyResult?.data) {\n        throw new Error(verifyResult?.error || 'تعذر التحقق من هوية المنتج.');\n      }\n\n      const verified = verifyResult.data as ProductVerification;\n      if (!verified.identityVerified) {\n        throw new Error('لم يتم تأكيد تطابق المنتج مع الرابط. لم يتم عرض البيانات.');\n      }\n\n      const verifiedSource: ExtractedProduct = {\n        ...extracted,\n        price: typeof verified.price === 'number' ? verified.price : extracted.price,\n        currency: verified.currency || extracted.currency,\n        warnings: [...(extracted.warnings || []), ...(verified.warnings || [])]\n      };\n\n      setVerification(verified);\n      setSource(verifiedSource);\n      setAffiliateUrl(verified.affiliateUrl || '');\n\n      // Text-only request. This intentionally does NOT call any image/video generator.\n      const { data: textResult, error: textError } = await supabase.functions.invoke('product-text-copy', {\n        body: { product: verifiedSource }\n      });`,
    'server-side verification step'
  );
}

if (!cu.includes('verificationSource: verification?.verificationSource')) {
  replaceCuOnce(
    `      affiliateUrl,\n      platform: source.platform,`,
    `      affiliateUrl,\n      identityVerified: verification?.identityVerified ?? false,\n      verificationSource: verification?.verificationSource || '',\n      affiliateVerified: verification?.affiliateVerified ?? false,\n      pagePrice: verification?.pagePrice ?? null,\n      officialPrice: verification?.officialPrice ?? null,\n      platform: source.platform,`,
    'verification fields in JSON output'
  );
  replaceCuOnce(
    `  }, [source, bilingual, affiliateUrl, discountPercent]);`,
    `  }, [source, bilingual, affiliateUrl, discountPercent, verification]);`,
    'allData dependency list'
  );
}

cu = cu
  .replace('<h2 className="text-2xl font-black text-white">SEO والنصوص</h2>', '<h2 className="text-2xl font-black text-white">CU والنصوص</h2>')
  .replace('الصقي رابط المنتج لجلب البيانات الحقيقية والسعر والكوبون ورابط الأفلييت والنص العربي والإنجليزي وبيانات SEO.', 'الصقي رابط المنتج الطويل من شريط المتصفح لجلب CU وبيانات المنتج الحقيقية والسعر والكوبون ورابط الأفلييت والنص العربي والإنجليزي وبيانات SEO.')
  .replace('placeholder="الصقي رابط Amazon أو AliExpress هنا..."', 'placeholder="الصقي رابط المنتج الطويل من شريط المتصفح هنا..."')
  .replace("{loading ? 'جاري الجلب...' : 'جلب البيانات والنصوص'}", "{loading ? 'جاري التحقق والجلب...' : 'جلب CU والبيانات والنصوص'}")
  .replace("anchor.download = `${source?.asin || source?.itemId || 'product'}-seo-text.json`;", "anchor.download = `${source?.asin || source?.itemId || 'product'}-cu-text.json`;");

if (!cu.includes('هوية المنتج مؤكدة')) {
  replaceCuOnce(
    `      {source && (\n        <>`,
    `      {source && (\n        <>\n          {verification?.identityVerified && (\n            <div className=\"rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-100\">\n              <div className=\"font-black text-emerald-300\">✓ هوية المنتج مؤكدة</div>\n              <div className=\"mt-1 text-xs\">\n                تم مطابقة {verification.platform === 'amazon' ? 'ASIN' : 'Item ID'}: <span className=\"font-mono font-black text-white\">{verification.identifier}</span>.\n                مصدر التحقق: <span className=\"text-white\">{verification.verificationSource}</span>.\n              </div>\n            </div>\n          )}`,
    'verification success banner'
  );
}

if (!cu.includes('Official/API Price:')) {
  replaceCuOnce(
    `            <div>Reviews: <span className="text-white">{source.reviewCount ?? '—'}</span></div>`,
    `            <div>Reviews: <span className="text-white">{source.reviewCount ?? '—'}</span></div>\n            <div>Page Price: <span className=\"text-white\">{verification?.pagePrice ?? '—'} {verification?.pageCurrency || source.currency}</span></div>\n            <div>Official/API Price: <span className=\"text-white\">{verification?.officialPrice ?? '—'} {verification?.officialCurrency || ''}</span></div>\n            <div>Affiliate link: <span className={verification?.affiliateVerified ? 'text-emerald-300' : 'text-amber-300'}>{verification?.affiliateVerified ? 'مؤكد من Affiliate API' : 'غير مؤكد من API — راجعي التحذير'}</span></div>`,
    'verification details block'
  );
}

cu = cu.replace('فتح رابط الأفلييت', "{verification?.affiliateVerified ? 'فتح رابط الأفلييت المؤكد' : 'فتح رابط المنتج'}");

if (cuChanged || cu.includes('CU والنصوص')) {
  fs.writeFileSync(cuFile, cu, 'utf8');
  console.log('[patch-seo-text-hub] CU/text accuracy checks applied.');
}
