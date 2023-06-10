import {basicSetup, EditorView} from "codemirror"
import {json} from "@codemirror/lang-json"
import { basicDark } from 'cm6-theme-basic-dark'


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
            basicExamples[name] = JSON.parse(value)
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
