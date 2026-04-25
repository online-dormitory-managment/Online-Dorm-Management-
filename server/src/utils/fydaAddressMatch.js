/**
 * FYDA back-side: focus on English/Latin; Amharic is stripped for matching.
 */

/**
 * Normalize text into a compact ASCII-only key suitable for matching OCR output.
 * - lowercases
 * - removes diacritics
 * - removes non-ascii characters (e.g. Amharic)
 * - strips punctuation/whitespace
 */
function normalizeAscii(input) {
  if (input == null) return '';
  const s = String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase();

  // Keep only ASCII letters/digits; remove spaces/punctuation
  return s.replace(/[^a-z0-9]+/g, '');
}

/**
 * Attempt to extract the most relevant "address-like" region from back-side OCR text.
 * Heuristic only — returns a substring that tends to contain location fields.
 */
function extractAddressRegionFromBackOcr(backOcrText) {
  const raw = String(backOcrText || '');
  if (!raw) return '';

  // Look for common location markers in OCR output
  const lowered = raw.toLowerCase();
  const markers = [
    'address',
    'addis ababa',
    'subcity',
    'sub-city',
    'woreda',
    'wereda',
    'kebele',
    'house',
    'region',
    'zone',
    'city',
  ];

  let start = 0;
  for (const m of markers) {
    const idx = lowered.indexOf(m);
    if (idx !== -1) {
      start = idx;
      break;
    }
  }

  // Capture a reasonable window; avoid very large payloads
  const windowSize = 2000;
  return raw.slice(start, start + windowSize);
}

/** 
 * Fuzzy matching: Check if word exists or if major chunk of it exists 
 * (helps with Tesseract typos like 'Addis Absba')
 */
function strictContains(source, target) {
  const s = normalizeAscii(source);
  const t = normalizeAscii(target);
  if (!s || !t) return false;
  return s.includes(t) || t.includes(s);
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

  if (strictContains(fullAscii, cityKey) || strictContains(addrAscii, cityKey)) return true;

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
    if (c.includes(kw) || b.includes(kw) || strictContains(c, kw) || strictContains(b, kw)) return true;
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
  strictContains,
};
