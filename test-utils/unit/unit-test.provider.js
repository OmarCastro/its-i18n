/**
 * this file adapts the test to their own environment
 * 
 * on Deno uses Deno API
 * on Node it uses playwright
 * on browser it uses a custom api
 */



/** @type {(test: Readonly<Test>) => any} */
let adapter;

const setTestAdapter = (newAdapter) => adapter = newAdapter

// thee 2 lines are to prevent esbuild to bundle the await imports
const importModule = (str) => import(str) 
let importStr;
const fn = async () => {
    if(globalThis.Deno != undefined){

        // init unit tests for deno

        importStr = 'https://deno.land/x/expect/mod.ts';
        const { expect } = await importModule(importStr);
        setTestAdapter(({description, test}) => {
            globalThis.Deno.test(`${description}`, async (t) => {
                await test({
                    step: t.step,
                    expect,
                    readFrom: async (url) => await globalThis.Deno.readTextFile(url.pathname)
                });
            }) 
            
        })
        return
    }
    if (globalThis.window == undefined) {

        // init unit tests for Playwright


        importStr = '@playwright/test';
        const { test, expect } = await importModule(importStr);
    
        setTestAdapter(({description, test: t}) => {

            test(description, async () => {
                await t({
                    step: test.step,
                    expect,
                    readFrom: async (url) => await importModule("node:fs/promises").then(({readFile}) => readFile(url.pathname))
                });
            }) 
        })
    
    } else {
        
        // init unit tests to be run in browser

        const { expect } = await import('expect');

        
        setTestAdapter(({description, test: t}) => {
            console.log("-"+description)

            return t({

                step: async (description, test) => {
                    console.log("--"+description)
                    await test()
                },
                expect,
                readFrom: async (url) => await fetch(url).then(req => req.text())
            });
        })
    }
}

await fn()

/**
 * @param {Test} test to adapt
 */
export const adapt = (test) => adapter(test)


/**
 * @callback TestCall
 * @param {TestAPI} test
 */

/**
 * @typedef {object} TestAPI
 * @property {typeof import('expect').expect} expect
 * @property {(description: string, step: () => any) => any} step
 * @property {(path: URL) => Promise<string>} readFrom
 */

/**
 * @typedef {object} Test
 * @property {string} description
 * @property {TestCall} test
 */



