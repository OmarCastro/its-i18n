/**
 * @class
 * @template {object} K
 * @template V
 */
export class IterableWeakMap {
  /** @param {Iterable<Readonly<[K, V]>>} [iterable] - initial data of the map */
  constructor (iterable = []) {
    for (const [key, value] of iterable) { this.set(key, value) }
  }

  /** @returns {number} amount of entries in the map */
  get size () {
    return dataOf(this).keySet.size
  }

  /**
   * Deletes the entry with key `key` from the iterable weak map, does nothing if not found
   * @param {K} key - target key
   */
  delete (key) {
    deleteKey(key, this)
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  /**
   * @yields {[K, V]} - map entry
   * @returns {Generator<[K, V], void>} - generator object of map entries
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
   * @param {(value : V, key : K, map : this) => void} callback - forEach callback
   * @param {*} [thisArg] - value of `this` variable in `callback`, optional
   */
  forEach (callback, thisArg) {
    for (const [key, value] of this.entries()) { callback.call(thisArg, value, key, this) }
  }

  /**
   * @param {K} key  - key object
   * @returns {V | undefined} - entry value of found entry with key, undefined if not found
   */
  get (key) {
    return dataOf(this).refWeakMap.get(key)?.value
  }

  /**
   * @param {K} key - key object
   * @returns {boolean} true if map contains `key`
   */
  has (key) {
    return dataOf(this).refWeakMap.has(key)
  }

  /**
   * @yields {K} - map entry key
   * @returns {Generator<K, void>} - generator object of map keys
   */
  * keys () {
    yield * iterateKeys(this)
  }

  /**
   * @param {K} key - key target
   * @param {V} value - value to set or override
   * @returns {IterableWeakMap<K, V>} the same instance
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
   * @yields {V} - map entry value
   * @returns {Generator<V, void>} - generator object of map values
   */
  * values () {
    for (const [, value] of this.entries()) { yield value }
  }
}

/**
 * @class
 * @template {object} V
 */
export class IterableWeakSet {
  /** @param {Iterable<V>} [iterable] - initial data of the set */
  constructor (iterable = []) {
    for (const value of iterable) { this.add(value) }
  }

  /** @returns {number} amount of entries in the set */
  get size () {
    return dataOf(this).keySet.size
  }

  /**
   * Deletes a value from the iterable weak set, does nothing if not found
   * @param {V} value - target value
   */
  delete (value) {
    deleteKey(value, this)
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  /**
   * @yields {V} - map entry value
   * @returns {Generator<V, void>} - generator object of map values
   */
  * entries () {
    for (const value of this.keys()) { yield value }
  }

  /**
   *
   * @param {(value : V, set : this) => void} callback - forEach callback
   * @param {*} [thisArg] - value of `this` variable in `callback`, optional
   */
  forEach (callback, thisArg) {
    for (const value of this.entries()) { callback.call(thisArg, value, this) }
  }

  /**
   *
   * @param {V} value - value
   * @returns {boolean} true if map contains `value`
   */
  has (value) {
    return dataOf(this).refWeakMap.has(value)
  }

  /**
   * @param {V} value - value to add
   * @returns {IterableWeakSet<V>} the same instance
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
   * @yields {V} - map entry value
   * @returns {Generator<V, void>} - generator object of map values
   */
  * keys () {
    yield * iterateKeys(this)
  }

  /**
   * @yields {V} - map entry value
   * @returns {Generator<V, void>} - generator object of map values
   */
  * values () {
    yield * iterateKeys(this)
  }
}

/**
 * @template {object} K
 * @template V
 * Generates an iterable weak struct key iterator
 * @param {IterableWeakSet<K> | IterableWeakMap<K, V>} struct - target weak struct
 * @yields {K} - weak struck key
 */
function * iterateKeys (struct) {
  const { keySet } = dataOf(struct)
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
 * Deletes a key from an iterable weak struct
 * @param {object} key - target key
 * @param {IterableWeakSet<object> | IterableWeakMap<object, *>} struct - target weak struct
 * @returns {boolean} true if deleted, false if not found
 */
function deleteKey (key, struct) {
  const { keySet, refWeakMap } = dataOf(struct)
  const entry = refWeakMap.get(key)
  if (!entry) return false
  keySet.delete(entry.ref)
  refWeakMap.delete(key)
  return true
}

const dataOf = (() => {
  /**
   * @type {WeakMap<*, IterableWeakMapData<object,*>>} valueMap
   */
  const map = new WeakMap()

  /**
   * @param {IterableWeakSet<object> | IterableWeakMap<object, *>} iter - target weak struct to initialize
   * @returns {IterableWeakMapData<*, *>} target weak struct data
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
   * @param {IterableWeakSet<K> | IterableWeakMap<K, V>} iter - target weak struct
   * @returns {IterableWeakMapData<K, V>} target weak struct data
   */
  function getData (iter) {
    return map.get(iter) ?? init(iter)
  }
  return getData
})()

export default IterableWeakMap

/**
 * @template {object} K
 * @template V
 * @typedef {object} IterableWeakMapData
 * @property {WeakMap<K, {ref: WeakRef<K> , value: V}>} refWeakMap - weakmap of weak refs and values
 * @property {Set<WeakRef<K>>} keySet - iterable set of weak keys
 */
