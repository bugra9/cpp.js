<script>
    import { initNative, Native } from './native/native.h';

    let message = 'compiling ...';
    initNative().then(async () => {
        message = await Native.sample();
    });
</script>

<main>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
</main>
