// Reads the published catalogue from Supabase.
//
// The products table stores one row per product: a text `id` and a `data`
// jsonb column holding the whole Product object. Row level security lets
// anyone read it, so visitors need no account; writing stays admin-only.
//
// Firestore is deliberately left untouched. This service reports "no data"
// rather than throwing when Supabase is empty or unreachable, so AppContext
// keeps whatever the Firestore subscription already provided. Supabase only
// ever replaces the catalogue when it actually has products to show.

import { supabase } from './adminAccount';
import { Product, VideoReview } from '../types';

const REFRESH_MS = 60_000;

const asProduct = (row: { id: string; data: unknown }): Product | null => {
  if (!row?.data || typeof row.data !== 'object') return null;
  const data = row.data as Partial<Product>;
  if (!data.titleAr && !data.titleEn) return null;
  return { ...(data as Product), id: row.id || (data.id as string) };
};

// Only products that passed review reach visitors. Anything still marked
// draft or needs_review stays inside the dashboard.
const isPublished = (data: Record<string, unknown>): boolean => {
  const status = String(data.status ?? 'draft');
  return status === 'published' || status === 'approved';
};

const fetchProducts = async (includeUnpublished: boolean): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('id, data');
  if (error || !Array.isArray(data)) return [];
  return data
    .filter(row => includeUnpublished || isPublished((row.data ?? {}) as Record<string, unknown>))
    .map(asProduct)
    .filter((p): p is Product => p !== null);
};

const fetchVideos = async (): Promise<VideoReview[]> => {
  const { data, error } = await supabase.from('videos').select('id, data');
  if (error || !Array.isArray(data)) return [];
  return data
    .map(row => (row.data && typeof row.data === 'object' ? { ...(row.data as VideoReview), id: row.id } : null))
    .filter((v): v is VideoReview => v !== null);
};

const poll = <T>(load: () => Promise<T[]>, onData: (items: T[]) => void) => {
  let stopped = false;

  const run = async () => {
    const items = await load();
    if (!stopped && items.length > 0) onData(items);
  };

  void run();
  const timer = window.setInterval(() => { void run(); }, REFRESH_MS);

  return () => { stopped = true; window.clearInterval(timer); };
};

export const supabaseCatalog = {
  // includeUnpublished is for the dashboard, where drafts must be visible.
  subscribeProducts(onData: (products: Product[]) => void, includeUnpublished = false) {
    return poll(() => fetchProducts(includeUnpublished), onData);
  },

  subscribeVideos(onData: (videos: VideoReview[]) => void) {
    return poll(fetchVideos, onData);
  },

  async saveProduct(product: Product) {
    const { error } = await supabase
      .from('products')
      .upsert({ id: product.id, data: product, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};
