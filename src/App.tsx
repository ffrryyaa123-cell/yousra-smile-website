import React, { Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { SEOHead } from './components/SEOHead';
import { HomePage } from './pages/HomePage';
import { lazyWithReload } from './utils/lazyWithReload';

const ProductsPage = lazyWithReload(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const VideosPage = lazyWithReload(() => import('./pages/VideosPage').then(m => ({ default: m.VideosPage })));
const DealsPage = lazyWithReload(() => import('./pages/DealsPage').then(m => ({ default: m.DealsPage })));
const FavoritesPage = lazyWithReload(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ComparePage = lazyWithReload(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const AdminPage = lazyWithReload(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const StaticPage = lazyWithReload(() => import('./pages/StaticPage').then(m => ({ default: m.StaticPage })));
const ProductDetailModal = lazyWithReload(() => import('./components/ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const VideoModal = lazyWithReload(() => import('./components/VideoModal').then(m => ({ default: m.VideoModal })));
const PriceAlertModal = lazyWithReload(() => import('./components/PriceAlertModal').then(m => ({ default: m.PriceAlertModal })));
const ThumbnailEditorModal = lazyWithReload(() => import('./components/ThumbnailEditorModal').then(m => ({ default: m.ThumbnailEditorModal })));
const CartModal = lazyWithReload(() => import('./components/CartModal').then(m => ({ default: m.CartModal })));
const RecentPurchaseToast = lazyWithReload(() => import('./components/RecentPurchaseToast').then(m => ({ default: m.RecentPurchaseToast })));
const PublicVisitorBadge = lazyWithReload(() => import('./components/PublicVisitorBadge').then(m => ({ default: m.PublicVisitorBadge })));
const VideoImportModal = lazyWithReload(() => import('./components/VideoImportModal').then(m => ({ default: m.VideoImportModal })));
const Footer = lazyWithReload(() => import('./components/Footer').then(m => ({ default: m.Footer })));
const WhatsAppButton = lazyWithReload(() => import('./components/WhatsAppButton').then(m => ({ default: m.WhatsAppButton })));
const ScrollToTop = lazyWithReload(() => import('./components/ScrollToTop').then(m => ({ default: m.ScrollToTop })));

const LoadingFallback = () => <div className="min-h-[20vh]" aria-hidden="true" />;

const AppContent: React.FC = () => {
  const {
    activePage,
    selectedProduct,
    closeProductDetail,
    selectedVideo,
    closeVideoModal,
    alertModalProduct,
    editingThumbnailVideo,
    closeThumbnailEditor,
    darkMode,
    importVideoModalOpen,
    closeImportVideoModal,
    importVideoPreselectedProductId,
    importVideoDefaultMode,
    importVideoIsReplacing
  } = useApp();

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'products': return <ProductsPage />;
      case 'videos': return <VideosPage />;
      case 'deals': return <DealsPage />;
      case 'favorites':
      case 'cart': return <FavoritesPage />;
      case 'compare': return <ComparePage />;
      case 'admin': return <AdminPage />;
      case 'about':
      case 'contact':
      case 'privacy':
      case 'terms':
      case 'cookies':
      case 'disclosure': return <StaticPage type={activePage} />;
      default: return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Cairo',sans-serif] transition-colors ${darkMode ? 'bg-[#0D0714] text-[#F4EFF5]' : 'bg-[#e0f2fe] text-slate-900'}`}>
      <SEOHead />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 pt-1 pb-3">
        <Suspense fallback={<LoadingFallback />}>{renderCurrentPage()}</Suspense>
      </main>
      <Suspense fallback={<div className="min-h-48" aria-hidden="true" />}><Footer /></Suspense>

      <Suspense fallback={null}>
        {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={closeProductDetail} />}
        {selectedVideo && <VideoModal video={selectedVideo} onClose={closeVideoModal} />}
        {alertModalProduct && <PriceAlertModal />}
        <CartModal />
        {editingThumbnailVideo && <ThumbnailEditorModal video={editingThumbnailVideo} onClose={closeThumbnailEditor} />}
        {importVideoModalOpen && <VideoImportModal isOpen={importVideoModalOpen} onClose={closeImportVideoModal} preselectedProductId={importVideoPreselectedProductId} isReplacing={importVideoIsReplacing} defaultMode={importVideoDefaultMode} />}
        {activePage === 'admin' && <RecentPurchaseToast />}
        {activePage !== 'admin' && <PublicVisitorBadge />}
      </Suspense>

      <Suspense fallback={null}><WhatsAppButton /><ScrollToTop /></Suspense>
    </div>
  );
};

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}
