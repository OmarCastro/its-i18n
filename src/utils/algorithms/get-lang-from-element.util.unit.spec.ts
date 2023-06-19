import { window } from '../../../test-utils/unit/init-dom.ts'
import { getLanguageFromElement } from './get-lang-from-element.util.ts'
import { test } from '../../../test-utils/unit/test.js'

const html = String.raw

test('getLanguageFromElement should get correctly defined lang value', ({ expect }) => {
  const { document } = window

  // prepare
  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3" lang="en-US">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `
  const level1Div = document.querySelector('.level-1') as Element
  const level2Div = document.querySelector('.level-2') as Element
  const level3Div = document.querySelector('.level-3') as Element
  const level4Div = document.querySelector('.level-4') as Element

  // act
  const level1DivLang = getLanguageFromElement(level1Div)
  const level2DivLang = getLanguageFromElement(level2Div)
  const level3DivLang = getLanguageFromElement(level3Div)
  const level4DivLang = getLanguageFromElement(level4Div)

  // assert
  expect({ level1DivLang, level2DivLang, level3DivLang, level4DivLang }).toEqual({
    level1DivLang: 'pt',
    level2DivLang: 'pt',
    level3DivLang: 'en-US',
    level4DivLang: 'en-US',
  })
})

test('getLanguageFromElement should ignore incorrectly defined html lang value', ({ expect }) => {
  // prepare
  const { document } = window
  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3" lang="aaah! ngonyaaahh!">
                    <div class="level-4"></div>
                </div>
            </div>
        </div>
    `
  const level1Div = document.querySelector('.level-1') as Element
  const level2Div = document.querySelector('.level-2') as Element
  const level3Div = document.querySelector('.level-3') as Element
  const level4Div = document.querySelector('.level-4') as Element

  // act
  const level1DivLang = getLanguageFromElement(level1Div)
  const level2DivLang = getLanguageFromElement(level2Div)
  const level3DivLang = getLanguageFromElement(level3Div)
  const level4DivLang = getLanguageFromElement(level4Div)

  // assert
  expect({ level1DivLang, level2DivLang, level3DivLang, level4DivLang }).toEqual({
    level1DivLang: 'pt',
    level2DivLang: 'pt',
    level3DivLang: 'pt',
    level4DivLang: 'pt',
  })
})

test('getLanguageFromElement return navigation.language on undefined lang', ({ expect }) => {
  // prepare
  const { document } = window
  document.body.innerHTML = html`<div class="level-1"></div>`
  const navigatorLanguage = navigator.language
  const level1Div = document.querySelector('.level-1') as Element
  document.documentElement.removeAttribute('lang')

  //act
  const level1DivLang = getLanguageFromElement(level1Div)

  // clean
  document.documentElement.setAttribute('lang', 'en')

  //assert
  expect(level1DivLang).toEqual(navigatorLanguage)
})

test('getLanguageFromElement return navigation.language on invalid <html> lang', ({ expect }) => {
  // prepare
  const { document } = window

  document.body.innerHTML = html`<div class="level-1"></div>`
  const navigatorLanguage = navigator.language
  const level1Div = document.querySelector('.level-1') as Element
  document.documentElement.setAttribute('lang', 'yayay!!')

  // act
  const level1DivLang = getLanguageFromElement(level1Div)

  // clean
  document.documentElement.setAttribute('lang', 'en')

  // assert
  expect(level1DivLang).toEqual(navigatorLanguage)
})

test('getLanguageFromElement should get lang value on element inside shadow DOM', ({ expect }) => {
  // prepare
  const { document } = window

  document.body.innerHTML = html`
        <div class="level-1" lang="pt">
            <div class="level-2">
                <div class="level-3" lang="en-US">
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

  const level1Div = document.querySelector('.level-1') as Element
  const level2Div = document.querySelector('.level-2') as Element
  const level3Div = document.querySelector('.level-3') as Element
  const level4Div = document.querySelector('.level-4') as Element
  const shadowRoot = level2Div.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = level2ShadowDomHtml
  const shadowLevel2Div = shadowRoot.querySelector('.shadow-level-2') as Element

  // act
  const level1DivLang = getLanguageFromElement(level1Div)
  const level2DivLang = getLanguageFromElement(level2Div)
  const level3DivLang = getLanguageFromElement(level3Div)
  const level4DivLang = getLanguageFromElement(level4Div)
  const shadowLevel2DivLang = getLanguageFromElement(shadowLevel2Div)

  // assert
  expect({ level1DivLang, level2DivLang, level3DivLang, level4DivLang, shadowLevel2DivLang }).toEqual({
    level1DivLang: 'pt',
    level2DivLang: 'pt',
    level3DivLang: 'en-US',
    level4DivLang: 'en-US',
    shadowLevel2DivLang: 'pt',
  })
})

test('getLanguageFromElement should get lang from shadow DOM, if defined, on slotted element', ({ expect }) => {
  // prepare
  const { document } = window
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
        <div class="shadow-level-1" lang="pt-PT">
            <div class="shadow-level-2">
                <slot></slot>
            </div>
        </div>
    `

  const level1Div = document.querySelector('.level-1') as Element
  const level2Div = document.querySelector('.level-2') as Element
  const level3Div = document.querySelector('.level-3') as Element
  const level4Div = document.querySelector('.level-4') as Element
  const shadowRoot = level2Div.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = level2ShadowDomHtml

  // act
  const level1DivLang = getLanguageFromElement(level1Div)
  const level2DivLang = getLanguageFromElement(level2Div)
  const level3DivLang = getLanguageFromElement(level3Div)
  const level4DivLang = getLanguageFromElement(level4Div)

  // assert
  expect({ level1DivLang, level2DivLang, level3DivLang, level4DivLang }).toEqual({
    level1DivLang: 'pt',
    level2DivLang: 'pt',
    level3DivLang: 'pt-PT',
    level4DivLang: 'pt-PT',
  })
})

test('getLanguageFromElement should ignore invalid lang from shadow DOM, if defined, on slotted element', ({ expect }) => {
  // prepare
  const { document } = window

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
        <div class="shadow-level-1" lang="yayayayaa!!">
            <div class="shadow-level-2">
                <slot></slot>
            </div>
        </div>
    `

  const level1Div = document.querySelector('.level-1') as Element
  const level2Div = document.querySelector('.level-2') as Element
  const shadowRoot = level2Div.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = level2ShadowDomHtml

  const level3Div = document.querySelector('.level-3') as Element
  const level4Div = document.querySelector('.level-4') as Element

  // act
  const level1DivLang = getLanguageFromElement(level1Div)
  const level2DivLang = getLanguageFromElement(level2Div)
  const level3DivLang = getLanguageFromElement(level3Div)
  const level4DivLang = getLanguageFromElement(level4Div)

  //assert
  expect({ level1DivLang, level2DivLang, level3DivLang, level4DivLang }).toEqual({
    level1DivLang: 'pt',
    level2DivLang: 'pt',
    level3DivLang: 'pt',
    level4DivLang: 'pt',
  })
})
