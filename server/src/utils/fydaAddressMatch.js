/**
 * FYDA back-side: focus on English/Latin; Amharic is stripped for matching.
 */

/** 
 * Fuzzy matching: Check if word exists or if major chunk of it exists 
 * (helps with Tesseract typos like 'Addis Absba')
 */
function fuzzyContains(source, target) {
  const s = normalizeAscii(source);
  const t = normalizeAscii(target);
  if (!s || !t) return false;
  if (s.includes(t) || t.includes(s)) return true;
  
  // For long words, check if at least 75% of characters match in sequence
  if (t.length >= 6) {
    const chunk = t.slice(0, Math.floor(t.length * 0.75));
    if (s.includes(chunk)) return true;
  }
  return false;
}

/** 
 * Declared city/address vs back-side OCR (full + address slice).
 */
function cityMatchesBackOcr(city, backOcrText) {
  const rawCity = String(city || '').split(',')[0].trim();
  if (!rawCity) return false;

  const cityKey = normalizeAscii(rawCity);
  if (!cityKey) return false;

  const fullAscii = normalizeAscii(backOcrText);
  const addrSlice = extractAddressRegionFromBackOcr(backOcrText);
  const addrAscii = normalizeAscii(addrSlice);

  if (fuzzyContains(fullAscii, cityKey) || fuzzyContains(addrAscii, cityKey)) return true;

  const parts = rawCity.split(/\s+/).filter((p) => p.length >= 3);
  for (const p of parts) {
    if (fuzzyContains(fullAscii, p) || fuzzyContains(addrAscii, p)) return true;
  }

  return false;
}

function cityImpliesAddis(city) {
  const v = String(city || '').toLowerCase();
  // Synonyms for the capital region
  return v.includes('addis') || v.includes('sheger') || v.includes('finfinne') || v.includes('finfine');
}

/**
 * Back-side OCR (ASCII) suggests residence is in Addis / Sheger / Finfinne area.
 */
function backOcrImpliesAddisArea(backOcrText) {
  const a = normalizeAscii(backOcrText);
  return (
    a.includes('addisababa') ||
    a.includes('addis') ||
    a.includes('sheger') ||
    a.includes('finfinne') ||
    a.includes('finfine')
  );
}

/**
 * "Far" Addis / outskirts: areas that are legally Addis but traditionally far enough 
 * to justify on-campus housing.
 */
const FAR_ADDIS_KEYWORDS = [
  // Outer Sub-cities
  'akaki', 'kality', 'kaliti', 'akakikality',
  'nifassilk', 'nifas', 'nifsilk', 'lafto', 'nifassilklafto', 
  'kolfe', 'keranio', 'kolfekeranio',
  'yeka', 'abado', 'kotebe',
  'gullele', 'shiro', 'meda',
  
  // Surrounding Oromia Special Zones (Sheger City)
  'sebeta', 'burayu', 'legetafo', 'legeta', 'sululta', 'holeta',
  'sendafa', 'dukem', 'gelan', 'bishoftu', 'debrezeit', 'pyassa',
  'ayertena', 'saris', 'tulu', 'dimtu', 'hanna', 'mariam'
];

function impliesFarAddis(city, backOcrText) {
  const c = normalizeAscii(city);
  const b = normalizeAscii(backOcrText);
  for (const kw of FAR_ADDIS_KEYWORDS) {
    if (c.includes(kw) || b.includes(kw) || fuzzyContains(c, kw) || fuzzyContains(b, kw)) return true;
  }
  return false;
}

/**
 * Eligible for immediate dorm assignment (no Pending) when FYDA matches:
 * - Declared origin is outside Addis/Sheger, OR
 * - Declared Addis but "far" / outskirts (same need for on-campus housing)
 */
function qualifiesForImmediateDorm(city, backOcrText) {
  const outside = !cityImpliesAddis(city);
  if (outside) return { eligible: true, reason: 'outside_addis_ababa' };

  const far = impliesFarAddis(city, backOcrText);
  if (far) return { eligible: true, reason: 'addis_outskirts_far' };

  return { eligible: false, reason: 'central_addis_or_review' };
}

module.exports = {
  normalizeAscii,
  extractAddressRegionFromBackOcr,
  cityMatchesBackOcr,
  cityImpliesAddis,
  backOcrImpliesAddisArea,
  impliesFarAddis,
  qualifiesForImmediateDorm,
};
