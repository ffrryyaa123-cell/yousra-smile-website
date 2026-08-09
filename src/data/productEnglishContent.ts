import { Product } from '../types';

type EnglishProductContent = Pick<
  Product,
  'descriptionEn' | 'longDescriptionEn' | 'subcategoryEn' | 'featuresEn' | 'specsEn' | 'keywordsEn'
>;

const PRODUCT_ENGLISH_CONTENT: Record<string, EnglishProductContent> = {
  'prod-1': {
    descriptionEn: 'Powerful robot vacuum and mop for carpets and hard floors, with automatic mop washing and drying.',
    longDescriptionEn: 'The Roborock S8 Pro Ultra delivers hands-free cleaning with 6,000 Pa suction, sonic mopping, and the all-in-one RockDock Ultra. The dock empties dust, washes the mop, refills the water tank, and dries the mop with hot air to help prevent odors.',
    subcategoryEn: 'Robot Vacuums',
    featuresEn: [
      '6,000 Pa suction for deep carpet cleaning',
      'DuoRoller dual brushes help prevent hair tangles',
      'Self-cleaning dock washes and hot-air dries the mop',
      '3D mapping and AI-powered obstacle avoidance',
      'App control with Alexa and Google Home support'
    ],
    specsEn: {
      'Suction power': '6,000 Pa',
      'Tank capacity': '350 ml water / 350 ml dust',
      'Battery life': 'Up to 180 minutes',
      'Navigation system': 'PreciSense LiDAR + Reactive 3D',
      'Warranty': '2-year comprehensive warranty'
    },
    keywordsEn: ['robot vacuum', 'smart cleaning', 'Roborock', 'carpet mopping', 'smart home']
  },
  'prod-2': {
    descriptionEn: 'Hands-free air frying with dual heating and remote cooking monitoring from your phone.',
    longDescriptionEn: 'The Cosori Dual Blaze uses 360 ThermoIQ technology with upper and lower heating elements, so food cooks evenly without flipping. It includes 12 cooking presets, an easy touchscreen, and phone notifications when the meal is ready.',
    subcategoryEn: 'Air Fryers',
    featuresEn: [
      'Upper and lower heating elements for even cooking',
      '6.4 L capacity for families of up to 6 people',
      'VeSync app control, voice control, and guided recipes',
      'Uses up to 85% less fat than traditional frying',
      'Dishwasher-safe nonstick basket'
    ],
    specsEn: {
      'Capacity': '6.4 L',
      'Power': '1,750 W',
      'Temperature range': '80°C–205°C',
      'Connectivity': 'Wi-Fi / VeSync App',
      'Weight': '6.3 kg'
    },
    keywordsEn: ['air fryer', 'smart kitchen', 'Cosori', 'healthy cooking', 'oil-free fryer']
  },
  'prod-3': {
    descriptionEn: 'Café-quality espresso at home with touchscreen guidance, automatic dosing, and assisted tamping.',
    longDescriptionEn: 'The Breville Barista Touch Impress guides you through grinding, dosing, and extraction on its color touchscreen. Its assisted tamping system applies a consistent 10 kg press, while automatic milk texturing creates smooth microfoam for lattes and cappuccinos.',
    subcategoryEn: 'Espresso Machines',
    featuresEn: [
      'Impress Puck System for guided dosing and assisted tamping',
      '8 customizable café-style drinks',
      'Built-in conical burr grinder',
      'Automatic hands-free milk texturing',
      'ThermoJet heating system ready in 3 seconds'
    ],
    specsEn: {
      'Pump pressure': '15 bar',
      'Water tank': '2 L with dual filter',
      'Heating system': 'ThermoJet',
      'Display': 'Color touchscreen',
      'Material': 'Durable stainless steel'
    },
    keywordsEn: ['espresso machine', 'Breville', 'coffee maker', 'automatic milk frothing', 'home café']
  },
  'prod-4': {
    descriptionEn: 'Modern Scandinavian-style sofa set with comfortable seating and solid natural-wood legs.',
    longDescriptionEn: 'A refined Scandinavian living-room set upholstered in soft, stain-resistant microfiber. High-density foam supports the back and keeps its shape, while the treated solid beech frame provides lasting strength for daily use.',
    subcategoryEn: 'Living Room Furniture',
    featuresEn: [
      'Soft, spill-resistant microfiber upholstery',
      'Treated solid beech frame and legs',
      'High-resilience cushions with comfortable back support',
      'Easy-to-clean materials for everyday use',
      'Available in versatile modern colors'
    ],
    specsEn: {
      'Dimensions': '220 × 90 × 85 cm',
      'Seating capacity': '3–4 people',
      'Frame': 'Solid natural beech',
      'Warranty': '3 years on frame'
    },
    keywordsEn: ['sofa set', 'Scandinavian furniture', 'living room', 'modern sofa', 'home décor']
  },
  'prod-5': {
    descriptionEn: 'Premium noise cancellation, detailed sound, and clear calls through an advanced multi-microphone system.',
    longDescriptionEn: 'Sony WH-1000XM5 headphones combine two processors and eight microphones for adaptive noise cancellation. The lightweight 250 g design stays comfortable, while the battery delivers up to 30 hours of listening with fast charging.',
    subcategoryEn: 'Headphones',
    featuresEn: [
      'Advanced noise cancellation powered by the V1 processor',
      'Up to 30 hours of battery life; 3-minute charge gives up to 3 hours',
      'Multipoint Bluetooth connection',
      'Speak-to-Chat automatically pauses playback',
      'Soft pressure-relieving ear cushions'
    ],
    specsEn: {
      'Battery life': 'Up to 30 hours with ANC',
      'Weight': '250 g',
      'Bluetooth': '5.2 with LDAC',
      'Microphones': '8 microphones'
    },
    keywordsEn: ['Sony headphones', 'noise cancelling', 'WH-1000XM5', 'wireless headphones', 'Bluetooth']
  },
  'prod-6': {
    descriptionEn: 'Curl, shape, smooth, and dry hair with controlled airflow and no extreme heat.',
    longDescriptionEn: 'The Dyson Airwrap uses the Coanda effect to attract and style hair with air instead of extreme heat. Six magnetic attachments support curling, smoothing, drying, and volumizing while helping protect natural shine.',
    subcategoryEn: 'Hair Styling Tools',
    featuresEn: [
      'Coanda airflow styles hair without extreme heat',
      'Intelligent heat control keeps temperature below 150°C',
      '6 magnetic styling attachments',
      'Premium storage case included',
      'Designed to smooth hair and enhance shine'
    ],
    specsEn: {
      'Power': '1,300 W',
      'Airflow': '13.5 L/s',
      'Heat settings': '3 settings plus cold shot',
      'Cord length': '2.68 m with 360° swivel'
    },
    keywordsEn: ['Dyson Airwrap', 'hair styler', 'hair dryer', 'Coanda', 'beauty tools']
  },
  'prod-7': {
    descriptionEn: 'Self-cleaning smart bottle that neutralizes up to 99.99% of bio-contaminants and lasts for weeks per charge.',
    longDescriptionEn: 'LARQ PureVis activates UV-C purification automatically every two hours to help keep water and the bottle fresh. Its insulated stainless-steel body keeps drinks cold for up to 24 hours, and a single USB charge can last up to a month.',
    subcategoryEn: 'Smart Water Bottles',
    featuresEn: [
      'PureVis UV-C purification technology',
      'Automatic self-cleaning cycle every 2 hours',
      'Keeps drinks cold for 24 hours or hot for 12 hours',
      'USB-rechargeable battery lasts up to one month',
      'BPA-free food-grade materials'
    ],
    specsEn: {
      'Capacity': '710 ml (25 oz)',
      'Purification': 'PureVis UV-C LED',
      'Material': '18/8 stainless steel',
      'Battery life': 'Up to one month'
    },
    keywordsEn: ['smart water bottle', 'LARQ', 'self-cleaning bottle', 'UV-C', 'insulated bottle']
  },
  'prod-8': {
    descriptionEn: 'Fingerprint access in 0.3 seconds, keyless entry, remote control, and instant security alerts.',
    longDescriptionEn: 'Eufy Security Smart Lock C220 supports multiple secure unlock methods, including fingerprint, passcode, app, key, and voice control. Built-in Wi-Fi enables remote management without a bridge, while the weather-resistant body and long battery life suit everyday use.',
    subcategoryEn: 'Smart Door Locks',
    featuresEn: [
      '0.3-second fingerprint recognition with 99.8% accuracy',
      'Built-in Wi-Fi with no separate bridge required',
      'Bank-grade encryption for stored access data',
      'Automatic locking and tamper alerts',
      'IP65 weather resistance'
    ],
    specsEn: {
      'Unlock methods': 'Fingerprint, passcode, app, key, and voice',
      'Battery life': 'Up to 8 months',
      'Connectivity': '2.4 GHz Wi-Fi + Bluetooth',
      'Weather rating': 'IP65'
    },
    keywordsEn: ['smart lock', 'Eufy Security', 'fingerprint lock', 'keyless entry', 'home security']
  },
  'prod-9': {
    descriptionEn: 'Bright display, Double Tap controls, and advanced heart, blood-oxygen, and wellness sensors.',
    longDescriptionEn: 'Apple Watch Series 9 is powered by the S9 SiP for fast on-device interactions and the one-handed Double Tap gesture. It supports sleep tracking, ECG, blood-oxygen insights, workout tracking, and safety features such as fall detection.',
    subcategoryEn: 'Smartwatches',
    featuresEn: [
      'Double Tap gesture for one-handed control',
      'Always-On Retina display up to 2,000 nits',
      'Heart-rate monitoring and ECG support',
      'Advanced workout tracking',
      'Water resistant to 50 meters'
    ],
    specsEn: {
      'Case': '45 mm aluminum',
      'Processor': 'S9 SiP',
      'Battery life': '18 hours; up to 36 hours in Low Power Mode',
      'Water resistance': 'WR50'
    },
    keywordsEn: ['Apple Watch', 'Series 9', 'smartwatch', 'fitness tracker', 'wearable technology']
  },
  'prod-10': {
    descriptionEn: 'Portable spot cleaner for carpets, upholstery, mattresses, stairs, and car interiors.',
    longDescriptionEn: 'Bissell SpotClean Pro combines cleaning solution, brushing, and strong suction to lift coffee, juice, pet, and everyday household stains. Its long hose and dual-tank system make targeted cleaning fast and convenient.',
    subcategoryEn: 'Spot Cleaners',
    featuresEn: [
      '750 W motor for powerful spot cleaning',
      'Separate clean-water and dirty-water tanks',
      '1.5 m hose for easier reach',
      'Suitable for cars, stairs, sofas, and mattresses',
      'Compact design for easy storage'
    ],
    specsEn: {
      'Power': '750 W',
      'Clean-water tank': '2.8 L',
      'Dirty-water tank': '2.2 L',
      'Cord length': '6.7 m'
    },
    keywordsEn: ['Bissell SpotClean', 'carpet cleaner', 'upholstery cleaner', 'stain remover', 'portable cleaner']
  },
  'prod-11': {
    descriptionEn: 'Illuminated rotating organizer for makeup, skincare, perfumes, and daily beauty essentials.',
    longDescriptionEn: 'This crystal-clear acrylic organizer rotates 360 degrees for quick access and includes an adjustable LED mirror with three lighting tones. Flexible shelves hold bottles and cosmetics of different sizes while keeping the vanity neat.',
    subcategoryEn: 'Makeup Organizers',
    featuresEn: [
      'Smooth 360° rotating base',
      'Rechargeable LED mirror with warm, white, and natural light',
      'Adjustable shelves for different bottle heights',
      'Thick, water-resistant high-clarity acrylic',
      'Compact footprint with generous storage'
    ],
    specsEn: {
      'Dimensions': '35 × 28 × 28 cm',
      'Mirror controls': 'Touch LED',
      'Battery': '1,200 mAh rechargeable battery',
      'Material': 'High-clarity acrylic',
      'Color': 'Transparent / gold'
    },
    keywordsEn: ['makeup organizer', 'LED mirror', 'acrylic organizer', 'vanity storage', 'beauty organizer']
  },
  'prod-12': {
    descriptionEn: 'Powerful percussive massager for muscle tension and soreness, with smart guided routines.',
    longDescriptionEn: 'Theragun Pro delivers deep-tissue treatment up to 16 mm to support recovery, mobility, and relief in the back, neck, and major muscle groups. Its adjustable arm, multiple attachments, and on-device guidance make treatment easier to target.',
    subcategoryEn: 'Massage Devices',
    featuresEn: [
      'QuietForce motor for powerful, quieter treatment',
      'OLED display with speed and pressure guidance',
      '6 interchangeable massage attachments',
      'Adjustable arm with 4 positions',
      'Designed for recovery, mobility, and muscle relief'
    ],
    specsEn: {
      'Treatment depth': '16 mm',
      'Battery life': 'Up to 150 minutes',
      'Warranty': '2 years'
    },
    keywordsEn: ['Theragun Pro', 'massage gun', 'muscle recovery', 'percussive therapy', 'deep tissue massage']
  }
};

export const applyEnglishProductContent = (product: Product): Product => {
  const fallback = PRODUCT_ENGLISH_CONTENT[product.id];
  if (!fallback) return product;

  return {
    ...product,
    descriptionEn: product.descriptionEn?.trim() || fallback.descriptionEn,
    longDescriptionEn: product.longDescriptionEn?.trim() || fallback.longDescriptionEn,
    subcategoryEn: product.subcategoryEn?.trim() || fallback.subcategoryEn,
    featuresEn: product.featuresEn?.length ? product.featuresEn : fallback.featuresEn,
    specsEn: product.specsEn && Object.keys(product.specsEn).length ? product.specsEn : fallback.specsEn,
    keywordsEn: product.keywordsEn?.length ? product.keywordsEn : fallback.keywordsEn
  };
};
