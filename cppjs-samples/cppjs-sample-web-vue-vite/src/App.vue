<script setup>
import { ref } from 'vue'
import { init } from 'cpp.js'
import { Native } from './native/native.h'

const message = ref("compiling ...")

init().then(async () => {
  message.value = await Native.sample();
});
</script>

<template>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
</template>
