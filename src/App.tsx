import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SEOHead } from './components/SEOHead';
import { WhatsAppButton } from './components/WhatsAppButton';
import { ScrollToTop } from './components/ScrollToTop';

const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const VideosPage = lazy(() => import('./pages/VideosPage').then(m => ({ default: m.VideosPage })));
const DealsPage = lazy(() => import('./pages/DealsPage').then(m => ({ default: m.DealsPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const StaticPage = lazy(() => import('./pages/StaticPage').then(m => ({ default: m.StaticPage })));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const VideoModal = lazy(() => import('./components/VideoModal').then(m => ({ default: m.VideoModal })));
const PriceAlertModal = lazy(() => import('./components/PriceAlertModal').then(m => ({ default: m.PriceAlertModal })));
const ThumbnailEditorModal = lazy(() => import('./components/ThumbnailEditorModal').then(m => ({ default: m.ThumbnailEditorModal })));
const CartModal = lazy(() => import('./components/CartModal').then(m => ({ default: m.CartModal })));
const RecentPurchaseToast = lazy(() => import('./components/RecentPurchaseToast').then(m => ({ default: m.RecentPurchaseToast })));
const VideoImportModal = lazy(() => import('./components/VideoImportModal').then(m => ({ default: m.VideoImportModal })));

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
      <Footer />

      <Suspense fallback={null}>
        {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={closeProductDetail} />}
        {selectedVideo && <VideoModal video={selectedVideo} onClose={closeVideoModal} />}
        {alertModalProduct && <PriceAlertModal />}
        <CartModal />
        {editingThumbnailVideo && <ThumbnailEditorModal video={editingThumbnailVideo} onClose={closeThumbnailEditor} />}
        {importVideoModalOpen && <VideoImportModal isOpen={importVideoModalOpen} onClose={closeImportVideoModal} preselectedProductId={importVideoPreselectedProductId} isReplacing={importVideoIsReplacing} defaultMode={importVideoDefaultMode} />}
        <RecentPurchaseToast />
      </Suspense>

      <WhatsAppButton />
      <ScrollToTop />
    </div>
  );
};

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}
