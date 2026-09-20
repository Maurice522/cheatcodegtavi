export function isGta6Related(item, keywords) {
  const haystack = `${item.title ?? ""} ${item.contentSnippet ?? item.content ?? ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

// Gaming outlets publish affiliate/coupon posts through the same RSS feed as
// their actual news — these mention "GTA 6" merch in passing but aren't a
// leak or update, so they'd otherwise slip through the keyword filter above.
const PROMO_PATTERNS = [
  /save \$\d/i,
  /\d+% off/i,
  /\bdeal(s)?\b/i,
  /\bdiscount(ed)?\b/i,
  /\bcoupon\b/i,
  /\blowest price\b/i,
  /\bprice drop\b/i,
  /\bon sale\b/i,
  /\bbest price\b/i,
  /\bwhere to (buy|pre-?order)\b/i,
];

export function isPromo(item) {
  return PROMO_PATTERNS.some((pattern) => pattern.test(item.title ?? ""));
}
