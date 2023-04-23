export function isNumeric(str: string) {
  return typeof str === 'string' && str.trim() === str && !isNaN(str as never) && !isNaN(parseFloat(str))
}

export function isInteger(str: string) {
  return typeof str === 'string' && /^[+-]?[0-9]+$/.test(str)
}
