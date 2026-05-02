import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const cwd = process.cwd();

  // Check all possible locations for cpp.wasm
  const paths = [
    // Production mode: .next directory (webpack output)
    join(cwd, '.next/cpp.wasm'),
    // Dev mode: .cppjs/build directory
    join(cwd, '.cppjs/build'),
  ];

  for (const pathOrDir of paths) {
    if (existsSync(pathOrDir)) {
      // Check if it's a directory (dev mode .cppjs/build)
      if (pathOrDir.endsWith('.cppjs/build')) {
        const files = readdirSync(pathOrDir);
        const wasmFile = files.find(f => f.endsWith('.wasm'));
        if (wasmFile) {
          const buffer = readFileSync(join(pathOrDir, wasmFile));
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/wasm',
              'Content-Length': buffer.length.toString(),
              'Cross-Origin-Opener-Policy': 'same-origin',
              'Cross-Origin-Embedder-Policy': 'require-corp',
            },
          });
        }
      } else {
        const buffer = readFileSync(pathOrDir);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/wasm',
            'Content-Length': buffer.length.toString(),
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
          },
        });
      }
    }
  }

  return new NextResponse(`cpp.wasm not found. CWD: ${cwd}`, {
    status: 404,
  });
}
