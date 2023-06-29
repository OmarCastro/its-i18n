import { IterableWeakSet } from '../algorithms/iterable-weak-struct'

/**
 * @type {IterableWeakSet<Element>}
 */
const tickingElements = new IterableWeakSet()

/** @type {unknown} */
let timeoutNumber

export function checkTick () {
  if (timeoutNumber !== undefined && tickingElements.size > 0) {
    timeoutNumber = setTimeout(() => {
      console.log('tick')
      timeoutNumber = undefined
      checkTick()
    }, Date.now() % 1000)
  }
}

/**
 *
 * @param {Element} element
 */
export function tickElement (element) {
  tickingElements.add(element)
  checkTick()
}
