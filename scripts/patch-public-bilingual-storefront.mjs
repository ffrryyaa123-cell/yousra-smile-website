import fs from 'node:fs';

const MARKER = 'PUBLIC_BILINGUAL_STOREFRONT_V1';

const patch = (relativePath, transform) => {
  const url = new URL(`../${relativePath}`, import.meta.url);
  let source = fs.readFileSync(url, 'utf8');
  if (source.includes(MARKER)) return;
  source = transform(source);
  source = `// ${MARKER}\n${source}`;
  fs.writeFileSync(url, source, 'utf8');
};

const replaceAll = (source, pairs) => {
  for (const [from, to] of pairs) source = source.split(from).join(to);
  return source;
};

patch('src/components/ProductFilters.tsx', source => {
  source = source.replace('const { products, formatPrice } = useApp();', 'const { products, formatPrice, language, t } = useApp();');
  return replaceAll(source, [
    ['>تصفية المنتجات</h3>', '>{language === \'ar\' ? \'تصفية المنتجات\' : \'Filter Products\'}</h3>'],
    ['          إعادة ضبط\n', "          {language === 'ar' ? 'إعادة ضبط' : 'Reset'}\n"],
    ['>القسم الرئيسي</label>', ">{language === 'ar' ? 'القسم الرئيسي' : 'Category'}</label>"],
    ['<option value="all">جميع الأقسام</option>', "<option value=\"all\">{language === 'ar' ? 'جميع الأقسام' : 'All Categories'}</option>"],
    ['<option key={cat.id} value={cat.id}>{cat.nameAr}</option>', "<option key={cat.id} value={cat.id}>{language === 'en' ? cat.nameEn : cat.nameAr}</option>"],
    ['>الفرع / التخصص</label>', ">{language === 'ar' ? 'الفرع / التخصص' : 'Subcategory'}</label>"],
    ['<option value="all">جميع التخصصات الفرعية</option>', "<option value=\"all\">{language === 'ar' ? 'جميع التخصصات الفرعية' : 'All Subcategories'}</option>"],
    ['{currentCategoryObj.subcategories.map((sub, i) => (\n              <option key={i} value={sub}>{sub}</option>\n            ))}', "{currentCategoryObj.subcategories.map((sub, i) => (\n              <option key={i} value={sub}>{language === 'en' ? (currentCategoryObj.subcategoriesEn?.[i] || 'Subcategory') : sub}</option>\n            ))}"],
    ['>العلامة التجارية (Brand)</label>', ">{language === 'ar' ? 'العلامة التجارية (Brand)' : 'Brand'}</label>"],
    ['<option value="all">جميع الماركات ({brands.length})</option>', "<option value=\"all\">{language === 'ar' ? `جميع الماركات (${brands.length})` : `All Brands (${brands.length})`}</option>"],
    ['>نسبة الخصم الأدنى</label>', ">{language === 'ar' ? 'نسبة الخصم الأدنى' : 'Minimum Discount'}</label>"],
    ["{disc === 0 ? 'الكل' : `${disc}%+`}", "{disc === 0 ? (language === 'ar' ? 'الكل' : 'All') : `${disc}%+`}"],
    ['<span>نطاق السعر الأقصى:</span>', "<span>{language === 'ar' ? 'نطاق السعر الأقصى:' : 'Maximum Price:'}</span>"]
  ]);
});

