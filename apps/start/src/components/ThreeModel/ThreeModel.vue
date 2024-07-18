<script setup>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { onMounted } from "vue";
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
