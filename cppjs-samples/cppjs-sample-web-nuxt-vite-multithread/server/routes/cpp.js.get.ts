import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const cwd = process.cwd()

  // Check all possible locations for cpp.js
  const paths = [
    // If you want to put your build into public directory manually
    join(cwd, 'public/cpp.js'),

    // Dev mode: .cppjs/build directory
    join(cwd, '.cppjs/build'),
  ]

  for (const pathOrDir of paths) {
    if (existsSync(pathOrDir)) {
      // Check if it's a directory (dev mode .cppjs/build)
      if (pathOrDir.endsWith('.cppjs/build')) {
        const files = readdirSync(pathOrDir)
        const browserJsFile = files.find(f => f.endsWith('.browser.js'))
        if (browserJsFile) {
          setHeader(event, 'Content-Type', 'application/javascript')
          setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
          setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
          return readFileSync(join(pathOrDir, browserJsFile), 'utf-8')
        }
      } else {
        setHeader(event, 'Content-Type', 'application/javascript')
        setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
        setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
        return readFileSync(pathOrDir, 'utf-8')
      }
    }
  }

  throw createError({ statusCode: 404, message: `cpp.js not found. CWD: ${cwd}, searched: ${paths.join(', ')}` })
})
