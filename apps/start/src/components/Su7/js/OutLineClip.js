import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshBVH, MeshBVHHelper, CONTAINED } from "three-mesh-bvh";
import * as THREE from "three";

export default class OutLineClip {
  params = {
    useBVH: true,
    helperDisplay: false,
    helperDepth: 10,

    wireframeDisplay: false,
    displayModel: false,

    animate: true,
    animation: "OSCILLATE",
    invert: false,
  };
  planeMesh;
  outlineLines;
  time = 0;
  initialClip = false;
  constructor(scaleValue, gltf, scene, gui, renderer) {
    this.clock = new THREE.Clock();
    this.tempVector = new THREE.Vector3();
    this.tempVector1 = new THREE.Vector3();
    this.tempVector2 = new THREE.Vector3();
    this.tempVector3 = new THREE.Vector3();
    this.tempLine = new THREE.Line3();
    this.inverseMatrix = new THREE.Matrix4();
    this.localPlane = new THREE.Plane();
    this.clippingPlanes = [new THREE.Plane()];
    renderer.localClippingEnabled = true;
    this.group = new THREE.Group();
    this.group.name = "outLineClip";
    scene.add(this.group);

    this.initClipPlane(this.group);

    let model = this.dealModel(scaleValue, gltf, this.group);

    const surfaceModel = model.clone();

    surfaceModel.material = new THREE.MeshStandardMaterial({
      depthFunc: THREE.EqualDepth,
    });
    surfaceModel.renderOrder = 1;

    let outlineLines = this.initLines(model);
    let frontSideModel = this.iniFrontModel(model);
    this.frontSideModel = frontSideModel;
    let backSideModel = this.iniBackModel();
    this.backSideModel = backSideModel;
    let { colliderBvh, colliderMesh, bvhHelper } = this.initBvh(model);
    this.colliderBvh = colliderBvh;
    this.colliderMesh = colliderMesh;
    this.bvhHelper = bvhHelper;
    this.outlineLines = outlineLines;

    this.group.add(colliderMesh, outlineLines);

    const box = new THREE.Box3();
    box.setFromObject(this.frontSideModel);
    box.getCenter(this.group.position).multiplyScalar(-1);
    this.group.updateMatrixWorld(true);

    if (gui) {
      this.initGui(gui);
    }
  }

