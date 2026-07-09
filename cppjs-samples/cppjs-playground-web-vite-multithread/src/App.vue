<script setup>
import { ref } from 'vue'
import { initCppJs, Native } from './native/native.h'

const message = ref("compiling ...")
const threadResult = ref("...")
const instanceResult = ref("...")
const constructResult = ref("...")

initCppJs({ useWorker: true }).then(async (A) => {
    message.value = "ready (worker + pthreads)";
    await Native.runOnThread();
    threadResult.value = await Native.getThreadResult();

    // Instance methods through the worker proxy: statics skip embind's
    // `this` conversion, so only instance calls cover identity handling.
    // joinTags takes a plain array on purpose (vector coercion).
    const counter = await A.Counter.create(40);
    await counter.increment(1);
    await counter.increment(1);
    const described = await counter.describe("count");
    const joined = await counter.joinTags(["a", "b"]);
    instanceResult.value = `${described} ${joined}`;

    // `new` through the worker proxy (Comlink CONSTRUCT): embind's prototype
    // identity check used to reject this path, so cover it separately from
    // the static factory above.
    const constructed = await new A.Counter(20);
    await constructed.increment(1);
    constructResult.value = await constructed.describe("ctor");
});
</script>

<template>
  <p>Cpp.js module &nbsp;&nbsp;=&gt;&nbsp;&nbsp;  {{message}}</p>
  <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp;  {{threadResult}}</p>
  <p>Instance result &nbsp;&nbsp;:&nbsp;&nbsp;  {{instanceResult}}</p>
  <p>Construct result &nbsp;&nbsp;:&nbsp;&nbsp;  {{constructResult}}</p>
</template>
