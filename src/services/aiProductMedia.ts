import { supabase } from './adminAccount';

export type GeneratedProductImageType =
  | 'hero'
  | 'lifestyle_home'
  | 'lifestyle_outdoor'
  | 'before_after'
  | 'feature'
  | 'thumbnail';

export interface GeneratedProductImage {
  type: GeneratedProductImageType;
  aspectRatio: string;
  url: string;
  storagePath: string;
  mimeType: string;
}

export interface GenerateProductImagesInput {
  storageKey: string;
  productTitle: string;
  brand?: string;
  category?: string;
  kind?: string;
  features?: string[];
  referenceImages: string[];
  sourceUrl?: string;
  onProgress?: (percent: number, message: string) => void;
}

const readFunctionError = async (error: any): Promise<string> => {
  try {
    const response = error?.context;
    if (response && typeof response.json === 'function') {
      const body = await response.json();
      return body?.error || body?.message || error?.message || '';
    }
  } catch {
    // Ignore response parsing errors and use the connector message below.
  }
  return error?.message || '';
};

/**
 * Generates NEW product media through the secure Supabase Edge Function.
 * Store/Amazon images are sent only as temporary references. The Edge Function
 * saves only generated outputs into Yousra Smile storage and returns their URLs.
 */
export async function generateOriginalProductImages(
  input: GenerateProductImagesInput
): Promise<GeneratedProductImage[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    throw new Error('سجّلي الدخول إلى لوحة التحكم قبل توليد الصور الأصلية.');
  }

  const references = Array.from(new Set((input.referenceImages || []).filter(Boolean))).slice(0, 3);
  if (references.length === 0) {
    throw new Error('لا توجد صورة مرجعية موثقة للمنتج. أوقفت التوليد حتى لا يتم إنشاء منتج مختلف.');
  }

  input.onProgress?.(10, 'تحليل المنتج وتجهيز المراجع المؤقتة...');

  const { data, error } = await supabase.functions.invoke('ai-product-media', {
    body: {
      action: 'generate_images',
      storageKey: input.storageKey,
      productTitle: input.productTitle,
      brand: input.brand || '',
      category: input.category || '',
      kind: input.kind || 'general',
      features: input.features || [],
      referenceImages: references,
      sourceUrl: input.sourceUrl || ''
    }
  });

  if (error) {
    const detail = await readFunctionError(error);
    throw new Error(detail || 'تعذر توليد الصور الأصلية.');
  }
  if (data?.error) throw new Error(data.error);

  const generated = data?.data?.generatedImages;
  if (!data?.success || !Array.isArray(generated) || generated.length === 0) {
    throw new Error('لم يرجع مولد الصور أي صورة أصلية قابلة للنشر.');
  }

  input.onProgress?.(100, `تم توليد وحفظ ${generated.length} صور أصلية بنجاح.`);

  return generated
    .filter((item: any) => item?.url && item?.storagePath)
    .map((item: any) => ({
      type: item.type || 'feature',
      aspectRatio: item.aspectRatio || '2:3',
      url: item.url,
      storagePath: item.storagePath,
      mimeType: item.mimeType || 'image/png'
    })) as GeneratedProductImage[];
}
