import { makeBadge } from 'https://esm.sh/v124/badge-maker@3.3.1'

const projectPath = new URL('../',import.meta.url).pathname;

const readFile = (path) => globalThis.Deno.readTextFile(path)
const writeFile = (path, content) => globalThis.Deno.writeTextFile(path, content)

function badgeColor(pct){
  if(pct > 80){ return '#007700' }
  if(pct > 60){ return '#777700' }
  if(pct > 40){ return '#883300' }
  if(pct > 20){ return '#aa0000' }
  return 'red'
}

async function makeBadgeForCoverages(path){
	const json = await readFile(`${path}/coverage-summary.json`).then(str => JSON.parse(str))
	const svg = makeBadge({
	  label: 'coverage',
	  message: `${json.total.lines.pct}%`,
	  color: badgeColor(json.total.lines.pct),
	  style: 'for-the-badge',
	})
	
	await writeFile(`${path}/coverage-badge.svg`, svg);
  }


await makeBadgeForCoverages(`${projectPath}/coverage/c8`)
