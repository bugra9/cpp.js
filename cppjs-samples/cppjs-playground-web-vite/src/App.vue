<script setup>
import { ref } from 'vue'
import { initCppJs, Native } from './native/native.h'

const message = ref("compiling ...")

initCppJs().then(async () => {
    // await keeps this correct in both modes: the browser runtime defaults to
    // useWorker, where every binding returns a Promise.
    message.value = await Native.sample();
});
</script>

<template>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
</template>
