import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Zap,
  ExternalLink, Copy, Check, ShoppingBag, Video, Share2,
  ArrowRight, ShieldCheck, Tag, Eye, Clock, Download, Plus
} from 'lucide-react';
import { generateProductVideoCampaign, extractBasicProductInfoFromUrl, buildAffiliateLink } from '../services/productVideoService';
import { generateVideosForProduct, toVideoReview } from '../services/productVideoPipeline';
import { catalogDatabase } from '../services/supabaseCatalog';
import { useApp } from '../context/AppContext';
import { Product, VideoReview } from '../types';

interface InstantVideoStudioProps {
  initialUrl?: string;
  initialProduct?: Product | null;
  onClose?: () => void;
  onProductPublished?: (product: Product) => void;
}

export const InstantVideoStudio: React.FC<InstantVideoStudioProps> = ({
  initialUrl = '',
  initialProduct = null,
  onClose,
  onProductPublished
}) => {
  const { siteSettings, addProduct, updateProduct, patchProduct, addVideo, formatPrice, openImportVideoModal } = useApp();

  // Single input state - ONLY the link!
  const [productLink, setProductLink] = useState(
    initialUrl || (initialProduct?.amazonUrl || initialProduct?.aliexpressUrl || '')
  );

  // Freedom to choose ANY brand/trademark or leave auto-extracted
  const [customBrand, setCustomBrand] = useState(initialProduct?.brand || '');
  const [showBrandOption, setShowBrandOption] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Real Video Rendering states
  const [isRenderingRealVideo, setIsRenderingRealVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState<{ percent: number; message: string } | null>(null);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [completedClips, setCompletedClips] = useState<Array<{ videoUrl: string; storagePath: string }>>([]);

  // Campaign & Video Result State
  const [campaignData, setCampaignData] = useState<any>(() => {
    if (initialProduct) {
      return {
        productTitleAr: initialProduct.titleAr,
        productTitleEn: initialProduct.titleEn,
        category: initialProduct.category,
        brand: initialProduct.brand || 'Amazon Choice',
        originalPrice: initialProduct.originalPrice,
        discountPrice: initialProduct.discountPrice,
        discountPercent: initialProduct.discountPercent || 25,
        features: initialProduct.features || ['أداء فائق وذكي', 'توفير للطاقة', 'ضمان سنتين'],
        affiliateLink: initialProduct.amazonUrl || initialProduct.aliexpressUrl || `https://www.amazon.sa/dp/B0CXSAMPLE?tag=${siteSettings.amazonTag}`,
        image: initialProduct.image,
        socialCaption: `🔥 أقوى عرض لـ ${initialProduct.titleAr} بسعر ${initialProduct.discountPrice} $ فقط!\n🛒 اطلب الآن عبر الرابط: ${initialProduct.amazonUrl || initialProduct.aliexpressUrl}\n#يسرى_سمايل #عروض #تسوق_ذكي`,
        hashtags: ['#يسرى_سمايل', '#تخفيضات', '#أجهزة_ذكية', '#تسوق_أونلاين'],
        videoScript: {
          videoTitle: `مراجعة وتجربة ${initialProduct.titleAr} 2026`,
          hook: `هل يستحق هذا المنتج كل هذه الضجة؟ شاهد التجربة الحية قبل الشراء!`,
          estimatedDuration: '0:35',
          scenes: [
            {
              sceneNumber: 1,
              timeRange: '00:00 - 00:06',
              visualPrompt: `لقطة افتتاحية سينمائية سريعة للمنتج ${initialProduct.titleAr} وهو يعمل`,
              voiceoverText: `لو محتار تشتري ${initialProduct.titleAr}، جمعت لك كل التفاصيل في 30 ثانية فقط!`,
              screenText: 'أقوى منتج لعام 2026 🔥'
            },
            {
              sceneNumber: 2,
              timeRange: '00:06 - 00:15',
              visualPrompt: 'استعراض مواصفات المنتج الدقيقة ومميزات التصميم الفخم',
              voiceoverText: `الجهاز بيوفر لك أعلى أداء عملي مع مميزات استثنائية وخامات متينة تدوم معك.`,
              screenText: 'جودة استثنائية وضمان سنتين ⭐'
            },
            {
              sceneNumber: 3,
              timeRange: '00:15 - 00:25',
              visualPrompt: 'إظهار شارة السعر والتخفيض ومقارنة السعر قبل وبعد الخصم',
              voiceoverText: `والأفضل من كذا، عليه خصم قوي لفترة محدودة وسعره نازل جداً!`,
              screenText: `خصم خاص: ${initialProduct.discountPrice} $ فقط 💰`
            },
            {
              sceneNumber: 4,
              timeRange: '00:25 - 00:35',
              visualPrompt: 'دعوة مباشرة للشراء مع الإشارة لرابط البايو أو زر الشراء بالأسفل',
              voiceoverText: `الرابط المباشر بخصم خاص موجود في الوصف ورابط البايو، اطلبه قبل نفاد الكمية!`,
              screenText: 'اضغط على الرابط للشراء الآن 🛒'
            }
          ],
          callToAction: `اطلب الآن عبر رابط الأفلييت بالأسفل واستفد من الخصم المباشر!`
        }
      };
    }
    return null;
  });

  // Video Playback Engine State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [videoPlayerMode, setVideoPlayerMode] = useState<'storyboard' | 'device_video' | 'rendered_video' | 'youtube'>('storyboard');

  const deviceVideoInputRef = useRef<HTMLInputElement>(null);
  const playTimerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const totalDurationSeconds = 32;

  // Direct Device Video File Handler
  const handleDeviceVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(objectUrl);
    setVideoPlayerMode('device_video');
    setIsPlaying(false);
  };

  // TTS Voice Synthesis
  const speakCurrentScene = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors gracefully
    }
  };

  // Playback Loop Controller
  useEffect(() => {
    if (!isPlaying || !campaignData?.videoScript?.scenes) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      clearInterval(playTimerRef.current);
      return;
    }

    const scenes = campaignData.videoScript.scenes;
    const sceneDuration = totalDurationSeconds / scenes.length;

    // Start audio for initial scene
    speakCurrentScene(scenes[currentSceneIdx]?.voiceoverText || '');

    startTimeRef.current = Date.now() - (progressPercent / 100) * totalDurationSeconds * 1000;

    playTimerRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.min(100, (elapsedSec / totalDurationSeconds) * 100);
      setProgressPercent(progress);

      const calculatedSceneIdx = Math.min(
        scenes.length - 1,
        Math.floor(elapsedSec / sceneDuration)
      );

      setCurrentSceneIdx((prev) => {
        if (prev !== calculatedSceneIdx) {
          speakCurrentScene(scenes[calculatedSceneIdx]?.voiceoverText || '');
          return calculatedSceneIdx;
        }
        return prev;
      });

      if (progress >= 100) {
        setIsPlaying(false);
        setProgressPercent(0);
        setCurrentSceneIdx(0);
        clearInterval(playTimerRef.current);
      }
    }, 100);

    return () => {
      clearInterval(playTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, campaignData, isMuted]);

  const togglePlay = () => {
    if (!campaignData) return;
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (progressPercent >= 99) {
        setProgressPercent(0);
        setCurrentSceneIdx(0);
      }
      setIsPlaying(true);
    }
  };

  const restartVideo = () => {
    setIsPlaying(false);
    setProgressPercent(0);
    setCurrentSceneIdx(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 1-Click Fast Generation from LINK ONLY
  const handleInstantGenerate = async () => {
    if (!productLink || productLink.trim() === '') {
      return;
    }

    setIsLoading(true);
    setPublishSuccess(false);
    setPipelineError(null);
    restartVideo();

    try {
      // Parse only the URL shape locally. All product facts come from the
      // server-side extractor; this helper never supplies commerce data.
      const parsedInfo = extractBasicProductInfoFromUrl(productLink.trim(), siteSettings.amazonTag);
      const builtAffiliate = buildAffiliateLink(productLink.trim(), { affiliateTag: siteSettings.amazonTag });

      // Extract verified facts and generate original images server-side.
      const campaign = await generateProductVideoCampaign({
        productUrl: productLink.trim(),
        affiliateLink: builtAffiliate,
        affiliateTag: siteSettings.amazonTag,
        platform: 'tiktok'
      });

      const chosenImage = campaign.product.image || campaign.heroImage || '';
      if (!chosenImage) throw new Error('لم يتم إنشاء صورة أصلية قابلة للنشر لهذا المنتج.');

      const effectiveBrand = customBrand.trim() || campaign.product.brand || parsedInfo.brand || '';

      setCampaignData({
        draftProductId: initialProduct?.id || `draft-${parsedInfo.asinOrId || Date.now()}`,
        productTitleAr: campaign.product.nameAr,
        productTitleEn: campaign.product.nameEn,
        description: campaign.product.description,
        category: campaign.product.category || 'smart-home',
        subcategory: campaign.product.subcategory || '',
        brand: effectiveBrand,
        originalPrice: campaign.product.originalPrice || 0,
        discountPrice: campaign.product.discountPrice || 0,
        discountPercent: campaign.product.discountPercent || 0,
        rating: campaign.product.rating || 0,
        reviewCount: campaign.product.reviewCount || 0,
        currency: campaign.product.currency || 'USD',
        features: campaign.product.features || [],
        affiliateLink: campaign.product.affiliateLink || builtAffiliate,
        image: chosenImage,
        images: campaign.product.images || [chosenImage],
        generatedImagePaths: campaign.product.generatedImagePaths || [],
        beforeImage: campaign.beforeImage || chosenImage,
        afterImage: campaign.afterImage || chosenImage,
        suggestedVideoUrl: campaign.product.youtubeUrl || (campaign as any).suggestedVideoUrl,
        socialCaption: campaign.socialCaption,
        hashtags: campaign.hashtags,
        videoScript: campaign.videoScript
      });

      // Save the fully generated result immediately as an admin-visible draft.
      // Public catalog screens already respect isHidden, so this persists the
      // work across refresh/login without exposing it before owner approval.
      const draftProductId = initialProduct?.id || `draft-${parsedInfo.asinOrId || Date.now()}`;
      const hiddenDraft: Product = {
        id: draftProductId,
        titleAr: campaign.product.nameAr,
        titleEn: campaign.product.nameEn,
        description: campaign.product.description,
        descriptionEn: campaign.product.description,
        longDescription: campaign.socialCaption,
        longDescriptionEn: campaign.socialCaption,
        category: (campaign.product.category || 'smart-home') as Product['category'],
        subcategory: campaign.product.subcategory || '',
        subcategoryEn: campaign.product.subcategory || '',
        brand: effectiveBrand,
        image: chosenImage,
        images: campaign.product.images || [chosenImage],
        amazonUrl: campaign.product.affiliateLink,
        originalPrice: campaign.product.originalPrice || 0,
        discountPrice: campaign.product.discountPrice || 0,
        discountPercent: campaign.product.discountPercent || 0,
        currency: campaign.product.currency || 'USD',
        rating: campaign.product.rating || 0,
        reviewCount: campaign.product.reviewCount || 0,
        features: campaign.product.features || [],
        featuresEn: campaign.product.features || [],
        specs: {},
        specsEn: {},
        keywords: campaign.seoMetadata?.keywords || [],
        isFeatured: false,
        isTopSelling: false,
        isLatest: true,
        isHidden: true,
        isActive: true,
        viewsCount: 0,
        createdAt: initialProduct?.createdAt || new Date().toISOString(),
        sourceProductUrl: productLink.trim(),
        thumbnail: campaign.product.images?.at(-1) || chosenImage,
        mediaPipeline: {
          script: campaign.videoScript,
          captions: campaign.videoScript.scenes.map(scene => scene.screenText).filter(Boolean),
          hashtags: campaign.hashtags,
          generatedImagePaths: campaign.product.generatedImagePaths || [],
          generatedVideoPaths: [],
          generatedAt: new Date().toISOString(),
          status: 'images_ready'
        }
      };
      await catalogDatabase.saveProduct(hiddenDraft);
      addProduct(hiddenDraft);
      await generateCampaignClips(hiddenDraft);

      // Storyboard is a plan; only completed MP4s are playable results.

    } catch (err: any) {
      console.error('URL-to-media pipeline failed:', err);
      setCampaignData(null);
      setPipelineError(err?.message || 'تعذر استخراج المنتج أو إنشاء وسائط أصلية. لم يتم إنشاء أي بيانات بديلة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Publish Directly to Store
  const handlePublishToStore = () => {
    if (!campaignData) return;
    if (campaignData.draftProductId) {
      patchProduct(campaignData.draftProductId, { isHidden: false });
      setPublishSuccess(true);
      return;
    }
    setIsPublishing(true);

    const newProd: Product = {
      id: campaignData.draftProductId || `prod-${Date.now()}`,
      titleAr: campaignData.productTitleAr,
      titleEn: campaignData.productTitleEn,
      description: campaignData.description || campaignData.productTitleEn,
      descriptionEn: campaignData.description || campaignData.productTitleEn,
      longDescription: campaignData.socialCaption || campaignData.productTitleEn,
      longDescriptionEn: campaignData.socialCaption || campaignData.productTitleEn,
      originalPrice: Number(campaignData.originalPrice) || 0,
      discountPrice: Number(campaignData.discountPrice) || Number(campaignData.originalPrice) || 0,
      discountPercent: Number(campaignData.discountPercent) || 0,
      currency: campaignData.currency || 'USD',
      rating: campaignData.rating || 0,
      reviewCount: campaignData.reviewCount || 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      category: campaignData.category || 'smart-home',
      subcategory: campaignData.subcategory || '',
      brand: campaignData.brand || '',
      features: campaignData.features || [],
      featuresEn: campaignData.features || [],
      specs: campaignData.specs || {},
      specsEn: campaignData.specs || {},
      image: campaignData.image,
      images: campaignData.images || [campaignData.image],
      amazonUrl: campaignData.affiliateLink,
      videoUrl: renderedBlobUrl || undefined,
      isFeatured: false,
      isTopSelling: false,
      isHidden: false,
      isActive: true,
      keywords: campaignData.hashtags || [],
      sourceProductUrl: productLink.trim(),
      thumbnail: campaignData.images?.find((url: string) => /thumbnail/i.test(url)) || campaignData.image,
      mediaPipeline: {
        script: campaignData.videoScript,
        captions: campaignData.videoScript?.scenes?.map((scene: any) => scene.screenText).filter(Boolean) || [],
        hashtags: campaignData.hashtags || [],
        generatedImagePaths: campaignData.generatedImagePaths || [],
        generatedVideoPaths: [],
        generatedAt: new Date().toISOString(),
        status: renderedBlobUrl ? 'video_ready' : 'images_ready'
      }
    };

    // This is the explicit owner approval action: reveal the existing draft.
    // Updating the same ID prevents a second/duplicate product from being made.
    updateProduct(newProd);

    // Attach a video record only when a real generated/uploaded video exists.
    if (renderedBlobUrl) {
    const newVideo: VideoReview = {
      id: `vid-${Date.now()}`,
      productId: newProd.id,
      productTitle: newProd.titleAr,
      productImage: newProd.image,
      platform: 'generated',
      embedId: `generated-${newProd.id}`,
      videoUrl: renderedBlobUrl,
      title: campaignData.videoScript?.videoTitle || `مراجعة ${newProd.titleAr}`,
      views: '15.2K',
      date: 'اليوم',
      duration: campaignData.videoScript?.estimatedDuration || '0:35'
    };
    addVideo(newVideo);
    }

    if (onProductPublished) {
      onProductPublished(newProd);
    }

    setIsPublishing(false);
    setPublishSuccess(true);
  };

  // Shared by automatic URL import and explicit retries. Persist each completed
  // clip before requesting the next, so a later failure cannot lose it.
  const generateCampaignClips = async (product: Product) => {
    setIsRenderingRealVideo(true);
    setPipelineError(null);
    setCompletedClips([]);
    const paths: string[] = [];
    let firstVideoUrl = '';
    try {
      await generateVideosForProduct(product, {
        aspectRatio,
        onProgress: progress => setRenderProgress({ percent: progress.percent, message: progress.message }),
        onClipReady: async clip => {
          const review = { id: clip.videoId, ...toVideoReview(product, clip) };
          await catalogDatabase.saveVideo(review);
          addVideo(review);
          paths.push(clip.storagePath);
          setCompletedClips(current => [...current, { videoUrl: clip.videoUrl, storagePath: clip.storagePath }]);
          if (!firstVideoUrl) {
            firstVideoUrl = clip.videoUrl;
            setRenderedBlobUrl(clip.videoUrl);
            setVideoPlayerMode('rendered_video');
          }
          const patch = {
            videoUrl: firstVideoUrl,
            mediaPipeline: {
              ...product.mediaPipeline,
              generatedVideoPaths: [...paths],
              generatedAt: new Date().toISOString(),
              status: paths.length === 3 ? 'video_ready' : 'video_partial'
            }
          };
          await catalogDatabase.patchProduct(product.id, patch);
          patchProduct(product.id, patch);
        }
      });
      setRenderProgress({ percent: 100, message: 'تم حفظ 3 فيديوهات. شغّليها لمراجعة الحركة والصوت قبل الإظهار.' });
    } catch (err: any) {
      const message = `اكتمل ${paths.length} من 3 فيديوهات. ${err?.message || 'تعذر إكمال التوليد.'}`;
      setPipelineError(message);
      setRenderProgress({ percent: Math.round(paths.length / 3 * 100), message });
    } finally {
      setIsRenderingRealVideo(false);
    }
  };

  const handleRenderRealVideo = async () => {
    if (!campaignData) return;
    const product = {
      ...initialProduct,
      id: campaignData.draftProductId || initialProduct?.id,
      titleAr: campaignData.productTitleAr,
      titleEn: campaignData.productTitleEn,
      image: campaignData.image,
      images: campaignData.images || [campaignData.image],
      amazonUrl: campaignData.affiliateLink,
      brand: campaignData.brand,
      features: campaignData.features || [],
      featuresEn: campaignData.features || [],
      specs: {},
      category: campaignData.category,
      originalPrice: campaignData.originalPrice,
      discountPrice: campaignData.discountPrice,
      currency: campaignData.currency || 'USD',
      keywords: []
    } as Product;
    if (!product.id) { setPipelineError('احفظي المنتج أولاً لربط الفيديوهات به.'); return; }
    await generateCampaignClips(product);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const scenes = campaignData?.videoScript?.scenes || [];
  const currentScene = scenes[currentSceneIdx] || scenes[0];

  return (
    <div className="bg-slate-950 text-white rounded-3xl border border-indigo-500/40 shadow-2xl overflow-hidden p-4 sm:p-7 space-y-6">

      {/* 🌟 Top Header: Simple & Focused */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-['Tajawal'] text-white">
                صانع الفيديوهات الفوري بضغطة زر ورابط واحد
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black">
                1-Click Instant
              </span>
            </div>
            <p className="text-xs text-slate-300">
              ضع رابط أي منتج أو رابط الأفلييت الخاص بك فقط، وسيقوم الذكاء الاصطناعي باستخراج السعر وتوليد وتشغيل الفيديو بالصوت والصورة فوراً!
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all self-end sm:self-auto"
          >
            ✕ إغلاق
          </button>
        )}
      </div>

      {/* ⚡ THE ONLY INPUT YOU NEED: 1 Single URL Box */}
      <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-inner space-y-3">
        <label className="block text-xs sm:text-sm font-black text-amber-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            رابط المنتج أو رابط الأفلييت الخاص بك (أمازون / علي إكسبريس / نون):
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            لا داعي لإدخال الأسعار أو المواصفات، سيتم استخراجها تلقائياً
          </span>
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              placeholder="ضع الرابط هنا: https://www.amazon.sa/dp/B0... أو https://amzn.to/... أو اسم المنتج"
              className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-slate-950 border border-indigo-500/50 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInstantGenerate();
              }}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              🔗
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstantGenerate}
            disabled={isLoading || isRenderingRealVideo || !productLink.trim()}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جارٍ فحص الرابط وتجهيز الفيديو...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white fill-white" />
                <span>⚡ أنشئ وشغّل الفيديو الترويجي الآن!</span>
              </>
            )}
          </button>
        </div>

        {/* 🏷️ Free Trademark / Brand Customizer & Helper */}
        <div className="pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowBrandOption(!showBrandOption)}
              className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer py-1"
            >
              <span>🏷️ تخصيص العلامة التجارية / الماركة (Brand / Trademark) — اختياري:</span>
              <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800">
                {customBrand ? `الماركة المحددة: ${customBrand}` : 'استخراج تلقائي / أي ماركة'}
              </span>
            </button>
            {customBrand && (
              <button
                type="button"
                onClick={() => setCustomBrand('')}
                className="text-[11px] text-slate-400 hover:text-red-400 cursor-pointer"
              >
                إعادة للتعيين التلقائي ✕
              </button>
            )}
          </div>

          {showBrandOption && (
            <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-purple-500/30 space-y-2 animate-fadeIn">
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span>يمكنك إطلاق المنتج تحت <b>أي علامة تجارية أو ماركتك الخاصة</b> دون أي قيود:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="اكتب اسم علامتك التجارية أو أي ماركة أخرى (مثل: ماركتي الخاصة، Roborock، Dyson، Apple، Tefal...)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-purple-500/40 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">خيارات سريعة:</span>
                {['علامتي الخاصة (Private Label)', 'يسرى بريميوم', 'Roborock', 'Dyson', 'Philips', 'Anker', 'Apple', 'Xiaomi', 'Tefal', 'Sony'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCustomBrand(b)}
                    className={`px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                      customBrand === b
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Links helper */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span>روابط تجريبية سريعة ومباشرة:</span>
          <button
            type="button"
            onClick={() => {
              setProductLink('https://www.amazon.com/s?k=karcher&crid=GQGQIZOIE8OC&sprefix=karsh%2Caps%2C620&linkCode=ll2&tag=frial-20&linkId=76c88d62038f793f1bbe28c19a2d7d2c&language=en_US&ref_=as_li_ss_tl');
              setCustomBrand('Kärcher');
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/30 text-amber-300 border border-amber-400/50 font-black cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span>💨 مكنسة كارشر البخارية Kärcher SC 3</span>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-bold">جاهز 100%</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setProductLink('https://www.amazon.com/dp/B0C39K9911?tag=yousrasmile-20');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            مكنسة روبوت (Roborock S8)
          </button>
          <button
            type="button"
            onClick={() => {
              setProductLink('https://www.amazon.com/dp/B07N8P9922?tag=yousrasmile-20');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            قلاية هوائية فيليبس XXL
          </button>
          <button
            type="button"
            onClick={() => {
              setProductLink('https://www.amazon.com/dp/B09K88888?tag=yousrasmile-20');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            قفل باب ذكي بكاميرا وبصمة
          </button>
        </div>
      </div>

      {pipelineError && (
        <div role="alert" className="rounded-2xl border border-red-500/50 bg-red-950/60 p-4 text-sm text-red-200">
          <strong className="block mb-1">توقفت العملية بدون إنشاء بيانات أو وسائط وهمية</strong>
          <span>{pipelineError}</span>
        </div>
      )}

      {/* 🎬 ACTIVE VIDEO STUDIO & PLAYER */}
      {campaignData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">

          {/* Left Column: Interactive Simulated Video Player (TikTok/Reels format) */}
          <div className="lg:col-span-5 flex flex-col items-center">

            {/* Video Mode Tabs */}
            <div className="flex items-center gap-1.5 mb-3 w-full max-w-[340px] overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setVideoPlayerMode('storyboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  videoPlayerMode === 'storyboard'
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>خطة المشاهد — صور وليست فيديو</span>
              </button>

              {uploadedVideoUrl ? (
                <button
                  type="button"
                  onClick={() => setVideoPlayerMode('device_video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    videoPlayerMode === 'device_video'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:text-white'
                  }`}
                >
                  <span>📁 فيديو من جهازي</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => deviceVideoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                  title="استيراد فيديو من الكمبيوتر أو الهاتف"
                >
                  <span>📁 رفع فيديو من جهازي</span>
                </button>
              )}

              {renderedBlobUrl && (
                <button
                  type="button"
                  onClick={() => setVideoPlayerMode('rendered_video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    videoPlayerMode === 'rendered_video'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-950/60 text-purple-300 border border-purple-800/80 hover:text-white'
                  }`}
                >
                  <span>🎥 فيديو MP4 مصيّر</span>
                </button>
              )}
            </div>

            {/* Aspect Ratio Switcher & Before/After Toggle */}
            <div className="flex items-center justify-between w-full max-w-[340px] mb-3">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📱 9:16
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🖥️ 16:9
                </button>
              </div>

              {/* Before & After Transformation Switch */}
              <button
                type="button"
                onClick={() => {
                  setVideoPlayerMode('storyboard');
                  const baIdx = scenes.findIndex((s: any) => s.sceneType === 'before_after');
                  if (baIdx >= 0) {
                    setCurrentSceneIdx(baIdx);
                    speakCurrentScene(scenes[baIdx]?.voiceoverText);
                  }
                }}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 hover:border-amber-400 cursor-pointer transition-all"
              >
                <span>✨ قبل وبعد (Before/After)</span>
              </button>
            </div>

            {/* Hidden Video File Picker */}
            <input
              type="file"
              ref={deviceVideoInputRef}
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={handleDeviceVideoFileChange}
              className="hidden"
            />

            {/* Video Canvas Phone Frame */}
            <div
              className={`relative bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl w-full transition-all duration-300 flex flex-col justify-between ${
                aspectRatio === '9:16' ? 'max-w-[340px] aspect-[9/16] min-h-[500px]' : 'aspect-video max-w-full'
              }`}
            >
              {/* If playing user-uploaded video from device */}
              {videoPlayerMode === 'device_video' && uploadedVideoUrl ? (
                <div className="relative w-full h-full flex flex-col justify-between z-10">
                  <video
                    src={uploadedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg pointer-events-none">
                    فيديو من جهازك 📁
                  </div>
                </div>
              ) : videoPlayerMode === 'rendered_video' && renderedBlobUrl ? (
                <div className="relative w-full h-full flex flex-col justify-between z-10">
                  <video
                    src={renderedBlobUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-purple-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg pointer-events-none">
                    فيديو مصيّر MP4 🎥
                  </div>
                </div>
              ) : (
                /* Interactive Storyboard Mode with Scraped Product Images */
                <>
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    {currentScene?.sceneType === 'before_after' ? (
                      <div className="relative w-full h-full flex">
                        {/* Split View Before & After */}
                        <div className="w-1/2 h-full relative overflow-hidden border-r-2 border-amber-400">
                          <img
                            src={currentScene?.beforeImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'}
                            alt="Before"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter grayscale contrast-125 scale-105"
                          />
                          <div className="absolute top-12 left-2 bg-red-600/90 text-white font-black text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
                            قبل ❌
                          </div>
                        </div>
                        <div className="w-1/2 h-full relative overflow-hidden">
                          <img
                            src={currentScene?.afterImage || currentScene?.sceneImage || campaignData.image}
                            alt="After"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover scale-105"
                          />
                          <div className="absolute top-12 right-2 bg-emerald-600/90 text-white font-black text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
                            بعد ✅
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={currentScene?.sceneImage || campaignData.image}
                        alt={campaignData.productTitleAr}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-all duration-1000 ${
                          isPlaying ? 'scale-110' : 'scale-100'
                        } ${currentScene?.sceneType === 'before_problem' ? 'filter sepia-[0.3] contrast-125' : ''}`}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 pointer-events-none"></div>
                  </div>

                  {/* Video Top Bar: Brand, Duration, Voice status */}
                  <div className="relative z-10 p-3.5 flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="font-bold text-[11px]">{campaignData.brand}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 cursor-pointer"
                        title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      <span className="bg-black/60 px-2 py-1 rounded-full text-[10px] font-mono font-bold text-slate-300 border border-white/10">
                        {Math.floor((progressPercent / 100) * totalDurationSeconds)}s / {totalDurationSeconds}s
                      </span>
                    </div>
                  </div>

                  {/* Center Play Button Overlay if Paused */}
                  {!isPlaying && (
                    <div className="relative z-20 flex flex-col items-center justify-center my-auto">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 cursor-pointer transform hover:scale-105 transition-all"
                      >
                        <Play className="w-8 h-8 fill-white ml-1" />
                      </button>
                      <span className="mt-2 text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm">
                        اضغط لتشغيل العرض بالصوت 🔊
                      </span>
                    </div>
                  )}

                  {/* Video Captions & Animated Scene Box */}
                  <div className="relative z-10 p-3.5 space-y-2.5 mt-auto">

                    {/* Onscreen Badge */}
                    <div className="inline-block px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg animate-bounce">
                      {currentScene?.screenText || 'عرض خاص وحصري 🔥'}
                    </div>

                    {/* Subtitle / Voiceover text */}
                    <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-right space-y-1">
                      <div className="text-[10px] text-amber-400 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          المشهد {currentSceneIdx + 1} من {scenes.length}
                        </span>
                        {currentScene?.transformationNote && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                            {currentScene.transformationNote}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-white font-['Tajawal'] leading-relaxed">
                        "{currentScene?.voiceoverText || ''}"
                      </p>
                    </div>

                    {/* Price Tag in Video */}
                    <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-indigo-500/40">
                      <div>
                        <span className="text-[10px] text-slate-300 block">السعر بالدولار ($):</span>
                        <span className="text-sm font-black text-emerald-400 font-['Tajawal']">
                          ${campaignData.discountPrice} USD
                        </span>
                      </div>
                      <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-md">
                        وفر {campaignData.discountPercent}%
                      </span>
                    </div>

                    {/* Affiliate Direct CTA in Video */}
                    <a
                      href={campaignData.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>اطلب الآن عبر رابط الأفلييت بالخصم 🛒</span>
                    </a>

                    {/* Video Timeline Progress Bar */}
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all duration-100"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="flex items-center justify-center gap-2.5 mt-4 w-full max-w-[340px]">
              <button
                type="button"
                onClick={restartVideo}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                title="إعادة من البداية"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل الفيديو'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  isMuted ? 'bg-red-900/40 border-red-500/40 text-red-300' : 'bg-slate-900 border-slate-800 text-emerald-400'
                }`}
                title={isMuted ? 'الصوت مكتوم' : 'الصوت يعمل'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Download / Export Video Button */}
              <button
                type="button"
                onClick={() => {
                  const content = `🎬 سكريبت الفيديو الترويجي - ${campaignData.productTitleAr}\nالعنوان: ${campaignData.videoScript?.videoTitle}\nالرابط: ${campaignData.affiliateLink}\n\nالمشاهد:\n` +
                    scenes.map((s: any, i: number) => `مشهد ${i+1} (${s.timeRange}):\nصوت: ${s.voiceoverText}\nشاشة: ${s.screenText}\nنوع: ${s.sceneType || 'مشهد'}\n`).join('\n') +
                    `\nالكابشن:\n${campaignData.socialCaption}`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `video-campaign-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-900 text-indigo-400 hover:text-white border border-slate-800 cursor-pointer"
                title="تصدير حزمة الفيديو وسكريبت المشاهد"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* 🎥 REAL VIDEO EXPORT & MP4/WEBM SYNTHESIS ENGINE */}
            <div className="mt-4 w-full max-w-[340px] bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 font-['Tajawal']">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>توليد وتصدير ملف الفيديو الحقيقي:</span>
                </span>
              </div>

              {!renderedBlobUrl ? (
                <button
                  type="button"
                  onClick={handleRenderRealVideo}
                  disabled={isRenderingRealVideo}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isRenderingRealVideo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري تصيير الفيديو ({renderProgress?.percent || 0}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>🎬 توليد 3 فيديوهات متحركة مع صوت (MP4)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-emerald-500/50 bg-black aspect-[9/16] max-h-56 mx-auto">
                    <video
                      src={renderedBlobUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a
                    href={renderedBlobUrl}
                    download={`yousra-video-${Date.now()}.mp4`}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل ملف الفيديو المكتمل ⬇️</span>
                  </a>
                </div>
              )}

              {completedClips.map((clip, index) => (
                <div key={clip.storagePath} className="space-y-2 border-t border-slate-700 pt-3">
                  <p>الفيديو {index + 1} من 3 — راجعي الحركة والصوت</p>
                  <video src={clip.videoUrl} controls preload="metadata" className="w-full rounded-xl" />
                  <a href={clip.videoUrl} download={`product-clip-${index + 1}.mp4`}>تنزيل المقطع {index + 1}</a>
                </div>
              ))}
              {isRenderingRealVideo && renderProgress && (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-amber-400 h-full transition-all duration-300"
                      style={{ width: `${renderProgress.percent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-purple-300 text-center font-bold">
                    {renderProgress.message}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Extracted Product Info, Verified Affiliate Link, Social Caption & 1-Click Publishing */}
          <div className="lg:col-span-7 space-y-4">

            {/* 🏷️ Extracted Details Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/60">
                      🏷️ {campaignData.brand}
                    </span>
                    <span className="text-xs text-slate-400">• {campaignData.category}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white font-['Tajawal'] mt-1">
                    {campaignData.productTitleAr}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{campaignData.productTitleEn}</p>
                </div>

                <div className="text-left shrink-0">
                  <div className="text-lg font-black text-emerald-400 font-['Tajawal']">
                    {formatPrice(campaignData.discountPrice)}
                  </div>
                  <div className="text-xs line-through text-slate-500">
                    {formatPrice(campaignData.originalPrice)}
                  </div>
                </div>
              </div>

              {/* Features Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {campaignData.features?.map((f: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* 🔗 Verified Affiliate Link Box */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  رابط الأفلييت المعتمد والمربوط لحسابك:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={campaignData.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1 font-bold"
                  >
                    <span>فتح وتجربة الرابط</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => copyText(campaignData.affiliateLink, 'aff-link')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {copiedKey === 'aff-link' ? 'تم النسخ!' : 'نسخ الرابط'}
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs text-emerald-300 bg-black/60 p-2 rounded-xl border border-emerald-900 break-all select-all">
                {campaignData.affiliateLink}
              </div>
            </div>

            {/* 📱 Social Media Caption Ready to Post */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-pink-400" />
                  الكابشن الجاهز للنشر (TikTok / Reels / YouTube Shorts):
                </span>
                <button
                  type="button"
                  onClick={() => copyText(campaignData.socialCaption, 'caption')}
                  className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'caption' ? 'تم النسخ!' : 'نسخ الكابشن'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-line font-['Cairo']">
                {campaignData.socialCaption}
              </p>
            </div>

            {/* 🎬 Storyboard Scenes Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-400" />
                  سكريبت ومشاهد الفيديو بالثواني ({scenes.length} مشاهد):
                </span>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(campaignData.videoScript, null, 2), 'script')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'script' ? 'تم نسخ السكريبت!' : 'نسخ السكريبت'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {scenes.map((sc: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentSceneIdx(idx);
                      speakCurrentScene(sc.voiceoverText);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      currentSceneIdx === idx
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] font-bold text-amber-400 mb-1">
                      <span>المشهد {idx + 1} ({sc.timeRange})</span>
                      <span className="text-slate-400 font-normal">شاشة: "{sc.screenText}"</span>
                    </div>
                    <p className="text-slate-200 font-['Cairo']">
                      🎙️ {sc.voiceoverText}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 🚀 1-CLICK ACTIONS */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  deviceVideoInputRef.current?.click();
                }}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-600 hover:opacity-95 text-slate-950 shadow-xl cursor-pointer border border-amber-400/50"
              >
                <Video className="w-4 h-4 text-slate-950" />
                <span>📁 رفع واستبدال بفيديو من جهازي (مع الاحتفاظ بجميع بيانات وسعر المنتج) 🔥</span>
              </button>

              <button
                type="button"
                onClick={handlePublishToStore}
                disabled={isPublishing || publishSuccess}
                className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  publishSuccess
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black shadow-xl shadow-emerald-500/30'
                }`}
              >
                {publishSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>✅ تم رفع المنتج والفيديو بنجاح إلى متجر يسرى سمايل!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-slate-950" />
                    <span>✨ نشر هذا المنتج فوراً في المتجر وقسم الفيديوهات</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-3xl p-8 border-2 border-dashed border-slate-800 text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 animate-pulse">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="font-black text-base text-white font-['Tajawal']">
              جاهز لتوليد وتشغيل أول فيديو ترويجي
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ضع رابط أي منتج في الحقل بالأعلى، وسيقوم الوكيل بتجهيز الفيديو الترويجي، قراءة النصوص صوتياً، وحساب السعر والخصم وربط عمولتك فوراً.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

