/* eslint-disable max-lines-per-function, sonarjs/cognitive-complexity */
/** @import {IncomingMessage, ServerResponse} from 'node:http' */
import https from 'node:https'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const CLIENT_WEBSOCKET_CODE = `
(() => {
    const source = new EventSource("/live-sse");
    source.addEventListener('message', e => {
      location.reload();
    });
})()
`.trim()

const projectPathURL = new URL('../../', import.meta.url)
const pathFromProject = (path) => new URL(path, projectPathURL).pathname
const rootPath = pathFromProject('.')

const options = await (async () => {
  const certFilePath = '.tmp/dev-server/cert.crt'
  const keyFilePath = '.tmp/dev-server/cert.key'

  if (!existsSync(certFilePath) || !existsSync(keyFilePath)) {
    const { default: mkcert } = await import('mkcert')
    await mkdir('.tmp/dev-server', { recursive: true })
    const ca = await mkcert.createCA({
      organization: 'Hello CA',
      countryCode: 'NP',
      state: 'Bagmati',
      locality: 'Kathmandu',
      validity: 365,
    })

    const cert = await mkcert.createCert({
      domains: ['127.0.0.1', 'localhost'],
      validity: 365,
      ca,
    })

    const result = {
      key: cert.key,
      cert: `${cert.cert}\n${ca.cert}`

    }

    await writeFile(certFilePath, result.cert)
    await writeFile(keyFilePath, result.key)
    return result
  }

  return {
    key: readFileSync(keyFilePath),
    cert: readFileSync(certFilePath),

  }
})()

/**
 *
 */
export function Server () {
  const sessions = new Set()

  /**
   * Use classic server-logic to serve a static file (e.g. default to 'index.html' etc)
   * @param {string} route - route
   * @param {string} reqUrl - route
   * @param {ServerResponse} res - response api
   * @returns {boolean} Whether or not the page exists and was served
   */
  function serveStaticPageIfExists (route, reqUrl, res) {
    // We don't care about performance for a dev server, so sync functions are fine.
    // If the route exists it's either the exact file we want or the path to a directory
    // in which case we'd serve up the 'index.html' file.
    if (existsSync(route)) {
      if (statSync(route).isDirectory()) {
        if (existsSync(path.join(route, 'index.html')) && !reqUrl.endsWith('/')) {
          res.setHeader('location', reqUrl + '/')
          res.writeHead(303)
          res.end()
          return true
        }
        return serveStaticPageIfExists(path.join(route, 'index.html'), reqUrl, res)
      } else if (statSync(route).isFile()) {
        /** @type {string|Buffer} */
        let file = readFileSync(route)
        if (route.endsWith('.html')) {
          // Inject the client-side websocket code.
          // This sounds fancier than it is; simply
          // append the script to the end since
          // browsers allow for tons of deviation
          // from *technically correct* HTML.
          file = `${file.toString()}\n\n<script>${CLIENT_WEBSOCKET_CODE}</script>`
        } else if (route.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript')
        }
        res.writeHead(200)
        res.end(file)
        return true
      }
    }
    return false
  }

  /**
   * General request handler and router
   * @param {IncomingMessage} req - incoming request
   * @param {ServerResponse} res - response api
   */
  function requestHandler (req, res) {
    const method = req.method.toLowerCase()
    if (method === 'get') {
      if (req.url === '/live-sse') {
        sseStart(res)
        return
      }

      // No need to ensure the route can't access other local files,
      // since this is for development only.
      const route = path.normalize(path.join(rootPath, req.url))
      if (serveStaticPageIfExists(route, req.url, res)) {
        return
      }
    }
    res.writeHead(404)
    res.end()
  }

  // SSE head
  /**
   * @param res
   */
  function sseStart (res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    sessions.add(res)
    res.addListener('close', () => sessions.delete(res))
  }

  const server = https.createServer(options, requestHandler)

  return {
    listen: (port) => server.listen(port),
    update: () => sessions.forEach(session => session.write('data: reload\n\n'))
  }
}
