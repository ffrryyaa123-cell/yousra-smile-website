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
  return { ...(row.data as VideoReview), id: row.id };
};

const POLL_MS = 20_000;

/**
 * Subscribes to a table two ways at once: Supabase Realtime for near-instant
 * updates, and a slow poll as a safety net in case a Realtime connection
 * drops or was never established (proxies, browser extensions, sleeping
 * tabs). Either path calls back with the freshly fetched full list.
 */
function subscribeTable<T>(
  table: 'products' | 'videos',
  mapRow: (row: { id: string; data: unknown }) => T | null,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  let stopped = false;

  const load = async () => {
    const { data, error } = await supabase.from(table).select('id, data');
    if (stopped) return;
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

  async saveProduct(product: Product) {
    const { error } = await supabase
      .from('products')
      .upsert({ id: product.id, data: product, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  async saveVideo(video: VideoReview) {
    const { error } = await supabase
      .from('videos')
      .upsert({ id: video.id, product_id: video.productId, data: video, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  async deleteProduct(productId: string) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  },

  async deleteVideo(videoId: string) {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) throw error;
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

  /** Kept for interface parity with the old Firestore uploader. New code
   * should call `uploadLocalVideo` from `videoAssets.ts` directly — it gives
   * real upload-progress events and is what the video import modal uses. */
  async uploadVideo(productId: string, file: File, onProgress?: (percent: number) => void) {
    const uploaded = await uploadLocalVideo(productId, file, onProgress);
    return { url: uploaded.videoUrl, storagePath: uploaded.storagePath };
  },

  /** Best-effort delete, mirroring the old Firestore helper: never throws.
   * Only removes files that live in our own Supabase bucket — a URL from
   * anywhere else (including the old, now-unreachable Firebase project) is
   * silently skipped rather than failing the caller. */
  async deleteStoredFile(urlOrPath?: string) {
    const path = toSupabaseStoragePath(urlOrPath);
    if (!path) return;
    await deleteProductVideo(path);
  }
};
