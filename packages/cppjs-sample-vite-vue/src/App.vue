<script setup>
import { ref } from 'vue'
import Native from '../native/native.h'

Native().then(({Native}) => {;
  message.value = Native.sample();
});

defineProps({
  fluent: Object
})

const message = ref("")
</script>

<template>
  <p>Cpp message: {{message}}</p>
</template>
