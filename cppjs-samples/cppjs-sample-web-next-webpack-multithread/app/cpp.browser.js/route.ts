import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const cwd = process.cwd();

  // Check all possible locations for cpp.browser.js
  const paths = [
    // Production mode: .next directory (webpack output)
    join(cwd, '.next/cpp.browser.js'),
    // Dev mode: .cppjs/build directory
    join(cwd, '.cppjs/build'),
  ];

  for (const pathOrDir of paths) {
    if (existsSync(pathOrDir)) {
      // Check if it's a directory (dev mode .cppjs/build)
      if (pathOrDir.endsWith('.cppjs/build')) {
        const files = readdirSync(pathOrDir);
        const browserJsFile = files.find(f => f.endsWith('.browser.js'));
        if (browserJsFile) {
          const content = readFileSync(join(pathOrDir, browserJsFile), 'utf-8');
          return new NextResponse(content, {
            headers: {
              'Content-Type': 'application/javascript',
              'Cross-Origin-Opener-Policy': 'same-origin',
              'Cross-Origin-Embedder-Policy': 'require-corp',
            },
          });
        }
      } else {
        const content = readFileSync(pathOrDir, 'utf-8');
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
          },
        });
      }
    }
  }

  return new NextResponse(`cpp.browser.js not found. CWD: ${cwd}, searched: ${paths.join(', ')}`, {
    status: 404,
  });
}
