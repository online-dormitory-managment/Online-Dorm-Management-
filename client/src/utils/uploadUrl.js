import { getUploadBaseUrl } from './apiConfig';

/** Build absolute URL for server static files under `/uploads` (handles full disk paths or `uploads/...`). */
export function uploadUrl(storedPath) {
  if (!storedPath) return null;
  let p = String(storedPath).replace(/\\/g, '/');
  const idx = p.toLowerCase().indexOf('uploads/');
  if (idx !== -1) p = p.slice(idx);
  else if (!p.startsWith('uploads')) p = `uploads/${p.replace(/^\//, '')}`;
  const base = getUploadBaseUrl();
  return `${base}/${p}`;
}
