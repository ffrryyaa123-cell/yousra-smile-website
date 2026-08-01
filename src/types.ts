import { CurrencyCode } from './utils/currency';

export type { CurrencyCode };

export type CategoryId = 
  | 'smart-home'
  | 'smart-kitchen'
  | 'furniture-decor'
  | 'smart-gadgets'
  | 'women-corner'
  | 'health-fitness';

export interface Product {
  id: string;
  titleAr: string;
  titleEn: string;
  description: string;
  longDescription: string;
  category: CategoryId;
  subcategory: string;
  brand: string;
  image: string;
  images: string[];
  youtubeUrl?: string;
  tiktokUrl?: string;
  pinterestUrl?: string;
  amazonUrl: string;
  aliexpressUrl?: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  currency: string;
  rating: number;
  reviewCount: number;
  features: string[];
  specs: Record<string, string>;
  keywords: string[];
  isFeatured?: boolean;
  isTopSelling?: boolean;
  isLatest?: boolean;
  viewsCount: number;
  createdAt: string;
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
  platform: 'youtube' | 'tiktok' | 'pinterest';
  embedId: string;
  videoUrl: string;
  title: string;
  views: string;
  date: string;
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

export type PageView = 
  | 'home' 
  | 'products' 
  | 'videos' 
  | 'deals' 
  | 'favorites' 
  | 'compare' 
  | 'admin' 
  | 'about' 
  | 'contact' 
  | 'privacy' 
  | 'terms' 
  | 'cookies' 
  | 'disclosure';
