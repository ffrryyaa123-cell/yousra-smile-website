export type CurrencyCode = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CAD' 
  | 'AUD' 
  | 'JPY' 
  | 'SAR' 
  | 'AED' 
  | 'KWD' 
  | 'QAR' 
  | 'BHD' 
  | 'OMR' 
  | 'EGP' 
  | 'TRY' 
  | 'JOD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbolAr: string;
  symbolEn: string;
  rateFromUsd: number; // base is USD ($)
  rateFromSar?: number; // backwards compatibility
  labelAr: string;
  labelEn: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbolAr: '$',
    symbolEn: '$',
    rateFromUsd: 1.0,
    rateFromSar: 0.267,
    labelAr: 'دولار أمريكي ($)',
    labelEn: 'US Dollar (USD)',
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    symbolAr: '€',
    symbolEn: '€',
    rateFromUsd: 0.92,
    rateFromSar: 0.245,
    labelAr: 'يورو أوروبي (€)',
    labelEn: 'Euro (EUR)',
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    symbolAr: '£',
    symbolEn: '£',
    rateFromUsd: 0.79,
    rateFromSar: 0.21,
    labelAr: 'جنيه إسترليني (£)',
    labelEn: 'British Pound (GBP)',
    flag: '🇬🇧'
  },
  CAD: {
    code: 'CAD',
    symbolAr: 'CA$',
    symbolEn: 'CA$',
    rateFromUsd: 1.36,
    rateFromSar: 0.36,
    labelAr: 'دولار كندي (CA$)',
    labelEn: 'Canadian Dollar (CAD)',
    flag: '🇨🇦'
  },
  AUD: {
    code: 'AUD',
    symbolAr: 'A$',
    symbolEn: 'A$',
    rateFromUsd: 1.52,
    rateFromSar: 0.40,
    labelAr: 'دولار أسترالي (A$)',
    labelEn: 'Australian Dollar (AUD)',
    flag: '🇦🇺'
  },
  JPY: {
    code: 'JPY',
    symbolAr: '¥',
    symbolEn: '¥',
    rateFromUsd: 155.0,
    rateFromSar: 41.5,
    labelAr: 'ين ياباني (¥)',
    labelEn: 'Japanese Yen (JPY)',
    flag: '🇯🇵'
  },
  SAR: {
    code: 'SAR',
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    rateFromUsd: 3.75,
    rateFromSar: 1.0,
    labelAr: 'ريال سعودي (ر.س)',
    labelEn: 'Saudi Riyal (SAR)',
    flag: '🇸🇦'
  },
  AED: {
    code: 'AED',
    symbolAr: 'د.إ',
    symbolEn: 'AED',
    rateFromUsd: 3.67,
    rateFromSar: 0.98,
    labelAr: 'درهم إماراتي (د.إ)',
    labelEn: 'UAE Dirham (AED)',
    flag: '🇦🇪'
  },
  KWD: {
    code: 'KWD',
    symbolAr: 'د.ك',
    symbolEn: 'KWD',
    rateFromUsd: 0.31,
    rateFromSar: 0.082,
    labelAr: 'دينار كويتي (د.ك)',
    labelEn: 'Kuwaiti Dinar (KWD)',
    flag: '🇰🇼'
  },
  QAR: {
    code: 'QAR',
    symbolAr: 'ر.ق',
    symbolEn: 'QAR',
    rateFromUsd: 3.64,
    rateFromSar: 0.97,
    labelAr: 'ريال قطري (ر.ق)',
    labelEn: 'Qatari Riyal (QAR)',
    flag: '🇶🇦'
  },
  BHD: {
    code: 'BHD',
    symbolAr: 'د.ب',
    symbolEn: 'BHD',
    rateFromUsd: 0.38,
    rateFromSar: 0.10,
    labelAr: 'دينار بحريني (د.ب)',
    labelEn: 'Bahraini Dinar (BHD)',
    flag: '🇧🇭'
  },
  OMR: {
    code: 'OMR',
    symbolAr: 'ر.ع',
    symbolEn: 'OMR',
    rateFromUsd: 0.38,
    rateFromSar: 0.10,
    labelAr: 'ريال عماني (ر.ع)',
    labelEn: 'Omani Rial (OMR)',
    flag: '🇴🇲'
  },
  EGP: {
    code: 'EGP',
    symbolAr: 'ج.م',
    symbolEn: 'EGP',
    rateFromUsd: 48.5,
    rateFromSar: 12.9,
    labelAr: 'جنيه مصري (ج.م)',
    labelEn: 'Egyptian Pound (EGP)',
    flag: '🇪🇬'
  },
  TRY: {
    code: 'TRY',
    symbolAr: '₺',
    symbolEn: '₺',
    rateFromUsd: 34.0,
    rateFromSar: 8.8,
    labelAr: 'ليرة تركية (₺)',
    labelEn: 'Turkish Lira (TRY)',
    flag: '🇹🇷'
  },
  JOD: {
    code: 'JOD',
    symbolAr: 'د.أ',
    symbolEn: 'JOD',
    rateFromUsd: 0.71,
    rateFromSar: 0.189,
    labelAr: 'دينار أردني (د.أ)',
    labelEn: 'Jordanian Dinar (JOD)',
    flag: '🇯🇴'
  }
};

/**
 * Formats a price in base USD currency into the selected currency.
 */
export function formatPriceValue(priceInUsd: number, currencyCode: CurrencyCode, language: 'ar' | 'en' = 'ar'): {
  amount: number;
  formattedAmount: string;
  symbol: string;
  fullText: string;
} {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const rate = config.rateFromUsd ?? 1;
  const converted = currencyCode === 'USD' ? priceInUsd : Math.round(priceInUsd * rate);
  
  const formattedAmount = (currencyCode === 'USD' && !Number.isInteger(converted))
    ? converted.toFixed(2)
    : Math.round(converted).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
    
  const symbol = language === 'ar' ? config.symbolAr : config.symbolEn;

  // Prefix symbol for standard currency signs like $, €, £, ¥, CA$, A$, ₺
  const prefixSymbols = ['$', '€', '£', '¥', 'CA$', 'A$', '₺'];
  let fullText = `${formattedAmount} ${symbol}`;
  if (prefixSymbols.includes(symbol)) {
    fullText = `${symbol}${formattedAmount}`;
  }

  return {
    amount: typeof converted === 'number' ? converted : Number(converted),
    formattedAmount,
    symbol,
    fullText
  };
}
