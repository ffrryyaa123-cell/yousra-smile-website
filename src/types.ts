import { CurrencyCode } from './utils/currency';

export type { CurrencyCode };

// Category slugs are database-driven so the owner can add and reorder categories
// without requiring a code change.
export type CategoryId = string;

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
  categoryEn?: string;
  image: string;
  readTime: string;
  readTimeEn?: string;
  publishedDate: string;
  authorName: string;
  authorNameEn?: string;
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
  instagramUrl?: string;
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
  keywordsEn?: string[];
  isFeatured?: boolean;
  isTopSelling?: boolean;
  isLatest?: boolean;
  isHidden?: boolean;
  isActive?: boolean;
  viewsCount: number;
  createdAt: string;
}

export interface Category {
  id: CategoryId;
  nameAr: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  subcategories: string[];
  image: string;
  showOnHome?: boolean;
}

export type SocialPlatform = 'youtube' | 'tiktok' | 'pinterest' | 'instagram' | 'x';

export interface VideoReview {
  id: string;
  productId: string;
  productTitle: string;
  productTitleEn?: string;
  productImage: string;
  thumbnailUrl?: string;
  platform: SocialPlatform;
  embedId: string;
  videoUrl: string;
  title: string;
  titleEn?: string;
  views: string;
  viewsEn?: string;
  date: string;
  dateEn?: string;
  duration: string;
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
  pinterestUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  instagramUrl?: string;
  xUrl?: string;
  whatsappUrl?: string;
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
