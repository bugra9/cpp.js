import React from "react";
import { useState } from "react";
import { initCppJs, Native } from './native/native.h';
import "./App.css";

function App() {
	const [message, setMessage] = useState("compiling ...");

    initCppJs().then(() => {;
        setMessage(Native.sample());
    });

	return (
        <div className="App">
			<p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
		</div>
	);
}

export default App;
