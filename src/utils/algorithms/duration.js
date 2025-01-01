/**
 * @satisfies {{[unit in Intl.RelativeTimeFormatUnit]?:number}}
 * @constant
 */
const durationUnits = {
  year: 1000 * 60 * 60 * 24 * 365,
  month: 1000 * 60 * 60 * 24 * 365 / 12,
  day: 1000 * 60 * 60 * 24,
  hour: 1000 * 60 * 60,
  minute: 1000 * 60,
  second: 1000,
}

/**
 * @param {number} time1 - timestamp 1, in milliseconds since Epoch
 * @param {number} time2 - timestamp 2, in milliseconds since Epoch
 */
export function getDurationBetweenTimestamps (time1, time2) {
  const durationInMillis = Math.abs(time1 - time2)

  const totalDays = Math.floor(durationInMillis / durationUnits.day)
  const hours = Math.floor((durationInMillis % durationUnits.day) / durationUnits.hour)
  const minutes = Math.floor((durationInMillis % durationUnits.hour) / durationUnits.minute)
  const seconds = Math.floor((durationInMillis % durationUnits.minute) / durationUnits.second)
  const milliseconds = durationInMillis % durationUnits.second

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

  return { hours, minutes, seconds, totalDays, years: elapsedYears, months: elapsedMonths, days: elapsedDays }
}

/**
 * @param {number} month - month to check, it is zero-based (January is 0)
 * @param {number} year - year to check, used to detect if it is a leap year
 * @returns {number} number of days in a month
 */
function daysInMonth (month, year) {
  return new Date(year, (month + 1) % 12, 0).getDate()
}
