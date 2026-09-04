import fs from 'node:fs';
import path from 'node:path';

const studioPath = path.resolve(process.cwd(), 'src/components/InstantVideoStudio.tsx');
let studio = fs.readFileSync(studioPath, 'utf8');

// Always preview generated narration with an English voice.
studio = studio.replace("utterance.lang = 'ar-SA';", "utterance.lang = 'en-US';");

// The studio must start from the URL workflow. Do not pre-populate it with the
// old Arabic hard-coded campaign for an existing product.
const campaignStart = studio.indexOf('  // Campaign & Video Result State\n  const [campaignData, setCampaignData] = useState<any>(() => {');
const campaignEndMarker = '\n\n  // Video Playback Engine State';
const campaignEnd = campaignStart >= 0 ? studio.indexOf(campaignEndMarker, campaignStart) : -1;
if (campaignStart >= 0 && campaignEnd > campaignStart) {
  studio = `${studio.slice(0, campaignStart)}  // Campaign & Video Result State — URL-first only\n  const [campaignData, setCampaignData] = useState<any>(null);${studio.slice(campaignEnd)}`;
}

// Remove stock-image substitution. The media service now returns original AI
// images or throws; a missing generated image must never turn into Unsplash.
const imageStartMarker = '      // 3. Pick image - ALWAYS prioritize the genuine extracted product image';
const imageStart = studio.indexOf(imageStartMarker);
const brandLineMarker = '      const effectiveBrand = customBrand.trim() || campaign.product.brand || parsedInfo.brand || \'Amazon Choice\';';
const brandLine = imageStart >= 0 ? studio.indexOf(brandLineMarker, imageStart) : -1;
if (imageStart >= 0 && brandLine > imageStart) {
  const brandLineEnd = studio.indexOf('\n', brandLine);
  const replacement = `      // 3. Use only the NEW AI-generated Yousra Smile product image.\n      const chosenImage = campaign.product.image || campaign.heroImage || '';\n      if (!chosenImage || !chosenImage.startsWith('http')) {\n        throw new Error('No original AI product image was generated. Store images will not be used as final media.');\n      }\n\n      const effectiveBrand = customBrand.trim() || campaign.product.brand || '';`;
  studio = `${studio.slice(0, imageStart)}${replacement}${studio.slice(brandLineEnd)}`;
}

// Remove the now-unused URL guesser from the generation block.
studio = studio.replace(
  "      const parsedInfo = extractBasicProductInfoFromUrl(productLink.trim(), siteSettings.amazonTag);\n",
  ''
);

// Do not invent product prices/features during a successful URL generation.
studio = studio.replace('        originalPrice: campaign.product.originalPrice || 450,', '        originalPrice: campaign.product.originalPrice,');
studio = studio.replace('        discountPrice: campaign.product.discountPrice || 299,', '        discountPrice: campaign.product.discountPrice,');
studio = studio.replace('        discountPercent: campaign.product.discountPercent || 33,', '        discountPercent: campaign.product.discountPercent,');
studio = studio.replace(
  "        features: campaign.product.features || ['جودة واعتمادية عالية', 'سعر مخفض لفترة محدودة', 'ضمان معتمد'],",
  '        features: Array.isArray(campaign.product.features) ? campaign.product.features : [],'
);
studio = studio.replace(
  '        category: campaign.product.category || \'smart-home\',',
  "        category: campaign.product.category || 'smart-home',\n        subcategory: campaign.product.subcategory || '',\n        description: campaign.product.description || campaign.product.nameEn || '',\n        currency: campaign.product.currency || 'USD',"
);
studio = studio.replace(
  '        image: chosenImage,',
  '        image: chosenImage,\n        images: Array.isArray(campaign.product.images) && campaign.product.images.length ? campaign.product.images : [chosenImage],'
);

// If URL extraction/generation fails, stop. The previous catch block invented a
// generic Arabic product, fake price, fake discount and stock photo.
const handlerStart = studio.indexOf('  const handleInstantGenerate = async () => {');
const catchStart = handlerStart >= 0 ? studio.indexOf('    } catch (err: any) {', handlerStart) : -1;
const finallyStart = catchStart >= 0 ? studio.indexOf('    } finally {', catchStart) : -1;
if (catchStart >= 0 && finallyStart > catchStart) {
  const catchReplacement = `    } catch (err: any) {\n      console.error('URL-first product generation failed:', err);\n      setCampaignData(null);\n      alert(err?.message || 'Could not verify the real product or generate original media. Nothing was fabricated.');\n`;
  studio = `${studio.slice(0, catchStart)}${catchReplacement}${studio.slice(finallyStart)}`;
}

