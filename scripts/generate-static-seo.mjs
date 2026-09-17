import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://yousrasmile.com';
const SUPABASE_URL = 'https://iicvasloytbjotbgbvjt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aMazQgFRFomsVGyuZF0cKg_Fn5fhH96';

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  throw new Error('[generate-static-seo] dist/index.html is missing. Run the Vite build first.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const normalizeSlug = value =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90) || 'product';

const productSlug = product => `${normalizeSlug(product.titleEn || product.titleAr || product.id)}--${encodeURIComponent(product.id)}`;
const productPath = product => `/product/${productSlug(product)}`;
const absoluteProductUrl = product => `${ORIGIN}${productPath(product)}`;

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const compact = (value, max) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
};

const replaceMeta = (html, selector, content) => {
  const escaped = escapeHtml(content);
  const separator = selector.indexOf(':');
  const kind = separator >= 0 ? selector.slice(0, separator) : 'name';
  const key = separator >= 0 ? selector.slice(separator + 1) : selector;
  const attr = kind === 'property' ? 'property' : 'name';
  const regex = new RegExp(`<meta\\s+${attr}=["']${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
};

const setCanonical = (html, url) => {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}" />`;
  return /<link\s+rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag)
    : html.replace('</head>', `  ${tag}\n</head>`);
};

const setTitle = (html, title) => html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

const injectVerification = html => {
  const token = String(process.env.GOOGLE_SITE_VERIFICATION || '').trim();
  if (!token || html.includes('google-site-verification')) return html;
  return html.replace('</head>', `  <meta name="google-site-verification" content="${escapeHtml(token)}" />\n</head>`);
};

const writeRoute = (route, html) => {
  const relative = route.replace(/^\/+|\/+$/g, '');
  const dir = relative ? path.join(DIST, relative) : DIST;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
};

const baseTemplate = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const nowIso = new Date().toISOString();

const { data: rows, error } = await supabase
  .from('products')
  .select('id,data,updated_at')
  .order('updated_at', { ascending: false });

if (error) throw new Error(`[generate-static-seo] Could not read public products from Supabase: ${error.message}`);

const products = (rows || [])
  .map(row => ({ ...(row.data || {}), id: row.id, _updatedAt: row.updated_at || nowIso }))
  .filter(product => product && product.id && product.isActive !== false && !product.isHidden);

if (!products.length) {
  throw new Error('[generate-static-seo] Public product catalog is empty; refusing to publish an empty sitemap.');
}

const pageDefinitions = [
  ['/', 'Yousra Smile | يسرى سمايل - Smart Home, Kitchen & Lifestyle Picks', 'Curated smart-home, kitchen, cleaning, lifestyle and personal-care product reviews, deals and buying links.'],
  ['/products', 'Smart Products Catalog & Reviews | Yousra Smile', 'Browse Yousra Smile product reviews, specifications, current retailer pricing and buying links.'],
  ['/videos', 'Product Video Reviews | Yousra Smile', 'Watch product demonstrations and video reviews for smart-home, kitchen and lifestyle products.'],
  ['/deals', 'Current Deals & Coupons | Yousra Smile', 'Browse current product deals, discounts and coupons from supported retailers.'],
  ['/compare', 'Compare Products | Yousra Smile', 'Compare product prices, specifications and features side by side.'],
  ['/about', 'About Yousra Smile | من نحن', 'Learn about Yousra Smile and how products, reviews and affiliate links are selected.'],
  ['/contact', 'Contact Yousra Smile | اتصل بنا', 'Contact Yousra Smile for questions, feedback and collaboration.'],
  ['/privacy', 'Privacy Policy | Yousra Smile', 'Read the Yousra Smile privacy policy.'],
  ['/terms', 'Terms of Use | Yousra Smile', 'Read the Yousra Smile terms of use.'],
  ['/cookies', 'Cookie Policy | Yousra Smile', 'Read the Yousra Smile cookie policy.'],
  ['/disclosure', 'Affiliate Disclosure | Yousra Smile', 'Yousra Smile affiliate disclosure for retailer links and qualifying purchases.']
];

for (const [route, title, description] of pageDefinitions) {
  let html = baseTemplate;
  html = setTitle(html, title);
  html = replaceMeta(html, 'name:description', compact(description, 160));
  html = replaceMeta(html, 'property:og:title', title);
  html = replaceMeta(html, 'property:og:description', compact(description, 200));
  html = replaceMeta(html, 'property:og:url', `${ORIGIN}${route === '/' ? '/' : route}`);
  html = replaceMeta(html, 'name:twitter:title', title);
  html = replaceMeta(html, 'name:twitter:description', compact(description, 200));
  html = setCanonical(html, `${ORIGIN}${route === '/' ? '/' : route}`);
  html = injectVerification(html);
  if (route !== '/') writeRoute(route, html);
  else fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
}

