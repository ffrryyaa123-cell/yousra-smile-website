import { supabase } from './adminAccount';
import { Product } from '../types';

/**
 * Permanent storage for generated product videos.
 *
 * Before this module the renderer handed back a `blob:` URL — a pointer into one
 * browser tab's memory. It played once, then vanished on reload and never
 * existed for anyone else. Everything here exists to turn that blob into a URL
 * that outlives the tab.
 */

const BUCKET = 'product-videos';

export const SUPABASE_PROJECT_URL = 'https://iicvasloytbjotbgbvjt.supabase.co';

/**
 * Rewrites a remote image URL so it is fetched through our own edge function.
 *
 * Amazon and AliExpress serve product photos without CORS headers. Painting one
 * onto a canvas either fails outright or taints the canvas, and a tainted canvas
 * makes MediaRecorder refuse to produce a file. Routing through the proxy gives
 * the browser a same-origin-friendly copy, so the real product photo reaches the
 * video. Data URLs and blobs are already local and pass through untouched.
 */
export const proxiedImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('/functions/v1/media-proxy')) return url;
  if (!/^https?:\/\//i.test(url)) return url;
  return `${SUPABASE_PROJECT_URL}/functions/v1/media-proxy?url=${encodeURIComponent(url)}`;
};

export interface StoredVideoAsset {
  /** Public, permanent URL of the uploaded file. */
  videoUrl: string;
  /** Path inside the bucket, kept so the file can be replaced or removed later. */
  storagePath: string;
  sizeBytes: number;
  contentType: string;
}

/**
 * Uploads a rendered video to Supabase Storage and returns its permanent URL.
 * Throws with a readable Arabic message — the caller decides whether to keep the
 * temporary blob URL as a stopgap.
 */
export const uploadProductVideo = async (
  productId: string,
  blob: Blob,
  options: { aspectRatio?: string; replacePath?: string } = {}
): Promise<StoredVideoAsset> => {
  if (!blob || blob.size === 0) {
    throw new Error('ملف الفيديو فارغ، لم يتم الرفع.');
  }

  const contentType = blob.type || 'video/webm';
  const extension = contentType.includes('mp4') ? 'mp4' : 'webm';
  const safeId = String(productId || 'product').replace(/[^a-zA-Z0-9_-]/g, '-');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ratio = (options.aspectRatio ?? '9-16').replace(':', '-');
  const storagePath = options.replacePath ?? `${safeId}/${stamp}-${ratio}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, blob, {
    contentType,
    upsert: Boolean(options.replacePath),
    cacheControl: '31536000'
  });

  if (error) {
    // The most common cause is a missing dashboard session — RLS on the bucket
    // only lets an active admin write.
    if (/row-level security|not authorized|jwt/i.test(error.message)) {
      throw new Error('تعذر رفع الفيديو: سجّلي الدخول إلى لوحة التحكم بالبريد وكلمة المرور ثم أعيدي المحاولة.');
    }
    throw new Error(`تعذر رفع الفيديو: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return {
    videoUrl: data.publicUrl,
    storagePath,
    sizeBytes: blob.size,
    contentType
  };
};

/** Removes a stored video file. Never throws — deletion is best effort. */
export const deleteProductVideo = async (storagePath: string): Promise<void> => {
  try {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  } catch (error) {
    console.warn('Could not remove stored video:', error);
  }
};

export interface VideoRecord {
  id: string;
  productId: string;
  videoUrl: string;
  storagePath: string;
  thumbnailUrl: string;
  durationSeconds: number;
  aspectRatio: string;
  title: string;
  caption: string;
  hashtags: string[];
  affiliateUrl: string;
  createdAt: string;
}

/**
 * Saves the video's metadata next to the file so the catalog can find it again
 * from any browser. The `videos` table stores its payload in a jsonb column.
 */
export const saveVideoRecord = async (record: VideoRecord): Promise<void> => {
  const { error } = await supabase.from('videos').upsert(
    {
      id: record.id,
      product_id: record.productId,
      data: record as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`تعذر حفظ بيانات الفيديو: ${error.message}`);
};

/** Every stored video for one product, newest first. */
export const listVideosForProduct = async (productId: string): Promise<VideoRecord[]> => {
  const { data, error } = await supabase
    .from('videos')
    .select('data')
    .eq('product_id', productId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(row => row.data as unknown as VideoRecord);
};

/**
 * The affiliate link that belongs to a product, taken from the product record
 * exactly as it was saved.
 *
 * The owner copies these from Amazon's SiteStripe on the product's own page, so
 * the saved string already carries the right ASIN and the right tracking id.
 * Rebuilding it would only risk pointing at the wrong item, so nothing here
 * edits, normalises or invents a URL — a missing link is reported, never faked.
 */
export const resolveAffiliateUrl = (product: Pick<Product, 'amazonUrl' | 'aliexpressUrl'>): string => {
  const candidate = (product.amazonUrl || product.aliexpressUrl || '').trim();
  if (!candidate || !/^https?:\/\//i.test(candidate)) {
    throw new Error(
      'لا يوجد رابط أفلييت محفوظ لهذا المنتج. افتحي صفحة المنتج على أمازون وانسخي رابطك من SiteStripe، ثم ضعيه في بيانات المنتج قبل توليد الفيديو.'
    );
  }
  if (/\/dp\/B08SAMPLE|B0SAMPLE|example\.com/i.test(candidate)) {
    throw new Error('رابط الأفلييت المحفوظ رابط تجريبي وليس رابطاً حقيقياً. استبدليه برابطك من أمازون أولاً.');
  }
  return candidate;
};
