import { test } from '../../../test-utils/unit/test.js'
import { document } from '../../../test-utils/unit/init-dom.js'
import { getStoresInfoFromElement, noStoresFound, setStoreFromElement, unsetStoreOnElement } from './store-map.ts'
import { i18nTanslationStore } from '../store/translation-store.js'

const html = String.raw

test('Given a simple document without any store set on any element, getStoresInfoFromElement must return a noMoreStoresFound result', ({ expect }) => {
  // prepare
  unsetStoreOnElement(document.documentElement)

  document.body.innerHTML = html`
      <div class="level-1" lang="pt">
          <div class="level-2">
              <div class="level-3" lang="en-US">
                  <div class="level-4"></div>
              </div>
          </div>
      </div>
  `

  const level1Div = document.querySelector('.level-1')!
  const level4Div = document.querySelector('.level-4')!

  // act
  const result1 = Array.from(getStoresInfoFromElement(level1Div))
  const result2 = Array.from(getStoresInfoFromElement(level4Div))

  //assert
  expect({ result1, result2 }).toEqual({
    result1: [noStoresFound],
    result2: [noStoresFound],
  })
})

test('Given a document with store set, getStoresInfoFromElement ', async ({ step, expect }) => {
  // prepare
  unsetStoreOnElement(document.documentElement)

  document.body.innerHTML = html`
          <div class="level-1">
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
          <div class="shadow-level-1-2"></div>
      `

  const level2SubShadowDomHtml = level2ShadowDomHtml
  const level3ClosedShadowDomHtml = html`
    <div class="shadow-level-3">
        <div class="shadow-level-4">
            <slot></slot>
        </div>
    </div>
`

  const level1Div = document.querySelector('.level-1')!
  const level2Div = document.querySelector('.level-2')!
  const level3Div = document.querySelector('.level-3')!
  const level4Div = document.querySelector('.level-4')!
  const shadowRootLv2 = level2Div.attachShadow({ mode: 'open' })
  shadowRootLv2.innerHTML = level2ShadowDomHtml

  const shadow2level1Div = shadowRootLv2.querySelector('.shadow-level-1')!
  const shadow2level2Div = shadowRootLv2.querySelector('.shadow-level-2')!
  const shadow2level12Div = shadowRootLv2.querySelector('.shadow-level-1-2')!

  const shadowRootLv3 = level3Div.attachShadow({ mode: 'closed' })
  shadowRootLv3.innerHTML = level3ClosedShadowDomHtml

  const shadow3level3Div = shadowRootLv3.querySelector('.shadow-level-3')!

  const subShadowRoot = shadow2level1Div.attachShadow({ mode: 'open' })
  subShadowRoot.innerHTML = level2SubShadowDomHtml

  const subshadow2level1Div = subShadowRoot.querySelector('.shadow-level-1')!
  const subshadow2level2Div = subShadowRoot.querySelector('.shadow-level-2')!

  const level1Store = i18nTanslationStore()
  level1Store.loadTranslations({
    location: 'http://example.com',
    languages: { 'en': { translations: { 'level1': 'level1' } } },
  })
  setStoreFromElement(level1Div, level1Store)

  const level2Store = i18nTanslationStore()
  level2Store.loadTranslations({
    location: 'http://example2.com',
    languages: { 'en': { translations: { 'level2': 'level2' } } },
  })

  setStoreFromElement(level2Div, level2Store)

  const level3Store = i18nTanslationStore()
  level3Store.loadTranslations({
    location: 'http://example3.com',
    languages: { 'en': { translations: { 'level3': 'level3' } } },
  })

  setStoreFromElement(level3Div, level3Store)

  const shadow2level1Store = i18nTanslationStore()
  shadow2level1Store.loadTranslations({
    location: 'http://example-shadow2.com',
    languages: { 'en': { translations: { 'level2': 'shadow1' } } },
  })

  setStoreFromElement(shadow2level1Div, shadow2level1Store)

  const shadow3level1Store = i18nTanslationStore()
  shadow3level1Store.loadTranslations({
    location: 'http://example-shadow3.com',
    languages: { 'en': { translations: { 'level3': 'shadow1' } } },
  })

  setStoreFromElement(shadow3level3Div, shadow3level1Store)

  // act
  const step1Result = Array.from(getStoresInfoFromElement(level1Div))
  const step2Result = Array.from(getStoresInfoFromElement(level4Div))
  const step3Result1 = Array.from(getStoresInfoFromElement(shadow2level1Div))
  const step3Result2 = Array.from(getStoresInfoFromElement(shadow2level2Div))
  const step3Result3 = Array.from(getStoresInfoFromElement(shadow2level12Div))
  const step3Result4 = Array.from(getStoresInfoFromElement(shadow3level3Div))
  const step3Result5 = Array.from(getStoresInfoFromElement(subshadow2level2Div))

  //assert
  const level1StoreResult = { store: level1Store, element: level1Div }
  const level2StoreResult = { store: level2Store, element: level2Div }
  const level3StoreResult = { store: level3Store, element: level3Div }
  const shadow2level1Div3StoreResult = { store: shadow2level1Store, element: shadow2level1Div }
  const shadow3level1Div3StoreResult = { store: shadow3level1Store, element: shadow3level3Div }

  await step('must return a self store, then a noMoreStoresFound if its located from self at topmost element woth store', async () => {
    await expect(step1Result).toEqual([level1StoreResult, noStoresFound])
  })

  await step('must return its store chain if there are parent elements with associated stores', async () => {
    await expect(step2Result).toEqual([level3StoreResult, level2StoreResult, level1StoreResult, noStoresFound])
  })

  await step('must return its store chain bypassing shadow dom', async () => {
    await expect(step2Result).toEqual([level3StoreResult, level2StoreResult, level1StoreResult, noStoresFound])
  })

  await step('must return its store chain bypassing shadow dom', async () => {
    await expect(step3Result1).toEqual([shadow2level1Div3StoreResult, level2StoreResult, level1StoreResult, noStoresFound])
    await expect(step3Result2).toEqual([shadow2level1Div3StoreResult, level2StoreResult, level1StoreResult, noStoresFound])
    await expect(step3Result3).toEqual([level2StoreResult, level1StoreResult, noStoresFound])
    await expect(step3Result4).toEqual([
      shadow3level1Div3StoreResult,
      level3StoreResult,
      level2StoreResult,
      level1StoreResult,
      noStoresFound,
    ])
    await expect(step3Result5).toEqual([shadow2level1Div3StoreResult, level2StoreResult, level1StoreResult, noStoresFound])
  })
})
