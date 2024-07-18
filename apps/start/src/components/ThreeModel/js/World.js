import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export default class World {
  constructor(selector, name) {
    this.domId = selector;
    this.scene = new THREE.Scene();
    this.scene.name = name;
    this.scene.fog = new THREE.Fog(0x000000, 0.01);
    this.scene.position.y = -2.8;
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));

    this.container = document.getElementById(selector);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 50);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff, 1);

    this.container.appendChild(this.renderer.domElement);

    this.render();
  }

  addModel(path) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("draco/gltf/");

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.dracoLoader.dispose();

    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(10, 10, 10);
        this.scene.add(model);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error(error);
      }
    );
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
