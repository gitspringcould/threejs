import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/addons/libs/stats.module.js";
import * as THREE from "three";
import bg from "../textures/t_env_light.hdr";
import ReflectFloorMesh from "./ReflectFloor";
import OutLineClip from "./OutLineClip";

import {
  BlendFunction,
  EffectPass,
  EffectComposer,
  SelectiveBloomEffect,
  RenderPass,
} from "postprocessing";

export default class World {
  constructor(selector, name = "world") {
    this.domId = selector;
    this.scene = new THREE.Scene();
    this.scene.name = name;
    this.scene.fog = new THREE.Fog(0x000000, 0.01);
    this.scene.position.y = -2.8;
    this.clock = new THREE.Clock();
    this.container = document.getElementById(selector);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1.0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.localClippingEnabled = true;
    this.stats = new Stats();
    this.container.appendChild(this.stats.dom);

    this.composer = "";
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      100
    );
    this.camera.position.set(0, 0, 22);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.update();
    this.time = 0;
    this.paused = false;
    this.gui = "";
    new RGBELoader().load(bg, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
    });

    this.setupResize();
    this.render();
  }

  initClipPlane() {
    this.localPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    this.localPlane.constant = 13;
  }

  initReflector() {
    const geo = new THREE.PlaneGeometry(64, 64);
    const floor = new ReflectFloorMesh(geo, {
      textureWidth: 512,
      textureHeight: 512,
    });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.0001;
    this.scene.add(floor);
  }

  initComposer() {
    const effect = new SelectiveBloomEffect();
  }

  initPostGrocess(path) {
    this.initClipPlane();
    this.initReflector();
    this.initComposer();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(path);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.dracoLoader.dispose();
    loader.load(path, (gltf) => {
      this.initGui();
      this.clipedge = new OutLineClip(
        this.scaleValue,
        gltf,
        this.scene,
        this.gui,
        this.renderer
      );
      this.clipedge.planeMesh.position.x = 13;
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.container = document.getElementById(this.domId);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (this.paused) {
      return;
    }
    this.stats.begin();
    if (this.clipedge) {
      this.clipedge.renderThing();
    }
    if (this.lineBloom) {
      this.lineBloom.renderThing();
    }
    if (this.windLineBloom) {
      this.windLineBloom.renderThing();
    }
    if (this.bodyMode) {
      this.bodyMode.renderThing();
    }
    this.composer && this.composer.render();
    this.stats.end();
    requestAnimationFrame(this.resize.bind(this));
  }
}
