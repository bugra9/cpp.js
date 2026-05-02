<script>
    import { initCppJs, Native } from './native/native.h';

    let standardResult = $state('compiling ...');
    let threadResult = $state('...');

    initCppJs().then(async () => {
        standardResult = await Native.sample();

        // Run computation on a separate thread
        await Native.runOnThread();

        // Poll for thread result after a short delay
        setTimeout(async () => {
            threadResult = await Native.getThreadResult();
        }, 1000);
    });
</script>

<main>
  <p>Matrix multiplier with c++</p>
  <br />
  <p>Standard Result &nbsp;&nbsp;:&nbsp;&nbsp; {standardResult}</p>
  <br />
  <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp; {threadResult}</p>
</main>