patch('src/pages/ProductsPage.tsx', source => {
  source = source.replace('    setSelectedCategory \r\n  } = useApp();', '    setSelectedCategory,\r\n    language,\r\n    t\r\n  } = useApp();');
  source = source.replace("const categoryTitle = CATEGORIES.find(c => c.id === filters.category)?.nameAr || 'جميع المنتجات';", "const selectedCategoryObject = CATEGORIES.find(c => c.id === filters.category);\r\n  const categoryTitle = filters.category === 'all'\r\n    ? (language === 'ar' ? 'جميع المنتجات' : 'All Products')\r\n    : (language === 'en' ? (selectedCategoryObject?.nameEn || 'Products') : (selectedCategoryObject?.nameAr || 'المنتجات'));" );
  return replaceAll(source, [
    ['            دليل التسويق بالعمولة\r\n', "            {language === 'ar' ? 'دليل التسويق بالعمولة' : 'Affiliate Shopping Guide'}\r\n"],
    ['            تم العثور على {filteredProducts.length} منتج متاح بخصومات وروابط مباشرة\r\n', "            {language === 'ar' ? `تم العثور على ${filteredProducts.length} منتج متاح` : `${filteredProducts.length} products available`}\r\n"],
    ['            التصفية والفلترة\r\n', "            {language === 'ar' ? 'التصفية والفلترة' : 'Filters'}\r\n"],
    ['title="عرض الشبكة"', "title={language === 'ar' ? 'عرض الشبكة' : 'Grid view'}"],
    ['title="عرض القائمة"', "title={language === 'ar' ? 'عرض القائمة' : 'List view'}"],
    ['              يتم تحديث أفضل العروض يوميًا من Amazon وAliExpress، وقد تتغير الأسعار حسب التوفر.\r\n', "              {language === 'ar' ? 'يتم تحديث أفضل العروض يوميًا من Amazon وAliExpress، وقد تتغير الأسعار حسب التوفر.' : 'Deals are updated regularly from Amazon and AliExpress; prices may change based on availability.'}\r\n"],
    ['<span className="text-xs font-bold text-slate-400 shrink-0">الترتيب:</span>', "<span className=\"text-xs font-bold text-slate-400 shrink-0\">{language === 'ar' ? 'الترتيب:' : 'Sort:'}</span>"],
    ['<option value="latest">الأحدث نزوَلاً</option>', "<option value=\"latest\">{language === 'ar' ? 'الأحدث نزوَلاً' : 'Latest'}</option>"],
    ['<option value="rating">الأعلى تقييمًا (★ 5.0)</option>', "<option value=\"rating\">{language === 'ar' ? 'الأعلى تقييمًا (★ 5.0)' : 'Highest Rated'}</option>"],
    ['<option value="best-selling">الأكثر مبيعًا وطلباً</option>', "<option value=\"best-selling\">{language === 'ar' ? 'الأكثر مبيعًا وطلباً' : 'Best Selling'}</option>"],
    ['<option value="highest-discount">الأعلى نسبة خصم</option>', "<option value=\"highest-discount\">{language === 'ar' ? 'الأعلى نسبة خصم' : 'Highest Discount'}</option>"],
    ['<option value="price-low">السعر: من الأرخص للأغلى</option>', "<option value=\"price-low\">{language === 'ar' ? 'السعر: من الأرخص للأغلى' : 'Price: Low to High'}</option>"],
    ['<option value="price-high">السعر: من الأغلى للأرخص</option>', "<option value=\"price-high\">{language === 'ar' ? 'السعر: من الأغلى للأرخص' : 'Price: High to Low'}</option>"],
    ['<span className="text-xs font-bold text-slate-400 shrink-0">عرض بالصفحة:</span>', "<span className=\"text-xs font-bold text-slate-400 shrink-0\">{language === 'ar' ? 'عرض بالصفحة:' : 'Per page:'}</span>"],
    ['<option value={12}>12 منتج</option>', "<option value={12}>{language === 'ar' ? '12 منتج' : '12 products'}</option>"],
    ['<option value={20}>20 منتج (الكل)</option>', "<option value={20}>{language === 'ar' ? '20 منتج (الكل)' : '20 products'}</option>"],
    ['<option value={50}>50 منتج</option>', "<option value={50}>{language === 'ar' ? '50 منتج' : '50 products'}</option>"],
    ['              يعرض <strong className="text-amber-400 font-mono text-sm">{filteredProducts.length}</strong> من إجمالي <strong className="text-amber-400 font-mono text-sm">{products.length}</strong> منتجاً\r\n', "              {language === 'ar' ? 'يعرض' : 'Showing'} <strong className=\"text-amber-400 font-mono text-sm\">{filteredProducts.length}</strong> {language === 'ar' ? 'من إجمالي' : 'of'} <strong className=\"text-amber-400 font-mono text-sm\">{products.length}</strong> {language === 'ar' ? 'منتجاً' : 'products'}\r\n"],
    ['                    <span>السابق</span>', "                    <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>"],
    ['                    <span>الصفحة</span>', "                    <span>{language === 'ar' ? 'الصفحة' : 'Page'}</span>"],
    ['                    <span>من</span>', "                    <span>{language === 'ar' ? 'من' : 'of'}</span>"],
    ['                    <span>التالي</span>', "                    <span>{language === 'ar' ? 'التالي' : 'Next'}</span>"],
    ['                لم نجد أي منتجات تطابق معايير البحث الحالية!\r\n', "                {language === 'ar' ? 'لم نجد أي منتجات تطابق معايير البحث الحالية!' : 'No products match the current filters.'}\r\n"],
    ['                جرّبي تغيير كلمات البحث أو إعادة ضبط خيارات تصفية الأسعار والأقسام لنتائج أفضل.\r\n', "                {language === 'ar' ? 'جرّبي تغيير كلمات البحث أو إعادة ضبط خيارات التصفية لنتائج أفضل.' : 'Try changing your search terms or resetting the filters.'}\r\n"],
    ['              إعادة ضبط الفلاتر\r\n', "              {language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}\r\n"]
  ]);
});

