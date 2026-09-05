// Only read the primary product's offer, never a recommendation or installment.
export function elementById(html: string, id: string): string {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bid=["']${escaped}["'][^>]*>`, 'i').exec(html);
  if (!start) return '';
  const tags = new RegExp(`</?${start[1]}\\b[^>]*>`, 'gi');
  tags.lastIndex = start.index + start[0].length;
  let depth = 1;
  let tag: RegExpExecArray | null;
  while ((tag = tags.exec(html))) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (!depth) return html.slice(start.index, tags.lastIndex);
  }
  return '';
}

export function parseMoney(raw: string): number | null {
  // Exactly one amount. Never join "259 99" or "259 + 20" into a new price.
  const cleaned = raw.replace(/&(?:nbsp|#160);/gi, ' ').replace(/[$€£]|USD|EUR|GBP|SAR|AED|US/gi, '').trim();
  if (!/^\d[\d.,]*$/.test(cleaned)) return null;
  let normalized = cleaned;
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(cleaned)) normalized = cleaned.replace(/,/g, '');
  else if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned)) normalized = cleaned.replace(/\./g, '').replace(',', '.');
  else if (/^\d+,\d{1,2}$/.test(cleaned)) normalized = cleaned.replace(',', '.');
  else if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function amazonPriceText(html: string): string {
  for (const id of ['corePriceDisplay_desktop_feature_div', 'corePrice_desktop', 'corePrice_feature_div']) {
    const block = elementById(html, id);
    // a-price-to-pay explicitly identifies the purchase price, unlike crossed-out prices.
    const payable = /<span\b[^>]*class=["'][^"']*\b(?:priceToPay|a-price-to-pay)\b[^"']*["'][^>]*>[\s\S]*?<span\b[^>]*class=["'][^"']*\ba-offscreen\b[^"']*["'][^>]*>([^<]+)</i.exec(block)?.[1];
    if (payable && parseMoney(payable) !== null) return payable;
  }
  for (const id of ['priceblock_ourprice', 'priceblock_dealprice', 'price_inside_buybox']) {
    const text = elementById(html, id).replace(/<[^>]*>/g, '').trim();
    if (parseMoney(text) !== null) return text;
  }
  return ''; // Missing or ambiguous is preferable to a different product's price.
}
