import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import {
  BlendFunction,
  EffectPass,
  EffectComposer,
  SelectiveBloomEffect,
  RenderPass,
} from "postprocessing";

import OutLineClip from "./OutLineClip";
import ReflectFloorMesh from "./ReflectFloor";

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

  initClipPlane() {
    this.localPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    this.localPlane.constant = 13;
  }

  initReflector() {
    let geo = new THREE.PlaneGeometry(64, 64);
    let floor = new ReflectFloorMesh(geo, {
      textureWidth: 512,
      textureHeight: 512,
    });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.0001;
    this.scene.add(floor);
  }

  initComposer() {
    const effect = new SelectiveBloomEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.ADD,
      mipmapBlur: true,
      luminanceThreshold: 0,
      luminanceSmoothing: 0.8,
      opacity: 0.6,
      intensity: 3.0,
    });
    effect.inverted = true;
    effect.ignoreBackground = true;
    effect.selection.set([]);
    let material = new THREE.MeshBasicMaterial({ color: 0x3fffff });
    let geometry = new THREE.PlaneGeometry(5, 5, 10, 10);
    let plane = new THREE.Mesh(geometry, material);
    let plane2 = new THREE.Mesh(geometry, material);
    plane2.position.x = 6;
    plane2.position.y = 6;
    plane.position.y = 6;
    plane.scale.set(0.01, 0.01, 0.01);
    plane2.scale.set(0.01, 0.01, 0.01);
    // this.scene.add(plane, plane2)

    effect.selection.set([plane]);
    this.bloomEffect = effect;
    let composerBloom = new EffectComposer(this.renderer);
    // 添加renderPass
    composerBloom.addPass(new RenderPass(this.scene, this.camera));
    const effectPass = new EffectPass(this.camera, effect);
    composerBloom.addPass(effectPass);
    this.composer = composerBloom;
  }

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

  addModle(path) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("draco/gltf/");

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.dracoLoader.dispose();
    loader.load(path, (gltf) => {
      gltf.scene.scale.set(2, 2, 2);
      gltf.scene.name = "carScene";
      // remove light
      gltf.scene.remove(gltf.scene.children[1]);
      gltf.scene.traverse((item) => {
        if (item.isMesh) {
          item.material.clippingPlanes = [this.localPlane];
          item.stencilRef = 1;
          item.stencilWrite = true;
          item.stencilWriteMask = 0xff;
          item.stencilZPass = THREE.ReplaceStencilOp;
          item.geometry.computeVertexNormals();
          if (item.name === "平面") {
            item.visible = false;
          }
          if (item.name === "topLigt") {
            item.material.clippingPlanes = [];
            item.position.y = 6;
            item.scale.set(12, 0.04, 6);
            // item.visible = false
            item.material.emissiveIntensity = 0.52;
            // item.material.emissiveIntensity = 0
            this.topLight = item;
          }
        }
      });
      this.scene.add(gltf.scene);
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