patch('src/pages/DealsPage.tsx', source => {
  source = source.replace('const { visibleProducts: products } = useApp();', 'const { visibleProducts: products, language } = useApp();');
  return replaceAll(source, [
    ['          مركز التخفيضات والكوبونات اليومية\r\n', "          {language === 'ar' ? 'مركز التخفيضات والكوبونات اليومية' : 'Daily Deals & Coupons'}\r\n"],
    ['          صفحة العروض والتخفيضات الكبرى 🏷️\r\n', "          {language === 'ar' ? 'صفحة العروض والتخفيضات الكبرى 🏷️' : 'Top Deals & Discounts 🏷️'}\r\n"],
    ['          جميع المنتجات المتاحة في هذه الصفحة خاضعة لخصومات حقيقية تبدأ من 20% وحتى 50% عبر متاجر أمازون وعلي إكسبريس. تم التحقق من الأسعار حديثاً!\r\n', "          {language === 'ar' ? 'تصفّح المنتجات المخفّضة وروابط الشراء المتاحة حالياً من Amazon وAliExpress.' : 'Browse discounted products and current purchase links from Amazon and AliExpress.'}\r\n"],
    ['<span className="text-xs font-bold text-slate-700 dark:text-slate-300">حد الخصم الأدنى المعروض:</span>', "<span className=\"text-xs font-bold text-slate-700 dark:text-slate-300\">{language === 'ar' ? 'حد الخصم الأدنى المعروض:' : 'Minimum discount:'}</span>"],
    ['              خصم {disc}% فأكثر\r\n', "              {language === 'ar' ? `خصم ${disc}% فأكثر` : `${disc}%+ off`}\r\n"],
    ['          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد منتجات بخصم أعلى من {minDiscount}% حالياً</h3>', "          <h3 className=\"text-base font-bold text-slate-800 dark:text-slate-200\">{language === 'ar' ? `لا توجد منتجات بخصم أعلى من ${minDiscount}% حالياً` : `No products currently match a ${minDiscount}% minimum discount`}</h3>"],
    ['          <p className="text-xs text-slate-500 mt-1">جرّبي تخفيض نسبة الخصم لمشاهدة باقي العروض المتاحة.</p>', "          <p className=\"text-xs text-slate-500 mt-1\">{language === 'ar' ? 'جرّبي تخفيض نسبة الخصم لمشاهدة باقي العروض المتاحة.' : 'Lower the minimum discount to see more available deals.'}</p>"]
  ]);
});

patch('src/pages/FavoritesPage.tsx', source => replaceAll(source, [
  ['            قائمة المفضلة فارغة حالياً!\r\n', "            {language === 'ar' ? 'قائمة المفضلة فارغة حالياً!' : 'Your favorites list is empty.'}\r\n"],
  ['            اضغطي على أيقونة القلب على أي بطاقة منتج أثناء التصفح لحفظه في هذه القائمة.\r\n', "            {language === 'ar' ? 'اضغطي على أيقونة القلب على أي بطاقة منتج أثناء التصفح لحفظه في هذه القائمة.' : 'Use the heart icon on any product card to save it here.'}\r\n"],
  ['            تصفحي المنتجات الآن\r\n', "            {language === 'ar' ? 'تصفحي المنتجات الآن' : 'Browse Products'}\r\n"],
  ['                تنبيهات الأسعار النشطة ({priceAlerts.length})\r\n', "                {language === 'ar' ? `تنبيهات الأسعار النشطة (${priceAlerts.length})` : `Active Price Alerts (${priceAlerts.length})`}\r\n"],
  ['                إدارات التنبيهات التي قمت بتفعيلها لتلقي إشعارات البريد عند هبوط الأسعار.\r\n', "                {language === 'ar' ? 'إدارة التنبيهات التي قمت بتفعيلها لتلقي إشعارات البريد عند هبوط الأسعار.' : 'Manage alerts you created for price changes.'}\r\n"],
  ['<span className="text-slate-400">السعر الحالي:</span>', "<span className=\"text-slate-400\">{language === 'ar' ? 'السعر الحالي:' : 'Current price:'}</span>"],
  ['<span className="text-slate-400">سعر التنبيه:</span>', "<span className=\"text-slate-400\">{language === 'ar' ? 'سعر التنبيه:' : 'Alert price:'}</span>"],
  ['title="إلغاء التنبيه"', "title={language === 'ar' ? 'إلغاء التنبيه' : 'Remove alert'}"],
  ['            <p>لا يوجد تنبيهات أسعار مفعلة حالياً. يمكنك تفعيل التنبيه على أي منتج من خلال زر الأيقونة الجرس 🔔.</p>', "            <p>{language === 'ar' ? 'لا يوجد تنبيهات أسعار مفعلة حالياً. يمكنك تفعيل التنبيه على أي منتج من خلال زر الجرس 🔔.' : 'No active price alerts. Use the bell button on a product to create one.'}</p>"]
]));

