export type CurrencyCode = 'SAR' | 'USD' | 'EUR' | 'EGP' | 'AED' | 'KWD';

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
  SAR: {
    code: 'SAR',
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    rateFromSar: 1,
    labelAr: 'ريال سعودي',
    labelEn: 'Saudi Riyal (SAR)',
    flag: '🇸🇦'
  },
  USD: {
    code: 'USD',
    symbolAr: '$',
    symbolEn: '$',
    rateFromSar: 0.267,
    labelAr: 'دولار أمريكي',
    labelEn: 'US Dollar (USD)',
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    symbolAr: '€',
    symbolEn: '€',
    rateFromSar: 0.245,
    labelAr: 'يورو أوروبي',
    labelEn: 'Euro (EUR)',
    flag: '🇪🇺'
  },
  EGP: {
    code: 'EGP',
    symbolAr: 'ج.م',
    symbolEn: 'EGP',
    rateFromSar: 12.9,
    labelAr: 'جنيه مصري',
    labelEn: 'Egyptian Pound (EGP)',
    flag: '🇪🇬'
  },
  AED: {
    code: 'AED',
    symbolAr: 'د.إ',
    symbolEn: 'AED',
    rateFromSar: 0.98,
    labelAr: 'درهم إماراتي',
    labelEn: 'UAE Dirham (AED)',
    flag: '🇦🇪'
  },
  KWD: {
    code: 'KWD',
    symbolAr: 'د.ك',
    symbolEn: 'KWD',
    rateFromSar: 0.082,
    labelAr: 'دينار كويتي',
    labelEn: 'Kuwaiti Dinar (KWD)',
    flag: '🇰🇼'
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
  const config = CURRENCIES[currencyCode] || CURRENCIES.SAR;
  const converted = Math.round(priceInSar * config.rateFromSar);
  const formattedAmount = converted.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
  const symbol = language === 'ar' ? config.symbolAr : config.symbolEn;

  // Format placement
  let fullText = `${formattedAmount} ${symbol}`;
  if (language === 'en' && (currencyCode === 'USD' || currencyCode === 'EUR')) {
    fullText = `${symbol}${formattedAmount}`;
  }

  return {
    amount: converted,
    formattedAmount,
    symbol,
    fullText
  };
}
