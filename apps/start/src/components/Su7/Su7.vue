<script setup>
import { onMounted } from "vue";
import su7ModelMerge from "./model/su7blender/merge.gltf";
import World from "./js/World";

let su7world = {};

onMounted(() => {
  su7world = new World("su7World", "su7World");
  su7world.initPostGrocess(su7ModelMerge);
});
</script>

<template>
  <div id="su7World">
    <div class="windBtn">
      <button class="btn" @click="handleClick('wind')">风阻</button>
      <button class="btn" @click="handleClick('body')">车身</button>
    </div>
  </div>
</template>

<style scoped>
#su7World {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100vw;
}
.windBtn {
  position: absolute;
  top: 10px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn {
  width: 60px;
  height: 20px;
  padding: 0;
  border-color: #06576b;
  color: #ffffff;
  background: #06576b;
}
</style>
