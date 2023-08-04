/* eslint-disable camelcase */
import { test } from '../../test-utils/unit/test.js'
import { getLanguageFromElement } from '../utils/algorithms/get-lang-from-element.util.js'
import { rootEventName, ElementLangObserver } from './element-lang-observer.util.js'

const html = String.raw

test('observeLangFromElement should trigger correctly when lang changed', async ({ expect, dom }) => {
  const { document } = dom
  // prepare
  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `
  const level1Div = document.querySelector('.level-1')
  const level4Div = document.querySelector('.level-4')

  // act
  const level4DivLang = getLanguageFromElement(level4Div)

  await new Promise((resolve) => {
    const observer = new ElementLangObserver(resolve)
    observer.observe(level4Div)
    level1Div.setAttribute('lang', 'es')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)

  // assert
  expect({ level4DivLang, level4DivNewLang }).toEqual({
    level4DivLang: 'pt',
    level4DivNewLang: 'es',
  })
})

test('observeLangFromElement should trigger another event on node root', async ({ expect, dom }) => {
  const { document } = dom

  // prepare
  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `

  const level3Div = document.querySelector('.level-3')
  const level4Div = document.querySelector('.level-4')
  const rootEvent = { triggered: false }

  // act
  const observer = new ElementLangObserver(() => {})
  observer.observe(level4Div)

  const level4DivLang = getLanguageFromElement(level4Div)
  await new Promise((resolve) => {
    document.addEventListener(rootEventName, () => {
      rootEvent.triggered = true
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'es')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)
  observer.unobserve(level4Div)

  // assert
  expect({ triggered: rootEvent.triggered, level4DivLang, level4DivNewLang }).toEqual({
    triggered: true,
    level4DivLang: 'pt',
    level4DivNewLang: 'es',
  })

})

test('observeLangFromElement should trigger multiple observing elements when ancestor lang changed', async ({ expect, dom }) => {
  // prepare
  const { document } = dom

  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3">
                    <div class="level-4">
                        <div class="level-5"></div>
                        <div class="level-5-2"></div>
                    </div>
                </div>
            </div>
        </div>
    `

  const level3Div = document.querySelector('.level-3')
  const level4Div = document.querySelector('.level-4')
  const level5Div = document.querySelector('.level-5')
  const level5_2Div = document.querySelector('.level-5-2')
  const triggeredEvents = {
    level3: false,
    level4: false,
    level5: false,
    level5_2: false,
  }

  // act

  new ElementLangObserver(() => { triggeredEvents.level3 = true }).observe(level3Div)
  new ElementLangObserver(() => { triggeredEvents.level5 = true }).observe(level5Div)
  new ElementLangObserver(() => { triggeredEvents.level5_2 = true }).observe(level5_2Div)

  await new Promise((resolve) => {
    document.addEventListener(rootEventName, () => {
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'es')
  })

  // assert
  expect(triggeredEvents).toEqual({
    level3: true,
    level4: false,
    level5: true,
    level5_2: true,
  })
})

test('observeLangFromElement should trigger when lang changed in the middle of the ascension tree', async ({ expect, dom }) => {
  // prepare
  const { document } = dom

  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `
  const level3Div = document.querySelector('.level-3')
  const level4Div = document.querySelector('.level-4')

  // act
  const level4DivLang = getLanguageFromElement(level4Div)
  await new Promise((resolve) => {
    new ElementLangObserver(resolve).observe(level4Div)
    level3Div.setAttribute('lang', 'es')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)

  // assert
  expect({ level4DivLang, level4DivNewLang }).toEqual({
    level4DivLang: 'pt',
    level4DivNewLang: 'es',
  })
})

test('observeLangFromElement should not trigger event when a new lang was added in the middle of the ascension tree, but is equal', async ({ expect, dom }) => {
  // prepare
  const { document } = dom

  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `
  const level3Div = document.querySelector('.level-3')
  const level4Div = document.querySelector('.level-4')
  const triggeredEvents = {
    rootEvent: false,
    level4DivLangEvent: false,
  }

  // act
  new ElementLangObserver(() => { triggeredEvents.level4DivLangEvent = true }).observe(level4Div)

  await new Promise((resolve) => {
    document.addEventListener(rootEventName, () => {
      triggeredEvents.rootEvent = true
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'pt')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)

  // assert
  expect({ ...triggeredEvents, level4DivNewLang }).toEqual({
    rootEvent: true,
    level4DivLangEvent: false,
    level4DivNewLang: 'pt',
  })
})

test('observeLangFromElement should trigger on shadowDom element when lang changed on lightdom', async ({ expect, dom }) => {
  // prepare
  const { document } = dom

  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `

  const level2ShadowDomHtml = html`
        <div class="shadow-level-1">
            <div class="shadow-level-2">
                <slot></slot>
            </div>
        </div>
    `

  const level1Div = document.querySelector('.level-1')
  const level2Div = document.querySelector('.level-2')
  // const level4Div = document.querySelector('.level-4')
  const shadowRoot = level2Div.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = level2ShadowDomHtml
  const shadowLevel2Div = shadowRoot.querySelector('.shadow-level-2')

  // act

  
  const shadowLevel2DivLang = getLanguageFromElement(shadowLevel2Div)
  await new Promise((resolve) => {
    new ElementLangObserver(resolve).observe(shadowLevel2Div)
    level1Div.setAttribute('lang', 'es')
  })
  const shadowLevel2DivNewLang = getLanguageFromElement(shadowLevel2Div)

  // assert
  expect({ shadowLevel2DivLang, shadowLevel2DivNewLang }).toEqual({
    shadowLevel2DivLang: 'pt',
    shadowLevel2DivNewLang: 'es',
  })
})
