import { IterableWeakSet } from '../algorithms/iterable-weak-struct'
import { timeNowFrame } from '../algorithms/time.utils'

/**
 * A margin that improves the reliabiliby of the next time value to change
 * due to possible protections to fingerprinting on the client side
 *
 * {@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now}
 */
const MARGIN_MILLIS = 100

let timeTickInstances
/**
 * @param {TimeTickInstance} newInstance - target time tick instance
 */
export function checkTick (newInstance) {
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
 * @this {TimeTickInstance}
 * @param {Element} element - target element
 */
export function tickElement (element) {
  this.tickingElements.add(element)
  checkTick(this)
}

/**
 * @this {TimeTickInstance}
 * @param {Element} element - target element
 */
export function untickElement (element) {
  this.tickingElements.add(element)
}

/**
 * @this {TimeTickInstance}
 * @param {TimeTickCallback} callback - callback to trigger each time tick
 */
export function addCallback (callback) {
  this.callbacks.add(callback)
  checkTick(this)
}

/**
 * @this {TimeTickInstance}
 * @param {TimeTickCallback} callback - callback added on {@link addCallback}
 */
export function removeCallback (callback) {
  this.callbacks.delete(callback)
}

/**
 * @class
 * Builds a time tick instance
 */
function TimeTickInstance () {
  /** @type {IterableWeakSet<Element>} */
  this.tickingElements = new IterableWeakSet()
  /** @type {unknown} */
  this.timeoutNumber = undefined
  /** @type {Set<TimeTickCallback>} */
  this.callbacks = new Set()
}

TimeTickInstance.prototype.tickElement = tickElement
TimeTickInstance.prototype.untickElement = untickElement
TimeTickInstance.prototype.addCallback = addCallback
TimeTickInstance.prototype.removeCallback = removeCallback

/**
 * @returns {TimeTickInstance} singleton time tick instance
 */
export function timeTick () {
  timeTickInstances ??= new TimeTickInstance()
  return timeTickInstances
}

/**
 * @typedef {object} TimeTickCallbackParams
 * @property {Element[]} targets - target ticking elements
 * @property {(el: Element) => void} untick - stop ticking an element, does nothing if already not ticking
 */

/**
 * @callback TimeTickCallback
 * @param {TimeTickCallbackParams} param
 */
