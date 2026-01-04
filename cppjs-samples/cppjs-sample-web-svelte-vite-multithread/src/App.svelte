<script>
    import { initCppJs, Native } from './native/native.h';

    let standardResult = $state('compiling ...');
    let threadResult = $state('...');

    initCppJs().then(() => {
        standardResult = Native.sample();
        
        // Run computation on a separate thread
        Native.runOnThread();
        
        // Poll for thread result after a short delay
        setTimeout(() => {
            threadResult = Native.getThreadResult();
        }, 1000);
    });
</script>

<main>
  <div class="logo">
    <img src={svelteLogo} alt="Svelte Logo" />
  </div>
  <p>Matrix multiplier with c++</p>
  <br />
  <p>Standard Result &nbsp;&nbsp;:&nbsp;&nbsp; {standardResult}</p>
  <br />
  <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp; {threadResult}</p>
</main>



