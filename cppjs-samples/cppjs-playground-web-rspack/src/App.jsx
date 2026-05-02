import React from "react";
import { useState } from "react";
import { initCppJs, Native } from './native/native.h';
import "./App.css";

function App() {
	const [message, setMessage] = useState("compiling ...");
	const [threadResult, setThreadResult] = useState("...");

    initCppJs().then(() => {
        console.log('zzz');
        Native.runOnThread();
        const y = Native.ops_JSPI();
        console.log('zzz2');
        console.log(y);
        y.then(() => {
            console.log('aaa');
            setMessage(Native.sample());
        });
        setTimeout(() => {
            setThreadResult(Native.getThreadResult());
            // message.value = Native.sample();
        }, 5000);
    });

	return (
        <div className="App">
			<p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
            <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp;  {threadResult}</p>
		</div>
	);
}

export default App;
