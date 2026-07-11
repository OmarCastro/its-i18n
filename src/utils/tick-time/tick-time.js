import { IterableWeakSet } from '../algorithms/iterable-weak-struct.js'
import { timeNowFrame } from '../algorithms/time.utils.js'

/**
 * A margin that improves the reliability of the next time value to change
 * due to possible protections to fingerprinting on the client side
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now}
 */
const MARGIN_MILLIS = 100

/**
 * @param {TimeTickInstance["data"]} newInstance - target time tick instance
 */
function checkTick (newInstance) {
  const { callbacks, tickingElements, timeoutNumber } = newInstance
  if (timeoutNumber === undefined && tickingElements.size > 0 && callbacks.size > 0) {
    const nextSecond = 1000 - timeNowFrame() % 1000
    newInstance.timeoutNumber = setTimeout(() => {
      for (const tickCallback of callbacks) {
        tickCallback({
          targets: [...tickingElements],
          untick: (el) => tickingElements.delete(el),
        })
      }
      newInstance.timeoutNumber = undefined
      checkTick(newInstance)
    }, nextSecond + MARGIN_MILLIS)
  }
}


/**
 * Builds a time tick instance
 */
function buildTimeTick () {
  const data = {
    /** @type {IterableWeakSet<Element>} */
    tickingElements: new IterableWeakSet(),
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    timeoutNumber: undefined,
    /** @type {Set<TimeTickCallback>} */
    callbacks: new Set(),
  }

  const api = {

    /** @param {Element} element - target element */
    tickElement: (element) => {
      data.tickingElements.add(element)
      checkTick(data)
    },

    /** @param {Element} element - target element */
    untickElement: (element) => {
      data.tickingElements.delete(element)
    },

    /** @param {TimeTickCallback} callback - callback to trigger each time tick */
    addCallback: (callback) => {
      data.callbacks.add(callback)
      checkTick(data)
    },

    /** @param {TimeTickCallback} callback - callback to trigger each time tick */
    removeCallback: (callback) => {
      data.callbacks.delete(callback)
    },
  }

  return { api, data }
}


/** @type {TimeTickInstance} */
let timeTickInstances

/**
 * @returns {TimeTickApi} singleton time tick instance
 */
export function timeTick () {
  timeTickInstances ??= buildTimeTick()
  return timeTickInstances.api
}

/**
 * @typedef {object} TimeTickCallbackParams
 * @property {Element[]} targets - target ticking elements
 * @property {(el: Element) => void} untick - stop ticking an element, does nothing if already not ticking
 */

/**
 * @typedef {ReturnType<typeof buildTimeTick>} TimeTickInstance
 */
/**
 * @typedef {TimeTickInstance["api"]} TimeTickApi
 */


/**
 * @callback TimeTickCallback
 * @param {TimeTickCallbackParams} param
 */
