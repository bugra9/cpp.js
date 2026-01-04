import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const cwd = process.cwd()

  // Check all possible locations for the worker js
  const paths = [
    // If you want to put your build into public directory manually
    join(cwd, 'public/cpp.worker.js'),

    // Dev mode: .cppjs/build directory
    join(cwd, '.cppjs/build'),
  ]

  for (const pathOrDir of paths) {
    if (existsSync(pathOrDir)) {
      // Check if it's a directory (dev mode .cppjs/build)
      if (pathOrDir.endsWith('.cppjs/build')) {
        const files = readdirSync(pathOrDir)
        // Look for worker.js file
        const workerJsFile = files.find(f => f.endsWith('.worker.js'))
        if (workerJsFile) {
          setHeader(event, 'Content-Type', 'application/javascript')
          setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
          setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
          return readFileSync(join(pathOrDir, workerJsFile), 'utf-8')
        }
        // If no separate worker file, serve the main .js (Emscripten sometimes embeds worker code)
        const mainJsFile = files.find(f => f.endsWith('.js') && !f.includes('browser'))
        if (mainJsFile) {
          setHeader(event, 'Content-Type', 'application/javascript')
          setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
          setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
          return readFileSync(join(pathOrDir, mainJsFile), 'utf-8')
        }
      } else {
        setHeader(event, 'Content-Type', 'application/javascript')
        setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
        setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
        return readFileSync(pathOrDir, 'utf-8')
      }
    }
  }

  throw createError({ statusCode: 404, message: `cpp.worker.js not found. CWD: ${cwd}, searched: ${paths.join(', ')}` })
})
