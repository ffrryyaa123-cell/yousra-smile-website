import { Product, VideoReview, VideoScene } from '../types';
import { RenderedVideoAsset } from './videoGenerator';
import { buildVideoFromProduct } from './productVideoBuilder';
import { adminAccount } from './adminAccount';
import { startAiProductVideo, waitForAiProductVideo } from './aiProductVideo';

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

export const generateVideosForProduct = async (
  product: Product,
  options: {
    aspectRatio?: '9:16' | '16:9';
    onProgress?: (progress: PipelineProgress) => void;
    onClipReady?: (clip: GeneratedProductVideo) => void | Promise<void>;
  } = {}
): Promise<GeneratedProductVideo[]> => {
  const { aspectRatio = '9:16', onProgress } = options;

  onProgress?.({
    stage: 'preparing',
    percent: 5,
    message: 'جاري تجهيز بيانات المنتج وصوره ورابط الأفلييت...'
  });

  // Throws early, and deliberately, when the affiliate link or images are
  // missing — better a clear message than a video nobody can buy from.
  const plan = buildVideoFromProduct(product);

  const scenes = plan.scenes.slice(0, 3);
  const images = [product.image, ...(product.images ?? [])].filter(Boolean);
  const results: GeneratedProductVideo[] = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const safe = (value: string | undefined, fallback: string) => {
      const ascii = (value || '').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
      return ascii || fallback;
    };
    const prompt = [
      safe(scene.visualPrompt, 'Create a realistic product demonstration with genuine physical motion.'),
      `A clear natural English female narrator says: "${safe(scene.voiceoverText, 'See how this product supports everyday use.')}"`,
      `On-screen English text: "${safe(scene.screenText, 'Product spotlight')}"`,
      `Connected clip ${index + 1} of ${scenes.length}. Maintain the exact same product, lighting, location, and visual continuity across the campaign.`,
      'This must be a genuinely moving commercial video, not a slideshow, still image, photo pan, zoom, or Ken Burns effect.',
      'The video must NOT be silent. Include synchronized spoken narration and subtle modern background music under the voice.',
      'Preserve the exact referenced product model, color, proportions, controls, logo placement, and visible details. Do not invent accessories or claims.',
      'If a woman appears, she must be an adult modest hijabi woman. Do not show any non-hijabi woman.'
    ].join('\n');

    onProgress?.({
      stage: 'rendering',
      percent: 10 + Math.round((index / scenes.length) * 78),
      message: `جاري إنشاء الفيديو المتحرك ${index + 1} من ${scenes.length} عبر Veo مع صوت إنجليزي...`
    });
    const job = await startAiProductVideo({
      productId: product.id,
      prompt,
      aspectRatio,
      referenceImageUrl: images[index] || images[0]
    });
    const generated = await waitForAiProductVideo(job, message => {
      onProgress?.({ stage: 'rendering', percent: Math.min(90, 18 + index * 25), message });
    });
    const videoId = `veo-${generated.storagePath.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    results.push({
      videoId,
      videoUrl: generated.videoUrl,
      storagePath: generated.storagePath,
      thumbnailUrl: images[index] || images[0],
      durationSeconds: 8,
      aspectRatio,
      caption: plan.caption,
      hashtags: plan.hashtags,
      affiliateUrl: plan.affiliateUrl,
      title: `${plan.videoTitle} — Clip ${index + 1}`,
      hook: plan.hook,
      callToAction: plan.callToAction,
      scenes: [scene],
      temporary: false
    });
    await options.onClipReady?.(results[results.length - 1]);
  }

  void adminAccount.logActivity('product_video_campaign_generated', 'product', product.id, {
    videoIds: results.map(video => video.videoId),
    aspectRatio,
    storagePaths: results.map(video => video.storagePath)
  });
  onProgress?.({ stage: 'done', percent: 100, message: `تم إنشاء ${results.length} فيديوهات متحركة بصوت وحفظها للمراجعة.` });
  return results;
};

/** Backwards-compatible single-clip entry point for older callers. */
export const generateVideoForProduct = async (
  product: Product,
  options: Parameters<typeof generateVideosForProduct>[1] = {}
): Promise<GeneratedProductVideo> => (await generateVideosForProduct(product, options))[0];

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
