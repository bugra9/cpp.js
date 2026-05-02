"use client";

import { useEffect, useState } from "react";
import { initCppJs, AllSymbols } from './native/native.h'

export default function Home() {
  const [message, setMessage] = useState('Loading...');
  const [threadResult, setThreadResult] = useState('waiting...');

  useEffect(() => {
    initCppJs({
      paths: {
        wasm: '/cpp.wasm',
        js: '/cpp.js',
      }
    }).then(async () => {
      // AllSymbols contains all exported symbols after initialization
      console.log('AllSymbols:', AllSymbols);
      console.log('AllSymbols.Native:', AllSymbols.Native);

      if (AllSymbols.Native) {
        const result = await AllSymbols.Native.sample();
        setMessage(result);
        await AllSymbols.Native.runOnThread();
        setTimeout(async () => {
          setThreadResult(await AllSymbols.Native.getThreadResult());
        }, 1000);
      } else {
        setMessage('Native class not found in AllSymbols');
      }
    }).catch((err: any) => {
      console.error('initCppJs error:', err);
      setMessage('Error: ' + err.message);
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <p>Result:{message}</p>
      <p>Thread Result:{threadResult}</p>
    </div>
  );
}
