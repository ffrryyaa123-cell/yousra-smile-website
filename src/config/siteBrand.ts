import smartHomeLogo from '../assets/images/smart_home_logo_optimized.jpg';
import creatorAvatar from '../assets/images/yousra_smile_avatar_1785601313942.webp';
import heroBanner from '../assets/images/yousra_smile_banner_1785601300772.webp';

export const STORAGE_BRAND_ASSETS = {
  siteLogo: 'https://iicvasloytbjotbgbvjt.supabase.co/storage/v1/object/public/product-videos/media-library/2026-09-15T00-05-00-719Z-image.png',
  creatorAvatar: 'https://iicvasloytbjotbgbvjt.supabase.co/storage/v1/object/public/product-videos/media-library/2026-09-14T23-57-02-711Z-image.png',
  heroBanner: 'https://iicvasloytbjotbgbvjt.supabase.co/storage/v1/object/public/product-videos/media-library/2026-09-15T00-08-13-501Z-bMbshy87fIj9RzgHmY6OZN.png',
} as const;

export const SITE_BRAND_ASSETS = { siteLogo: smartHomeLogo, creatorAvatar, heroBanner } as const;

const optimizedDefaults = new Map<string, string>([
  [STORAGE_BRAND_ASSETS.siteLogo, SITE_BRAND_ASSETS.siteLogo],
  [STORAGE_BRAND_ASSETS.creatorAvatar, SITE_BRAND_ASSETS.creatorAvatar],
  [STORAGE_BRAND_ASSETS.heroBanner, SITE_BRAND_ASSETS.heroBanner],
]);

export const optimizedBrandAssetUrl = (url: string | undefined, fallback: string) =>
  (url && optimizedDefaults.get(url)) || url || fallback;

export const LEGACY_WRONG_SITE_LOGOS = new Set([
  'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
]);
