/**
 * this file adapts the test to their own environment
 *
 * on Deno uses Deno API
 * on Node it uses playwright
 * on browser it uses a custom api
 */

// thee 2 lines are to prevent esbuild to bundle the await imports
const importModule = (str) => import(str)
let importStr

/**
 * @returns {Test}
 */
const fn = async () => {
  if (globalThis.Deno != null) {
    // init unit tests for deno

    importStr = 'https://deno.land/x/expect/mod.ts'
    const { expect } = await importModule(importStr)

    importStr = './init-dom'
    const { window } = await importModule(importStr)

    return (description, test) => {
      globalThis.Deno.test(`${description}`, async (t) => {
        await test({
          step: t.step,
          expect,
          dom: window,
        })
      })
    }
  }

  if (globalThis.window == null) {
    // init unit tests for Playwright

    importStr = '@playwright/test'
    const { test: base, expect } = await import('@playwright/test')

    importStr = './init-dom'
    const { window, resetDom } = await importModule(importStr)

    /** @type {(description, test) => Promise<any>} */
    const test = base.extend({
      // eslint-disable-next-line no-empty-pattern
      step: async ({}, use) => {
        await use(test.step)
      },

      // eslint-disable-next-line no-empty-pattern
      dom: async ({}, use, testinfo) => {
        resetDom()
        await use(window)
      },
      // eslint-disable-next-line no-empty-pattern
      expect: async ({}, use) => {
        await use(expect)
      },
    })

    return test
  } else {
    // init unit tests to be run in browser

    const { expect } = await import('expect')

    return async (description, test) => {
      console.log('-' + description)

      return test({

        step: async (description, test) => {
          console.log('--' + description)
          await test()
        },
        dom: window,
        expect,
      })
    }
  }
}

export const test = await fn()

/**
 * @callback Test
 * @param {string} description
 * @param {TestCall} test
 */

/**
 * @callback TestCall
 * @param {TestAPI} callback
 */

/**
 * @typedef {object} TestAPI
 * @property {typeof import('expect').expect} expect
 * @property {(description: string, step: () => any) => any} step
 * @property {Window} dom
 */
