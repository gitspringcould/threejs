<script setup>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { onMounted } from "vue";

import Porsche from "./model/porsche/porsche.glb";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const loaders = new GLTFLoader();

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

onMounted(() => {
  document.getElementById("three-model").appendChild(renderer.domElement);
  loaders.load(
    Porsche,
    (gltf) => {
      const mesh = gltf.scene.children[0];
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      const offset = new THREE.Vector3();
      offset.subVectors(center, new THREE.Vector3(0, 0, 0));
      mesh.position.sub(offset);
      scene.add(gltf.scene);
      animate();
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error(error);
    }
  );
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
