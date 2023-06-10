import {basicSetup, EditorView} from "codemirror"
import {json} from "@codemirror/lang-json"
import { basicDark } from 'cm6-theme-basic-dark'
import I18nElement from "../src/custom-elements/i18n-container/i18n-container.element"
import {setStoreFromElement} from "../src/utils/store-map/store-map"

import { i18nTanslationStore  } from '../src/utils/store/translation-store.ts'
import '../src/utils/i18n-importer/implementation.ts'

customElements.define("i18n-container", I18nElement)

const basicExamples = {
  en: {
    "hello world": "hello world",
    "hello mouse": "hello mouse" 
  },
  es: {
    "hello world": "hola mundo",
    "hello mouse": "hola ratón" 
  },
  pt: {
    "hello world": "olá mundo",
    "hello mouse": "olá rato" 
  }
}

document.querySelectorAll('.example--basic .example__json .editor').forEach(element => {
  const exampleContainer = element.closest('.example--basic')
  if(!exampleContainer){ return }
  

  exampleContainer.addEventListener("input", (event) => {
    if(event.target.matches(".lang-edit")){
      const node = exampleContainer.querySelector("i18n-container")
      if(node instanceof I18nElement){
        node.setAttribute("lang", event.target.textContent)
      }
    }
  })
  

  const updateStore = () => {
    const store = i18nTanslationStore()
    store.loadTranslations({
      location: window.location.href,
      languages: Object.fromEntries(Object.entries(basicExamples).map(([lang, translations]) => [lang, {translations}]))
    })
    setStoreFromElement(exampleContainer, store)
    const node = exampleContainer.querySelector("i18n-container")
    if(node instanceof I18nElement){
      node.updateNodes()
    }
  }



  const editorView = new EditorView({
    doc: JSON.stringify(basicExamples.es, null, 2),
    extensions: [
      basicSetup,
      json(),
      basicDark,
      EditorView.updateListener.of(function(e) {

        const name = exampleContainer.querySelector('input[name="example--basic"]:checked ~ span[data-lang]')?.getAttribute("data-lang")
        if(name && Object.hasOwn(basicExamples, name)){
          try {
            const value = e.state.doc.toString();
            const newTranslations = JSON.parse(value)
            if(JSON.stringify(newTranslations) !== JSON.stringify(basicExamples[name])){
              basicExamples[name] = newTranslations
              updateStore()
            }
          } catch {
            //ignore
          }
        }
    })
    ],
    parent: element
  })



  const updateCode = () => {
    const name = exampleContainer.querySelector('input[name="example--basic"]:checked ~ span[data-lang]')?.getAttribute("data-lang")
    if(name && Object.hasOwn(basicExamples, name)){
      editorView.dispatch({
        changes: {from: 0, to: editorView.state.doc.length, insert: JSON.stringify(basicExamples[name], null, 2)}
      })
      updateStore()
    }
  }

  exampleContainer.querySelectorAll('input[name="example--basic"]').forEach(el => el.addEventListener("change", updateCode))
  updateCode()
})


document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('pre code').forEach((el) => {
        const html = el.innerHTML
        const lines = html.split("\n")
        const minSpaces = lines.filter(line => line.trim() !== "").reduce((acc, line) => Math.min(line.search(/\S|$/), acc), Infinity)
        el.innerHTML = lines.map(line => line.substring(minSpaces)).join("\n").trim()
      });
});


function reactElementNameChange(event) {
  const componentName = event.target.closest(".component-name-edit")
  if(componentName == null){ return false }
  const newText = componentName.textContent
  document.body.querySelectorAll(".component-name-ref").forEach(ref => ref.textContent = newText)
  return true
}


document.body.addEventListener("input", (event) => {
  reactElementNameChange(event)
})