patch('src/pages/ComparePage.tsx', source => replaceAll(source, [
  ['<th className="p-4 text-slate-400 font-bold w-48">خاصية المقارنة</th>', "<th className=\"p-4 text-slate-400 font-bold w-48\">{language === 'ar' ? 'خاصية المقارنة' : 'Comparison'}</th>"],
  ['title="إزالة من المقارنة"', "title={language === 'ar' ? 'إزالة من المقارنة' : 'Remove from comparison'}"],
  ["{language === 'en' ? (prod.titleEn || prod.titleAr) : prod.titleAr}", "{language === 'en' ? (prod.titleEn || prod.brand || 'Product') : (prod.titleAr || prod.titleEn || prod.brand || 'منتج')}"],
  ['>السعر والتوفير</td>', ">{language === 'ar' ? 'السعر والتوفير' : 'Price & Savings'}</td>"],
  ['>التقييم وسرعة الطلب</td>', ">{language === 'ar' ? 'التقييم وسرعة الطلب' : 'Rating & Reviews'}</td>"],
  ['<span className="text-slate-400 font-normal">({prod.reviewCount} تقييم)</span>', "<span className=\"text-slate-400 font-normal\">({prod.reviewCount} {language === 'ar' ? 'تقييم' : 'reviews'})</span>"],
  ['>القسم والتخصص</td>', ">{language === 'ar' ? 'القسم والتخصص' : 'Category & Type'}</td>"],
  ['>أبرز المميزات</td>', ">{language === 'ar' ? 'أبرز المميزات' : 'Key Features'}</td>"],
  ['>الانتقال للشراء Direct</td>', ">{language === 'ar' ? 'الانتقال للشراء' : 'Buy Now'}</td>"],
  ['                      اشترِ من أمازون\r\n', "                      {language === 'ar' ? 'اشترِ من أمازون' : 'Buy on Amazon'}\r\n"],
  ['            لم تقومي بإضافة أي منتجات للمقارنة بعد!\r\n', "            {language === 'ar' ? 'لم تقومي بإضافة أي منتجات للمقارنة بعد!' : 'No products added for comparison yet.'}\r\n"],
  ['            انقري على رمز الميزان في بطاقات المنتجات لإضافتها لمصفوفة المقارنة المباشرة.\r\n', "            {language === 'ar' ? 'انقري على رمز الميزان في بطاقات المنتجات لإضافتها للمقارنة.' : 'Use the compare icon on product cards to add products here.'}\r\n"],
  ['            تصفحي المنتجات الآن\r\n', "            {language === 'ar' ? 'تصفحي المنتجات الآن' : 'Browse Products'}\r\n"]
]));

