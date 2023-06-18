/**
 * Parses ISO-8601 text
 *
 * @param {string} text - ISO8601 input as string
 * @returns {number} the representing ISO date as milliseconds from UNIX time on valid input, NaN on invalid input
 */
export function parseISO8601(text) {
  if (typeof text !== 'string') {
    return NaN
  }
  const iso8601Regex =
    /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/
  return !text.match(iso8601Regex) ? NaN : Date.parse(text)
}
