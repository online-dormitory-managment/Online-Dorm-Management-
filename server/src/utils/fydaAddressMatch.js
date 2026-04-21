/**
 * FYDA back-side: focus on English/Latin; Amharic is stripped for matching.
 */

function normalizeAscii(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** English OCR often has "Address" / "Place of birth" — take text after Address for matching. */
function extractAddressRegionFromBackOcr(ocrText) {
  const t = String(ocrText || '');
  const lower = t.toLowerCase();
  const markers = ['address', 'place of residence', 'residence'];
  let best = '';
  for (const m of markers) {
    const i = lower.indexOf(m);
    if (i !== -1) {
      const slice = t.slice(i, i + Math.min(600, t.length - i));
      if (slice.length > best.length) best = slice;
    }
  }
  return best || t;
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

  if (fullAscii.includes(cityKey) || addrAscii.includes(cityKey)) return true;

  const parts = rawCity.split(/\s+/).filter((p) => p.length >= 3);
  for (const p of parts) {
    const k = normalizeAscii(p);
    if (k.length >= 3 && (fullAscii.includes(k) || addrAscii.includes(k))) return true;
  }

  const first = rawCity.split(/\s+/)[0];
  const firstKey = normalizeAscii(first);
  return !!(firstKey && firstKey.length >= 3 && (fullAscii.includes(firstKey) || addrAscii.includes(firstKey)));
}

function cityImpliesAddis(city) {
  const v = String(city || '').toLowerCase();
  return v.includes('addis') || v.includes('sheger') || v.includes('finfinne');
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
 * "Far" Addis / outskirts: student or ID text suggests outer sub-cities / surrounding areas.
 * (Heuristic — expand as needed.)
 */
const FAR_ADDIS_KEYWORDS = [
  'akaki',
  'kality',
  'kaliti',
  'nifas',
  'nifsilk',
  'nifassilk',
  'kolfe',
  'keranio',
  'gullele',
  'yeka',
  'burayu',
  'legetafo',
  'legeta',
  'sebeta',
  'sululta',
  'holeta',
  'sendafa',
  'teji',
  'ayertena',
  'kotebe',
  'saris',
  'megenagna',
  'lideta',
  'nifassilklafto',
  'lafto',
];

function impliesFarAddis(city, backOcrText) {
  const c = normalizeAscii(city);
  const b = normalizeAscii(backOcrText);
  for (const kw of FAR_ADDIS_KEYWORDS) {
    if (c.includes(kw) || b.includes(kw)) return true;
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
