import { supabase } from './adminAccount';
import { deleteProductVideo, uploadLocalVideo } from './videoAssets';
import { Product, VideoReview } from '../types';

/**
 * Live catalog storage on Supabase/PostgreSQL.
 *
 * This replaces the previous Firestore-backed `catalogDatabase`. The Firebase
 * project behind this site (`studied-retina-k9v0l`) was created automatically
 * by Google AI Studio on the Starter Tier — nobody on this team owns it, its
 * security rules were never actually deployed to it, and both reads and
 * writes there return `PERMISSION_DENIED` in production. Every product edit,
 * every video "confirm and upload", every affiliate-link change that went
 * through Firestore looked like it worked in the open tab (React state
 * updated immediately) and then silently vanished on refresh, because the
 * remote write always failed and was only ever logged to the console as a
 * warning nobody was watching.
 *
 * The `products` and `videos` tables here use the exact same shape Firestore
 * did (`id` + a `data` jsonb blob holding the whole object), so this module
 * is a drop-in replacement: same method names, same call shape, nothing else
 * in the app needs to change beyond the import.
 */

const asProduct = (row: { id: string; data: unknown }): Product | null => {
  if (!row?.data || typeof row.data !== 'object') return null;
  return { ...(row.data as Product), id: row.id };
};

const asVideo = (row: { id: string; data: unknown }): VideoReview | null => {
  if (!row?.data || typeof row.data !== 'object') return null;
  const raw = row.data as Partial<VideoReview>;
  return {
    ...raw,
    id: row.id,
    platform: raw.platform || 'local',
    embedId: raw.embedId || row.id,
    videoUrl: raw.videoUrl || '',
    title: raw.title || raw.productTitle || 'فيديو المنتج',
    views: raw.views || '0',
    date: raw.date || '',
    duration: raw.duration || '00:00'
  } as VideoReview;
};

const POLL_MS = 20_000;
const OUTBOX_KEY = 'yousrasmile_catalog_outbox_v2';

type PendingCatalogWrite =
  | { key: string; kind: 'product-save'; id: string; payload: Product; queuedAt: number }
  | { key: string; kind: 'product-patch'; id: string; payload: Record<string, unknown>; queuedAt: number }
  | { key: string; kind: 'video-save'; id: string; payload: VideoReview; queuedAt: number };

