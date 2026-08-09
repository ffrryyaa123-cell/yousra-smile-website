import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

interface SEOHeadProps {
  customTitle?: string;
  customDescription?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ customTitle, customDescription }) => {
  const {
    activePage,
    selectedProduct,
    language,
    activeStaticTab,
    siteSettings,
    currency,
    formatPrice,
    formatPriceObject
  } = useApp();

  useEffect(() => {
    const siteName = language === 'en'
      ? 'Yousra Smile'
      : (siteSettings.siteName || 'يسرى سمايل (Yousra Smile)');
    const siteLogo = siteSettings.siteLogo || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';
    
    let title = language === 'en'
      ? `${siteName} - Smart Products, Reviews & Modern Living`
      : `${siteName} - مراجعات الأجهزة الذكية والمنزل العصري`;
    let description = language === 'en'
      ? `${siteName} reviews smart-home, kitchen, beauty, and modern-living products with selected Amazon and AliExpress deals.`
      : `موقع ${siteName} لمراجعات الأجهزة المنزلية الذكية والمطبخ العصري والجمال مع أفضل كوبونات وعروض أمازون وعلي إكسبريس.`;
    let keywords = language === 'en'
      ? `${siteName}, product reviews, affiliate shopping, Amazon, AliExpress, robot vacuums, air fryers, smart home`
      : `${siteName}, مراجعات أجهزة, تسويق بالعمولة, أمازون, علي إكسبريس, مكانس روبوتية, قلاية هوائية, أجهزة منزلية ذكية`;
    let ogType = 'website';
    let imageUrl = siteLogo;
    let currentUrl = window.location.href;

    const currentProduct: Product | null = selectedProduct;

    if (currentProduct) {
      const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.brand) : currentProduct.titleAr;
      const prodDescription = language === 'en'
        ? (currentProduct.descriptionEn || 'English product details are being prepared.')
        : currentProduct.description;
      const prodKeywords = language === 'en' ? (currentProduct.keywordsEn || []) : currentProduct.keywords;
      title = language === 'en'
        ? `${prodName} | Price & Review | Yousra Smile`
        : `${prodName} | السعر والمراجعة | Yousra Smile`;
      description = language === 'en'
        ? `${prodDescription} • Original price: ${formatPrice(currentProduct.originalPrice)} | Sale price: ${formatPrice(currentProduct.discountPrice)} (${currentProduct.discountPercent}% off). Rated ${currentProduct.rating}/5 from ${currentProduct.reviewCount} reviews.`
        : `${prodDescription} • السعر الأصلي: ${formatPrice(currentProduct.originalPrice)} | السعر بعد الخصم: ${formatPrice(currentProduct.discountPrice)} (${currentProduct.discountPercent}% خصم). تقييم ${currentProduct.rating}/5 من ${currentProduct.reviewCount} تقييم.`;
      keywords = language === 'en'
        ? `${prodKeywords.join(', ')}, ${currentProduct.brand}, ${prodName} price, ${prodName} review, Amazon deal`
        : `${prodKeywords.join(', ')}, ${currentProduct.brand}, سعر ${prodName}, مراجعة ${prodName}, خصم أمازون`;
      ogType = 'og:product';
      imageUrl = currentProduct.image;
    } else {
      switch (activePage) {
        case 'products':
          title = language === 'en' ? 'Smart Products Catalog & Reviews | Yousra Smile' : 'كتالوج المنتجات الذكية والمراجعات | يسرى سمايل';
          description = language === 'en' ? 'Explore all reviewed products in smart home, kitchen appliances, modern furniture, and personal care gadgets.' : 'استكشف كافة المنتجات المراجعة في أقسام المنزل الذكي، أجهزة المطبخ، الأثاث المودرن، وأجهزة العناية بالمرأة والرياضة.';
          break;
        case 'videos':
          title = language === 'en' ? 'Live Video Reviews | Yousra Smile Channel' : 'مراجعات الفيديو الحية | قناة يسرى سمايل';
          description = language === 'en' ? 'Watch unboxing and real usage videos of top smart home and kitchen gadgets.' : 'شاهد فيديوهات الفتح والتجربة الحقيقية لأحدث أجهزة المنزل والمطبخ الذكي على يوتيوب وتيك توك وبنترست.';
          break;
        case 'deals':
          title = language === 'en' ? 'Top Exclusive Deals & Coupons | Yousra Smile' : 'أقوى العروض والخصومات الحصرية | يسرى سمايل';
          description = language === 'en' ? 'Save big with up to 40% discount coupons on Amazon & AliExpress best sellers.' : 'وفري مالك مع أقوى خصومات وتخفيضات أجهزة المنزل الذكي تصل إلى 40% مع رابط الشراء المباشر.';
          break;
        case 'compare':
          title = language === 'en' ? 'Compare Smart Products | Yousra Smile' : 'مقارنة المواصفات والأسعار | يسرى سمايل';
          description = language === 'en' ? 'Compare prices, specs, and features of your favorite smart home products side by side.' : 'قارن بين أسعار ومواصفات ومميزات أفضل أجهزة المنزل الذكي جنباً إلى جنب لاختيار الأنسب لبيتك.';
          break;
        case 'favorites':
          title = language === 'en' ? 'My Saved Favorites | Yousra Smile' : 'منتجاتي المفضلة | يسرى سمايل';
          description = language === 'en' ? 'Your saved list of recommended smart home gadgets and kitchen tools.' : 'قائمتك المحفوظة من أفضل الأجهزة والأدوات الذكية لمتابعة أسعارها وعروضها.';
          break;
        case 'admin':
          title = language === 'en' ? 'Admin Dashboard | Yousra Smile' : 'لوحة التحكم | يسرى سمايل';
          break;
        case 'about':
        case 'contact':
        case 'privacy':
        case 'terms':
        case 'cookies':
        case 'disclosure':
          if (activeStaticTab === 'about') title = language === 'en' ? 'About Yousra Smile' : 'قصة يسرى سمايل | من نحن';
          else if (activeStaticTab === 'contact') title = language === 'en' ? 'Contact & Partnerships | Yousra Smile' : 'اتصل بنا والتعاون التجاري | يسرى سمايل';
          else if (activeStaticTab === 'disclosure') title = language === 'en' ? 'Affiliate Disclosure | Yousra Smile' : 'إفصاح روابط الأفلييت والتسويق بالعمولة | يسرى سمايل';
          else if (activeStaticTab === 'privacy') title = language === 'en' ? 'Privacy Policy | Yousra Smile' : 'سياسة الخصوصية | يسرى سمايل';
          else if (activeStaticTab === 'terms') title = language === 'en' ? 'Terms of Use | Yousra Smile' : 'شروط الاستخدام | يسرى سمايل';
          else if (activeStaticTab === 'cookies') title = language === 'en' ? 'Cookie Policy | Yousra Smile' : 'سياسة الكوكيز | يسرى سمايل';
          break;
        default:
          break;
      }
    }

    if (customTitle) title = customTitle;
    if (customDescription) description = customDescription;

    // Update Document Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index, follow');

    // Update Open Graph Meta Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', imageUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:site_name', siteName);
    setMetaTag('property', 'og:locale', language === 'ar' ? 'ar_SA' : 'en_US');

    // Update Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', imageUrl);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Dynamic JSON-LD Schema Markup Injection
    let schemaObj: any = null;

    if (currentProduct) {
      const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.brand) : currentProduct.titleAr;
      const prodDescription = language === 'en'
        ? (currentProduct.descriptionEn || 'English product details are being prepared.')
        : currentProduct.description;
      const currentPrice = formatPriceObject(currentProduct.discountPrice);
      const originalPrice = formatPriceObject(currentProduct.originalPrice);
      schemaObj = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": prodName,
        "image": [currentProduct.image, ...(currentProduct.images || [])],
        "description": prodDescription,
        "sku": currentProduct.id,
        "mpn": currentProduct.id,
        "brand": {
          "@type": "Brand",
          "name": currentProduct.brand
        },
        "review": [
          {
            "@type": "Review",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": currentProduct.rating.toString(),
              "bestRating": "5",
              "worstRating": "1"
            },
            "author": {
              "@type": "Person",
              "name": language === 'en' ? 'Yousra Smile' : 'يسرى سمايل (Yousra Smile)'
            },
            "datePublished": currentProduct.createdAt
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": currentProduct.rating.toString(),
          "reviewCount": currentProduct.reviewCount.toString(),
          "bestRating": "5",
          "worstRating": "1"
        },
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": currency,
          "lowPrice": currentPrice.amount.toString(),
          "highPrice": originalPrice.amount.toString(),
          "offerCount": currentProduct.aliexpressUrl ? "2" : "1",
          "offers": [
            {
              "@type": "Offer",
              "name": "Amazon Purchase Link",
              "url": currentProduct.amazonUrl,
              "priceCurrency": currency,
              "price": currentPrice.amount.toString(),
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "Amazon"
              }
            },
            ...(currentProduct.aliexpressUrl ? [{
              "@type": "Offer",
              "name": "AliExpress Purchase Link",
              "url": currentProduct.aliexpressUrl,
              "priceCurrency": currency,
              "price": currentPrice.amount.toString(),
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "AliExpress"
              }
            }] : [])
          ]
        }
      };
    } else {
      schemaObj = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${currentUrl}#website`,
            "url": currentUrl,
            "name": siteName,
            "alternateName": siteName,
            "description": description,
            "inLanguage": language === 'ar' ? 'ar' : 'en'
          },
          {
            "@type": "Organization",
            "@id": `${currentUrl}#organization`,
            "name": siteName,
            "url": currentUrl,
            "logo": siteLogo,
            "sameAs": [
              siteSettings.youtubeUrl || "https://youtube.com",
              siteSettings.tiktokUrl || "https://tiktok.com",
              siteSettings.pinterestUrl || "https://pinterest.com"
            ]
          },
          {
            "@type": "BreadcrumbList",
            "@id": "https://yousrasmile.com/#breadcrumb",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": language === 'en' ? 'Home' : 'الرئيسية',
                "item": "https://yousrasmile.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": activePage.toUpperCase(),
                "item": `https://yousrasmile.com/${activePage}`
              }
            ]
          }
        ]
      };
    }

    // Inject script element for JSON-LD
    let scriptTag = document.getElementById('json-ld-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'json-ld-schema';
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaObj, null, 2);

  }, [activePage, selectedProduct, language, activeStaticTab, customTitle, customDescription, currency, siteSettings, formatPrice, formatPriceObject]);

  return null;
};
