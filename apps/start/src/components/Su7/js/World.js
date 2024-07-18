import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

import OutLineClip from "./OutLineClip";

import bg from "../textures/t_env_light.hdr";

export default class World {
  constructor(selector, name) {
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
    // this.initLight()
    // this.addObjects()
    this.render();
  }

  initClipPlane() {}

  initReflector() {}

  initComposer() {}

  initGui() {
    this.gui = new GUI({ width: 260 });
    let folderLocal = this.gui.addFolder("Local Clipping");
    let propsLocal = {
      Enabled: true,
      Plane: 0,
    };
    this.propsLocal = propsLocal;
    folderLocal.add(propsLocal, "Enabled", (v) => {
      this.renderer.localClippingEnabled = v;
    });
    folderLocal
      .add(propsLocal, "Plane")
      .min(-13)
      .max(13)
      .step(0.001)
      .onChange((v) => {
        this.localPlane.constant = v;
        this.clipedge.planeMesh.position.x = v / this.scaleValue + 0.05;
      });
  }

  initPostGrocess(path) {
    this.initClipPlane();
    this.initReflector();
    this.initComposer();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("draco/gltf/");

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
    // this.renderer.render(this.scene, this.camera);
    this.stats.end();
    requestAnimationFrame(this.render.bind(this));
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
}
