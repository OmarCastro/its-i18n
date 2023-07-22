/* eslint-disable camelcase */
import { test } from '../../../test-utils/unit/test.js'
import { getLanguageFromElement } from './get-lang-from-element.util.js'
import { eventName, observeLangFromElement, rootEventName, unobserveLangFromElement } from './observe-lang-from-element.util.js'

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
  observeLangFromElement(level4Div)
  const level4DivLang = getLanguageFromElement(level4Div)
  await new Promise((resolve) => {
    level4Div.addEventListener(eventName, () => {
      resolve()
    }, { once: true })
    level1Div.setAttribute('lang', 'es')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)
  unobserveLangFromElement(level4Div)

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
  observeLangFromElement(level4Div)
  const level4DivLang = getLanguageFromElement(level4Div)
  await new Promise((resolve) => {
    document.addEventListener(rootEventName, () => {
      rootEvent.triggered = true
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'es')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)
  unobserveLangFromElement(level4Div)

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
  observeLangFromElement(level3Div)
  observeLangFromElement(level5Div)
  observeLangFromElement(level5_2Div)

  level3Div.addEventListener(eventName, () => {
    triggeredEvents.level3 = true
  }, { once: true })
  level4Div.addEventListener(eventName, () => {
    triggeredEvents.level4 = true
  }, { once: true })
  level5Div.addEventListener(eventName, () => {
    triggeredEvents.level5 = true
  }, { once: true })
  level5_2Div.addEventListener(eventName, () => {
    triggeredEvents.level5_2 = true
  }, { once: true })

  await new Promise((resolve) => {
    document.addEventListener(rootEventName, () => {
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'es')
  })

  unobserveLangFromElement(level3Div)
  unobserveLangFromElement(level5Div)
  unobserveLangFromElement(level5_2Div)

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
  observeLangFromElement(level4Div)
  const level4DivLang = getLanguageFromElement(level4Div)
  await new Promise((resolve) => {
    level4Div.addEventListener(eventName, () => {
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'es')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)
  unobserveLangFromElement(level4Div)

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
  observeLangFromElement(level4Div)
  level4Div.addEventListener(eventName, () => {
    triggeredEvents.level4DivLangEvent = true
  }, { once: true })

  await new Promise((resolve) => {
    document.addEventListener(rootEventName, () => {
      triggeredEvents.rootEvent = true
      resolve()
    }, { once: true })
    level3Div.setAttribute('lang', 'pt')
  })
  const level4DivNewLang = getLanguageFromElement(level4Div)
  unobserveLangFromElement(level4Div)

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
  observeLangFromElement(shadowLevel2Div)
  const shadowLevel2DivLang = getLanguageFromElement(shadowLevel2Div)
  await new Promise((resolve) => {
    shadowLevel2Div.addEventListener(eventName, () => {
      resolve()
    }, { once: true })
    level1Div.setAttribute('lang', 'es')
  })
  const shadowLevel2DivNewLang = getLanguageFromElement(shadowLevel2Div)
  unobserveLangFromElement(shadowLevel2Div)

  // assert
  expect({ shadowLevel2DivLang, shadowLevel2DivNewLang }).toEqual({
    shadowLevel2DivLang: 'pt',
    shadowLevel2DivNewLang: 'es',
  })
})
