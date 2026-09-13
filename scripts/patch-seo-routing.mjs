import fs from 'node:fs';

const file = new URL('../src/context/AppContext.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) throw new Error(`[patch-seo-routing] Missing ${label}; refusing to guess.`);
  source = source.replace(needle, replacement);
  changed = true;
};

if (!source.includes("from '../utils/productSeo'")) {
  const needle = "import { recordSiteActivity } from '../services/siteActivity';";
  replaceOnce(
    needle,
    `${needle}\nimport { pageFromPath, pagePath, productIdFromPath, productPath } from '../utils/productSeo';`,
    'product SEO route import'
  );
}

if (!source.includes('const syncRouteFromLocation = useCallback')) {
  const needle = "  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);";
  const block = `${needle}\n\n  // Keep the existing state-driven UI, but give every public page and product a\n  // stable browser URL. Direct visits from Google resolve after the live\n  // Supabase catalog arrives; back/forward navigation stays in sync too.\n  const syncRouteFromLocation = useCallback(() => {\n    const pathname = window.location.pathname;\n    const route = pageFromPath(pathname);\n    if (route) {\n      setActivePage(route.page);\n      if (route.staticTab) setActiveStaticTab(route.staticTab);\n    }\n\n    const routeProductId = productIdFromPath(pathname);\n    if (routeProductId) {\n      const match = products.find(product => product.id === routeProductId && product.isActive !== false && !product.isHidden);\n      if (match) setSelectedProduct(match);\n    } else {\n      setSelectedProduct(null);\n    }\n  }, [products]);\n\n  useEffect(() => {\n    syncRouteFromLocation();\n    window.addEventListener('popstate', syncRouteFromLocation);\n    return () => window.removeEventListener('popstate', syncRouteFromLocation);\n  }, [syncRouteFromLocation]);\n\n  useEffect(() => {\n    if (!selectedProduct || activePage === 'admin') return;\n    const timer = window.setTimeout(\n      () => void recordSiteActivity('product_view', 'products', selectedProduct.id),\n      250\n    );\n    return () => window.clearTimeout(timer);\n  }, [selectedProduct?.id, activePage]);`;
  replaceOnce(needle, block, 'selectedProduct route synchronization point');
}

if (!source.includes('const nextPath = pagePath(page, staticTab);')) {
  const needle = `  const setPage = (page: PageView, staticTab?: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure') => {\n    setActivePage(page);`;
  const replacement = `  const setPage = (page: PageView, staticTab?: 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'disclosure') => {\n    const nextPath = pagePath(page, staticTab);\n    if (window.location.pathname !== nextPath) {\n      window.history.pushState({ ysPage: page }, '', nextPath);\n    }\n    setSelectedProduct(null);\n    setActivePage(page);`;
  replaceOnce(needle, replacement, 'setPage URL synchronization');
}

if (!source.includes('const nextProductPath = productPath(product);')) {
  const needle = `  const openProductDetail = (product: Product) => {\n    setSelectedProduct(product);`;
  const replacement = `  const openProductDetail = (product: Product) => {\n    if (activePage !== 'admin') {\n      const nextProductPath = productPath(product);\n      if (window.location.pathname !== nextProductPath) {\n        window.history.pushState({ ysProductId: product.id }, '', nextProductPath);\n      }\n    }\n    setSelectedProduct(product);`;
  replaceOnce(needle, replacement, 'product URL push');
}

// Product views are now recorded by the selectedProduct effect so direct Google\n// landings and in-site clicks use the same single path and cannot double-count.
if (source.includes("    void recordSiteActivity('product_view', activePage, product.id);")) {
  source = source.replace("    void recordSiteActivity('product_view', activePage, product.id);\n", '');
  changed = true;
}

if (!source.includes('const closeProductDetail = () => {')) {
  replaceOnce(
    '  const closeProductDetail = () => setSelectedProduct(null);',
    `  const closeProductDetail = () => {\n    setSelectedProduct(null);\n    if (activePage !== 'admin' && productIdFromPath(window.location.pathname)) {\n      window.history.replaceState(\n        { ysPage: activePage },\n        '',\n        pagePath(activePage, activeStaticTab)\n      );\n    }\n  };`,
    'product URL close handling'
  );
}

if (changed) {
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-seo-routing] Stable public routes enabled.');
} else {
  console.log('[patch-seo-routing] Already applied.');
}
