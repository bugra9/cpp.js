<script setup>
import { ref, onMounted } from 'vue'
import { initCppJs, Native } from './native/native.h'

const message = ref('compiling ...')

console.log('Component setup started')

onMounted(async () => {
  console.log('Component mounted, calling initCppJs...')
  try {
    await initCppJs()
    console.log('initCppJs completed, Native:', Native)
    message.value = Native.sample()
    console.log('Result:', message.value)
  } catch (e) {
    console.error('Error in initCppJs:', e)
    message.value = 'Error: ' + e.message
  }
})
</script>
<template>
  <div style="padding: 20px; font-size: 18px;">
    <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {{ message }}</p>
  </div>
</template>

