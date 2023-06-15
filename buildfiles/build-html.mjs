import Prism from 'prismjs'
import { globSync } from 'glob'
import {minify} from 'html-minifier'
import {imageSize} from 'image-size'

//import { minifyHTML } from "https://deno.land/x/minifier/mod.ts";

const projectPath = new URL('../',import.meta.url).pathname;
const docsPath = new URL('../docs',import.meta.url).pathname;
const docsOutputPath = new URL('../build/docs',import.meta.url).pathname;

const fs = await import('fs')

const data = fs.readFileSync(`${docsPath}/${process.argv[2]}`, 'utf8');
const jsdom = await import("jsdom");
const dom = new jsdom.JSDOM(data, {
	url: import.meta.url
});
/** @type {Window} */
const window = dom.window;
const document = window.document;

globalThis.window = dom.window
globalThis.document = document


if(document == null){
    throw "error parsing document"
}
//@ts-ignore
await import('prismjs/plugins/keep-markup/prism-keep-markup.js')
//@ts-ignore
await import('prismjs/components/prism-json.js')

const exampleCode =  (strings, ...expr) => {

  let statement = strings[0];

  for(let i = 0; i < expr.length; i++){
    statement += String(expr[i]).replace(/</g, "&lt")
    .replaceAll("{{elementName}}", '<span class="component-name-ref keep-markup">i18n-container</span>')
    .replace(/{{([^¦]+)¦lang}}/g, '<span contenteditable="true" class="lang-edit">$1</span>')
    .replace(/{{([^¦]+)¦lang¦([^}]+)}}/g, '<span contenteditable="true" class="lang-edit" data-bind-selector="$2">$1</span>')
    .replace(/{{([^¦]+)¦data-i18n}}/, '<span contenteditable="true" class="data-i18n-edit">$1</span>')
    .replace(/{{([^¦]+)¦data-i18n¦([^}]+)}}/g, '<span contenteditable="true" class="data-i18n-edit" data-bind-selector="$2">$1</span>')
    statement += strings[i+1]
  }

  return statement
}

/**
 * @param {string} selector 
 * @returns 
 */
const queryAll = (selector) => [...document.documentElement.querySelectorAll(selector)]

queryAll("script.html-example").forEach(element => {
  const pre = document.createElement("pre")
  pre.innerHTML = exampleCode`<code class="language-markup keep-markup">${dedent(element.innerHTML)}</code>`
  element.replaceWith(pre)
})

queryAll("script.css-example").forEach(element => {
  const pre = document.createElement("pre")
  pre.innerHTML = exampleCode`<code class="language-css keep-markup">${dedent(element.innerHTML)}</code>`
  element.replaceWith(pre)
})

queryAll("script.json-example").forEach(element => {
	const pre = document.createElement("pre")
	pre.innerHTML = exampleCode`<code class="language-json keep-markup">${dedent(element.innerHTML)}</code>`
	element.replaceWith(pre)
  })

queryAll("code").forEach(element => {
  Prism.highlightElement(element, false)
})

queryAll("svg[ss:include]").forEach(element => {
  const ssInclude = element.getAttribute("ss:include")
  const svgText = fs.readFileSync(`${docsOutputPath}/${ssInclude}`, 'utf8');
  element.outerHTML = svgText
})


queryAll("img[ss:size]").forEach(element => {
  const imageSrc = element.getAttribute("src")
  const size = imageSize(`${docsOutputPath}/${imageSrc}`);
  element.removeAttribute("ss:size")
  element.setAttribute("width", `${size.width}`)
  element.setAttribute("height", `${size.height}`)
})

queryAll("img[ss:badge-attrs]").forEach(element => {
  const imageSrc = element.getAttribute("src")
  const svgText = fs.readFileSync(`${docsOutputPath}/${imageSrc}`, 'utf8');
  const div = document.createElement("div")
  div.innerHTML = svgText
  element.removeAttribute("ss:badge-attrs")
  const svg = div.querySelector("svg")
  if(!svg){ throw Error(`${docsOutputPath}/${imageSrc} is not a valid svg`) }

  const alt = svg.getAttribute("aria-label")
  if(alt){ element.setAttribute("alt", alt) }

  const title = svg.querySelector("title")?.textContent
  if(title){ element.setAttribute("title", title) }  
})

queryAll('link[href][rel="stylesheet"][ss:inline]').forEach(element => {
  const href = element.getAttribute("href")
  const cssText = fs.readFileSync(`${docsOutputPath}/${href}`, 'utf8');
  element.outerHTML = `<style>${cssText}</style>`
})


queryAll('link[href][ss:repeat-glob]').forEach(element => {
	const href = element.getAttribute("href")
	if(!href){ return }
	globSync(href, {cwd: docsOutputPath}).forEach(value => {
		const link = document.createElement("link")
		for (const {name, value} of element.attributes) {
			link.setAttribute(name, value)
		}
		link.removeAttribute("ss:repeat-glob")
		link.setAttribute("href", value)
		element.insertAdjacentElement("afterend", link)
	})
	element.remove()
  })

const minifiedHtml = minify("<!DOCTYPE html>" + document.documentElement?.outerHTML || "", {
  removeAttributeQuotes: true,
  useShortDoctype: true,
  collapseWhitespace: true
})

fs.writeFileSync(`${projectPath}/build/docs/${process.argv[2]}`, minifiedHtml);



function dedent (templateStrings, ...values) {
  const matches = [];
	const strings = typeof templateStrings === 'string' ? [ templateStrings ] : templateStrings.slice();
	strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, '');
	for (const string of strings) {
		const match = string.match(/\n[\t ]+/g)
        match && matches.push(...match);
	}
	if (matches.length) {
		const size = Math.min(...matches.map(value => value.length - 1));
		const pattern = new RegExp(`\n[\t ]{${size}}`, 'g');
		for (let i = 0; i < strings.length; i++) {
			strings[i] = strings[i].replace(pattern, '\n');
		}
	}

	strings[0] = strings[0].replace(/^\r?\n/, '');
	let string = strings[0];
	for (let i = 0; i < values.length; i++) {
		string += values[i] + strings[i + 1];
	}
	return string;
}
