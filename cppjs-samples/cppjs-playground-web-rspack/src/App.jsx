import React from "react";
import { useState } from "react";
import { initCppJs, Native } from './native/native.h';
import "./App.css";

function App() {
	const [message, setMessage] = useState("compiling ...");
	const [threadResult, setThreadResult] = useState("...");

    // No ops_JSPI here: this playground builds the mt (pthreads) browser
    // runtime, which cannot carry -sJSPI, so the JSPI demo binding is guarded
    // out of the build. The mt demo is the thread roundtrip below.
    initCppJs().then(() => {
        Native.runOnThread();
        setMessage("ready (pthreads)");
        setTimeout(() => {
            setThreadResult(Native.getThreadResult());
        }, 1000);
    });

	return (
        <div className="App">
			<p>Cpp.js module &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
            <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp;  {threadResult}</p>
		</div>
	);
}

export default App;
