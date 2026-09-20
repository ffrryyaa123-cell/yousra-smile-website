const SUPABASE_PUBLIC_IMAGE_SEGMENT = '/storage/v1/object/public/';
const SUPABASE_RENDER_IMAGE_SEGMENT = '/storage/v1/render/image/public/';

export const optimizedImageUrl = (value: string | undefined, width = 720, quality = 72): string => {
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return value || '';
  try {
    const url = new URL(value, window.location.origin);
    if (!url.hostname.endsWith('.supabase.co') || !url.pathname.includes(SUPABASE_PUBLIC_IMAGE_SEGMENT)) return value;
    url.pathname = url.pathname.replace(SUPABASE_PUBLIC_IMAGE_SEGMENT, SUPABASE_RENDER_IMAGE_SEGMENT);
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch {
    return value;
  }
};

export const optimizedImageSrcSet = (value: string | undefined, quality = 72): string | undefined => {
  if (!value || !value.includes('.supabase.co/storage/v1/object/public/')) return undefined;
  return [320, 480, 720, 960]
    .map(width => `${optimizedImageUrl(value, width, quality)} ${width}w`)
    .join(', ');
};