// Publish only verified/extracted values. Never add fake ratings, warranty,
// shipping claims, stock video links, or placeholder YouTube reviews.
const publishStart = studio.indexOf('  // Publish Directly to Store');
const publishEndMarker = '  // Real Video Synthesis with Canvas & Audio';
const publishEnd = publishStart >= 0 ? studio.indexOf(publishEndMarker, publishStart) : -1;
if (publishStart >= 0 && publishEnd > publishStart) {
  const safePublish = `  // Publish verified URL-generated product to Store\n  const handlePublishToStore = () => {\n    if (!campaignData?.image || !campaignData?.affiliateLink) return;\n    setIsPublishing(true);\n\n    const affiliate = String(campaignData.affiliateLink || '');\n    const isAliExpress = /aliexpress\\./i.test(affiliate);\n    const generatedImages = Array.isArray(campaignData.images) && campaignData.images.length\n      ? campaignData.images\n      : [campaignData.image];\n\n    const newProd: Product = {\n      id: \`prod-\${Date.now()}\`,\n      titleAr: campaignData.productTitleAr || campaignData.productTitleEn,\n      titleEn: campaignData.productTitleEn || campaignData.productTitleAr,\n      description: campaignData.description || campaignData.productTitleEn || campaignData.productTitleAr,\n      descriptionEn: campaignData.description || campaignData.productTitleEn || '',\n      longDescription: campaignData.socialCaption || campaignData.description || '',\n      longDescriptionEn: campaignData.socialCaption || campaignData.description || '',\n      category: campaignData.category || 'smart-home',\n      subcategory: campaignData.subcategory || '',\n      subcategoryEn: campaignData.subcategory || '',\n      brand: campaignData.brand || '',\n      image: campaignData.image,\n      images: generatedImages,\n      youtubeUrl: '',\n      tiktokUrl: '',\n      pinterestUrl: '',\n      videoUrl: '',\n      amazonUrl: isAliExpress ? '' : affiliate,\n      aliexpressUrl: isAliExpress ? affiliate : '',\n      originalPrice: Number(campaignData.originalPrice) || 0,\n      discountPrice: Number(campaignData.discountPrice) || Number(campaignData.originalPrice) || 0,\n      discountPercent: Number(campaignData.discountPercent) || 0,\n      currency: campaignData.currency || 'USD',\n      rating: 0,\n      reviewCount: 0,\n      features: Array.isArray(campaignData.features) ? campaignData.features : [],\n      featuresEn: Array.isArray(campaignData.features) ? campaignData.features : [],\n      specs: {},\n      specsEn: {},\n      keywords: Array.isArray(campaignData.hashtags) ? campaignData.hashtags : [],\n      isFeatured: false,\n      isTopSelling: false,\n      isLatest: true,\n      isActive: true,\n      viewsCount: 0,\n      createdAt: new Date().toISOString()\n    };\n\n    addProduct(newProd);\n    onProductPublished?.(newProd);\n    setIsPublishing(false);\n    setPublishSuccess(true);\n  };\n\n`;
  studio = `${studio.slice(0, publishStart)}${safePublish}${studio.slice(publishEnd)}`;
}

// Render visible product title and scene fields in English. The admin status UI
// may remain Arabic; the produced media must not contain Arabic copy.
studio = studio.replace(
  '        productTitle: campaignData.productTitleAr,',
  '        productTitle: campaignData.productTitleEn || campaignData.productTitleAr,'
);
studio = studio.replace(
  "          voiceoverScriptAr: s.voiceoverText || '',\n          voiceoverScriptEn: s.voiceoverText || '',\n          onScreenTextAr: s.screenText || '',\n          onScreenTextEn: s.screenText || '',",
  "          timeRange: s.timeRange || '',\n          voiceoverText: s.voiceoverText || '',\n          screenText: s.screenText || '',\n          sceneImage: s.sceneImage || campaignData.image,"
);
studio = studio.replace(
  "          callToAction: idx === ((campaignData.videoScript?.scenes?.length || 1) - 1) ? 'اطلب الآن بخصم خاص' : undefined",
  "          transformationNote: idx === ((campaignData.videoScript?.scenes?.length || 1) - 1) ? 'Check the product page for current details.' : undefined"
);

fs.writeFileSync(studioPath, studio, 'utf8');

const rendererPath = path.resolve(process.cwd(), 'src/services/realVideoRenderer.ts');
let renderer = fs.readFileSync(rendererPath, 'utf8');
renderer = renderer.replace('منتج معتمد عالي الجودة', 'VERIFIED PRODUCT');
renderer = renderer.replace("const highlightText = currentScene?.screenText || 'عرض حصري ومميز 🔥';", "const highlightText = currentScene?.screenText || 'Product Highlight';");
fs.writeFileSync(rendererPath, renderer, 'utf8');

console.log('[Yousra Smile] English-only video studio safeguards enabled.');