patch('src/components/AffiliateDealScanner.tsx', source => {
  source = source.replace('const { products, siteSettings, formatPrice, openProductDetail, setPage } = useApp();', 'const { products, siteSettings, formatPrice, openProductDetail, setPage, language } = useApp();');
  source = source.replace("p.titleAr.toLowerCase().includes(trimmed.toLowerCase()) ||\n      p.titleEn.toLowerCase().includes(trimmed.toLowerCase()) ||\n      p.brand.toLowerCase().includes(trimmed.toLowerCase())", "String(p.titleAr || '').toLowerCase().includes(trimmed.toLowerCase()) ||\n      String(p.titleEn || '').toLowerCase().includes(trimmed.toLowerCase()) ||\n      String(p.brand || '').toLowerCase().includes(trimmed.toLowerCase())");
  return replaceAll(source, [
    ['<span>فاحص الروابط والعروض الفوري (Affiliate Link Scanner)</span>', "<span>{language === 'ar' ? 'فاحص الروابط والعروض الفوري' : 'Affiliate Link & Deal Scanner'}</span>"],
    ['            هل لديك رابط منتج وتريد أفضل كود خصم ورابط شراء موثوق؟\n', "            {language === 'ar' ? 'هل لديك رابط منتج وتريد التحقق من رابط الشراء؟' : 'Have a product link? Check the matching product and purchase link.'}\n"],
    ['            الصق أي رابط من أمازون أو علي إكسبريس أو اكتب اسم الجهاز للتحقق من العرض ورابط الخصم الترويجي\n', "            {language === 'ar' ? 'الصق رابط Amazon أو AliExpress أو اكتب اسم المنتج للبحث في الكتالوج.' : 'Paste an Amazon or AliExpress URL, or enter a product name to search the catalog.'}\n"],
    ['placeholder="الصق رابط المنتج (Amazon / AliExpress) أو اكتب اسم الجهاز (مثل: Roborock، قلاية فيليبس)..."', "placeholder={language === 'ar' ? 'الصق رابط المنتج أو اكتب اسم الجهاز...' : 'Paste a product URL or enter a product name...'}"],
    ['<span>فحص العرض وتجهيز الرابط</span>', "<span>{language === 'ar' ? 'فحص العرض وتجهيز الرابط' : 'Check Product Link'}</span>"],
    ['<span className="text-xs font-bold text-emerald-400">تم التحقق من الرابط والخصم</span>', "<span className=\"text-xs font-bold text-emerald-400\">{language === 'ar' ? 'تم التحقق من الرابط' : 'Link checked'}</span>"],
    ['                  خصم حتى {scanResult.discountPercent}%\n', "                  {language === 'ar' ? `خصم حتى ${scanResult.discountPercent}%` : `Up to ${scanResult.discountPercent}% off`}\n"],
    ["{scanResult.type === 'matched' ? scanResult.product.titleAr : scanResult.name}", "{scanResult.type === 'matched' ? (language === 'en' ? (scanResult.product.titleEn || scanResult.product.brand || 'Product') : (scanResult.product.titleAr || scanResult.product.titleEn)) : scanResult.name}"],
    ['                العلامة التجارية: {scanResult.type === \'matched\' ? scanResult.product.brand : scanResult.brand}\n', "                {language === 'ar' ? 'العلامة التجارية:' : 'Brand:'} {scanResult.type === 'matched' ? scanResult.product.brand : scanResult.brand}\n"],
    ['                  <span>تم نسخ الرابط!</span>', "                  <span>{language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!'}</span>"],
    ['                  <span>نسخ الرابط المعتمد</span>', "                  <span>{language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>"],
    ['              <span>الشراء بالخصم المباشر</span>', "              <span>{language === 'ar' ? 'الشراء عبر الرابط' : 'Open Purchase Link'}</span>"],
    ['                <span>تفاصيل السلعة</span>', "                <span>{language === 'ar' ? 'تفاصيل السلعة' : 'Product Details'}</span>"]
  ]);
});

