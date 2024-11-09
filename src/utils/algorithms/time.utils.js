/**
 * Parses ISO-8601 text to unix timestamp
 * @param {string} text - ISO8601 input as string
 * @returns {number} the representing ISO date as milliseconds from UNIX time on valid input, NaN on invalid input
 */
export function parseISO8601 (text) {
  if (typeof text !== 'string') {
    return NaN
  }
  /* eslint-disable-next-line sonarjs/regex-complexity -- ISO 8601 Regexp is that complex */
  const iso8601Regex =
    /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/
  return !text.match(iso8601Regex) ? NaN : Date.parse(text)
}

/**
 * Returns current time and memoizes it for the duration of a frame
 *
 * This function exists because many operations related to relative time
 * relies on current time, calling Date.now() continuously not only returns
 * different result each call, it is expensive. Calling it continuously
 * will affect performance
 *
 * The impact of different results in Date.now() is that each frame you may,
 * see inconsistent results on all ticking elements in a screen (one or two elements jumps 2 seconds,
 * or no seconds at all, while others are ok)
 * @returns {number} the current time, or the time of first call if called more than once during a frame
 */
export const timeNowFrame = (() => {
  /** @type {number | null} */
  let frameTime = null

  return function timeNowFrame () {
    if (frameTime === null) {
      frameTime = Date.now()
      requestAnimationFrame(() => { frameTime = null })
    }

    return frameTime
  }
})()
