<script setup>
import { onMounted } from "vue";
import World from "./js/World";
import Porsche from "./model/porsche/porsche.glb";

onMounted(() => {
  const threeModel = new World("three-model", "three-model");
  threeModel.addModel(Porsche);
});
</script>

<template>
  <div id="three-model"></div>
</template>

<style scoped>
#three-model {
  width: 100vw;
  height: 100vh;
}
</style>
