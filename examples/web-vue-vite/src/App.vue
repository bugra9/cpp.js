<script setup>
import { ref } from 'vue'
import { initNative, Native } from './native/native.h'

const message = ref("compiling ...")

initNative().then(async () => {
  message.value = await Native.sample();
});
</script>

<template>
  <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
</template>
