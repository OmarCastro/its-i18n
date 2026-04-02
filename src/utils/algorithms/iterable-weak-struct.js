/**
 * WeakMap that is iterable with `for..of` and `forEach()` while making the keys referenced
 * weakly with the map, meaning the key can be garbage collected if there is no strong
 * references from the map
 *
 * @class
 * @template {WeakKey} K
 * @template V
 */
export class IterableWeakMap {
  /** @param {Iterable<Readonly<[K, V]>>} [iterable] - initial data of the map */
  constructor (iterable = []) {
    for (const [key, value] of iterable) { this.set(key, value) }
  }

  /** @returns {number} the number of elements in the IterableWeakMap */
  get size () {
    return getSize(this)
  }

  /**
   * Removes the specified element from the IterableWeakMap.
   * @param {K} key - target key
   * @returns {boolean} true if the element was successfully removed, or false if it was not present.
   */
  delete (key) {
    return deleteKey(key, this)
  }

  /**
   * Returns the value corresponding to the specified key in this WeakMap.
   * If the key is not present, it inserts a new entry with the key and a given default value, and returns the inserted value.
   * @param {K} key  - key object
   * @param {V} defaultValue  - value to insert if not found
   * @returns {V} - entry value of found entry with key or inserted value
   */
  getOrInsert (key, defaultValue) {
    if (this.has(key)) { return /** @type {V} */ (this.get(key)) }
    this.set(key, defaultValue)
    return defaultValue
  }

  /**
   * returns the value corresponding to the specified key in this WeakMap. If the key is not present, it inserts a new entry with the key and a default value computed from a given callback, and returns the inserted value
   * @param {K} key  - key object
   * @param {(key: K) => V} callback - A function that returns the value to insert and return if the key is not already present
   * @returns {V} - entry value of found entry with key or inserted value
   */
  getOrInsertComputed (key, callback) {
    if (this.has(key)) { return /** @type {V} */ (this.get(key)) }
    const value = callback(key)
    this.set(key, value)
    return value
  }

  /**
   * Removes all elements from the map.
   */
  clear () {
    clear(this)
  }

  /**
   * Executes a provided function once per each key/value pair in the IterableWeakMap, in insertion order.
   * @param {(value : V, key : K, map : this) => void} callback - forEach callback
   * @param { unknown } [thisArg] - value of `this` variable in `callback`, optional
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
   * @returns {boolean} a boolean indicating whether an element with the specified key exists or not
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

  /**
   * @yields {[K, V]} - map entry
   * @returns {Generator<[K, V], void>} an iterable of key, value pairs for every entry in the IterableWeakMap, in insertion order
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

  [Symbol.iterator] () {
    return this.entries()
  }
}

/**
 * WeakSet that is iterable with `for..of` and `forEach()` while making the values referenced
 * weakly with the set, meaning the value can be garbage collected if there is no strong
 * references from the value
 *
 * @class
 * @template {WeakKey} V
 */
export class IterableWeakSet {
  /** @param {Iterable<V>} [iterable] - initial data of the set */
  constructor (iterable = []) {
    for (const value of iterable) { this.add(value) }
  }

  /** @returns {number} the number of (unique) elements in Set */
  get size () {
    return getSize(this)
  }

  /**
   * Deletes a value from the iterable weak set, does nothing if not found
   * @param {V} value - target value
   */
  delete (value) {
    deleteKey(value, this)
  }

  /**
   * Removes all elements from the set.
   */
  clear () {
    clear(this)
  }

  /**
   * Executes a provided function once for each value in this set, in insertion order.
   * @param {(value : V, key : V, set : this) => void} callback - forEach callback
   * @param { unknown } [thisArg] - value of `this` variable in `callback`, optional
   */
  forEach (callback, thisArg) {
    for (const value of this.entries()) { callback.call(thisArg, value, value, this) }
  }

  /**
   * @param {V} value - value
   * @returns {boolean} a boolean indicating whether an element with the specified value exists in the Set or not
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
   * @returns {Generator<V, void>} - generator object of set values
   */
  * keys () {
    yield * iterateKeys(this)
  }

  /**
   * @yields {V} - map entry value
   * @returns {Generator<V, void>} - generator object of set values
   */
  * values () {
    yield * iterateKeys(this)
  }

  /**
   * @yields {V} - map entry value
   * @returns {Generator<V, void>} - generator object of set values
   */
  * entries () {
    yield * iterateKeys(this)
  }

  [Symbol.iterator] () {
    return this.entries()
  }
}

/**
 * @template {WeakKey} K
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
 * @param {WeakKey} key - target key
 * @param {IterableWeakSet<WeakKey> | IterableWeakMap<WeakKey, unknown>} struct - target weak struct
 * @returns {boolean} true if deleted, false if not found
 */
function deleteKey (key, struct) {
  const { keySet, refWeakMap } = dataOf(struct)
  const entry = refWeakMap.get(key)
  if (!entry) { return false }
  keySet.delete(entry.ref)
  refWeakMap.delete(key)
  return true
}

/**
 * clears an iterable weak struct
 * @param {IterableWeakSet<WeakKey> | IterableWeakMap<WeakKey, unknown>} struct - target weak struct
 */
function clear (struct) {
  const { keySet, refWeakMap } = dataOf(struct)
  const array = Array.from(keySet)
  for (const ref of array) {
    const deref = ref.deref()
    if (deref) {
      refWeakMap.delete(deref)
    }
  }
  keySet.clear()
}

/**
 * Gets actual size of iterable weak struct
 * @param {IterableWeakSet<WeakKey> | IterableWeakMap<WeakKey, unknown>} struct - target weak struct
 */
function getSize (struct) {
  const { keySet } = dataOf(struct)
  keySet.forEach(ref => { if (!ref.deref()) { keySet.delete(ref) } })
  return keySet.size
}

const dataOf = (() => {
  /**
   * @type {WeakMap<IterableWeakSet<any> | IterableWeakMap<WeakKey, any>, IterableWeakMapData<any, any>>}
   */
  const map = new WeakMap()

  /**
   * @template {WeakKey} K
   * @template V
   * @param {IterableWeakSet<K> | IterableWeakMap<K, V>} iter - target iterable weak struct to initialize
   * @returns {IterableWeakMapData<K, V>} target weak struct data
   */
  function init (iter) {
    const keySet = new Set()
    /** @type {WeakMap<K, ValueRef<K,V>>} */
    const refWeakMap = new WeakMap()
    const result = {
      keySet,
      refWeakMap,
    }
    map.set(iter, result)
    return result
  }

  /**
   * @template {WeakKey} K
   * @template V
   * @param {IterableWeakSet<K> | IterableWeakMap<K, V>} iter - target iterable weak struct
   * @returns {IterableWeakMapData<K, V>} target weak struct data
   */
  function getData (iter) {
    return map.get(iter) ?? init(iter)
  }
  return getData
})()

/**
 * @template {WeakKey} K
 * @template V
 * @typedef {object} ValueRef
 * @property {WeakRef<K>} ref - reference object applied on the map
 * @property {V} value - value on the map
 */

/**
 * @template {WeakKey} K
 * @template V
 * @typedef {object} IterableWeakMapData
 * @property {WeakMap<K, ValueRef<K,V>>} refWeakMap - weakmap of weak refs and values
 * @property {Set<WeakRef<K>>} keySet - iterable set of weak keys
 */
