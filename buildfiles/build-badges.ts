import { makeBadge } from 'https://esm.sh/badge-maker@3.3.1'
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const projectPath = new URL('../',import.meta.url).pathname;

function badgeColor(pct){
  if(pct > 80){ return '#007700' }
  if(pct > 60){ return '#777700' }
  if(pct > 40){ return '#883300' }
  if(pct > 20){ return '#aa0000' }
  return 'red'
}



const text = await globalThis.Deno.readTextFile(`${projectPath}/coverage/html/index.html`)
const document = new DOMParser().parseFromString(text ,"text/html") as Document;
const percentageEntries = document.body.querySelectorAll(".headerCovTableEntryHi")

for (const entry of percentageEntries ){
	const headerItems = Array.from(entry.parentElement?.querySelectorAll(".headerItem") ?? [])
	if(headerItems.some(headerItem => headerItem.innerHTML.includes("Lines"))){
		const percentage = Number.parseInt(entry.innerHTML.trim())
		const svg = makeBadge({
			label: 'coverage',
			message: `${percentage}%`,
			color: badgeColor(percentage),
			style: 'for-the-badge',
		})
		globalThis.Deno.writeTextFile(`${projectPath}/coverage/coverage-badge.svg`, svg)

	}
}
