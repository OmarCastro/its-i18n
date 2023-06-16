/**
 * Checks if string is an integer, it accepts all numeric notations
 *
 * @param {string} str - target string
 * @returns true if `str`is a number, false otherwise
 */
export function isNumeric(str) {
  return typeof str === 'string' && str.trim() === str && !isNaN(Number(str)) && !isNaN(parseFloat(str))
}

/**
 * Checks if string is an integer, in this case, it only accepts number sign and digits
 *
 * @param {string} str - target string
 * @returns true if `str`is an integer, false otherwise
 */
export function isInteger(str) {
  return typeof str === 'string' && /^[+-]?[0-9]+$/.test(str)
}
