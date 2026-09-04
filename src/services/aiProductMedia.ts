import { auth } from './googleWorkspace';
import { uploadLocalImage } from './videoAssets';

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
  geminiApiKey?: string;
  onProgress?: (percent: number, message: string) => void;
}

const safeStorageKey = (value: string): string => {
  const cleaned = String(value || 'product')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || `product-${Date.now()}`;
};

const base64ToFile = (data: string, mimeType: string, fileName: string): File => {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mimeType, lastModified: Date.now() });
};

const extensionForMime = (mimeType: string): string => {
  if (/png/i.test(mimeType)) return 'png';
  if (/webp/i.test(mimeType)) return 'webp';
  if (/avif/i.test(mimeType)) return 'avif';
  return 'jpg';
};

/**
 * Generates NEW product media from verified product references, then stores only
 * those generated outputs in Yousra Smile storage. Reference/store images are
 * never persisted by this service.
 */
export async function generateOriginalProductImages(
  input: GenerateProductImagesInput
): Promise<GeneratedProductImage[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('سجّلي الدخول إلى لوحة التحكم قبل توليد الصور الأصلية.');
  }

  const idToken = await currentUser.getIdToken();
  input.onProgress?.(5, 'تحليل المنتج وتجهيز المراجع المؤقتة...');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`
  };
  if (input.geminiApiKey) headers['x-gemini-key'] = input.geminiApiKey;

  const response = await fetch('/api/agent/generate-product-images', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productTitle: input.productTitle,
      brand: input.brand || '',
      category: input.category || '',
      kind: input.kind || 'general',
      features: input.features || [],
      referenceImages: Array.from(new Set((input.referenceImages || []).filter(Boolean))).slice(0, 3),
      sourceUrl: input.sourceUrl || ''
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !Array.isArray(payload?.data?.generatedImages)) {
    throw new Error(payload?.error || `تعذر توليد الصور الأصلية (HTTP ${response.status}).`);
  }

  const rawImages = payload.data.generatedImages as Array<{
    type?: GeneratedProductImageType;
    aspectRatio?: string;
    mimeType?: string;
    data?: string;
  }>;

  if (rawImages.length === 0) {
    throw new Error('لم يرجع مولد الصور أي صورة أصلية.');
  }

  input.onProgress?.(45, `تم توليد ${rawImages.length} صور. جاري حفظها في Yousra Smile...`);

  const storageKey = `ai-${safeStorageKey(input.storageKey)}`;
  const stored: GeneratedProductImage[] = [];

  for (let index = 0; index < rawImages.length; index += 1) {
    const raw = rawImages[index];
    if (!raw?.data || !raw?.mimeType?.startsWith('image/')) continue;

    const type = raw.type || 'feature';
    const extension = extensionForMime(raw.mimeType);
    const file = base64ToFile(
      raw.data,
      raw.mimeType,
      `${type}-${Date.now()}-${index + 1}.${extension}`
    );

    const storedAsset = await uploadLocalImage(storageKey, file, progress => {
      const base = 45 + Math.round((index / rawImages.length) * 50);
      const perFile = Math.round((progress / rawImages.length) * 50);
      input.onProgress?.(
        Math.min(95, base + perFile),
        `حفظ الصورة ${index + 1} من ${rawImages.length}...`
      );
    });

    stored.push({
      type,
      aspectRatio: raw.aspectRatio || '2:3',
      url: storedAsset.videoUrl,
      storagePath: storedAsset.storagePath,
      mimeType: raw.mimeType
    });
  }

  if (stored.length === 0) {
    throw new Error('تم توليد الصور لكن تعذر حفظها في التخزين الدائم.');
  }

  input.onProgress?.(100, 'تم توليد وحفظ الصور الأصلية بنجاح.');
  return stored;
}
