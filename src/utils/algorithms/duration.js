/**
 * @satisfies {{[unit in Intl.RelativeTimeFormatUnit]?:number}}
 * @constant
 */
const durationUnitsInMillis = {
  month: 1000 * 60 * 60 * 24 * 365 / 12,
  day: 1000 * 60 * 60 * 24,
  hour: 1000 * 60 * 60,
  minute: 1000 * 60,
  second: 1000,
}

export const durationUnits = Object.freeze(/** @type {const} */(['hours', 'minutes', 'seconds', 'milliseconds', 'days', 'months', 'years', 'totalDays']))

/**
 * @param {number} time1 - timestamp 1, in milliseconds since Epoch
 * @param {number} time2 - timestamp 2, in milliseconds since Epoch
 * @returns {Duration} duration between timestamps
 */
export function getDurationBetweenTimestamps (time1, time2) {
  const durationInMillis = Math.abs(time1 - time2)

  const totalDays = Math.floor(durationInMillis / durationUnitsInMillis.day)
  const hours = Math.floor((durationInMillis % durationUnitsInMillis.day) / durationUnitsInMillis.hour)
  const minutes = Math.floor((durationInMillis % durationUnitsInMillis.hour) / durationUnitsInMillis.minute)
  const seconds = Math.floor((durationInMillis % durationUnitsInMillis.minute) / durationUnitsInMillis.second)
  const milliseconds = durationInMillis % durationUnitsInMillis.second

  if (totalDays === 0) {
    return { hours, minutes, seconds, milliseconds, totalDays, years: 0, months: 0, days: 0 }
  }

  const maxTimestamp = Math.max(time1, time2)
  const minTimestamp = Math.min(time1, time2)
  const maxDate = new Date(maxTimestamp)
  const minDate = new Date(minTimestamp)
  const diffYears = maxDate.getFullYear() - minDate.getFullYear()
  const diffMonths = maxDate.getMonth() - minDate.getMonth()
  const diffDays = maxDate.getDate() - minDate.getDate()
  const elapsedDays = diffDays < 0 ? daysInMonth(minDate.getMonth(), minDate.getFullYear()) - diffDays : diffDays
  const elapsedMonths = (diffMonths < 0 ? 12 - diffMonths : diffMonths) - (diffDays < 0 ? 1 : 0)
  const elapsedYears = diffYears - (diffMonths < 0 ? 1 : 0)

  return { hours, minutes, seconds, milliseconds, totalDays, years: elapsedYears, months: elapsedMonths, days: elapsedDays }
}

/**
 * @param {number} month - month to check, it is zero-based (January is 0)
 * @param {number} year - year to check, used to detect if it is a leap year
 * @returns {number} number of days in a month
 */
function daysInMonth (month, year) {
  return new Date(year, (month + 1) % 12, 0).getDate()
}

/**
 * @typedef {object} Duration
 * @property {number} hours - elapsed remaining hours
 * @property {number} minutes - elapsed remaining minutes
 * @property {number} seconds - elapsed remaining seconds
 * @property {number} milliseconds - elapsed remaining milliseconds
 * @property {number} days - elapsed remaining days
 * @property {number} months - elapsed remaining months
 * @property {number} years - elapsed years
 * @property {number} totalDays - elapsed days
 */
