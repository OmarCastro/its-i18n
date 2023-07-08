import { setStoreFromElement } from '../src/utils/store-map/store-map.js'
import { i18nTanslationStore } from '../src/utils/store/translation-store.js'
import '../src/utils/i18n-importer/implementation.js'
import('../src/custom-elements/i18n-container/i18n-container.element').then(({ default: I18nElement }) => customElements.define('i18n-container', I18nElement))

/** @typedef {import("../src/custom-elements/i18n-container/i18n-container.element").default} I18nElement */

function updateStore (exampleObject, exampleContainer) {
  const store = i18nTanslationStore()
  store.loadTranslations({
    location: window.location.href,
    languages: Object.fromEntries(Object.entries(exampleObject).map(([lang, translations]) => [lang, { translations }])),
  })
  console.log(store)
  setStoreFromElement(exampleContainer, store)
  /** @type {I18nElement | null}  */
  const node = exampleContainer.querySelector('i18n-container')
  node && node.updateNodes && node.updateNodes()
}

/**
 *
 * @param {Record<string, any>} exampleObject
 * @param {Element} editorElement
 * @returns
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
    const { createEditorView } = await import('./code-editor.lazy.js')
    const editorView = createEditorView({
      doc: editorElement.textContent || '',
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
      parent: editorElement,
    })

    editorElement.replaceChildren(editorView.dom)

    const { clientX, clientY } = event
    requestAnimationFrame(() => {
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
    if (event.target.matches('.lang-edit')) {
      const selector = event.target.getAttribute('data-bind-selector') || '[lang]'
      const node = element.querySelector(selector)
      node && node.setAttribute('lang', event.target.textContent)
    }
    if (event.target.matches('.data-i18n-edit')) {
      const selector = event.target.getAttribute('data-bind-selector') || '[data-i18n]'
      const node = element.querySelector(selector)
      node && node.setAttribute('data-i18n', event.target.textContent)
    }
  })
})

function reactElementNameChange (event) {
  const componentName = event.target.closest('.component-name-edit')
  if (componentName == null) { return false }
  const newText = componentName.textContent
  document.body.querySelectorAll('.component-name-ref').forEach(ref => { ref.textContent = newText })
  return true
}

document.body.addEventListener('input', (event) => { reactElementNameChange(event) })
