import { IterableWeakSet } from '../algorithms/iterable-weak-struct'

let timeTickInstances
/**
 *
 * @param {TimeTickInstance} newInstance;
 */
export function checkTick (newInstance) {
  const { callbacks, tickingElements, timeoutNumber } = newInstance
  if (timeoutNumber === undefined && tickingElements.size > 0 && callbacks.size > 0) {
    const now = Date.now()
    const nextSecond = 1000 - (now % 1000)
    newInstance.timeoutNumber = setTimeout(() => {
      for (const tickCallback of callbacks) {
        tickCallback({
          targets: [...tickingElements],
          untick: (el) => tickingElements.delete(el),
        })
      }
      newInstance.timeoutNumber = undefined
      checkTick(newInstance)
    }, nextSecond)
  }
}

/**
 * @this {TimeTickInstance}
 * @param {Element} element
 */
export function tickElement (element) {
  this.tickingElements.add(element)
  checkTick(this)
}

/**
 * @this {TimeTickInstance}
 * @param {Element} element
 */
export function untickElement (element) {
  this.tickingElements.add(element)
}

/**
 * @this {TimeTickInstance}
 * @param {TimeTickCallback} callback
 */
export function addCallback (callback) {
  this.callbacks.add(callback)
  checkTick(this)
}

/**
 * @this {TimeTickInstance}
 * @param {TimeTickCallback} callback
 */
export function removeCallback (callback) {
  this.callbacks.delete(callback)
}

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
 * @returns {TimeTickInstance}
 */
export function timeTick () {
  timeTickInstances ??= new TimeTickInstance()
  return timeTickInstances
}

/**
 * @typedef {object} TimeTickCallbackParams
 * @property {Element[]} targets
 * @property {(el: Element) => void} untick
 */

/**
 * @callback TimeTickCallback
 * @param {TimeTickCallbackParams} param
 */
