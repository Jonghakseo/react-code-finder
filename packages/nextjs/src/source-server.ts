import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let started = false

export function startSourceServer(options: { port: number; root: string }) {
  if (started) return
  started = true

  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${options.port}`)

    if (url.pathname !== '/source') {
      res.statusCode = 404
      res.end()
      return
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    const filePath = url.searchParams.get('file')
    const line = parseInt(url.searchParams.get('line') || '0', 10)
    const contextLines = parseInt(url.searchParams.get('context') || '15', 10)

    if (!filePath) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Missing file parameter' }))
      return
    }

    try {
      const absolutePath = resolve(options.root, filePath)
      if (!absolutePath.startsWith(options.root)) {
        res.statusCode = 403
        res.end(JSON.stringify({ error: 'Access denied' }))
        return
      }

      const content = readFileSync(absolutePath, 'utf-8')
      const lines = content.split('\n')
      const startLine = Math.max(0, line - contextLines - 1)
      const endLine = Math.min(lines.length, line + contextLines)
      const snippet = lines.slice(startLine, endLine)

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        file: filePath,
        startLine: startLine + 1,
        endLine,
        content: snippet.join('\n'),
      }))
    } catch {
      res.statusCode = 404
      res.end(JSON.stringify({ error: 'File not found' }))
    }
  })

  server.listen(options.port, () => {
    // silent start
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      started = false
    }
  })
}
