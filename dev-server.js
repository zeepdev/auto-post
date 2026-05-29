// Servidor de desenvolvimento: roda os mesmos handlers serverless localmente,
// pra testar /api antes do deploy na Vercel. Em produção, a Vercel usa os
// arquivos de api/ diretamente (este arquivo não vai pro deploy).
import 'dotenv/config'
import http from 'node:http'
import login from './api/login.js'
import generate from './api/generate.js'

const routes = {
  '/api/login': login,
  '/api/generate': generate,
}

const port = process.env.API_PORT || 3000

http
  .createServer(async (req, res) => {
    const path = req.url.split('?')[0]
    const handler = routes[path]
    if (!handler) {
      res.statusCode = 404
      res.end('Not found')
      return
    }
    try {
      await handler(req, res)
    } catch (e) {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: e.message }))
    }
  })
  .listen(port, () => console.log(`[api] dev em http://localhost:${port}`))
