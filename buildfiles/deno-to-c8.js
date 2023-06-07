
const { readdirSync, readFileSync, statSync } = require('fs')
const { isAbsolute, resolve, extname } = require('path')



const tempDirectory = "coverage/deno"

const loadReports = () => {
    const reports = []
    for (const file of readdirSync(tempDirectory)) {
      try {

		const report = JSON.parse(readFileSync(
			resolve(tempDirectory, file),
			'utf8'
		  ))

		if(report.url.startsWith("file://")){
			reports.push(report)

		}
      } catch (err) {
        debuglog(`${err.stack}`)
      }
    }
    return reports
  }


  console.log(JSON.stringify({result: loadReports()}))

  
