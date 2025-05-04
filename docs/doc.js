import { setStoreFromElement } from '../src/utils/store-map/store-map.js'
import { i18nTranslationStore } from '../src/utils/store/translation-store.js'
import '../src/utils/i18n-importer/implementation.js'
import { translate } from '../src/js-api/api.js'
import { ElementLangObserver } from '../src/element-lang-observer/element-lang-observer.util.js'
/** @import {I18nContainerElement as I18nElement} from "../src/custom-elements/i18n-container/i18n-container.element.js" */

import('../src/custom-elements/i18n-container/i18n-container.element').then(({ default: I18nElement }) => customElements.define('i18n-container', I18nElement))

/**
 * @param {Record<string, any>} exampleObject  - example object data
 * @param {Element} exampleContainer -  - example element
 */
function updateStore (exampleObject, exampleContainer) {
  const store = i18nTranslationStore()
  store.loadTranslations({
    location: window.location.href,
    languages: Object.fromEntries(Object.entries(exampleObject).map(([lang, translations]) => [lang, { translations }])),
  })
  setStoreFromElement(exampleContainer, store)
  /** @type {I18nElement | null}  */
  const node = exampleContainer.querySelector('i18n-container')
  node && node.updateNodes && node.updateNodes()
  const canvas = exampleContainer.querySelector('canvas')
  canvas && paintHelloWorldOnCanvas(canvas)
}

/**
 * @param {Record<string, any>} exampleObject - example object data
 * @param {Element} codeView - element container
 * @returns {Promise<EditorView>} codemirror EditorView object
 */
async function transformCodeViewToEditor (exampleObject, codeView) {
  const exampleContainer = codeView.closest('.example')
  const lang = codeView.getAttribute('data-lang')
  const { createEditorView } = await import('./code-editor.lazy.js')
  const textContent = codeView.querySelector(':scope > pre')?.textContent ?? codeView.textContent ?? ''
  const editorView = createEditorView({
    doc: textContent,
    onChange: (e) => {
      try {
        const value = e.state.doc.toString()
        const newTranslations = JSON.parse(value)
        if (JSON.stringify(newTranslations) !== JSON.stringify(exampleObject[lang])) {
          exampleObject[lang] = newTranslations
          updateStore(exampleObject, exampleContainer)
        }
      } catch {
        // ignore
      }
    },
    parent: codeView,
  })

  codeView.replaceChildren(editorView.dom)
  return editorView
}

/**
 * @param {Record<string, any>} exampleObject - example object data
 * @param {Element} editorElement - editor element
 */
async function applyExample (exampleObject, editorElement) {
  const exampleContainer = editorElement.closest('.example')
  if (!exampleContainer) { return }

  const lang = editorElement.getAttribute('data-lang')
  if (!lang) { return }

  editorElement.addEventListener('click', async function eventListener (event) {
    const selection = getSelection()
    if (selection && selection.toString()) {
      return
    }
    editorElement.removeEventListener('click', eventListener)
    const editorView = await transformCodeViewToEditor(exampleObject, editorElement)
    const { clientX, clientY } = event
    queueMicrotask(() => {
      editorView.focus()
      const anchor = editorView.posAtCoords({ x: clientX, y: clientY })
      anchor != null && editorView.dispatch({ selection: { anchor } })
    })
  })
}

document.querySelectorAll('.example').forEach(element => {
  const exampleObj = {}

  console.log('.example %o', element)

  element.querySelectorAll('.example__json .editor').forEach(element => {
    const lang = element.getAttribute('data-lang')
    if (!lang) { return }
    exampleObj[lang] = JSON.parse(element.textContent || '')
    requestIdleCallback(() => applyExample(exampleObj, element))
  })
  updateStore(exampleObj, element)

  element.addEventListener('input', (event) => {
    const bindSelectorAttr = 'data-bind-selector'
    if (event.target.matches('.lang-edit')) {
      const selector = event.target.getAttribute(bindSelectorAttr) || '[lang]'
      const node = element.querySelector(selector)
      node && node.setAttribute('lang', event.target.textContent)
    }
    if (event.target.matches('.data-i18n-edit')) {
      const selector = event.target.getAttribute(bindSelectorAttr) || '[data-i18n]'
      const node = element.querySelector(selector)
      node && node.setAttribute('data-i18n', event.target.textContent)
    }
    if (event.target.matches('.data-i18n-text-edit')) {
      const selector = event.target.getAttribute(bindSelectorAttr) || '[data-i18n-text]'
      const node = element.querySelector(selector)
      node && node.setAttribute('data-i18n-text', event.target.textContent)
    }
    if (event.target.matches('.data-i18n--title-edit')) {
      const selector = event.target.getAttribute(bindSelectorAttr) || '[data-i18n--title]'
      const node = element.querySelector(selector)
      node && node.setAttribute('data-i18n--title', event.target.textContent)
    }
  })
})

/**
 * @param {Event} event - 'input' event object
 */
function reactElementNameChange (event) {
  const componentName = event.target.closest('.component-name-edit')
  if (componentName == null) { return }
  const newText = componentName.textContent
  document.body.querySelectorAll('.component-name-edit').forEach(ref => { if (componentName !== ref) ref.textContent = newText })
  document.body.querySelectorAll('.component-name-ref').forEach(ref => { ref.textContent = newText })
}

document.body.addEventListener('input', (event) => { reactElementNameChange(event) })

/**
 * Example canvas code on index.html
 * @param {HTMLCanvasElement} canvas - canvas element
 */
async function paintHelloWorldOnCanvas (canvas) {
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  const text = await translate('hello world', { element: canvas })
  context.font = '30px Arial'
  context.fillStyle = 'green'
  context.fillText(text, 10, 50)
}

const observer = new ElementLangObserver((records) => {
  for (const record of records) {
    if (record.target instanceof HTMLCanvasElement) {
      paintHelloWorldOnCanvas(record.target)
    }
  }
})

document.querySelectorAll('canvas.canvas-example').forEach(canvas => {
  paintHelloWorldOnCanvas(canvas)
  observer.observe(canvas)
})
