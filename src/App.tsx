import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { VideosPage } from './pages/VideosPage';
import { DealsPage } from './pages/DealsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ComparePage } from './pages/ComparePage';
import { AdminPage } from './pages/AdminPage';
import { StaticPage } from './pages/StaticPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { VideoModal } from './components/VideoModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { ThumbnailEditorModal } from './components/ThumbnailEditorModal';
import { CartModal } from './components/CartModal';
import { SEOHead } from './components/SEOHead';
import { WhatsAppButton } from './components/WhatsAppButton';
import { ScrollToTop } from './components/ScrollToTop';
import { RecentPurchaseToast } from './components/RecentPurchaseToast';

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
    darkMode
  } = useApp();

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'products':
        return <ProductsPage />;
      case 'videos':
        return <VideosPage />;
      case 'deals':
        return <DealsPage />;
      case 'favorites':
      case 'cart':
        return <FavoritesPage />;
      case 'compare':
        return <ComparePage />;
      case 'admin':
        return <AdminPage />;
      case 'about':
      case 'contact':
      case 'privacy':
      case 'terms':
      case 'cookies':
      case 'disclosure':
        return <StaticPage type={activePage} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Cairo',sans-serif] transition-colors ${
      darkMode 
        ? 'bg-[#0D0714] text-[#F4EFF5]' 
        : 'bg-[#e0f2fe] text-slate-900'
    }`}>
      <SEOHead />
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 pt-1 pb-3">
        {renderCurrentPage()}
      </main>

      <Footer />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={closeProductDetail} 
        />
      )}

      {/* Video Review Playback Modal */}
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={closeVideoModal} 
        />
      )}

      {/* Price Alert Modal */}
      {alertModalProduct && <PriceAlertModal />}

      {/* Cart Modal Drawer */}
      <CartModal />

      {/* Video Thumbnail Editor Modal (YouTube Style) */}
      {editingThumbnailVideo && (
        <ThumbnailEditorModal 
          video={editingThumbnailVideo} 
          onClose={closeThumbnailEditor} 
        />
      )}
      {/* Floating WhatsApp Consultation Button */}
      <WhatsAppButton />

      {/* Floating Back To Top Button */}
      <ScrollToTop />

      {/* Live Recent Purchase Toast Notification */}
      <RecentPurchaseToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
