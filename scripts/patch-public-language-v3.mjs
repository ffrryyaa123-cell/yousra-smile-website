import fs from 'node:fs';

const MARKER = 'PUBLIC_LANGUAGE_V3';

const patch = (relativePath, transform) => {
  const url = new URL(`../${relativePath}`, import.meta.url);
  if (!fs.existsSync(url)) return;
  let source = fs.readFileSync(url, 'utf8').replace(/\r\n/g, '\n');
  if (source.includes(MARKER)) return;
  source = transform(source);
  source = `// ${MARKER}\n${source}`;
  fs.writeFileSync(url, source, 'utf8');
};

const pairs = (source, replacements) => {
  for (const [from, to] of replacements) source = source.split(from).join(to);
  return source;
};

patch('src/components/ProductDetailModal.tsx', source => {
  if (!source.includes("import { CATEGORIES } from '../data/categories';")) {
    source = source.replace("import { Product } from '../types';", "import { Product } from '../types';\nimport { CATEGORIES } from '../data/categories';");
  }

  source = source.replace(
    "const displaySubcategory = language === 'en' ? (product.subcategoryEn || product.category) : product.subcategory;",
    "const categoryMeta = CATEGORIES.find(category => category.id === product.category);\n  const displayCategoryName = language === 'en' ? (categoryMeta?.nameEn || 'Products') : (categoryMeta?.nameAr || 'المنتجات');\n  const displaySubcategory = language === 'en' ? (product.subcategoryEn || categoryMeta?.nameEn || '') : (product.subcategory || categoryMeta?.nameAr || '');"
  );

  source = source.replace("const shareTitle = product.titleAr || product.titleEn;", 'const shareTitle = displayTitle;');
  source = source.replace("const shareText = `مراجعة وتفاصيل ${shareTitle} عبر يسرى سمايل Yousra Smile:`;", "const shareText = language === 'en' ? `Review and product details for ${shareTitle} via Yousra Smile:` : `مراجعة وتفاصيل ${shareTitle} عبر Yousra Smile:`;");
  source = source.replace("title: videoItem.title || product.titleAr,", "title: language === 'en' ? (product.titleEn || product.brand || 'Product Review') : (videoItem.title || product.titleAr),");

  source = pairs(source, [
    ['<span className="text-xs text-slate-400">كود المنتج: {product.id}</span>', "<span className=\"text-xs text-slate-400\">{language === 'ar' ? 'كود المنتج:' : 'Product ID:'} {product.id}</span>"],
    ['title="إضافة للمفضلة"', "title={language === 'ar' ? 'إضافة للمفضلة' : 'Add to Favorites'}"],
    ['title="مقارنة المنتجات"', "title={language === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'}"],
    ['title="مشاركة عبر التواصل الاجتماعي"', "title={language === 'ar' ? 'مشاركة عبر التواصل الاجتماعي' : 'Share Product'}"],
    ['                    مشاركة المنتج عبر:\n', "                    {language === 'ar' ? 'مشاركة المنتج عبر:' : 'Share product via:'}\n"],
    ['<span>واتساب (WhatsApp)</span>', "<span>{language === 'ar' ? 'واتساب (WhatsApp)' : 'WhatsApp'}</span>"],
    ['<span>فيسبوك (Facebook)</span>', "<span>{language === 'ar' ? 'فيسبوك (Facebook)' : 'Facebook'}</span>"],
    ['<span>بنترست (Pinterest)</span>', "<span>{language === 'ar' ? 'بنترست (Pinterest)' : 'Pinterest'}</span>"],
    ['<span>تويتر / X (Twitter)</span>', "<span>{language === 'ar' ? 'تويتر / X' : 'X / Twitter'}</span>"],
    ['<span>نسخ رابط الصفحة</span>', "<span>{language === 'ar' ? 'نسخ رابط الصفحة' : 'Copy Page Link'}</span>"],
    ['              ✓ تم نسخ رابط المنتج بنجاح!\n', "              {language === 'ar' ? '✓ تم نسخ رابط المنتج بنجاح!' : '✓ Product link copied successfully!'}\n"],
    ['              {product.category}\n', '              {displayCategoryName}\n'],
    ['<span className="text-slate-200 truncate max-w-xs">{product.titleAr}</span>', '<span className="text-slate-200 truncate max-w-xs">{displayTitle}</span>'],
    ['alt={product.titleAr}', 'alt={displayTitle}'],
    ['                    خصم {product.discountPercent}%\n', "                    {language === 'ar' ? 'خصم' : 'Save'} {product.discountPercent}%\n"],
    ['<span className="hidden sm:inline">مشاركة:</span>', "<span className=\"hidden sm:inline\">{language === 'ar' ? 'مشاركة:' : 'Share:'}</span>"],
    ['title="مشاركة عبر واتساب"', "title={language === 'ar' ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}"],
    ['<span>واتساب</span>', "<span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>"],
    ['title="مشاركة عبر بنترست"', "title={language === 'ar' ? 'مشاركة عبر بنترست' : 'Share via Pinterest'}"],
    ['<span>بنترست</span>', "<span>{language === 'ar' ? 'بنترست' : 'Pinterest'}</span>"],
    ['title="مشاركة عبر تويتر / X"', "title={language === 'ar' ? 'مشاركة عبر تويتر / X' : 'Share via X'}"],
    ['<span>تويتر / X</span>', "<span>{language === 'ar' ? 'تويتر / X' : 'X'}</span>"],
    ['title="نسخ الرابط"', "title={language === 'ar' ? 'نسخ الرابط' : 'Copy link'}"],
    ['                  {product.titleAr}\n', '                  {displayTitle}\n'],
    ['                <p className="text-xs text-slate-400 mb-3">{product.titleEn}</p>', "                {language === 'ar' && product.titleEn && <p className=\"text-xs text-slate-400 mb-3\">{product.titleEn}</p>}"],
    ['({product.reviewCount + (currentUserRating > 0 ? 1 : 0)} تقييم)', "({product.reviewCount + (currentUserRating > 0 ? 1 : 0)} {language === 'ar' ? 'تقييم' : 'reviews'})"],
    ['<span className="text-slate-400">👁 {product.viewsCount} مشاهدة</span>', "<span className=\"text-slate-400\">👁 {product.viewsCount} {language === 'ar' ? 'مشاهدة' : 'views'}</span>"],
    ['title={`تقييم ${star} نجوم`}', "title={language === 'ar' ? `تقييم ${star} نجوم` : `Rate ${star} stars`}"],
    ['<span>مقارنة أسعار الشراء المباشرة:</span>', "<span>{language === 'ar' ? 'مقارنة أسعار الشراء المباشرة:' : 'Purchase Options:'}</span>"],
    ['                    أفضل سعر الآن 🔥\n', "                    {language === 'ar' ? 'أفضل سعر الآن 🔥' : 'Current options 🔥'}\n"],
    ['<span>متجر أمازون (Amazon)</span>', "<span>{language === 'ar' ? 'متجر أمازون (Amazon)' : 'Amazon'}</span>"],
    ['<span>علي إكسبريس (AliExpress)</span>', "<span>{language === 'ar' ? 'علي إكسبريس (AliExpress)' : 'AliExpress'}</span>"],
    ['title="مشاركة عبر فيسبوك"', "title={language === 'ar' ? 'مشاركة عبر فيسبوك' : 'Share via Facebook'}"],
    ['<span className="hidden sm:inline">فيسبوك</span>', "<span className=\"hidden sm:inline\">{language === 'ar' ? 'فيسبوك' : 'Facebook'}</span>"],
    ['<span className="hidden sm:inline">تويتر / X</span>', "<span className=\"hidden sm:inline\">{language === 'ar' ? 'تويتر / X' : 'X'}</span>"],
    ["title: product.titleAr,", 'title: displayTitle,'],
    ["title: v.title || product.titleAr,", "title: language === 'en' ? (product.titleEn || product.brand || 'Product Review') : (v.title || product.titleAr),"],
    ['<h4 className="text-sm font-bold text-white">فيديوهات ومراجعات المنتج</h4>', "<h4 className=\"text-sm font-bold text-white\">{language === 'ar' ? 'فيديوهات ومراجعات المنتج' : 'Product Videos & Reviews'}</h4>"],
    ['<p className="text-xs text-slate-400">كل فيديوهات المنتج تظهر هنا ويمكن تشغيل أي واحد منها بشكل مستقل.</p>', "<p className=\"text-xs text-slate-400\">{language === 'ar' ? 'كل فيديوهات المنتج تظهر هنا ويمكن تشغيل أي واحد منها بشكل مستقل.' : 'All available product videos appear here and can be played individually.'}</p>"],
    ['title={product.titleAr}', 'title={displayTitle}'],
    ['<span>الفيديو مربوط ببيانات المنتج الحالية</span>', "<span>{language === 'ar' ? 'الفيديو مربوط ببيانات المنتج الحالية' : 'Video linked to the current product'}</span>"],
    ['<h4 className="text-sm font-bold text-white">لم يتم ربط فيديو بهذا المنتج بعد</h4>', "<h4 className=\"text-sm font-bold text-white\">{language === 'ar' ? 'لم يتم ربط فيديو بهذا المنتج بعد' : 'No video linked to this product yet'}</h4>"],
    ['                          لا يوجد فيديو منشور لهذا المنتج حاليًا.\n', "                          {language === 'ar' ? 'لا يوجد فيديو منشور لهذا المنتج حاليًا.' : 'There is no published video for this product yet.'}\n"],
    ['<label className="text-xs text-slate-400 block mb-1">تفاصيل تجربتك وتوصيتك للمشترين:</label>', "<label className=\"text-xs text-slate-400 block mb-1\">{language === 'ar' ? 'تفاصيل تجربتك وتوصيتك للمشترين:' : 'Your experience and recommendation:'}</label>"],
    ['placeholder="اكتبي ملخص تجربتك عن سرعة الشحن، جودة التصنيع، سهولة الاستخدام..."', "placeholder={language === 'ar' ? 'اكتبي ملخص تجربتك عن سرعة الشحن، جودة التصنيع، سهولة الاستخدام...' : 'Share your experience with quality, shipping, and ease of use...'}"],
    ['<span>تمت إضافة تقييمك ورأيك بنجاح!</span>', "<span>{language === 'ar' ? 'تمت إضافة تقييمك ورأيك بنجاح!' : 'Your review was added successfully!'}</span>"],
    ['                      إضافة التقييم\n', "                      {language === 'ar' ? 'إضافة التقييم' : 'Submit Review'}\n"],
    ['<h4 className="text-sm font-bold text-slate-200">أحدث آراء المشترين:</h4>', "<h4 className=\"text-sm font-bold text-slate-200\">{language === 'ar' ? 'أحدث آراء المشترين:' : 'Latest Customer Reviews:'}</h4>"],
    ["{language === 'en' ? (relProd.titleEn || relProd.titleAr) : relProd.titleAr}", "{language === 'en' ? (relProd.titleEn || relProd.brand || 'Product') : (relProd.titleAr || relProd.titleEn || relProd.brand || 'منتج')}"],
    ['                  {product.category}\n', '                  {displayCategoryName}\n']
  ]);

  // Demo Arabic customer-review cards should never leak into English mode.
  source = source.replace(
    '<div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">\n                    <div className="flex items-center justify-between">',
    "{language === 'ar' && <div className=\"bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2\">\n                    <div className=\"flex items-center justify-between\">"
  );
  // Close the first two demo review cards conditionally without touching real product reviews.
  let demoClosures = 0;
  source = source.replace(/\n                  <\/div>\n\n                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">/g, match => {
    demoClosures += 1;
    if (demoClosures === 1) return '\n                  </div>}\n\n                  {language === \'ar\' && <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">';
    return match;
  });
  source = source.replace(
    '\n                  {product.reviews && product.reviews.map((rev) => (',
    '\n                  </div>}\n\n                  {product.reviews && product.reviews.map((rev) => ('
  );

  return source;
});

