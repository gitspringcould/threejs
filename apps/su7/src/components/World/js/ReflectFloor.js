import * as THREE from "three";
import tNormalMap0 from "../textures/t_floor_normal.webp";
import tRoughness from "../textures/t_floor_roughness.webp";
import tNoise from "../textures/noise.png";

export default class Reflector extends THREE.Mesh {
  constructor(geometry, options = []) {
    super(geometry);
    this.type = "Reflector";
    this.camera = new THREE.PerspectiveCamera();
    const scope = this;

    const color = options.color
      ? new THREE.color(options.color)
      : new THREE.Color(0xffffff);
    const textureWidth = options.textureWidth || 1024;
    const textureHeight = options.textureHeight || 1024;
    const clipBias = options.clipBias || 0;
    const scale = options.scale || 1;
    const shader = options.shader || Reflector.ReflectorShader;
    const textureLoader = new THREE.TextureLoader();
    const normalMap0 = options.normalMap0 || textureLoader.load(tNormalMap0);
    const roughness = options.roughness || textureLoader.load(tRoughness);
    const noise = options.noise || textureLoader.load(tNoise);
    const reflectorPlane = new THREE.Plane();
    const normal = new THREE.Vector3();
    const reflectorWorldPosition = new THREE.Vector3();
    const cameraWorldPosition = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4();
    const lookAtPosition = new THREE.Vector3(0, 0, -1);
    const clipPlane = new THREE.Vector4();
    const view = new THREE.Vector3();
    const target = new THREE.Vector3();
    const q = new THREE.Vector4();
    const textureMatrix = new THREE.Matrix4(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    );
    const virtualCamera = this.camera;
    const clock = new THREE.Clock();
    // internal components
    const renderTarget = new THREE.WebGLRenderTarget(
      textureWidth,
      textureHeight,
      {
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      }
    );
    renderTarget.depthBuffer = true;
    renderTarget.depthTexture = new THREE.DepthTexture();
    renderTarget.depthTexture.type = THREE.UnsignedShortType;

    // material

    this.material = new THREE.ShaderMaterial({
      name: shader.name,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        shader.uniforms,
      ]),
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      transparent: true,
      fog: true,
    });

    // maps

    normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
    roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
    Noise.wrapS = Noise.wrapT = THREE.RepeatWrapping;

    this.material.uniforms["tReflectionMap"].value = renderTarget.texture;
    this.material.uniforms["tNormalMap0"].value = normalMap0;
    this.material.uniforms["tRoughness"].value = roughness;
    this.material.uniforms["tNoise"].value = Noise;
    this.material.uniforms.tDepth.value = renderTarget.depthTexture;

    this.material.uniforms["color"].value = color;
    this.material.uniforms["textureMatrix"].value = textureMatrix;

    // inital values

    this.material.uniforms["config"].value.x = 0; //
    this.material.uniforms["config"].value.y = 0.75;
    this.material.uniforms["config"].value.w = scale; // scale
  }
}
