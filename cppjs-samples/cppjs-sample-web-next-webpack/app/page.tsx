"use client";

import { useEffect, useState } from "react";
import { initCppJs, AllSymbols } from './native/native.h'

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    initCppJs({
      paths: {
        wasm: '/cpp.wasm',
        js: '/cpp.js',
      }
    }).then(() => {
      // AllSymbols contains all exported symbols after initialization
      console.log('AllSymbols:', AllSymbols);
      console.log('AllSymbols.Native:', AllSymbols.Native);

      if (AllSymbols.Native) {
        const result = AllSymbols.Native.sample();
        setMessage(result);
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
      <p>{message}</p>
    </div>
  );
}
