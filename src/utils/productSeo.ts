import { Product, PageView } from '../types';

const normalizeSlug = (value: string): string =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90) || 'product';

export const productSlug = (product: Pick<Product, 'id' | 'titleEn' | 'titleAr'>): string => {
  const readable = normalizeSlug(product.titleEn || product.titleAr || product.id);
  return `${readable}--${encodeURIComponent(product.id)}`;
};

export const productPath = (product: Pick<Product, 'id' | 'titleEn' | 'titleAr'>): string =>
  `/product/${productSlug(product)}`;

export const productIdFromPath = (pathname: string): string | null => {
  const match = String(pathname || '').match(/^\/product\/[^/]*--([^/]+)\/?$/i);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const pagePath = (
  page: PageView,
  staticTab?: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure'
): string => {
  if (page === 'home') return '/';
  if (page === 'admin') return '/admin';
  if (staticTab) return `/${staticTab}`;
  return `/${page}`;
};

export const pageFromPath = (pathname: string): {
  page: PageView;
  staticTab?: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure';
} | null => {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (path.startsWith('/product/')) return { page: 'products' };
  const simple: Record<string, PageView> = {
    '/': 'home',
    '/products': 'products',
    '/videos': 'videos',
    '/deals': 'deals',
    '/favorites': 'favorites',
    '/compare': 'compare',
    '/admin': 'admin'
  };
  if (simple[path]) return { page: simple[path] };
  const staticPages = ['about', 'contact', 'privacy', 'terms', 'cookies', 'disclosure'] as const;
  const tab = staticPages.find(name => path === `/${name}`);
  return tab ? { page: tab, staticTab: tab } : null;
};

export const absoluteProductUrl = (product: Pick<Product, 'id' | 'titleEn' | 'titleAr'>): string =>
  `https://yousrasmile.com${productPath(product)}`;
