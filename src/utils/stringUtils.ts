/**
 * Utility functions for string manipulation and formatting
 */

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&#039;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&apos;': "'"
  };
  return str.replace(/&quot;|&amp;|&lt;|&gt;|&#039;|&#39;|&nbsp;|&apos;/g, (match) => entities[match] || match);
}

export function slugify(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function sanitizeFilename(str: string): string {
  return (str || 'track')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