for (const product of products) {
  const titleEn = String(product.titleEn || product.titleAr || product.brand || 'Product').trim();
  const titleAr = String(product.titleAr || '').trim();
  const pageTitle = compact(`${titleEn} | Review, Price & Details | Yousra Smile`, 66);
  const rawDescription = product.descriptionEn || product.longDescriptionEn || product.description || product.longDescription || '';
  const description = compact(rawDescription || `Review ${titleEn}, specifications, current price and retailer buying options on Yousra Smile.`, 158);
  const canonical = absoluteProductUrl(product);
  const image = String(product.image || (Array.isArray(product.images) ? product.images[0] : '') || '').trim();
  const price = Number(product.discountPrice || product.originalPrice || 0);
  const currency = String(product.currency || 'USD');
  const affiliateUrl = String(product.amazonUrl || product.aliexpressUrl || product.sourceProductUrl || '').trim();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: titleEn,
    ...(titleAr ? { alternateName: titleAr } : {}),
    description,
    ...(image ? { image: [image, ...(Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 7) : [])] } : {}),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    sku: product.id,
    ...(Number(product.rating) > 0 && Number(product.reviewCount) > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(product.rating),
        reviewCount: Number(product.reviewCount),
        bestRating: 5,
        worstRating: 1
      }
    } : {}),
    ...(price > 0 && affiliateUrl ? {
      offers: {
        '@type': 'Offer',
        url: affiliateUrl,
        priceCurrency: currency,
        price: price.toFixed(2),
        itemCondition: 'https://schema.org/NewCondition'
      }
    } : {})
  };

  const features = (product.featuresEn?.length ? product.featuresEn : product.features || []).filter(Boolean).slice(0, 8);
  const specs = Object.entries(product.specsEn && Object.keys(product.specsEn).length ? product.specsEn : product.specs || {}).slice(0, 12);
  const fallbackArticle = `<article style="max-width:960px;margin:0 auto;padding:32px 20px;color:#f8fafc;background:#0d0714;font-family:Arial,sans-serif;line-height:1.7"><nav><a href="/products" style="color:#facc15">Yousra Smile Products</a></nav><h1>${escapeHtml(titleEn)}</h1>${titleAr ? `<h2 dir="rtl">${escapeHtml(titleAr)}</h2>` : ''}${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(titleEn)}" width="720" height="720" style="max-width:100%;height:auto;border-radius:18px" />` : ''}<p>${escapeHtml(description)}</p>${price > 0 ? `<p><strong>Current listed price:</strong> ${escapeHtml(currency)} ${escapeHtml(price.toFixed(2))}</p>` : ''}${features.length ? `<h2>Key features</h2><ul>${features.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}${specs.length ? `<h2>Specifications</h2><dl>${specs.map(([key, value]) => `<dt><strong>${escapeHtml(key)}</strong></dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>` : ''}<p><small>Affiliate disclosure: Yousra Smile may earn a commission from qualifying purchases through retailer links, at no additional cost to you.</small></p></article>`;

  let html = baseTemplate;
  html = setTitle(html, pageTitle);
  html = replaceMeta(html, 'name:description', description);
  html = replaceMeta(html, 'name:robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  html = replaceMeta(html, 'property:og:type', 'product');
  html = replaceMeta(html, 'property:og:title', pageTitle);
  html = replaceMeta(html, 'property:og:description', description);
  html = replaceMeta(html, 'property:og:url', canonical);
  if (image) html = replaceMeta(html, 'property:og:image', image);
  html = replaceMeta(html, 'name:twitter:title', pageTitle);
  html = replaceMeta(html, 'name:twitter:description', description);
  if (image) html = replaceMeta(html, 'name:twitter:image', image);
  html = setCanonical(html, canonical);
  html = html.replace('</head>', `  <script type="application/ld+json">${safeJson(schema)}</script>\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${fallbackArticle}</div>`);
  html = injectVerification(html);
  writeRoute(productPath(product), html);
}

const sitemapEntries = [
  ...pageDefinitions.map(([route]) => ({
    loc: `${ORIGIN}${route === '/' ? '/' : route}`,
    lastmod: nowIso
  })),
  ...products.map(product => ({ loc: absoluteProductUrl(product), lastmod: product._updatedAt || nowIso }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(entry => `  <url>\n    <loc>${escapeHtml(entry.loc)}</loc>\n    <lastmod>${escapeHtml(new Date(entry.lastmod).toISOString())}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://yousrasmile.com/sitemap.xml\n', 'utf8');

console.log(`[generate-static-seo] Generated ${products.length} product pages and ${sitemapEntries.length} sitemap URLs.`);
