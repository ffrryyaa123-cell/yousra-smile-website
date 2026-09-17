import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DIST = path.join(process.cwd(), 'dist');
const ORIGIN = 'https://yousrasmile.com';
const SUPABASE_URL = 'https://iicvasloytbjotbgbvjt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aMazQgFRFomsVGyuZF0cKg_Fn5fhH96';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const xml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const compact = (value, max) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
};

const normalizeSlug = value => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-')
  .slice(0, 90) || 'product';

const [{ data: productRows, error: productError }, { data: videoRows, error: videoError }] = await Promise.all([
  supabase.from('products').select('id,data,updated_at'),
  supabase.from('videos').select('id,data,updated_at').order('updated_at', { ascending: false })
]);

if (productError) throw new Error(`[video-sitemap] products: ${productError.message}`);
if (videoError) throw new Error(`[video-sitemap] videos: ${videoError.message}`);

const products = new Map((productRows || []).map(row => [row.id, { ...(row.data || {}), id: row.id }]));
const entries = [];
let skipped = 0;

for (const row of videoRows || []) {
  const video = { ...(row.data || {}), id: row.id };
  const product = products.get(video.productId);
  const contentUrl = String(video.videoUrl || '').trim();
  const thumbnail = String(video.thumbnailUrl || video.productImage || product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || '').trim();
  if (!product || !contentUrl || !thumbnail) {
    skipped += 1;
    continue;
  }

  const productTitle = String(product.titleEn || product.titleAr || video.productTitle || 'Product').trim();
  const slug = `${normalizeSlug(product.titleEn || product.titleAr || product.id)}--${encodeURIComponent(product.id)}`;
  const landingUrl = `${ORIGIN}/product/${slug}`;
  const title = compact(video.title || `Video review: ${productTitle}`, 100);
  const description = compact(video.seoDescription || product.descriptionEn || product.description || `Product demonstration and review for ${productTitle} on Yousra Smile.`, 2000);
  const publicationDate = String(video.date || row.updated_at || '').trim();

  entries.push(`  <url>\n    <loc>${xml(landingUrl)}</loc>\n    <video:video>\n      <video:thumbnail_loc>${xml(thumbnail)}</video:thumbnail_loc>\n      <video:title>${xml(title)}</video:title>\n      <video:description>${xml(description)}</video:description>\n      <video:content_loc>${xml(contentUrl)}</video:content_loc>${publicationDate ? `\n      <video:publication_date>${xml(new Date(publicationDate).toISOString())}</video:publication_date>` : ''}\n    </video:video>\n  </url>`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${entries.join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(DIST, 'video-sitemap.xml'), sitemap, 'utf8');
console.log(`[video-sitemap] Generated ${entries.length} video entries; skipped ${skipped} missing product/content/thumbnail requirements.`);
