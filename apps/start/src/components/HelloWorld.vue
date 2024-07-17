<script setup>
import * as THREE from "three";
import { onMounted } from "vue";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

const animate = () => {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};

onMounted(() => {
  document.getElementById("world").appendChild(renderer.domElement);
  animate();
});
</script>

<template>
  <div id="world"></div>
</template>

<style scoped>
#world {
  width: 100vw;
  height: 100vh;
}
</style>
