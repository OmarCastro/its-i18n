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

const millisInADay = durationUnits.day

/**
 * @param {number} time1 - timestamp 1, in milliseconds since Epoch
 * @param {number} time2 - timestamp 2, in milliseconds since Epoch
 */
export function getDurationBetweenTimestamos (time1, time2) {
  const durationInMillis = Math.abs(time1 - time2)
  if (durationInMillis < millisInADay) {
    const hours = Math.floor(durationInMillis / durationUnits.hour)
    const minutes = Math.floor((durationInMillis % durationUnits.hour) / durationUnits.minute)
    const seconds = Math.floor((durationInMillis % durationUnits.minute) / durationUnits.second)
    const milliseconds = durationInMillis % durationUnits.second

    return { hours, minutes, seconds, milliseconds }
  }
}
