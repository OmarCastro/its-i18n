/**
 * Escape regex pattern as to search for raw string, similar to Perl's \Q ... \E and quotemeta
 * @param {string} pattern - pattern to escape
 * @returns {string} escaped regex pattern
 */
export function escape (pattern) {
  return String(pattern).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
}
