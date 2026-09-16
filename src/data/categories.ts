import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'smart-home',
    nameAr: 'المنزل الذكي',
    nameEn: 'Smart Home',
    icon: 'Home',
    description: 'أحدث المكانس الروبوتية، أجهزة التنظيف، الإضاءة والأقفال الذكية لمنزل أكثر راحة وسهولة',
    descriptionEn: 'Robot vacuums, cleaning devices, smart lighting, locks, and connected-home essentials for easier everyday living.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'الأجهزة المنزلية الذكية', 'المكانس الروبوتية', 'أجهزة تنظيف الأرضيات', 'أجهزة تنظيف السجاد',
      'أجهزة تنظيف الزجاج', 'أجهزة البخار', 'أجهزة التنظيف اللاسلكية', 'أجهزة إزالة البقع',
      'أجهزة التعقيم', 'الإضاءة الذكية', 'المقابس الذكية', 'الكاميرات المنزلية',
      'أقفال الأبواب الذكية', 'حساسات المنزل', 'أجراس الأبواب الذكية', 'منظمات المنزل', 'حلول التخزين الذكية'
    ],
    subcategoriesEn: [
      'Smart Home Appliances', 'Robot Vacuums', 'Floor Cleaners', 'Carpet Cleaners',
      'Window Cleaners', 'Steam Cleaners', 'Cordless Cleaners', 'Spot Cleaners',
      'Sanitizing Devices', 'Smart Lighting', 'Smart Plugs', 'Home Cameras',
      'Smart Door Locks', 'Home Sensors', 'Smart Doorbells', 'Home Organizers', 'Smart Storage Solutions'
    ]
  },
  {
    id: 'smart-kitchen',
    nameAr: 'المطبخ الذكي',
    nameEn: 'Smart Kitchen',
    icon: 'Utensils',
    description: 'قلايات هوائية، ماكينات قهوة، خلاطات وأدوات مطبخ ذكية تجعل إعداد الطعام متعة',
    descriptionEn: 'Air fryers, coffee machines, blenders, and smart kitchen tools that make food preparation easier and more enjoyable.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'القلايات الهوائية', 'الخلاطات', 'محضرات الطعام', 'ماكينات القهوة', 'الغلايات الكهربائية',
      'العصارات', 'أجهزة صنع الثلج', 'أجهزة صنع الوافل', 'أجهزة صنع الساندويتش',
      'المكانس الصغيرة للمطبخ', 'أدوات المطبخ الذكية', 'أدوات تنظيم المطبخ', 'حافظات الطعام الذكية'
    ],
    subcategoriesEn: [
      'Air Fryers', 'Blenders', 'Food Processors', 'Coffee Machines', 'Electric Kettles',
      'Juicers', 'Ice Makers', 'Waffle Makers', 'Sandwich Makers',
      'Compact Kitchen Vacuums', 'Smart Kitchen Tools', 'Kitchen Organizers', 'Smart Food Storage'
    ]
  },
  {
    id: 'furniture-decor',
    nameAr: 'أثاث المنزل والديكور',
    nameEn: 'Furniture & Decor',
    icon: 'Armchair',
    description: 'لمسات ديكورية عصرية وأثاث فاخر ومنظمات للمنزل تحول المساحات إلى تحفة فنية',
    descriptionEn: 'Modern decor, furniture, storage, and organization ideas for stylish and functional living spaces.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'أثاث غرفة المعيشة', 'أثاث غرفة النوم', 'أثاث المكتب المنزلي', 'طاولات', 'كراسي', 'رفوف',
      'خزائن', 'وحدات التخزين', 'الإضاءة', 'السجاد', 'الستائر', 'المرايا', 'اللوحات',
      'الإكسسوارات المنزلية', 'ديكورات عصرية', 'منظمات المنزل'
    ],
    subcategoriesEn: [
      'Living Room Furniture', 'Bedroom Furniture', 'Home Office Furniture', 'Tables', 'Chairs', 'Shelving',
      'Cabinets', 'Storage Units', 'Lighting', 'Rugs', 'Curtains', 'Mirrors', 'Wall Art',
      'Home Accessories', 'Modern Decor', 'Home Organizers'
    ]
  },
  {
    id: 'smart-gadgets',
    nameAr: 'الأجهزة الذكية والإلكترونيات',
    nameEn: 'Smart Electronics',
    icon: 'Cpu',
    description: 'سماعات لاسلكية، ساعات ذكية، باور بنك وشواحن بدون تركيز على الهواتف',
    descriptionEn: 'Wireless audio, smart watches, chargers, power banks, and practical electronics for everyday use.',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'السماعات اللاسلكية', 'سماعات الرأس', 'الساعات الذكية', 'أجهزة تتبع اللياقة',
      'مكبرات الصوت الذكية', 'الشواحن اللاسلكية', 'الباور بانك', 'قواعد الشحن',
      'إكسسوارات الكمبيوتر', 'إكسسوارات اللابتوب', 'لوحات المفاتيح', 'الفأرات',
      'كاميرات المراقبة المنزلية', 'أجهزة المنزل الذكي'
    ],
    subcategoriesEn: [
      'Wireless Earbuds', 'Headphones', 'Smart Watches', 'Fitness Trackers',
      'Smart Speakers', 'Wireless Chargers', 'Power Banks', 'Charging Docks',
      'Computer Accessories', 'Laptop Accessories', 'Keyboards', 'Mice',
      'Home Security Cameras', 'Smart Home Devices'
    ]
  },
  {
    id: 'women-corner',
    nameAr: 'العناية الشخصية والأناقة',
    nameEn: 'Personal Care & Style',
    icon: 'Sparkles',
    description: 'أدوات العناية بالبشرة والشعر، أدوات تصفيف، حقائب، عطور ومستحضرات العناية الفاخرة للجميع',
    descriptionEn: 'Skin, hair, styling, beauty, fashion, fragrance, and personal-care essentials.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'الملابس', 'الحقائب', 'الأحذية', 'العطور', 'المكياج', 'مستحضرات التجميل', 'العناية بالبشرة',
      'العناية بالشعر', 'أدوات تصفيف الشعر', 'أجهزة إزالة الشعر', 'الإكسسوارات', 'المجوهرات', 'منظمات المكياج'
    ],
    subcategoriesEn: [
      'Clothing', 'Bags', 'Shoes', 'Fragrance', 'Makeup', 'Cosmetics', 'Skin Care',
      'Hair Care', 'Hair Styling Tools', 'Hair Removal Devices', 'Accessories', 'Jewelry', 'Makeup Organizers'
    ]
  },
  {
    id: 'health-fitness',
    nameAr: 'الصحة واللياقة',
    nameEn: 'Health & Fitness',
    icon: 'Activity',
    description: 'أجهزة مساج، مطارات مياه ذكية، أدوات رياضية منزلية وموازين ذكية لصحة أفضل',
    descriptionEn: 'Massage devices, smart bottles, home fitness equipment, and smart scales for everyday wellness.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'زجاجات المياه الذكية', 'أجهزة المساج', 'أجهزة الاسترخاء', 'أدوات الرياضة المنزلية', 'أجهزة قياس الوزن', 'أجهزة تتبع النشاط'
    ],
    subcategoriesEn: [
      'Smart Water Bottles', 'Massage Devices', 'Relaxation Devices', 'Home Fitness Equipment', 'Smart Scales', 'Activity Trackers'
    ]
  }
];
