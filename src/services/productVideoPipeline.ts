import { Product, VideoReview, VideoScene } from '../types';
import { RenderedVideoAsset } from './videoGenerator';
import { buildVideoFromProduct } from './productVideoBuilder';
import { renderRealVideoAsset } from './realVideoRenderer';
import { uploadProductVideo, saveVideoRecord, VideoRecord } from './videoAssets';
import { adminAccount } from './adminAccount';

/**
 * End-to-end generation of a promotional video for a product that is already in
 * the catalog: real data in, permanent file out.
 *
 * The three failures this replaces:
 *   1. every product got the same stock storyboard (no product data reached the
 *      renderer);
 *   2. the finished file only ever existed as a `blob:` URL and disappeared on
 *      reload;
 *   3. the affiliate link could be a placeholder ASIN that earned nothing.
 */

export interface PipelineProgress {
  stage: 'preparing' | 'rendering' | 'uploading' | 'saving' | 'done';
  percent: number;
  message: string;
}

export interface GeneratedProductVideo {
  videoId: string;
  videoUrl: string;
  storagePath: string;
  thumbnailUrl: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  caption: string;
  hashtags: string[];
  affiliateUrl: string;
  title: string;
  hook: string;
  callToAction: string;
  scenes: VideoScene[];
  /** True when the file could not be uploaded and the URL is only temporary. */
  temporary: boolean;
}

export const generateVideoForProduct = async (
  product: Product,
  options: {
    aspectRatio?: '9:16' | '16:9' | '1:1';
    replaceStoragePath?: string;
    onProgress?: (progress: PipelineProgress) => void;
  } = {}
): Promise<GeneratedProductVideo> => {
  const { aspectRatio = '9:16', replaceStoragePath, onProgress } = options;

  onProgress?.({
    stage: 'preparing',
    percent: 5,
    message: 'جاري تجهيز بيانات المنتج وصوره ورابط الأفلييت...'
  });

  // Throws early, and deliberately, when the affiliate link or images are
  // missing — better a clear message than a video nobody can buy from.
  const plan = buildVideoFromProduct(product);

  onProgress?.({
    stage: 'rendering',
    percent: 15,
    message: 'جاري رسم مشاهد الفيديو من صور المنتج الحقيقية...'
  });

  const rendered = await renderRealVideoAsset({
    productTitle: plan.videoTitle,
    productTitleEn: product.titleEn,
    brand: product.brand,
    price: product.originalPrice,
    discountPrice: product.discountPrice,
    currency: product.currency === 'USD' ? '$' : product.currency,
    heroImage: plan.heroImage,
    beforeImage: plan.beforeImage,
    afterImage: plan.afterImage,
    scenes: plan.scenes,
    affiliateUrl: plan.affiliateUrl,
    aspectRatio,
    onProgress: (pct, msg) => {
      onProgress?.({
        stage: 'rendering',
        percent: Math.min(15 + Math.round(pct * 0.6), 75),
        message: msg
      });
    }
  });

  const videoId = `vid-${product.id}-${Date.now()}`;
  let videoUrl = rendered.videoUrl;
  let storagePath = '';
  let temporary = true;

  onProgress?.({
    stage: 'uploading',
    percent: 80,
    message: 'جاري رفع الفيديو إلى التخزين الدائم...'
  });

  try {
    const stored = await uploadProductVideo(product.id, rendered.videoBlob, {
      aspectRatio,
      replacePath: replaceStoragePath
    });
    videoUrl = stored.videoUrl;
    storagePath = stored.storagePath;
    temporary = false;
  } catch (uploadError) {
    // Keep the blob URL so the owner can still preview and download what was
    // rendered; the caller surfaces the reason it was not saved.
    console.warn('Video upload failed, keeping temporary URL:', uploadError);
    throw Object.assign(
      new Error((uploadError as Error).message),
      { partial: { videoUrl: rendered.videoUrl, blob: rendered.videoBlob } }
    );
  }

  onProgress?.({
    stage: 'saving',
    percent: 92,
    message: 'جاري حفظ بيانات الفيديو وربطه بالمنتج...'
  });

  const record: VideoRecord = {
    id: videoId,
    productId: product.id,
    videoUrl,
    storagePath,
    thumbnailUrl: product.image,
    durationSeconds: rendered.durationSeconds,
    aspectRatio,
    title: plan.videoTitle,
    caption: plan.caption,
    hashtags: plan.hashtags,
    affiliateUrl: plan.affiliateUrl,
    createdAt: new Date().toISOString()
  };

  try {
    await saveVideoRecord(record);
  } catch (saveError) {
    // The file is already safely uploaded; a failed metadata row should not
    // discard it.
    console.warn('Video metadata not saved:', saveError);
  }

  void adminAccount.logActivity('product_video_generated', 'product', product.id, {
    videoId,
    aspectRatio,
    storagePath
  });

  onProgress?.({ stage: 'done', percent: 100, message: 'تم إنشاء الفيديو وحفظه بنجاح.' });

  return {
    videoId,
    videoUrl,
    storagePath,
    thumbnailUrl: product.image,
    durationSeconds: rendered.durationSeconds,
    aspectRatio,
    caption: plan.caption,
    hashtags: plan.hashtags,
    affiliateUrl: plan.affiliateUrl,
    title: plan.videoTitle,
    hook: plan.hook,
    callToAction: plan.callToAction,
    scenes: plan.scenes,
    temporary
  };
};

/**
 * Shapes the pipeline result for the dashboard's existing preview modal, which
 * was written against the older asset type.
 */
export const toRenderedAsset = (
  product: Product,
  generated: GeneratedProductVideo
): RenderedVideoAsset => ({
  id: generated.videoId,
  videoUrl: generated.videoUrl,
  thumbnailUrl: generated.thumbnailUrl,
  durationSeconds: generated.durationSeconds,
  aspectRatio: generated.aspectRatio,
  scenes: generated.scenes,
  productInfo: {
    nameAr: product.titleAr,
    nameEn: product.titleEn,
    description: product.description,
    category: String(product.category),
    subcategory: product.subcategory,
    brand: product.brand,
    originalPrice: product.originalPrice,
    discountPrice: product.discountPrice,
    discountPercent: product.discountPercent,
    currency: product.currency,
    features: product.features ?? [],
    affiliateLink: generated.affiliateUrl,
    sourceUrl: generated.affiliateUrl,
    image: product.image,
    images: product.images
  },
  script: {
    videoTitle: generated.title,
    hook: generated.hook,
    estimatedDuration: `${generated.durationSeconds} ثانية`,
    scenes: generated.scenes,
    callToAction: generated.callToAction
  },
  socialCaption: generated.caption,
  hashtags: generated.hashtags,
  affiliateUrl: generated.affiliateUrl,
  createdAt: new Date().toISOString(),
  status: 'ready'
});

/** Shapes the pipeline result for the site's video review catalog. */
export const toVideoReview = (
  product: Product,
  generated: GeneratedProductVideo
): Omit<VideoReview, 'id'> => ({
  productId: product.id,
  productTitle: product.titleAr,
  productImage: product.image,
  thumbnailUrl: generated.thumbnailUrl,
  platform: 'generated',
  embedId: generated.videoId,
  videoUrl: generated.videoUrl,
  title: generated.title,
  views: '0',
  date: new Date().toISOString().slice(0, 10),
  duration: `${generated.durationSeconds}s`,
  storagePath: generated.storagePath,
  seoDescription: generated.caption,
  hashtags: generated.hashtags
});