patch('src/components/SmartSavingsCalculator.tsx', source => {
  source = source.replace('const { formatPrice, setPage, setSelectedCategory, openProductDetail, products } = useApp();', 'const { formatPrice, setPage, setSelectedCategory, openProductDetail, products, language } = useApp();');
  source = source.replace('{item.nameAr}\n                        </h4>\n                        <span className="text-[10px] text-slate-400">{item.nameEn}</span>', "{language === 'ar' ? item.nameAr : item.nameEn}\n                        </h4>\n                        {language === 'ar' && <span className=\"text-[10px] text-slate-400\">{item.nameEn}</span>}");
  return replaceAll(source, [
    ['<span>حاسبة ذكية تفاعلية • التوفير المالي والزمني</span>', "<span>{language === 'ar' ? 'حاسبة ذكية تفاعلية • التوفير المالي والزمني' : 'Smart Savings Calculator'}</span>"],
    ['            كم توفر لك أجهزة المنزل الذكي شهرياً وسنوياً؟\n', "            {language === 'ar' ? 'كم توفر لك أجهزة المنزل الذكي شهرياً وسنوياً؟' : 'How much time and money can smart devices save?'}\n"],
    ['            اختر الأجهزة الذكية التي تفكر في اقتنائها واكتشف حجم الساعات والتكاليف التي توفرها لعائلتك شهرياً وسنوياً\n', "            {language === 'ar' ? 'اختر الأجهزة الذكية التي تفكر في اقتنائها واكتشف التوفير التقديري.' : 'Select devices to see estimated monthly and annual savings.'}\n"],
    ['<span className="text-xs text-slate-300 font-bold">حجم العائلة:</span>', "<span className=\"text-xs text-slate-300 font-bold\">{language === 'ar' ? 'حجم العائلة:' : 'Family size:'}</span>"],
    ['            اضغط لتحديد الأجهزة المراد حساب توفيرها:\n', "            {language === 'ar' ? 'اضغط لتحديد الأجهزة المراد حساب توفيرها:' : 'Select devices to include:'}\n"],
    ['                      توفير ~${item.moneySavedMonthlyUSD}/شهر\n', "                      {language === 'ar' ? `توفير ~$${item.moneySavedMonthlyUSD}/شهر` : `~$${item.moneySavedMonthlyUSD}/month savings`}\n"],
    ['                      +{item.hoursSavedMonthly} ساعة راحة\n', "                      +{item.hoursSavedMonthly} {language === 'ar' ? 'ساعة راحة' : 'hours saved'}\n"],
    ['<span className="text-xs font-bold text-slate-300">النتيجة التقديرية المباشرة:</span>', "<span className=\"text-xs font-bold text-slate-300\">{language === 'ar' ? 'النتيجة التقديرية المباشرة:' : 'Estimated savings:'}</span>"],
    ['                محسوبة بدقة\n', "                {language === 'ar' ? 'تقدير تقريبي' : 'Estimate'}\n"],
    ['<span className="text-[11px] text-slate-400 block mb-1">الوقت الموفّر شهرياً</span>', "<span className=\"text-[11px] text-slate-400 block mb-1\">{language === 'ar' ? 'الوقت الموفّر شهرياً' : 'Monthly time saved'}</span>"],
    ['<span className="text-xs font-normal text-slate-300">ساعة</span>', "<span className=\"text-xs font-normal text-slate-300\">{language === 'ar' ? 'ساعة' : 'hours'}</span>"],
    ['                  ({totalAnnualHours} ساعة/سنة)\n', "                  ({totalAnnualHours} {language === 'ar' ? 'ساعة/سنة' : 'hours/year'})\n"],
    ['<span className="text-[11px] text-slate-400 block mb-1">التوفير المالي السنوي</span>', "<span className=\"text-[11px] text-slate-400 block mb-1\">{language === 'ar' ? 'التوفير المالي السنوي' : 'Estimated annual savings'}</span>"],
    ['                  (~{formatPrice(totalMonthlySavingsUSD)} / شهر)\n', "                  (~{formatPrice(totalMonthlySavingsUSD)} / {language === 'ar' ? 'شهر' : 'month'})\n"],
    ['<span className="text-[11px] font-bold text-slate-400 block">أفضل العروض المرشحة بأعلى تقييم:</span>', "<span className=\"text-[11px] font-bold text-slate-400 block\">{language === 'ar' ? 'منتجات مقترحة:' : 'Suggested products:'}</span>"],
    ['<div className="text-[10px] text-emerald-400">وفر خصم يصل حتى 25%</div>', "<div className=\"text-[10px] text-emerald-400\">{language === 'ar' ? 'خصم محتمل حسب العرض الحالي' : 'Check current deal'}</div>"],
    ['            <span>استعرض جميع المنتجات الذكية المخفضة</span>', "            <span>{language === 'ar' ? 'استعرض جميع المنتجات الذكية' : 'Browse Smart Products'}</span>"]
  ]);
});

patch('src/pages/HomePage.tsx', source => {
  source = source.replace("const title = language === 'en' ? (prod.titleEn || prod.titleAr) : prod.titleAr;", "const title = language === 'en' ? (prod.titleEn || prod.brand || 'Product') : (prod.titleAr || prod.titleEn || prod.brand || 'منتج');");
  source = source.replace('<span>Price: {formatPrice(prod.discountPrice)}</span>', "<span>{language === 'ar' ? 'السعر:' : 'Price:'} {formatPrice(prod.discountPrice)}</span>");
  source = source.replace("{cat.subcategories.slice(0, 2).join(' • ')}", "{(language === 'en' ? (cat.subcategoriesEn || []) : cat.subcategories).slice(0, 2).join(' • ')}");
  source = source.replace("{publicVideos.slice(0, 3).map(video => (", "{publicVideos.slice(0, 3).map(video => {\n            const linkedProduct = products.find(p => p.id === video.productId);\n            const reviewProductTitle = language === 'en'\n              ? (linkedProduct?.titleEn || linkedProduct?.brand || (!/[\\u0600-\\u06FF]/.test(String(video.productTitle || '')) ? video.productTitle : 'Product'))\n              : (linkedProduct?.titleAr || video.productTitle || linkedProduct?.titleEn || 'منتج');\n            const reviewTitle = language === 'en'\n              ? (linkedProduct?.titleEn ? `Yousra Smile Review: ${linkedProduct.titleEn}` : (!/[\\u0600-\\u06FF]/.test(String(video.title || '')) ? video.title : 'Product Review'))\n              : video.title;\n            return (");
  source = source.replace("          ))}\n        </div>\n      </section>\n\n      {/* Best Sellers Grid */}", "          );})}\n        </div>\n      </section>\n\n      {/* Best Sellers Grid */}");
  source = source.replace('                  {video.productTitle}\n', '                  {reviewProductTitle}\n');
  source = source.replace('                  {video.title}\n', '                  {reviewTitle}\n');
  source = source.replace('<span>{video.date}</span>', "<span>{language === 'en' && /[\\u0600-\\u06FF]/.test(String(video.date || '')) ? 'Latest review' : video.date}</span>");
  return source;
});

