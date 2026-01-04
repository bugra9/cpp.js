<script setup>
import ExampleComponent from './example.vue'
</script>

<template>
  <div>
    <ClientOnly fallback-tag="div" fallback="Loading C++...">
      <ExampleComponent />
    </ClientOnly>
  </div>
</template>