let outboxTimer: number | null = null;
let outboxFlushing = false;
let onlineListenerInstalled = false;

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readOutbox = (): PendingCatalogWrite[] => {
  if (!hasBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeOutbox = (items: PendingCatalogWrite[]) => {
  if (!hasBrowserStorage()) return;
  try {
    if (items.length === 0) window.localStorage.removeItem(OUTBOX_KEY);
    else window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Could not persist Supabase sync outbox locally.', error);
  }
};

const removeQueuedWrite = (key: string) => {
  writeOutbox(readOutbox().filter(item => item.key !== key));
};

const removeQueuedWritesForProduct = (productId: string) => {
  writeOutbox(readOutbox().filter(item => !(item.id === productId && (item.kind === 'product-save' || item.kind === 'product-patch'))));
};

const queueProductSave = (product: Product) => {
  const items = readOutbox().filter(item => !(item.id === product.id && (item.kind === 'product-save' || item.kind === 'product-patch')));
  items.push({ key: `product-save:${product.id}`, kind: 'product-save', id: product.id, payload: product, queuedAt: Date.now() });
  writeOutbox(items);
};

const queueProductPatch = (productId: string, patch: Record<string, unknown>) => {
  const items = readOutbox();
  const saveIndex = items.findIndex(item => item.id === productId && item.kind === 'product-save');
  if (saveIndex >= 0) {
    const existing = items[saveIndex] as Extract<PendingCatalogWrite, { kind: 'product-save' }>;
    items[saveIndex] = {
      ...existing,
      payload: { ...existing.payload, ...patch, id: productId } as Product,
      queuedAt: Date.now()
    };
    writeOutbox(items);
    return;
  }

  const key = `product-patch:${productId}`;
  const patchIndex = items.findIndex(item => item.key === key && item.kind === 'product-patch');
  if (patchIndex >= 0) {
    const existing = items[patchIndex] as Extract<PendingCatalogWrite, { kind: 'product-patch' }>;
    items[patchIndex] = { ...existing, payload: { ...existing.payload, ...patch, id: productId }, queuedAt: Date.now() };
  } else {
    items.push({ key, kind: 'product-patch', id: productId, payload: { ...patch, id: productId }, queuedAt: Date.now() });
  }
  writeOutbox(items);
};

const queueVideoSave = (video: VideoReview) => {
  const key = `video-save:${video.id}`;
  const items = readOutbox().filter(item => item.key !== key);
  items.push({ key, kind: 'video-save', id: video.id, payload: video, queuedAt: Date.now() });
  writeOutbox(items);
};

const directSaveProduct = async (product: Product) => {
  const { data, error } = await supabase
    .from('products')
    .upsert({ id: product.id, data: product, updated_at: new Date().toISOString() })
    .select('id')
    .single();
  if (error || !data) throw error || new Error('لم تؤكد قاعدة البيانات حفظ المنتج.');
};

const directPatchProduct = async (productId: string, patch: Record<string, unknown>): Promise<Product> => {
  const { data, error } = await supabase.rpc('patch_catalog_product', {
    p_id: productId,
    p_patch: { ...patch, id: productId }
  });
  if (error || !data || typeof data !== 'object') throw error || new Error('لم تؤكد قاعدة البيانات حفظ تعديل المنتج.');
  return { ...(data as Product), id: productId };
};

const directSaveVideo = async (video: VideoReview) => {
  const { data, error } = await supabase
    .from('videos')
    .upsert({ id: video.id, product_id: video.productId, data: video, updated_at: new Date().toISOString() })
    .select('id')
    .single();
  if (error || !data) throw error || new Error('لم تؤكد قاعدة البيانات حفظ الفيديو.');
};

const scheduleOutboxFlush = (delay = 2500) => {
  if (typeof window === 'undefined') return;
  if (outboxTimer !== null) window.clearTimeout(outboxTimer);
  outboxTimer = window.setTimeout(() => {
    outboxTimer = null;
    void flushCatalogOutbox();
  }, delay);
};

const installOnlineListener = () => {
  if (typeof window === 'undefined' || onlineListenerInstalled) return;
  onlineListenerInstalled = true;
  window.addEventListener('online', () => scheduleOutboxFlush(100));
};

async function flushCatalogOutbox() {
  if (outboxFlushing) return;
  const pending = readOutbox().sort((a, b) => a.queuedAt - b.queuedAt);
  if (pending.length === 0) return;

  outboxFlushing = true;
  let hadFailure = false;
  try {
    for (const item of pending) {
      try {
        if (item.kind === 'product-save') await directSaveProduct(item.payload);
        else if (item.kind === 'product-patch') await directPatchProduct(item.id, item.payload);
        else await directSaveVideo(item.payload);
        removeQueuedWrite(item.key);
      } catch (error) {
        hadFailure = true;
        console.warn(`Supabase catalog write still pending: ${item.key}`, error);
      }
    }
  } finally {
    outboxFlushing = false;
  }

  if (hadFailure && readOutbox().length > 0) scheduleOutboxFlush(10_000);
}

installOnlineListener();

/**
 * Subscribes to a table two ways at once: Supabase Realtime for near-instant
 * updates, and a slow poll as a safety net in case a Realtime connection
 * drops or was never established (proxies, browser extensions, sleeping
 * tabs). Before every read we retry any write that was queued locally, so an
 * optimistic UI update cannot later "disappear" merely because one network
 * request failed.
 */
function subscribeTable<T>(
  table: 'products' | 'videos',
  mapRow: (row: { id: string; data: unknown }) => T | null,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  let stopped = false;
  let loadSequence = 0;

  const load = async () => {
    const sequence = ++loadSequence;
    await flushCatalogOutbox();
    const { data, error } = await supabase.from(table).select('id, data');
    if (stopped || sequence !== loadSequence) return;
    if (error) {
      onError?.(new Error(error.message));
      return;
    }
    const items = (data ?? []).map(mapRow).filter((v): v is T => v !== null);
    onData(items);
  };

  void load();

  const channel = supabase
    .channel(`${table}-catalog-sync`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => { void load(); })
    .subscribe();

  const timer = window.setInterval(() => { void load(); }, POLL_MS);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    void supabase.removeChannel(channel);
  };
}

/** Extracts the storage path from one of our own public bucket URLs. Returns
 * the input unchanged if it already looks like a bare path (no scheme). Old
 * Firebase Storage URLs (a different host entirely) come back null — there is
 * nothing on Supabase to delete for those, and best effort means skipping
 * them rather than throwing. */
const toSupabaseStoragePath = (urlOrPath?: string | null): string | null => {
  if (!urlOrPath) return null;
  if (!/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const marker = '/storage/v1/object/public/product-videos/';
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(urlOrPath.slice(idx + marker.length));
};

export const catalogDatabase = {
  subscribeProducts(onData: (products: Product[]) => void, onError?: (error: Error) => void) {
    return subscribeTable('products', asProduct, onData, onError);
  },

  subscribeVideos(onData: (videos: VideoReview[]) => void, onError?: (error: Error) => void) {
    return subscribeTable('videos', asVideo, onData, onError);
  },

  /**
   * Durable save: queue first, then remove from the queue only after Supabase
   * confirms the row. If the request is interrupted, the browser retries the
   * exact latest product automatically on the next poll, reconnect or reload.
   */
  async saveProduct(product: Product) {
    queueProductSave(product);
    try {
      await directSaveProduct(product);
      removeQueuedWrite(`product-save:${product.id}`);
    } catch (error) {
      scheduleOutboxFlush();
      console.warn('Product save queued for automatic retry.', error);
    }
  },

  /** Same durable-write rule for review/video rows. */
  async saveVideo(video: VideoReview) {
    if (!/^https?:\/\//i.test(video.videoUrl)) throw new Error('الفيديو يحتاج رابطًا دائمًا؛ لم يتم حفظ الرابط المؤقت.');
    queueVideoSave(video);
    try {
      await directSaveVideo(video);
      removeQueuedWrite(`video-save:${video.id}`);
    } catch (error) {
      scheduleOutboxFlush();
      console.warn('Video save queued for automatic retry.', error);
    }
  },

  async deleteProduct(productId: string) {
    removeQueuedWritesForProduct(productId);
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  },

  async removeVideoThumbnail(videoId: string) {
    const { data: row, error } = await supabase.from('videos').select('data, updated_at').eq('id', videoId).single();
    if (error) throw error;
    const updated = { ...row.data, thumbnailUrl: '', hideThumbnail: true };
    let request = supabase.from('videos').update({ data: updated, updated_at: new Date().toISOString() }).eq('id', videoId);
    request = row.updated_at ? request.eq('updated_at', row.updated_at) : request.is('updated_at', null);
    const { data: saved, error: saveError } = await request.select('id').single();
    if (saveError || !saved) throw saveError || new Error('تعذر حفظ حذف الصورة. حدّثي الصفحة وأعيدي المحاولة.');
  },

  async replaceReviewMedia(videoId: string, productId: string, media: Pick<VideoReview, 'videoUrl' | 'platform' | 'duration'> & { storagePath?: string }) {
    if (!/^https:\/\//i.test(media.videoUrl)) throw new Error('رابط الفيديو غير صالح');
    const { data: row, error } = await supabase.from('videos').select('data, updated_at').eq('id', videoId).single();
    if (error) throw error;
    if (row.data.productId !== productId) throw new Error('المراجعة لا تتبع المنتج المحدد');
    let embedId = videoId;
    if (media.platform === 'youtube') {
      const url = new URL(media.videoUrl);
      embedId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop() || '';
      if (!/^[A-Za-z0-9_-]{11}$/.test(embedId)) throw new Error('رابط يوتيوب لا يحتوي على معرّف فيديو صالح');
    }
    const updated = { ...row.data, videoUrl: media.videoUrl, platform: media.platform, duration: media.duration, storagePath: media.storagePath || '', embedId };
    let request = supabase.from('videos').update({ data: updated, updated_at: new Date().toISOString() }).eq('id', videoId);
    request = row.updated_at ? request.eq('updated_at', row.updated_at) : request.is('updated_at', null);
    const { data: saved, error: saveError } = await request.select('id').single();
    if (saveError || !saved) throw saveError || new Error('تغيّرت المراجعة أو حُذفت. حدّثي الصفحة وأعيدي المحاولة.');
    return { ...updated, id: videoId } as VideoReview;
  },

  async deleteVideo(videoId: string) {
    removeQueuedWrite(`video-save:${videoId}`);
    const { data, error } = await supabase.rpc('delete_catalog_review', { p_id: videoId });
    if (error || data?.deleted !== true) throw error || new Error('لم يتم تأكيد حذف المراجعة');
    return data as { deleted: true; product?: Product };
  },

  /** Removes only the video-related fields from a product's saved data,
   * keeping everything else (title, images, affiliate link, SEO...) intact. */
  async clearProductVideo(productId: string) {
    const { data, error } = await supabase.from('products').select('data').eq('id', productId).maybeSingle();
    if (error) throw error;
    if (!data?.data) return;
    const cleared = { ...(data.data as Record<string, unknown>) };
    delete cleared.videoUrl;
    delete cleared.videoThumbnailUrl;
    delete cleared.videoStoragePath;
    delete cleared.youtubeUrl;
    const { error: saveError } = await supabase
      .from('products')
      .update({ data: cleared, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (saveError) throw saveError;
  },

  /**
   * Atomic + durable partial update. The merge now happens inside PostgreSQL,
   * not as a client-side read followed by a later write. That removes the
   * race where two uploads could both read the same old product and whichever
   * finished last accidentally erased the other's new images/video fields.
   */
  async patchProduct(productId: string, patch: Record<string, unknown>) {
    queueProductPatch(productId, patch);
    try {
      const merged = await directPatchProduct(productId, patch);
      removeQueuedWrite(`product-patch:${productId}`);
      return merged;
    } catch (error) {
      scheduleOutboxFlush();
      console.warn('Product patch queued for automatic retry.', error);
      return { ...patch, id: productId } as Product;
    }
  },

  /** Kept for interface parity with the old Firestore uploader. */
  async uploadVideo(productId: string, file: File, onProgress?: (percent: number) => void) {
    const uploaded = await uploadLocalVideo(productId, file, onProgress);
    return { url: uploaded.videoUrl, storagePath: uploaded.storagePath };
  },

  async deleteStoredFile(urlOrPath?: string) {
    const path = toSupabaseStoragePath(urlOrPath);
    if (!path) return;
    await deleteProductVideo(path);
  },

  /** Exposed for admin diagnostics/tests; normal users never need to press anything. */
  async flushPendingWrites() {
    await flushCatalogOutbox();
    return readOutbox().length;
  }
};
