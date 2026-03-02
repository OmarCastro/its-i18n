const { test: base, expect: baseExpect } = await import('@playwright/test')
const { window, resetDom } = await import('./init-dom.js')
const { setup: setupFetchMock, teardown: teardownFetchMock } = await import('./fetch-mock.js')
const { gc } = await import('./gc.js')

export const expect = baseExpect

/** @type {any} */
export const test = base.extend({
  step: async ({}, use) => {
    await use(test.step)
  },
  dom: async ({}, use) => {
    resetDom()
    await use(window)
  },
  expect: async ({}, use) => {
    await use(expect)
  },
  fetch: async ({}, use) => {
    const api = setupFetchMock()
    await use(api)
    teardownFetchMock()
  },
  gc: async ({}, use) => {
    await use(gc)
  },
})
