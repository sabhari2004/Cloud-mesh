/**
 * Production Input Sanitization & Security Validation Utility
 * Defends against XSS, injection payloads, and malformed inputs.
 */

export const sanitizeText = (input = '', maxLength = 1000) => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    // Strip control characters and dangerous protocol schemes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const sanitizeNumber = (input, min = 0, max = 1000000, fallback = 0) => {
  const num = Number(input);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
};

export const sanitizeCategory = (category, allowed = [], fallback = 'other') => {
  if (typeof category !== 'string') return fallback;
  const clean = category.toLowerCase().trim();
  return allowed.includes(clean) ? clean : fallback;
};
