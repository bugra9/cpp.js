import { useState, useEffect } from 'react'
import './App.css'
import { initCppJs, Native } from './native/native.h'

function App() {
  const [standardResult, setStandardResult] = useState('compiling ...')
  const [threadResult, setThreadResult] = useState('...')

  useEffect(() => {
    initCppJs().then(async () => {
        setStandardResult(await Native.sample());

        // Run computation on a separate thread
        await Native.runOnThread();

        // Poll for thread result after a short delay
        setTimeout(async () => {
            setThreadResult(await Native.getThreadResult());
        }, 1000);
    });
  }, []);

  return (
    <>
      <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {standardResult}</p>
      <p>{threadResult}</p>
    </>
  )
}

export default App