  initClipPlane(scene) {
    this.planeMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ZeroStencilOp,
        stencilZFail: THREE.ZeroStencilOp,
        stencilZPass: THREE.ZeroStencilOp,
      })
    );
    this.planeMesh.scale.setScalar(1.5);
    this.planeMesh.material.color.set(0x80deea).convertLinearToSRGB();
    this.planeMesh.renderOrder = 2;
    scene.add(this.planeMesh);
  }

  dealModel(scaleValue, gltf, scene) {
    let mergedGeometry = new THREE.BufferGeometry();
    let geometries = [];

    gltf.scene.traverse((item) => {
      if (item.isMesh) {
        const instanceGeo = item.geometry.clone();
        instanceGeo.applyMatrix4(item.matrix);
        geometries.push(instanceGeo);
      }
    });

    if (geometries.length > 0) {
      mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    }

    let mergedMesh = new THREE.Mesh(
      mergedGeometry,
      new THREE.MeshBasicMaterial()
    );
    mergedMesh.scale.set(scaleValue, scaleValue, scaleValue);
    mergedMesh.position.y = -3.3;
    mergedMesh.quaternion.identity();
    mergedMesh.applyMatrix4(gltf.scene.matrix);
    mergedMesh.updateMatrixWorld(true);
    // scene.add(mergedMesh)

    return mergedMesh;
  }

  initLines(model) {
    const lineGeometry = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(
      new Float32Array(300000),
      3,
      false
    );
    linePosAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeometry.setAttribute("position", linePosAttr);
    let outlineLines = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial()
    );
    outlineLines.material.color.set(0x00acc1);
    outlineLines.frustumCulled = false;
    outlineLines.renderOrder = 3;

    outlineLines.scale.copy(model.scale);
    outlineLines.position.set(0, 0, 0);
    outlineLines.quaternion.identity();

    return outlineLines;
  }

  iniFrontModel(model) {
    const matSet = new Set();
    const materialMap = new Map();
    let frontSideModel = model;
    frontSideModel.updateMatrixWorld(true);
    frontSideModel.traverse((c) => {
      if (c.isMesh) {
        if (materialMap.has(c.material)) {
          c.material = materialMap.get(c.material);
          return;
        }
        matSet.add(c.material);
        const material = c.material.clone();
        material.color.set(0xffffff);
        material.roughness = 1.0;
        material.metalness = 0.0;
        material.side = THREE.FrontSide;
        material.stencilWrite = true;
        material.stencilFail = THREE.IncrementWrapStencilOp;
        material.stencilZFail = THREE.IncrementWrapStencilOp;
        material.stencilZPass = THREE.IncrementWrapStencilOp;
        material.clippingPlanes = this.clippingPlanes;

        materialMap.set(c.material, material);
        c.material = material;
      }
    });

    return frontSideModel;
  }

  iniBackModel() {
    const materialMap = new Map();
    let backSideModel = this.frontSideModel.clone();
    backSideModel.traverse((c) => {
      if (c.isMesh) {
        if (materialMap.has(c.material)) {
          c.material = materialMap.get(c.material);
          return;
        }

        const material = c.material.clone();
        material.color.set(0xffffff);
        material.roughness = 1.0;
        material.metalness = 0.0;
        material.colorWrite = false;
        material.depthWrite = false;
        material.side = THREE.BackSide;
        material.stencilWrite = true;
        material.stencilFail = THREE.DecrementWrapStencilOp;
        material.stencilZFail = THREE.DecrementWrapStencilOp;
        material.stencilZPass = THREE.DecrementWrapStencilOp;
        material.clippingPlanes = this.clippingPlanes;

        materialMap.set(c.material, material);
        c.material = material;
      }
    });

    return backSideModel;
  }

  initBvh(model) {
    let mergedGeometry = model.geometry;
    let colliderBvh = new MeshBVH(mergedGeometry, { maxLeafTris: 3 });
    mergedGeometry.boundsTree = colliderBvh;
    let colliderMesh = new THREE.Mesh(
      mergedGeometry,
      new THREE.MeshBasicMaterial({
        wireframe: false,
        transparent: true,
        opacity: 0.01,
        depthWrite: false,
      })
    );
    colliderMesh.renderOrder = 2;
    colliderMesh.position.copy(model.position);
    colliderMesh.rotation.copy(model.rotation);
    colliderMesh.visible = false;
    colliderMesh.scale.copy(model.scale);

    let bvhHelper = new MeshBVHHelper(
      colliderMesh,
      parseInt(this.params.helperDepth)
    );
    bvhHelper.depth = parseInt(this.params.helperDepth);
    bvhHelper.update();

    return { colliderBvh, colliderMesh, bvhHelper };
  }

  initGui() {
    let params = this.params;
    gui.add(params, "invert");
    gui.add(params, "animate");
    gui.add(params, "animation", ["SPIN", "OSCILLATE"]).onChange(() => {
      this.time = 0;
    });
    gui.add(params, "displayModel");
    gui.add(params, "useBVH");

    const helperFolder = gui.addFolder("helper");
    helperFolder.add(params, "wireframeDisplay");
    helperFolder.add(params, "helperDisplay");
    helperFolder.add(params, "helperDepth", 1, 20, 1).onChange((v) => {
      if (this.bvhHelper) {
        this.bvhHelper.depth = parseInt(v);
        this.bvhHelper.update();
      }
    });
    helperFolder.open();

    gui.open();
  }
}
