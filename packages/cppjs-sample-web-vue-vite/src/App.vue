<script setup>
import { ref } from 'vue'
import { initCppJs, Native } from './native/native.h'

const message = ref("compiling ...")

initCppJs().then(() => {;
  message.value = Native.sample();
});
</script>

<template>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
</template>
