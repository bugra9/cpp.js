import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const cwd = process.cwd()

  // Check all possible locations for cpp.wasm
  const paths = [
    // Preview/Production mode: public directory
    join(cwd, 'public/cpp.wasm'),
    // Dev mode: .cppjs/build directory
    join(cwd, '.cppjs/build'),
  ]

  for (const pathOrDir of paths) {
    if (existsSync(pathOrDir)) {
      // Check if it's a directory (dev mode .cppjs/build)
      if (pathOrDir.endsWith('.cppjs/build')) {
        const files = readdirSync(pathOrDir)
        // Find the main wasm file (not compiler test files)
        const wasmFile = files.find(f => f.endsWith('.wasm') && f.includes(cwd.split('/').pop() || ''))
          || files.find(f => f.endsWith('.wasm') )
        if (wasmFile) {
          const buffer = readFileSync(join(pathOrDir, wasmFile))
          setHeader(event, 'Content-Type', 'application/wasm')
          setHeader(event, 'Content-Length', buffer.length)
          setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
          setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
          return buffer
        }
      } else {
        const buffer = readFileSync(pathOrDir)
        setHeader(event, 'Content-Type', 'application/wasm')
        setHeader(event, 'Content-Length', buffer.length)
        setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
        setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
        return buffer
      }
    }
  }

  throw createError({ statusCode: 404, message: `cpp.wasm not found. CWD: ${cwd}` })
})
