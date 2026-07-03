<script setup>
import { ref } from 'vue'
import { initCppJs, Native } from './native/native.h'

const message = ref("compiling ...")
const threadResult = ref("...")

initCppJs({ useWorker: true }).then(async () => {
    message.value = "ready (worker + pthreads)";
    await Native.runOnThread();
    threadResult.value = await Native.getThreadResult();
});
</script>

<template>
  <p>Cpp.js module &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
  <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp;  {{threadResult}}</p>
</template>
