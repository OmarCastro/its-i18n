/**
 * @constructor
 * @template {object} K
 * @template V
 */
export class IterableWeakMap {
  /**
   *
   * @param {Iterable<readonly [K, V]>} [iterable]
   */
  constructor (iterable = []) {
    for (const [key, value] of iterable) { this.set(key, value) }
  }

  /** @returns {number} */
  get size () {
    return dataOf(this).keySet.size
  }

  /**
   *
   * @param {K} key
   */
  delete (key) {
    const { keySet, refWeakMap } = dataOf(this)
    const entry = refWeakMap.get(key)
    if (!entry) return false
    keySet.delete(entry.ref)
    refWeakMap.delete(key)
    return true
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  /**
   * @returns {IterableIterator<[K, V]>}
   */
  * entries () {
    const { refWeakMap } = dataOf(this)
    for (const key of this.keys()) {
      const entry = refWeakMap.get(key)
      if (entry) {
        yield [key, entry.value]
      }
    }
  }

  /**
   *
   * @param {(value : V, key : K, map : this) => void} callback
   * @param {*} [thisArg]
   */
  forEach (callback, thisArg) {
    for (const [key, value] of this.entries()) { callback.call(thisArg, value, key, this) }
  }

  /**
   *
   * @param {K} key
   * @returns {V | undefined}
   */
  get (key) {
    return dataOf(this).refWeakMap.get(key)?.value
  }

  /**
   *
   * @param {K} key
   */
  has (key) {
    return dataOf(this).refWeakMap.has(key)
  }

  * keys () {
    const { keySet } = dataOf(this)
    const array = Array.from(keySet)
    for (const ref of array) {
      const deref = ref.deref()
      if (!deref) {
        keySet.delete(ref)
        continue
      }
      yield deref
    }
  }

  /**
   *
   * @param {K} key
   * @param {V} value
   * @returns
   */
  set (key, value) {
    const { keySet, refWeakMap } = dataOf(this)
    const refVal = refWeakMap.get(key)
    if (refVal !== undefined) {
      refVal.value = value
      return this
    }
    const ref = new WeakRef(key)
    refWeakMap.set(key, { ref, value })
    keySet.add(ref)
    return this
  }

  /**
   * @returns {IterableIterator<V>}
   */
  * values () {
    for (const [, value] of this.entries()) { yield value }
  }
}

/**
 * @constructor
 * @template {object} V
 */
export class IterableWeakSet {
  /**
   *
   * @param {Iterable<V>} [iterable]
   */
  constructor (iterable = []) {
    for (const value of iterable) { this.add(value) }
  }

  /** @returns {number} */
  get size () {
    return dataOf(this).keySet.size
  }

  /**
   *
   * @param {V} key
   */
  delete (key) {
    const { keySet, refWeakMap } = dataOf(this)
    const entry = refWeakMap.get(key)
    if (!entry) return false
    keySet.delete(entry.ref)
    refWeakMap.delete(key)
    return true
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  /**
   * @returns {IterableIterator<V>}
   */
  * entries () {
    for (const value of this.keys()) { yield value }
  }

  /**
   *
   * @param {(value : V, set : this) => void} callback
   * @param {*} [thisArg]
   */
  forEach (callback, thisArg) {
    for (const value of this.entries()) { callback.call(thisArg, value, this) }
  }

  /**
   *
   * @param {V} value
   */
  has (value) {
    return dataOf(this).refWeakMap.has(value)
  }

  * keys () {
    const { keySet } = dataOf(this)
    const array = Array.from(keySet)
    for (const ref of array) {
      const deref = ref.deref()
      if (!deref) {
        keySet.delete(ref)
        continue
      }
      yield deref
    }
  }

  /**
   *
   * @param {V} value
   * @returns
   */
  add (value) {
    const { keySet, refWeakMap } = dataOf(this)
    if (refWeakMap.has(value)) {
      return this
    }
    const ref = new WeakRef(value)
    refWeakMap.set(value, { ref, value: true })
    keySet.add(ref)
    return this
  }

  /**
   * @returns {IterableIterator<V>}
   */
  * values () {
    for (const value of this.keys()) { yield value }
  }
}

const dataOf = (() => {
  /**
   * @template {object} K
   * @template V
   *
   * @typedef {object} IterableWeakMapData
   *
   * @property {WeakMap<K, {ref: WeakRef<K> , value: V}>} refWeakMap
   * @property {Set<WeakRef<K>>} keySet
   *
   */

  /**
   * @type {WeakMap<*, IterableWeakMapData<object,*>>} valueMap
   */
  const map = new WeakMap()

  /**
   * @param {IterableWeakSet<object> | IterableWeakMap<object, *>} iter
   */
  function init (iter) {
    const keySet = new Set()
    const refWeakMap = new WeakMap()
    const result = { keySet, refWeakMap }
    map.set(iter, result)
    return result
  }

  /**
     * @template {object} K
     * @template V
     * @param {IterableWeakSet<K> | IterableWeakMap<K, V>} iter
     * @returns {IterableWeakMapData<K, V>} iter
     */
  function getData (iter) {
    return map.get(iter) ?? init(iter)
  }
  return getData
})()

export default IterableWeakMap
