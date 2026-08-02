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
  rateFromSar: number; // base is SAR
  labelAr: string;
  labelEn: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbolAr: '$',
    symbolEn: '$',
    rateFromSar: 0.267,
    labelAr: 'دولار أمريكي ($)',
    labelEn: 'US Dollar (USD)',
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    symbolAr: '€',
    symbolEn: '€',
    rateFromSar: 0.245,
    labelAr: 'يورو أوروبي (€)',
    labelEn: 'Euro (EUR)',
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    symbolAr: '£',
    symbolEn: '£',
    rateFromSar: 0.21,
    labelAr: 'جنيه إسترليني (£)',
    labelEn: 'British Pound (GBP)',
    flag: '🇬🇧'
  },
  CAD: {
    code: 'CAD',
    symbolAr: 'CA$',
    symbolEn: 'CA$',
    rateFromSar: 0.36,
    labelAr: 'دولار كندي (CA$)',
    labelEn: 'Canadian Dollar (CAD)',
    flag: '🇨🇦'
  },
  AUD: {
    code: 'AUD',
    symbolAr: 'A$',
    symbolEn: 'A$',
    rateFromSar: 0.40,
    labelAr: 'دولار أسترالي (A$)',
    labelEn: 'Australian Dollar (AUD)',
    flag: '🇦🇺'
  },
  JPY: {
    code: 'JPY',
    symbolAr: '¥',
    symbolEn: '¥',
    rateFromSar: 41.5,
    labelAr: 'ين ياباني (¥)',
    labelEn: 'Japanese Yen (JPY)',
    flag: '🇯🇵'
  },
  SAR: {
    code: 'SAR',
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    rateFromSar: 1,
    labelAr: 'ريال سعودي (ر.س)',
    labelEn: 'Saudi Riyal (SAR)',
    flag: '🇸🇦'
  },
  AED: {
    code: 'AED',
    symbolAr: 'د.إ',
    symbolEn: 'AED',
    rateFromSar: 0.98,
    labelAr: 'درهم إماراتي (د.إ)',
    labelEn: 'UAE Dirham (AED)',
    flag: '🇦🇪'
  },
  KWD: {
    code: 'KWD',
    symbolAr: 'د.ك',
    symbolEn: 'KWD',
    rateFromSar: 0.082,
    labelAr: 'دينار كويتي (د.ك)',
    labelEn: 'Kuwaiti Dinar (KWD)',
    flag: '🇰🇼'
  },
  QAR: {
    code: 'QAR',
    symbolAr: 'ر.ق',
    symbolEn: 'QAR',
    rateFromSar: 0.97,
    labelAr: 'ريال قطري (ر.ق)',
    labelEn: 'Qatari Riyal (QAR)',
    flag: '🇶🇦'
  },
  BHD: {
    code: 'BHD',
    symbolAr: 'د.ب',
    symbolEn: 'BHD',
    rateFromSar: 0.10,
    labelAr: 'دينار بحريني (د.ب)',
    labelEn: 'Bahraini Dinar (BHD)',
    flag: '🇧🇭'
  },
  OMR: {
    code: 'OMR',
    symbolAr: 'ر.ع',
    symbolEn: 'OMR',
    rateFromSar: 0.10,
    labelAr: 'ريال عماني (ر.ع)',
    labelEn: 'Omani Rial (OMR)',
    flag: '🇴🇲'
  },
  EGP: {
    code: 'EGP',
    symbolAr: 'ج.م',
    symbolEn: 'EGP',
    rateFromSar: 12.9,
    labelAr: 'جنيه مصري (ج.م)',
    labelEn: 'Egyptian Pound (EGP)',
    flag: '🇪🇬'
  },
  TRY: {
    code: 'TRY',
    symbolAr: '₺',
    symbolEn: '₺',
    rateFromSar: 8.8,
    labelAr: 'ليرة تركية (₺)',
    labelEn: 'Turkish Lira (TRY)',
    flag: '🇹🇷'
  },
  JOD: {
    code: 'JOD',
    symbolAr: 'د.أ',
    symbolEn: 'JOD',
    rateFromSar: 0.189,
    labelAr: 'دينار أردني (د.أ)',
    labelEn: 'Jordanian Dinar (JOD)',
    flag: '🇯🇴'
  }
};

/**
 * Formats a price in base SAR currency into the selected currency.
 */
export function formatPriceValue(priceInSar: number, currencyCode: CurrencyCode, language: 'ar' | 'en' = 'ar'): {
  amount: number;
  formattedAmount: string;
  symbol: string;
  fullText: string;
} {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = Math.round(priceInSar * config.rateFromSar);
  const formattedAmount = converted.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
  const symbol = language === 'ar' ? config.symbolAr : config.symbolEn;

  // Prefix symbol for standard currency signs like $, €, £, ¥, CA$, A$, ₺
  const prefixSymbols = ['$', '€', '£', '¥', 'CA$', 'A$', '₺'];
  let fullText = `${formattedAmount} ${symbol}`;
  if (prefixSymbols.includes(symbol)) {
    fullText = `${symbol}${formattedAmount}`;
  }

  return {
    amount: converted,
    formattedAmount,
    symbol,
    fullText
  };
}
