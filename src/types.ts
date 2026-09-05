import { CurrencyCode } from './utils/currency';

export type { CurrencyCode };

export type CategoryId = 
  | 'smart-home'
  | 'smart-kitchen'
  | 'furniture-decor'
  | 'smart-gadgets'
  | 'women-corner'
  | 'health-fitness';

export interface UserReview {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
}

export interface BlogPost {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  category: string;
  image: string;
  readTime: string;
  publishedDate: string;
  authorName: string;
  relatedProductIds: string[];
}

export interface Product {
  id: string;
  titleAr: string;
  titleEn: string;
  description: string;
  descriptionEn?: string;
  longDescription: string;
  longDescriptionEn?: string;
  category: CategoryId;
  subcategory: string;
  subcategoryEn?: string;
  brand: string;
  image: string;
  images: string[];
  youtubeUrl?: string;
  tiktokUrl?: string;
  pinterestUrl?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoStoragePath?: string;
  amazonUrl: string;
  aliexpressUrl?: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  currency: string;
  rating: number;
  reviewCount: number;
  reviews?: UserReview[];
  features: string[];
  featuresEn?: string[];
  specs: Record<string, string>;
  specsEn?: Record<string, string>;
  keywords: string[];
  isFeatured?: boolean;
  isTopSelling?: boolean;
  isLatest?: boolean;
  isHidden?: boolean;
  isActive?: boolean;
  viewsCount: number;
  createdAt: string;
  sourceProductUrl?: string;
  thumbnail?: string;
  mediaPipeline?: {
    script?: PromotionalVideoScript;
    captions?: string[];
    hashtags?: string[];
    generatedImagePaths?: string[];
    generatedVideoPaths?: string[];
    imageModel?: string;
    videoModel?: string;
    generatedAt?: string;
    status?: 'draft' | 'images_ready' | 'video_pending' | 'video_ready' | 'failed';
    lastError?: string;
  };
}

export interface Category {
  id: CategoryId;
  nameAr: string;
  nameEn: string;
  icon: string;
  description: string;
  subcategories: string[];
  image: string;
}

export interface VideoReview {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  thumbnailUrl?: string;
  /** When true, the owner removed the review-card image deliberately. */
  hideThumbnail?: boolean;
  platform: 'youtube' | 'tiktok' | 'pinterest' | 'instagram' | 'snapchat' | 'direct' | 'local' | 'generated';
  embedId: string;
  videoUrl: string;
  title: string;
  views: string;
  date: string;
  duration: string;
  storagePath?: string;
  seoDescription?: string;
  hashtags?: string[];
  scenes?: any[];
  script?: any;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  currentPrice: number;
  targetPrice: number;
  currency: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  subcategory: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  minDiscount: number;
  sortBy: 'latest' | 'rating' | 'best-selling' | 'highest-discount' | 'price-low' | 'price-high';
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteLogo: string;
  defaultLanguage: 'ar' | 'en';
  defaultCurrency: CurrencyCode;
  instagramUrl?: string;
  snapchatUrl?: string;
  pinterestUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  amazonTag: string;
  aliexpressTag: string;
  contactEmail: string;
}

export interface AiGeneratedProductContent {
  seoTitle: string;
  seoDescription: string;
  productDescription: string;
  longDescription?: string;
  tags: string[];
  hashtags: string[];
  keywords: string[];
  imageNote: string;
  suggestedFeatures?: string[];
}

export interface VideoScene {
  timeRange: string;
  visualPrompt: string;
  voiceoverText: string;
  screenText: string;
  sceneType?: 'before_problem' | 'action' | 'specs' | 'before_after' | 'cta';
  sceneImage?: string;
  beforeImage?: string;
  afterImage?: string;
  transformationNote?: string;
}

export interface PromotionalVideoScript {
  videoTitle: string;
  hook: string;
  estimatedDuration: string;
  scenes: VideoScene[];
  callToAction: string;
  suggestedBgm?: string;
}

export interface ExtractedProductInfo {
  rating?: number;
  reviewCount?: number;
  nameAr: string;
  nameEn: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  currency: string;
  features: string[];
  affiliateLink: string;
  sourceUrl: string;
  image?: string;
  images?: string[];
  youtubeUrl?: string;
  generatedImagePaths?: string[];
}

export interface ProductVideoCampaignResult {
  product: ExtractedProductInfo;
  videoScript: PromotionalVideoScript;
  socialCaption: string;
  hashtags: string[];
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  suggestedVideoUrl?: string;
  heroImage?: string;
  beforeImage?: string;
  afterImage?: string;
}

export interface ProductVideoServiceInput {
  productUrl: string;
  affiliateLink?: string;
  affiliateTag?: string;
  platform?: 'tiktok' | 'youtube' | 'instagram' | 'pinterest';
  targetAudience?: string;
  customNotes?: string;
  geminiApiKey?: string;
  agentApiKey?: string;
}

export type PageView = 
  | 'home' 
  | 'products' 
  | 'videos' 
  | 'deals' 
  | 'favorites' 
  | 'cart'
  | 'compare' 
  | 'admin' 
  | 'about' 
  | 'contact' 
  | 'privacy' 
  | 'terms' 
  | 'cookies' 
  | 'disclosure';