patch('src/components/HeroBanner.tsx', source => {
  source = source.replace("const showcase = videos.find(video => !video.productId || visibleProducts.some(p => p.id === video.productId));", "const showcase = videos.find(video => !video.productId || visibleProducts.some(p => p.id === video.productId));\n  const showcaseProduct = showcase?.productId ? visibleProducts.find(p => p.id === showcase.productId) : undefined;\n  const showcaseTitle = language === 'en'\n    ? (showcaseProduct?.titleEn || showcaseProduct?.brand || (!/[\\u0600-\\u06FF]/.test(String(showcase?.productTitle || showcase?.title || '')) ? (showcase?.productTitle || showcase?.title) : 'Product review'))\n    : (showcaseProduct?.titleAr || showcase?.productTitle || showcase?.title || 'مراجعات المنتجات');");
  source = source.replace("{showcase?.productTitle || showcase?.title || (language === 'ar' ? 'مراجعات المنتجات' : 'Product reviews')}", '{showcaseTitle}');
  return source;
});

patch('src/pages/StaticPage.tsx', source => {
  source = source.replace('const { activeStaticTab, setPage } = useApp();', 'const { activeStaticTab, setPage, language } = useApp();');
  source = replaceAll(source, [
    ['          من نحن\n', "          {language === 'ar' ? 'من نحن' : 'About'}\n"],
    ['          اتصل بنا\n', "          {language === 'ar' ? 'اتصل بنا' : 'Contact'}\n"],
    ['          إفصاح الأفلييت\n', "          {language === 'ar' ? 'إفصاح الأفلييت' : 'Affiliate Disclosure'}\n"],
    ['          سياسة الخصوصية\n', "          {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}\n"],
    ['          شروط الاستخدام\n', "          {language === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}\n"],
    ['          سياسة ملفات الكوكيز\n', "          {language === 'ar' ? 'سياسة ملفات الكوكيز' : 'Cookies Policy'}\n"],
    ['                  {STATIC_CONTENT.about.title}\n', "                  {language === 'ar' ? STATIC_CONTENT.about.title : STATIC_CONTENT.about.titleEn}\n"],
    ['                  {STATIC_CONTENT.about.subtitle}\n', "                  {language === 'ar' ? STATIC_CONTENT.about.subtitle : STATIC_CONTENT.about.subtitleEn}\n"],
    ['              {STATIC_CONTENT.about.bio}\n', "              {language === 'ar' ? STATIC_CONTENT.about.bio : STATIC_CONTENT.about.bioEn}\n"],
    ['<h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">رسالتنا وهدفنا الرئيسي:</h3>', "<h3 className=\"text-sm font-bold text-slate-900 dark:text-white mb-2\">{language === 'ar' ? 'رسالتنا وهدفنا الرئيسي:' : 'Our Mission:'}</h3>"],
    ['                {STATIC_CONTENT.about.mission}\n', "                {language === 'ar' ? STATIC_CONTENT.about.mission : STATIC_CONTENT.about.missionEn}\n"],
    ['<h3 className="text-sm font-bold text-slate-900 dark:text-white">ما الذي يميّز يسرى سمايل؟</h3>', "<h3 className=\"text-sm font-bold text-slate-900 dark:text-white\">{language === 'ar' ? 'ما الذي يميّز يسرى سمايل؟' : 'What you can find on Yousra Smile'}</h3>"],
    ['{STATIC_CONTENT.about.features.map((item, i) => (', "{(language === 'ar' ? STATIC_CONTENT.about.features : STATIC_CONTENT.about.featuresEn).map((item, i) => ("],
    ['                {STATIC_CONTENT.contact.title}\n', "                {language === 'ar' ? STATIC_CONTENT.contact.title : STATIC_CONTENT.contact.titleEn}\n"],
    ['                {STATIC_CONTENT.contact.subtitle}\n', "                {language === 'ar' ? STATIC_CONTENT.contact.subtitle : STATIC_CONTENT.contact.subtitleEn}\n"],
    ['                    ✓ تم إرسال رسالتك بنجاح! وسوف تقوم يسرى بالرد عليكِ في أقرب وقت.\n', "                    {language === 'ar' ? '✓ تم إرسال رسالتك بنجاح!' : '✓ Your message was sent successfully!'}\n"],
    ['<label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الاسم الكامل *</label>', "<label className=\"font-bold text-slate-700 dark:text-slate-300 block mb-1\">{language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>"],
    ['placeholder="ادخلي اسمك..."', "placeholder={language === 'ar' ? 'ادخلي اسمك...' : 'Enter your name...'}"],
    ['<label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">البريد الإلكتروني *</label>', "<label className=\"font-bold text-slate-700 dark:text-slate-300 block mb-1\">{language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</label>"],
    ['<label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">موضوع الرسالة *</label>', "<label className=\"font-bold text-slate-700 dark:text-slate-300 block mb-1\">{language === 'ar' ? 'موضوع الرسالة *' : 'Subject *'}</label>"],
    ['placeholder="مثال: استفسار عن منتج، طلب مراجعة، تعاون..."', "placeholder={language === 'ar' ? 'مثال: استفسار عن منتج، طلب مراجعة، تعاون...' : 'Example: product question, review request, collaboration...'}"],
    ['<label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">تفاصيل الرسالة *</label>', "<label className=\"font-bold text-slate-700 dark:text-slate-300 block mb-1\">{language === 'ar' ? 'تفاصيل الرسالة *' : 'Message *'}</label>"],
    ['placeholder="اكتبي نص الرسالة هنا..."', "placeholder={language === 'ar' ? 'اكتبي نص الرسالة هنا...' : 'Write your message here...'}"],
    ['                  إرسال الرسالة الآن\n', "                  {language === 'ar' ? 'إرسال الرسالة الآن' : 'Send Message'}\n"],
    ['<h3 className="text-sm font-bold text-slate-900 dark:text-white">قنوات التواصل الاجتماعية الرسمية:</h3>', "<h3 className=\"text-sm font-bold text-slate-900 dark:text-white\">{language === 'ar' ? 'قنوات التواصل الاجتماعية الرسمية:' : 'Official social channels:'}</h3>"],
    ['                  {STATIC_CONTENT.disclosure.title}\n', "                  {language === 'ar' ? STATIC_CONTENT.disclosure.title : STATIC_CONTENT.disclosure.titleEn}\n"],
    ['<span className="text-xs text-slate-400">آخر تحديث: {STATIC_CONTENT.disclosure.updatedAt}</span>', "<span className=\"text-xs text-slate-400\">{language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {language === 'ar' ? STATIC_CONTENT.disclosure.updatedAt : STATIC_CONTENT.disclosure.updatedAtEn}</span>"],
    ['              {STATIC_CONTENT.disclosure.text}\n', "              {language === 'ar' ? STATIC_CONTENT.disclosure.text : STATIC_CONTENT.disclosure.textEn}\n"],
    ['                {STATIC_CONTENT.privacy.title}\n', "                {language === 'ar' ? STATIC_CONTENT.privacy.title : STATIC_CONTENT.privacy.titleEn}\n"],
    ['<span className="text-xs text-slate-400">آخر تحديث: {STATIC_CONTENT.privacy.updatedAt}</span>', "<span className=\"text-xs text-slate-400\">{language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {language === 'ar' ? STATIC_CONTENT.privacy.updatedAt : STATIC_CONTENT.privacy.updatedAtEn}</span>"],
    ['{STATIC_CONTENT.privacy.sections.map((section, i) => (', "{(language === 'ar' ? STATIC_CONTENT.privacy.sections : STATIC_CONTENT.privacy.sectionsEn).map((section, i) => ("],
    ['                {STATIC_CONTENT.terms.title}\n', "                {language === 'ar' ? STATIC_CONTENT.terms.title : STATIC_CONTENT.terms.titleEn}\n"],
    ['<span className="text-xs text-slate-400">آخر تحديث: {STATIC_CONTENT.terms.updatedAt}</span>', "<span className=\"text-xs text-slate-400\">{language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {language === 'ar' ? STATIC_CONTENT.terms.updatedAt : STATIC_CONTENT.terms.updatedAtEn}</span>"],
    ['              {STATIC_CONTENT.terms.text}\n', "              {language === 'ar' ? STATIC_CONTENT.terms.text : STATIC_CONTENT.terms.textEn}\n"],
    ['                {STATIC_CONTENT.cookies.title}\n', "                {language === 'ar' ? STATIC_CONTENT.cookies.title : STATIC_CONTENT.cookies.titleEn}\n"],
    ['<span className="text-xs text-slate-400">آخر تحديث: {STATIC_CONTENT.cookies.updatedAt}</span>', "<span className=\"text-xs text-slate-400\">{language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {language === 'ar' ? STATIC_CONTENT.cookies.updatedAt : STATIC_CONTENT.cookies.updatedAtEn}</span>"],
    ['              {STATIC_CONTENT.cookies.text}\n', "              {language === 'ar' ? STATIC_CONTENT.cookies.text : STATIC_CONTENT.cookies.textEn}\n"]
  ]);
  return source;
});

patch('src/components/BlogSection.tsx', source => source);
patch('src/components/BlogDetailModal.tsx', source => source);

console.log('[patch-public-bilingual-storefront] Public storefront language mode enforced.');
