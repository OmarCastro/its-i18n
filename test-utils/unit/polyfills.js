/*
  A bunch of simple polyfills to allow running tests in a client environment instead of browser
*/

applyPolyfills()

function applyPolyfills () {
  applyRequestAnimationFramePolyfill()
  applyRequestIdleCallbackPolyfill()
}

function applyRequestAnimationFramePolyfill () {
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (callback) => setImmediate(callback)
    globalThis.cancelAnimationFrame = (animationFrame) => clearImmediate(animationFrame)
  }
}

function applyRequestIdleCallbackPolyfill () {
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestIdleCallback = (callback) => setImmediate(callback)
    globalThis.cancelIdleCallback = (animationFrame) => clearImmediate(animationFrame)
  }
}
