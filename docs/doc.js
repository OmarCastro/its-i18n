import {basicSetup, EditorView} from "codemirror"
import {json} from "@codemirror/lang-json"
import { basicDark } from 'cm6-theme-basic-dark'
import I18nElement from "../src/custom-elements/i18n-container/i18n-container.element"
import {setStoreFromElement} from "../src/utils/store-map/store-map"

import { i18nTanslationStore  } from '../src/utils/store/translation-store.ts'
import '../src/utils/i18n-importer/implementation.ts'

customElements.define("i18n-container", I18nElement)



function applyExample(exampleObject, editorElement){
  const exampleContainer = editorElement.closest('.example')
  if(!exampleContainer){ return }

  const updateStore = () => {
    const store = i18nTanslationStore()
    store.loadTranslations({
      location: window.location.href,
      languages: Object.fromEntries(Object.entries(exampleObject).map(([lang, translations]) => [lang, {translations}]))
    })
    setStoreFromElement(exampleContainer, store)
    const node = exampleContainer.querySelector("i18n-container")
    if(node instanceof I18nElement){
      node.updateNodes()
    }
  }

  const editorView = new EditorView({
    doc: JSON.stringify(exampleObject.es, null, 2),
    extensions: [
      basicSetup,
      json(),
      basicDark,
      EditorView.updateListener.of(function(e) {

        const name = exampleContainer.querySelector('.example__tabs input[type="radio"]:checked ~ span[data-lang]')?.getAttribute("data-lang")
        if(name && Object.hasOwn(exampleObject, name)){
          try {
            const value = e.state.doc.toString();
            const newTranslations = JSON.parse(value)
            if(JSON.stringify(newTranslations) !== JSON.stringify(exampleObject[name])){
              exampleObject[name] = newTranslations
              updateStore()
            }
          } catch {
            //ignore
          }
        }
    })
    ],
    parent: editorElement
  })



  const updateCode = () => {
    const name = exampleContainer.querySelector('.example__tabs input[type="radio"]:checked ~ span[data-lang]')?.getAttribute("data-lang")
    if(name && Object.hasOwn(exampleObject, name)){
      editorView.dispatch({
        changes: {from: 0, to: editorView.state.doc.length, insert: JSON.stringify(exampleObject[name], null, 2)}
      })
      updateStore()
    }
  }

  exampleContainer.querySelectorAll('.example__tabs input[type="radio"]').forEach(el => el.addEventListener("change", updateCode))
  updateCode()
}


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

document.querySelectorAll('.example--basic .example__json .editor').forEach(element => applyExample(basicExamples, element))
document.querySelectorAll('.example--basic').forEach(element => element.addEventListener("input", (event) => {
  if(event.target.matches(".lang-edit")){
    const node = element.querySelector("i18n-container")
    if(node instanceof I18nElement){
      node.setAttribute("lang", event.target.textContent)
    }
  }
}))



const multiLangExamples = {
  en: {
    "hello mouse": "hello mouse",
    "I am portuguese": "I am portuguese",
    "I am spanish": "I am spanish",
    "I am english": "I am english",
  },
  es: {
    "hello mouse": "hola ratón",
    "I am portuguese": "soy portugués",
    "I am spanish": "soy español",
    "I am english": "soy inglés",
  },
  pt: {
    "hello mouse": "olá rato",
    "I am portuguese": "sou portugês",
    "I am spanish": "sou espanhol",
    "I am english": "sou inglês",
  }
}

document.querySelectorAll('.example--multi-lang .example__json .editor').forEach(element => applyExample(multiLangExamples, element))
document.querySelectorAll('.example--multi-lang').forEach(element => element.addEventListener("input", (event) => {
  if(!event.target.matches(".lang-edit")){ return }
  if(event.target.matches(".pt")){ element.querySelector(".portuguese")?.setAttribute("lang", event.target.textContent) }
  else if(event.target.matches(".es")){ element.querySelector(".spanish")?.setAttribute("lang", event.target.textContent) }
  else if(event.target.matches(".en")){ element.querySelector(".english")?.setAttribute("lang", event.target.textContent) }
}))


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
