const path = require('path');

/**
 * Normalizes a file path to be relative to the 'uploads' directory
 * and uses forward slashes. This ensures consistency across different
 * environments (Windows, Linux, Vercel /tmp).
 */
function normalizeFilePath(fullPath) {
  if (!fullPath) return '';
  
  // Convert all slashes to forward slashes
  let p = String(fullPath).replace(/\\/g, '/');
  
  // Rule 1: If it's a Vercel /tmp path, we map it to 'uploads/filename'
  if (p.startsWith('/tmp/')) {
    const filename = path.basename(p);
    return `uploads/${filename}`;
  }
  
  // Rule 2: If the path already contains 'uploads/', strip everything before it
  const uploadsIdx = p.toLowerCase().indexOf('uploads/');
  if (uploadsIdx !== -1) {
    return p.slice(uploadsIdx);
  }
  
  // Rule 3: If it's a relative path from the project root (e.g. 'uploads/subdir/file.jpg')
  if (p.startsWith('uploads/')) {
    return p;
  }
  
  // Rule 4: Final fallback - prepend 'uploads/' if it doesn't look like an absolute path
  if (!p.startsWith('/') && !p.includes(':')) {
    return `uploads/${p.replace(/^\/+/, '')}`;
  }
  
  // Rule 5: If it really is just a filename, return 'uploads/filename'
  if (!p.includes('/')) {
    return `uploads/${p}`;
  }

  return p;
}

module.exports = { normalizeFilePath };
