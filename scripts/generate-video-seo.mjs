import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://yousrasmile.com';
const SUPABASE_URL = 'https://iicvasloytbjotbgbvjt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aMazQgFRFomsVGyuZF0cKg_Fn5fhH96';
const sitemapPath = path.join(DIST, 'sitemap.xml');

if (!fs.existsSync(path.join(DIST, 'index.html')) || !fs.existsSync(sitemapPath)) {
  throw new Error('[generate-video-seo] Build and base sitemap must exist first.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const compact = (value, max) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
};
const normalizeSlug = value => String(value || '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
  .replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-').slice(0, 80) || 'video';
const videoPath = video => `/video/${normalizeSlug(video.title || video.productTitle || video.id)}--${encodeURIComponent(video.id)}`;
const absoluteVideoUrl = video => `${ORIGIN}${videoPath(video)}`;
const isoDuration = value => {
  const match = String(value || '').match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;
  const hours = Number(match[1] || 0), minutes = Number(match[2] || 0), seconds = Number(match[3] || 0);
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds}S`;
};
const safeIsoDate = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
};
const writeRoute = (route, html) => {
  const dir = path.join(DIST, route.replace(/^\/+|\/+$/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
};

const [{ data: videoRows, error: videoError }, { data: productRows, error: productError }] = await Promise.all([
  supabase.from('videos').select('id,data,updated_at').order('updated_at', { ascending: false }),
  supabase.from('products').select('id,data')
]);
if (videoError) throw new Error(`[generate-video-seo] Could not read videos: ${videoError.message}`);
if (productError) throw new Error(`[generate-video-seo] Could not read products: ${productError.message}`);

const products = new Map((productRows || []).map(row => [row.id, { ...(row.data || {}), id: row.id }]));
const videos = (videoRows || []).map(row => ({ ...(row.data || {}), id: row.id, _updatedAt: row.updated_at }))
  .filter(video => video.id && /^https:\/\//i.test(String(video.videoUrl || '')));

const baseTemplate = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const videoSitemapEntries = [];

for (const video of videos) {
  const product = products.get(video.productId) || {};
  const title = compact(video.title || `Video review: ${video.productTitle || product.titleEn || product.titleAr || 'Product'}`, 100);
  const description = compact(video.seoDescription || product.descriptionEn || product.description || `Watch ${title} on Yousra Smile.`, 180);
  const thumbnail = String(video.thumbnailUrl || video.productImage || product.image || (Array.isArray(product.images) ? product.images[0] : '') || '').trim();
  if (!thumbnail) continue;
  const uploadDate = safeIsoDate(video.date, video._updatedAt, Date.now());
  const canonical = absoluteVideoUrl(video);
  const duration = isoDuration(video.duration);
  const schema = {
    '@context': 'https://schema.org', '@type': 'VideoObject',
    name: title, description, thumbnailUrl: [thumbnail], uploadDate,
    contentUrl: video.videoUrl,
    ...(duration ? { duration } : {})
  };
  const player = `<main style="max-width:960px;margin:0 auto;padding:28px 18px;background:#0d0714;color:#f8fafc;font-family:Arial,sans-serif;line-height:1.65"><nav><a href="/videos" style="color:#facc15">Yousra Smile Videos</a></nav><h1>${escapeHtml(title)}</h1><video controls preload="metadata" poster="${escapeHtml(thumbnail)}" style="display:block;width:100%;max-height:75vh;background:#000;border-radius:18px" src="${escapeHtml(video.videoUrl)}"></video><p>${escapeHtml(description)}</p>${video.productId ? `<p><a href="/products" style="color:#facc15">View product catalog</a></p>` : ''}</main>`;

  let html = baseTemplate;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(compact(`${title} | Yousra Smile`, 65))}</title>`);
  html = html.replace('</head>', `  <meta name="description" content="${escapeHtml(description)}" />\n  <meta name="robots" content="index, follow, max-video-preview:-1, max-image-preview:large" />\n  <link rel="canonical" href="${escapeHtml(canonical)}" />\n  <meta property="og:type" content="video.other" />\n  <meta property="og:title" content="${escapeHtml(title)}" />\n  <meta property="og:description" content="${escapeHtml(description)}" />\n  <meta property="og:image" content="${escapeHtml(thumbnail)}" />\n  <meta property="og:video" content="${escapeHtml(video.videoUrl)}" />\n  <script type="application/ld+json">${safeJson(schema)}</script>\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${player}</div>`);
  writeRoute(videoPath(video), html);
  videoSitemapEntries.push({ loc: canonical, title, description, thumbnail, content: video.videoUrl, uploadDate, duration: duration || '' });
}

let sitemap = fs.readFileSync(sitemapPath, 'utf8');
sitemap = sitemap.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">');
const xmlEntries = videoSitemapEntries.map(v => `  <url>\n    <loc>${escapeHtml(v.loc)}</loc>\n    <video:video>\n      <video:thumbnail_loc>${escapeHtml(v.thumbnail)}</video:thumbnail_loc>\n      <video:title>${escapeHtml(v.title)}</video:title>\n      <video:description>${escapeHtml(v.description)}</video:description>\n      <video:content_loc>${escapeHtml(v.content)}</video:content_loc>\n      <video:publication_date>${escapeHtml(v.uploadDate)}</video:publication_date>\n    </video:video>\n  </url>`).join('\n');
sitemap = sitemap.replace('\n</urlset>', `${xmlEntries ? `\n${xmlEntries}` : ''}\n</urlset>`);
fs.writeFileSync(sitemapPath, sitemap, 'utf8');

console.log(`[generate-video-seo] Generated ${videoSitemapEntries.length} indexable video watch pages from ${videos.length} public video records.`);
