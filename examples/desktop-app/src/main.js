import { initNative, Native } from './native/native.h';

const message = document.querySelector('#cppMessage');

initNative()
    .then(() => Native.sample())
    .then((result) => {
        message.textContent = result;
        // During development the page's console shows in the terminal that runs `pnpm dev`.
        console.log(`Matrix multiplier with c++ => ${result}`);
    })
    .catch((error) => {
        message.textContent = error.message;
        console.error(error);
    });
