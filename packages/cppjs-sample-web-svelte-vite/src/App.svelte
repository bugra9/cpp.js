<script>
    import { initCppJs } from './native/native.h';

    let message = 'compiling ...';
    initCppJs().then(({Native}) => {
        message = Native.sample();
    });
</script>

<main>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
</main>
