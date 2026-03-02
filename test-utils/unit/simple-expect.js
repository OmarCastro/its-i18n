import inspect from 'object-inspect'

const formatted = (strings, ...values) => () => String.raw(
  { raw: strings },
  ...values.map(value => inspect(value))
)

const invariant = (check, errorMessageThunk) => {
  if (!check) {
    throw Error(errorMessageThunk())
  }
}

export const isEqual = (a, b) => {
  if (a === b) {
    return true
  }

  const bothAreObjects = a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)

  return Boolean(
    bothAreObjects &&
      Object.keys(a).length === Object.keys(b).length &&
      Object.entries(a).every(([k, v]) => isEqual(v, b[k]))
  )
}

const validateThrows = (method, expectedError) => {
  let errorCaught
  try {
    method()
  } catch (e) {
    errorCaught = e
    const errorCaughtMessage = e instanceof Error ? e.message : String(e)
    const expectedMessage = expectedError instanceof Error ? expectedError.message : String(expectedError)
    invariant(Object.is(errorCaughtMessage, expectedMessage), formatted`Expected function to throw error with message ${expectedMessage}`)
  }
  invariant(errorCaught !== undefined, formatted`Expected function to throw error`)
}

const validateRejects = async (method, expectedError) => {
  let errorCaught
  try {
    await method()
  } catch (e) {
    errorCaught = e
    const errorCaughtMessage = e instanceof Error ? e.message : String(e)
    const expectedMessage = expectedError instanceof Error ? expectedError.message : String(expectedError)
    invariant(Object.is(errorCaughtMessage, expectedMessage), formatted`Expected function to reject with message ${expectedMessage}`)
  }
  invariant(errorCaught !== undefined, formatted`Expected function to reject`)
}

/** @type {ExpectApi} */
export const expect = (target) => ({
  toBe: (expected) => invariant(Object.is(target, expected), formatted`Expected ${target} to be ${expected}`),
  toEqual: (expected) => invariant(isEqual(target, expected), formatted`Expected ${target} to equal ${expected}`),
  toStrictEqual: (expected) => invariant(isEqual(target, expected), formatted`Expected ${target} to toStrictEqual ${expected}`),
  toThrow: (expected) => validateThrows(target, expected),
  resolves: {
    toBe: async (expected) => invariant(Object.is(await target, expected), formatted`Expected promise to resolve to be ${expected}`),
    toEqual: async (expected) => invariant(isEqual(await target, expected), formatted`Expected promise to resolve to equal ${expected}`),
    toStrictEqual: async (expected) => invariant(isEqual(await target, expected), formatted`Expected promise to resolve to toStrictEqual ${expected}`),
  },
  rejects: {
    toThrow: async (expected) => await validateRejects(target, expected),
  }
})

/**
 * @typedef {object} BaseExpectMatchers
 * @property {(expected: unknown) => void} toBe - checks sameness with Object.is()
 * @property {(expected: unknown) => void} toEqual - deep checks value
 * @property {(expected: unknown) => void} toStrictEqual - same as toEqual
 *
 * @typedef  {object} PromiseExpectMatchers
 * @property {object} resolves - waits for promise to resolve
 * @property {(expected: unknown) => Promise<void>} resolves.toBe - checks sameness with Object.is()
 * @property {(expected: unknown) => Promise<void>} resolves.toEqual - deep checks value
 * @property {(expected: unknown) => Promise<void>} resolves.toStrictEqual - same as toEqual
 *
 * @typedef  {object} FunctionExpectMatchers
 * @property {(expected: unknown) => void} toThrow - toThrow
 * @property {object} rejects - waits for promise to reject
 * @property {(expected: unknown) => void} rejects.toThrow - toThrow
 *
 * @typedef {{
 *  (target: Promise) => PromiseExpectMatchers & BaseExpectMatchers
 *  (target: Function) => FunctionExpectMatchers & PromiseExpectMatchers & BaseExpectMatchers
 *  (target: any) => BaseExpectMatchers
 * }} ExpectApi
 */
