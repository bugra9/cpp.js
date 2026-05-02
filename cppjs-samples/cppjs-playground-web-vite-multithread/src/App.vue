<script setup>
import { ref } from 'vue'
import { initCppJs, Native } from './native/native.h'

const message = ref("compiling ...")
const threadResult = ref("...")

initCppJs().then((A) => {
    console.log('zzz');
    Native.runOnThread();
    const y = Native.ops_JSPI();
    console.log('zzz2');
    console.log(y);
    y.then(() => {
        console.log('aaa');
        message.value = Native.sample();
    });
    setTimeout(() => {
        threadResult.value = Native.getThreadResult();
    }, 5000);
});
</script>

<template>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
  <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp;  {{threadResult}}</p>
</template>
