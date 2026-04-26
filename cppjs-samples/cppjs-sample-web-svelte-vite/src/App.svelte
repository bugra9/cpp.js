<script>
    import { initCppJs, Native } from './native/native.h';

    let message = 'compiling ...';
    initCppJs().then(async () => {
        message = await Native.sample();
    });
</script>

<main>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
</main>