patch('src/components/CartModal.tsx', source => {
  source = source.replace("const title = language === 'en' ? (product.titleEn || product.titleAr) : product.titleAr;", "const title = language === 'en' ? (product.titleEn || product.brand || 'Product') : (product.titleAr || product.titleEn || product.brand || 'منتج');");
  return source;
});

patch('src/components/PriceAlertModal.tsx', source => {
  source = source.replace("const title = language === 'en' ? (alertModalProduct.titleEn || alertModalProduct.titleAr) : alertModalProduct.titleAr;", "const title = language === 'en' ? (alertModalProduct.titleEn || alertModalProduct.brand || 'Product') : (alertModalProduct.titleAr || alertModalProduct.titleEn || alertModalProduct.brand || 'منتج');");
  return source;
});

patch('src/components/ProductCoupon.tsx', source => {
  if (!source.includes("import { useApp } from '../context/AppContext';")) {
    source = source.replace("import { Product } from '../types';", "import { Product } from '../types';\nimport { useApp } from '../context/AppContext';");
  }
  source = source.replace("export function ProductCouponBadge({ coupon }: { coupon: Product['coupon'] }) {\n  if (!coupon?.isPublic", "export function ProductCouponBadge({ coupon }: { coupon: Product['coupon'] }) {\n  const { language } = useApp();\n  if (!coupon?.isPublic");
  source = source.replace('{coupon.expiresOn && <p>حتى {coupon.expiresOn}</p>}', "{coupon.expiresOn && <p>{language === 'ar' ? 'حتى' : 'Valid through'} {coupon.expiresOn}</p>}");
  source = source.replace('<p>يُطبق حسب أهلية الحساب وشروط المتجر عند الدفع.</p>', "<p>{language === 'ar' ? 'يُطبق حسب أهلية الحساب وشروط المتجر عند الدفع.' : 'Coupon eligibility and final terms are determined by the retailer at checkout.'}</p>");
  return source;
});

