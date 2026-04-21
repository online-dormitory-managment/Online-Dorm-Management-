/**
 * Map student department → dorm campus (kilo) for room assignment.
 */
function normalizeDepartment(department) {
  return String(department || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getCampusForDepartment(department) {
  const d = normalizeDepartment(department);

  if (d.includes('engineering')) return '5kilo';
  if (d.includes('computer science')) return '4kilo';
  if (d.includes('software engineering')) return '5kilo';
  if (d.includes('information')) return '4kilo';

  const natural = ['biology', 'chemistry', 'physics', 'mathematics', 'math', 'statistics', 'geology', 'environmental science', 'biotechnology'];
  if (natural.some((k) => d.includes(k))) return '4kilo';

  const fbe = ['business', 'business administration', 'economics', 'accounting', 'management', 'finance', 'marketing'];
  if (fbe.some((k) => d.includes(k))) return 'FBE';

  return '6kilo';
}

module.exports = { getCampusForDepartment };
