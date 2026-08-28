import { supabase, SUPABASE_PUBLISHABLE_KEY } from './adminAccount';
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

/** Largest file the bucket accepts, mirrored here so the UI can refuse early. */
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

/**
 * Uploads a video the owner picked from her own computer, reporting real
 * progress as the bytes go up.
 *
 * The Supabase JS client has no progress callback, and a 200 MB upload with no
 * feedback looks identical to one that has frozen — so this posts to the storage
 * REST endpoint through XMLHttpRequest, whose upload events give a true
 * percentage. Same bucket, same row level security as every other upload here.
 */
export const uploadLocalVideo = async (
  productId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<StoredVideoAsset> => {
  if (!file || file.size === 0) {
    throw new Error('الملف فارغ أو تالف. اختاري ملفاً آخر.');
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      `حجم الملف ${(file.size / 1048576).toFixed(0)} ميغابايت، والحد الأقصى ${MAX_VIDEO_BYTES / 1048576} ميغابايت. اضغطي الفيديو ثم أعيدي المحاولة.`
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('انتهت جلسة الدخول. سجّلي الدخول إلى لوحة التحكم بالبريد وكلمة المرور ثم أعيدي المحاولة.');
  }

  const contentType = file.type || 'video/mp4';
  const extension = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const safeId = String(productId || 'product').replace(/[^a-zA-Z0-9_-]/g, '-');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const storagePath = `${safeId}/upload-${stamp}.${extension}`;

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${SUPABASE_PROJECT_URL}/storage/v1/object/${BUCKET}/${storagePath}`, true);
    request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    request.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
    request.setRequestHeader('Content-Type', contentType);
    request.setRequestHeader('x-upsert', 'true');
    request.setRequestHeader('cache-control', '31536000');

    request.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      // Storage returns a JSON body describing why it refused.
      let detail = '';
      try {
        detail = JSON.parse(request.responseText)?.message ?? '';
      } catch {
        detail = request.responseText?.slice(0, 200) ?? '';
      }
      if (request.status === 403 || /row-level security/i.test(detail)) {
        reject(new Error('ليس لديك صلاحية الرفع. تأكدي أنك داخلة بحساب المالك بالبريد وكلمة المرور.'));
      } else if (request.status === 413 || /exceeded|too large/i.test(detail)) {
        reject(new Error('الملف أكبر من الحد المسموح. اضغطي الفيديو ثم أعيدي المحاولة.'));
      } else if (/mime type/i.test(detail)) {
        reject(new Error('صيغة الملف غير مدعومة. استخدمي MP4 أو WebM أو MOV.'));
      } else {
        reject(new Error(detail || `تعذر رفع الفيديو (رمز ${request.status}).`));
      }
    };

    request.onerror = () => reject(new Error('انقطع الاتصال أثناء الرفع. تحققي من الإنترنت وأعيدي المحاولة.'));
    request.onabort = () => reject(new Error('تم إلغاء الرفع.'));

    request.send(file);
  });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return {
    videoUrl: data.publicUrl,
    storagePath,
    sizeBytes: file.size,
    contentType
  };
};

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Uploads one product image the owner picked from her own computer.
 *
 * Product photos previously had to be pasted in as URLs, which meant every
 * image had to already live somewhere else on the internet — and in practice
 * that "somewhere else" was the seller's own site, with the rights questions
 * that brings. Hosting them here makes the catalog self-contained.
 */
export const uploadLocalImage = async (
  productId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<StoredVideoAsset> => {
  if (!file || file.size === 0) {
    throw new Error('الصورة فارغة أو تالفة. اختاري ملفاً آخر.');
  }
  if (!/^image\//.test(file.type)) {
    throw new Error('هذا الملف ليس صورة. استخدمي JPG أو PNG أو WebP.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `حجم الصورة ${(file.size / 1048576).toFixed(1)} ميغابايت، والحد الأقصى ${MAX_IMAGE_BYTES / 1048576} ميغابايت.`
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('انتهت جلسة الدخول. سجّلي الدخول بالبريد وكلمة المرور ثم أعيدي المحاولة.');
  }

  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const safeId = String(productId || 'product').replace(/[^a-zA-Z0-9_-]/g, '-');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = Math.random().toString(36).slice(2, 7);
  const storagePath = `${safeId}/images/${stamp}-${suffix}.${extension}`;

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${SUPABASE_PROJECT_URL}/storage/v1/object/${BUCKET}/${storagePath}`, true);
    request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    request.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
    request.setRequestHeader('Content-Type', file.type);
    request.setRequestHeader('x-upsert', 'true');
    request.setRequestHeader('cache-control', '31536000');

    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      let detail = '';
      try {
        detail = JSON.parse(request.responseText)?.message ?? '';
      } catch {
        detail = '';
      }
      if (request.status === 403 || /row-level security/i.test(detail)) {
        reject(new Error('ليس لديك صلاحية الرفع. ادخلي بحساب المالك بالبريد وكلمة المرور.'));
      } else if (/mime type/i.test(detail)) {
        reject(new Error('صيغة الصورة غير مدعومة. استخدمي JPG أو PNG أو WebP.'));
      } else {
        reject(new Error(detail || `تعذر رفع الصورة (رمز ${request.status}).`));
      }
    };
    request.onerror = () => reject(new Error('انقطع الاتصال أثناء رفع الصورة.'));
    request.send(file);
  });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { videoUrl: data.publicUrl, storagePath, sizeBytes: file.size, contentType: file.type };
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