patch('src/components/SEOHead.tsx', source => {
  source = source.replace(
    "    let title = `${siteName} - مراجعات الأجهزة الذكية والمنزل العصري`;\n    let description = `موقع ${siteName} لمراجعات الأجهزة المنزلية الذكية والمطبخ العصري والجمال مع أفضل كوبونات وعروض أمازون وعلي إكسبريس.`;\n    let keywords = `${siteName}, مراجعات أجهزة, تسويق بالعمولة, أمازون, علي إكسبريس, مكانس روبوتية, قلاية هوائية, أجهزة منزلية ذكية`;",
    "    let title = language === 'en' ? `${siteName} - Smart Product Reviews & Modern Living` : `${siteName} - مراجعات الأجهزة الذكية والمنزل العصري`;\n    let description = language === 'en' ? `${siteName} reviews smart-home, kitchen, personal-care, and lifestyle products with current Amazon and AliExpress links.` : `موقع ${siteName} لمراجعات الأجهزة المنزلية الذكية والمطبخ العصري والعناية الشخصية مع روابط Amazon وAliExpress.`;\n    let keywords = language === 'en' ? `${siteName}, product reviews, smart home, Amazon, AliExpress, robot vacuum, air fryer, smart devices` : `${siteName}, مراجعات أجهزة, تسويق بالعمولة, أمازون, علي إكسبريس, مكانس روبوتية, قلاية هوائية, أجهزة منزلية ذكية`;"
  );

  source = source.replace("const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.titleAr) : currentProduct.titleAr;", "const prodName = language === 'en' ? (currentProduct.titleEn || currentProduct.brand || 'Product') : (currentProduct.titleAr || currentProduct.titleEn || currentProduct.brand || 'منتج');");
  source = source.replace(
    "      title = `${prodName} | سعر ومراجعة Yousra Smile`;\n      description = `${currentProduct.description} • السعر الأصلي: ${currentProduct.originalPrice} ${currentProduct.currency} | السعر بعد الخصم: ${currentProduct.discountPrice} ${currentProduct.currency} (${currentProduct.discountPercent}% خصم). تقييم ${currentProduct.rating}/5 من ${currentProduct.reviewCount} تقييم.`;\n      keywords = `${currentProduct.keywords.join(', ')}, ${currentProduct.brand}, سعر ${prodName}, مراجعة ${prodName}, خصم أمازون`;",
    "      title = language === 'en' ? `${prodName} | Review & Price | Yousra Smile` : `${prodName} | سعر ومراجعة Yousra Smile`;\n      description = language === 'en'\n        ? `${currentProduct.seoDescriptionEn || currentProduct.descriptionEn || currentProduct.longDescriptionEn || `Review and buying details for ${prodName}.`} Current price: ${currentProduct.discountPrice} ${currentProduct.currency}. Rating ${currentProduct.rating}/5.`\n        : `${currentProduct.seoDescriptionAr || currentProduct.description || currentProduct.longDescription || ''} السعر الحالي: ${currentProduct.discountPrice} ${currentProduct.currency}. تقييم ${currentProduct.rating}/5.`;\n      keywords = language === 'en'\n        ? `${(currentProduct.keywordsEn || currentProduct.keywords || []).join(', ')}, ${currentProduct.brand}, ${prodName} review, ${prodName} price`\n        : `${(currentProduct.keywordsAr || currentProduct.keywords || []).join(', ')}, ${currentProduct.brand}, سعر ${prodName}, مراجعة ${prodName}`;"
  );

  source = source.replace("          if (activeStaticTab === 'about') title = 'قصة يسرى سمايل | من نحن';\n          else if (activeStaticTab === 'contact') title = 'اتصل بنا والتعاون التجاري | يسرى سمايل';\n          else if (activeStaticTab === 'disclosure') title = 'إفصاح روابط الأفلييت والتسويق بالعمولة | يسرى سمايل';\n          else if (activeStaticTab === 'privacy') title = 'سياسة الخصوصية | يسرى سمايل';\n          else if (activeStaticTab === 'terms') title = 'شروط الاستخدام | يسرى سمايل';\n          else if (activeStaticTab === 'cookies') title = 'سياسة الكوكيز | يسرى سمايل';", "          if (activeStaticTab === 'about') title = language === 'en' ? 'About Yousra Smile' : 'قصة يسرى سمايل | من نحن';\n          else if (activeStaticTab === 'contact') title = language === 'en' ? 'Contact Yousra Smile' : 'اتصل بنا والتعاون التجاري | يسرى سمايل';\n          else if (activeStaticTab === 'disclosure') title = language === 'en' ? 'Affiliate Disclosure | Yousra Smile' : 'إفصاح روابط الأفلييت والتسويق بالعمولة | يسرى سمايل';\n          else if (activeStaticTab === 'privacy') title = language === 'en' ? 'Privacy Policy | Yousra Smile' : 'سياسة الخصوصية | يسرى سمايل';\n          else if (activeStaticTab === 'terms') title = language === 'en' ? 'Terms of Use | Yousra Smile' : 'شروط الاستخدام | يسرى سمايل';\n          else if (activeStaticTab === 'cookies') title = language === 'en' ? 'Cookies Policy | Yousra Smile' : 'سياسة الكوكيز | يسرى سمايل';");

  source = source.replace('"description": currentProduct.description,', '"description": language === \'en\' ? (currentProduct.descriptionEn || currentProduct.longDescriptionEn || currentProduct.titleEn || \'Product review\') : (currentProduct.description || currentProduct.longDescription || currentProduct.titleAr),');
  source = source.replace('"name": "Yousra Smile (يسرى سمايل)"', '"name": language === \'en\' ? "Yousra Smile" : "Yousra Smile | يسرى سمايل"');
  return source;
});

patch('src/components/PublicVisitorBadge.tsx', source => {
  if (!source.includes("import { useApp } from '../context/AppContext';")) {
    source = source.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport { useApp } from '../context/AppContext';");
  }
  source = source.replace("export const PublicVisitorBadge: React.FC = () => {\n  const [visitors", "export const PublicVisitorBadge: React.FC = () => {\n  const { language } = useApp();\n  const [visitors");
  source = source.replace('<span>زار الموقع هذا الشهر</span>', "<span>{language === 'ar' ? 'زار الموقع هذا الشهر' : 'Visitors this month'}</span>");
  source = source.replace("{visitors.toLocaleString('ar')}", "{visitors.toLocaleString(language === 'ar' ? 'ar' : 'en-US')}");
  return source;
});

console.log('[patch-public-language-v3] Product detail, metadata and public widgets localized.');
