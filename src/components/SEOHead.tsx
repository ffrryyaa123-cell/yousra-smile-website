import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

interface SEOHeadProps {
  customTitle?: string;
  customDescription?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ customTitle, customDescription }) => {
  const { activePage, selectedProduct, language, activeStaticTab } = useApp();

  useEffect(() => {
    let title = 'ابتسامة يسرى | Yousra Smile - مراجعات الأجهزة الذكية والمنزل العصري';
    let description = 'موقع ابتسامة يسرى (Yousra Smile) لمراجعات الأجهزة الذكية، المكانس الروبوتية، أدوات المطبخ العصرية، ومستلزمات المرأة والرياضة مع أفضل كوبونات وخصومات أمازون وعلي إكسبريس.';
    let keywords = 'ابتسامة يسرى, ابتسامة يسرا, Yousra Smile, مراجعات أجهزة, تسويق بالعمولة, أمازون, علي إكسبريس, مكانس روبوتية, قلاية هوائية, أجهزة منزلية ذكية';
    let ogType = 'website';
    let imageUrl = 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=1200&q=80';
    let currentUrl = window.location.href;

    const currentProduct: Product | null = selectedProduct;

    if (currentProduct) {
      const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.titleAr) : currentProduct.titleAr;
      title = `${prodName} | سعر ومراجعة Yousra Smile`;
      description = `${currentProduct.description} • السعر الأصلي: ${currentProduct.originalPrice} ${currentProduct.currency} | السعر بعد الخصم: ${currentProduct.discountPrice} ${currentProduct.currency} (${currentProduct.discountPercent}% خصم). تقييم ${currentProduct.rating}/5 من ${currentProduct.reviewCount} تقييم.`;
      keywords = `${currentProduct.keywords.join(', ')}, ${currentProduct.brand}, سعر ${prodName}, مراجعة ${prodName}, خصم أمازون`;
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
          title = 'لوحة التحكم | يسرى سمايل Admin';
          break;
        case 'about':
        case 'contact':
        case 'privacy':
        case 'terms':
        case 'cookies':
        case 'disclosure':
          if (activeStaticTab === 'about') title = 'قصة يسرى سمايل | من نحن';
          else if (activeStaticTab === 'contact') title = 'اتصل بنا والتعاون التجاري | يسرى سمايل';
          else if (activeStaticTab === 'disclosure') title = 'إفصاح روابط الأفلييت والتسويق بالعمولة | يسرى سمايل';
          else if (activeStaticTab === 'privacy') title = 'سياسة الخصوصية | يسرى سمايل';
          else if (activeStaticTab === 'terms') title = 'شروط الاستخدام | يسرى سمايل';
          else if (activeStaticTab === 'cookies') title = 'سياسة الكوكيز | يسرى سمايل';
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
    setMetaTag('property', 'og:site_name', 'Yousra Smile | يسرى سمايل');
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
      const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.titleAr) : currentProduct.titleAr;
      schemaObj = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": prodName,
        "image": [currentProduct.image, ...(currentProduct.images || [])],
        "description": currentProduct.description,
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
              "name": "Yousra Smile (يسرى سمايل)"
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
          "priceCurrency": currentProduct.currency,
          "lowPrice": currentProduct.discountPrice.toString(),
          "highPrice": currentProduct.originalPrice.toString(),
          "offerCount": currentProduct.aliexpressUrl ? "2" : "1",
          "offers": [
            {
              "@type": "Offer",
              "name": "Amazon Purchase Link",
              "url": currentProduct.amazonUrl,
              "priceCurrency": currentProduct.currency,
              "price": currentProduct.discountPrice.toString(),
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
              "priceCurrency": currentProduct.currency,
              "price": currentProduct.discountPrice.toString(),
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
            "@id": "https://yousrasmile.com/#website",
            "url": "https://yousrasmile.com",
            "name": "Yousra Smile",
            "alternateName": "يسرى سمايل",
            "description": "العلامة التجارية الشخصية الأولى لمراجعات وتصنيفات الأجهزة الذكية والمنزل العصري",
            "inLanguage": language === 'ar' ? 'ar' : 'en'
          },
          {
            "@type": "Organization",
            "@id": "https://yousrasmile.com/#organization",
            "name": "Yousra Smile",
            "url": "https://yousrasmile.com",
            "logo": "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=400&q=80",
            "sameAs": [
              "https://youtube.com",
              "https://tiktok.com",
              "https://pinterest.com"
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

  }, [activePage, selectedProduct, language, activeStaticTab, customTitle, customDescription]);

  return null;
};
