// @ts-nocheck Since this file adds info to globalThis as to simulate a browser
// on a Deno environment, it is better to disable type checking and code coverage
// for this file
let windowObj: Window;

if("Deno" in globalThis || globalThis.window == undefined ){
  // running in Deno
  const { JSDOM } = await import("jsdom")
  const jsdom = new JSDOM(
    `<!DOCTYPE html>
  <html lang="en">
    <head>
      <title>Hello from Deno</title>
    </head>
    <body>
    </body>
  </html>`,
    {
      url: "https://example.com/",
      referrer: "https://example.org/",
      contentType: "text/html",
      storageQuota: 10000000, 
    },
  );
  
  windowObj = jsdom.window as Window 
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 10)
  globalThis.cancelAnimationFrame = (frameNumber) => clearTimeout(frameNumber)
  globalThis.requestIdleCallback = windowObj.requestIdleCallback
  globalThis.cancelIdleCallback = windowObj.cancelIdleCallback
  globalThis.ShadowRoot = windowObj.ShadowRoot
  globalThis.MutationObserver = windowObj.MutationObserver
  globalThis.CustomEvent = windowObj.CustomEvent
  globalThis.HTMLElement = windowObj.HTMLElement
  globalThis.Element = windowObj.Element
  globalThis.Document = windowObj.Document
  globalThis.document = windowObj.document
  globalThis.navigator = windowObj.navigator
  globalThis.DOMParser = windowObj.DOMParser
  globalThis.XMLSerializer = windowObj.XMLSerializer
} else {
  windowObj = globalThis.window 
}

export const window = windowObj 
export const document = windowObj.document
