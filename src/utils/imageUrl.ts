const SUPABASE_PUBLIC_IMAGE_SEGMENT = '/storage/v1/object/public/';
const SUPABASE_RENDER_IMAGE_SEGMENT = '/storage/v1/render/image/public/';

export const optimizedImageUrl = (value: string | undefined, width = 720, quality = 72): string => {
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return value || '';
  try {
    const url = new URL(value, window.location.origin);
    if (url.hostname.endsWith('.supabase.co') && url.pathname.includes(SUPABASE_PUBLIC_IMAGE_SEGMENT)) {
      url.pathname = url.pathname.replace(SUPABASE_PUBLIC_IMAGE_SEGMENT, SUPABASE_RENDER_IMAGE_SEGMENT);
      url.searchParams.set('width', String(width));
      url.searchParams.set('quality', String(quality));
      url.searchParams.set('resize', 'contain');
      return url.toString();
    }
    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(Math.min(quality, 68)));
      return url.toString();
    }
    if (url.hostname === 'm.media-amazon.com') {
      url.pathname = url.pathname.replace(/\._(?:AC_)?SL\d+_\./i, `._AC_SL${Math.max(320, width)}_.`);
      return url.toString();
    }
    return value;
  } catch {
    return value;
  }
};

export const optimizedImageSrcSet = (value: string | undefined, quality = 72): string | undefined => {
  if (!value || !/(\.supabase\.co\/storage\/v1\/object\/public\/|images\.unsplash\.com\/|m\.media-amazon\.com\/)/i.test(value)) return undefined;
  return [320, 480, 720, 960]
    .map(width => `${optimizedImageUrl(value, width, quality)} ${width}w`)
    .join(', ');
};
