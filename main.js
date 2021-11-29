import * as THREE from "./node_modules/three/build/three.module.js";

import Stats from "./node_modules/three/examples/jsm/libs/stats.module.js";
import { GUI } from "./node_modules/three/examples/jsm/libs/lil-gui.module.min.js";

import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import * as BufferGeometryUtils from "./node_modules/three/examples/jsm/utils/BufferGeometryUtils.js";

let container, stats, gui, guiStatsEl;
let camera, controls, scene, renderer, material;

// gui

const Method = {
  INSTANCED: "INSTANCED",
  MERGED: "MERGED",
  NAIVE: "NAIVE",
};

const api = {
  method: Method.INSTANCED,
  count: 1000,
};

//

init();
initMesh();
animate();

//

/* ****************************************************************************
 * clean
 *
 *
 * removes all geometry and material so it can rebuild the mesh
 */
function clean() {
  const meshes = [];

  // Runs through each children inside the scene and applies the
  // below function.
  scene.traverse(function (object) {
    if (object.isMesh) meshes.push(object);
  });

  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    mesh.material.dispose();
    mesh.geometry.dispose();

    scene.remove(mesh);
  }
}

/* ****************************************************************************
 * randomizeMatrix
 *
 *
 * Sets the position, rotation, and scale of the mesh objects
 */
const randomizeMatrix = (function () {
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  return function (matrix) {
    position.x = Math.random() * 40 - 20;
    position.y = Math.random() * 40 - 20;
    position.z = Math.random() * 40 - 20;

    /* rotation.x = Math.random() * 2 * Math.PI;
    rotation.y = Math.random() * 2 * Math.PI;
    rotation.z = Math.random() * 2 * Math.PI; */

    quaternion.setFromEuler(rotation);

    scale.x = scale.y = scale.z = Math.random() * 1;

    matrix.compose(position, quaternion, scale);
  };
})();

/* ****************************************************************************
 * InitMesh
 *
 *
 * Initializes the mesh that we are going to use for the objects in scene
 */
function initMesh() {
  clean();

  // make instances
  new THREE.BufferGeometryLoader()
    .setPath("models/json/")
    .load("suzanne_buffergeometry.json", function (geometry) {
      material = new THREE.MeshNormalMaterial();

      geometry.computeVertexNormals();

      console.time(api.method + " (build)");

      switch (api.method) {
        case Method.INSTANCED:
          makeInstanced(geometry);
          break;

        case Method.MERGED:
          makeMerged(geometry);
          break;

        case Method.NAIVE:
          makeNaive(geometry);
          break;
      }

      console.timeEnd(api.method + " (build)");
    });
}

/* ****************************************************************************
 * makeInstanced
 *
 *
 * Sets the position, rotation, and scale of the mesh objects
 */
function makeInstanced(geometry) {
  const matrix = new THREE.Matrix4();
  const mesh = new THREE.InstancedMesh(geometry, material, api.count);

  for (let i = 0; i < api.count; i++) {
    randomizeMatrix(matrix);
    mesh.setMatrixAt(i, matrix);
  }

  scene.add(mesh);

  //

  const geometryByteLength = getGeometryByteLength(geometry);

  guiStatsEl.innerHTML = [
    "<i>GPU draw calls</i>: 1",
    "<i>GPU memory</i>: " + formatBytes(api.count * 16 + geometryByteLength, 2),
  ].join("<br/>");
}

function makeMerged(geometry) {
  const geometries = [];
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < api.count; i++) {
    randomizeMatrix(matrix);

    const instanceGeometry = geometry.clone();
    instanceGeometry.applyMatrix4(matrix);

    geometries.push(instanceGeometry);
  }

  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

  scene.add(new THREE.Mesh(mergedGeometry, material));

  //

  guiStatsEl.innerHTML = [
    "<i>GPU draw calls</i>: 1",
    "<i>GPU memory</i>: " +
      formatBytes(getGeometryByteLength(mergedGeometry), 2),
  ].join("<br/>");
}

function makeNaive(geometry) {
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < api.count; i++) {
    randomizeMatrix(matrix);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.applyMatrix4(matrix);

    scene.add(mesh);
  }

  //

  const geometryByteLength = getGeometryByteLength(geometry);

  guiStatsEl.innerHTML = [
    "<i>GPU draw calls</i>: " + api.count,
    "<i>GPU memory</i>: " + formatBytes(api.count * 16 + geometryByteLength, 2),
  ].join("<br/>");
}

function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // camera

  camera = new THREE.PerspectiveCamera(70, width / height, 1, 100);
  camera.position.z = 30;

  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.outputEncoding = THREE.sRGBEncoding;

  container = document.getElementById("container");
  container.appendChild(renderer.domElement);

  // scene

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  /* scene.background = new THREE.Color(0x000000); */

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;

  // stats

  stats = new Stats();
  container.appendChild(stats.dom);

  // gui

  gui = new GUI();
  gui.add(api, "method", Method).onChange(initMesh);
  gui.add(api, "count", 1, 10000).step(1).onChange(initMesh);

  const perfFolder = gui.addFolder("Performance");

  guiStatsEl = document.createElement("div");
  guiStatsEl.classList.add("gui-stats");

  perfFolder.$children.appendChild(guiStatsEl);
  perfFolder.open();

  // listeners

  window.addEventListener("resize", onWindowResize);

  Object.assign(window, { scene });
}

//

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  stats.update();

  render();
}

function render() {
  renderer.render(scene, camera);
}

//

function getGeometryByteLength(geometry) {
  let total = 0;

  if (geometry.index) total += geometry.index.array.byteLength;

  for (const name in geometry.attributes) {
    total += geometry.attributes[name].array.byteLength;
  }

  return total;
}

// Source: https://stackoverflow.com/a/18650828/1314762
function formatBytes(bytes, decimals) {
  if (bytes === 0) return "0 bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
// aaaaa

/* import * as THREE from "./node_modules/three/build/three.module.js";

import Stats from "./node_modules/three/examples/jsm/libs/stats.module.js";

let renderer, scene, camera, stats;
let pointclouds;
let raycaster;
let intersection = null;
let spheresIndex = 0;
let clock;
let toggle = 0;

const pointer = new THREE.Vector2();
const spheres = [];

const threshold = 0.1;
const pointSize = 0.05;
const width = 80;
const length = 160;
const rotateY = new THREE.Matrix4().makeRotationY(0.005);

init();
animate();

function generatePointCloudGeometry(color, width, length) {
  const geometry = new THREE.BufferGeometry();
  const numPoints = width * length;

  const positions = new Float32Array(numPoints * 3);
  const colors = new Float32Array(numPoints * 3);

  let k = 0;

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < length; j++) {
      const u = i / width;
      const v = j / length;
      const x = u - 0.5;
      const y = (Math.cos(u * Math.PI * 4) + Math.sin(v * Math.PI * 8)) / 20;
      const z = v - 0.5;

      positions[3 * k] = x;
      positions[3 * k + 1] = y;
      positions[3 * k + 2] = z;

      const intensity = (y + 0.1) * 5;
      colors[3 * k] = color.r * intensity;
      colors[3 * k + 1] = color.g * intensity;
      colors[3 * k + 2] = color.b * intensity;

      k++;
    }
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingBox();

  return geometry;
}

function generatePointcloud(color, width, length) {
  const geometry = generatePointCloudGeometry(color, width, length);
  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
  });

  return new THREE.Points(geometry, material);
}

function generateIndexedPointcloud(color, width, length) {
  const geometry = generatePointCloudGeometry(color, width, length);
  const numPoints = width * length;
  const indices = new Uint16Array(numPoints);

  let k = 0;

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < length; j++) {
      indices[k] = k;
      k++;
    }
  }

  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
  });

  return new THREE.Points(geometry, material);
}

function generateIndexedWithOffsetPointcloud(color, width, length) {
  const geometry = generatePointCloudGeometry(color, width, length);
  const numPoints = width * length;
  const indices = new Uint16Array(numPoints);

  let k = 0;

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < length; j++) {
      indices[k] = k;
      k++;
    }
  }

  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.addGroup(0, indices.length);

  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
  });

  return new THREE.Points(geometry, material);
}

function init() {
  const container = document.getElementById("container");

  scene = new THREE.Scene();

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(10, 10, 10);
  camera.lookAt(scene.position);
  camera.updateMatrix();

  //

  const pcBuffer = generatePointcloud(new THREE.Color(1, 0, 0), width, length);
  pcBuffer.scale.set(5, 10, 10);
  pcBuffer.position.set(-5, 0, 0);
  scene.add(pcBuffer);

  const pcIndexed = generateIndexedPointcloud(
    new THREE.Color(0, 1, 0),
    width,
    length
  );
  pcIndexed.scale.set(5, 10, 10);
  pcIndexed.position.set(0, 0, 0);
  scene.add(pcIndexed);

  const pcIndexedOffset = generateIndexedWithOffsetPointcloud(
    new THREE.Color(0, 1, 1),
    width,
    length
  );
  pcIndexedOffset.scale.set(5, 10, 10);
  pcIndexedOffset.position.set(5, 0, 0);
  scene.add(pcIndexedOffset);

  pointclouds = [pcBuffer, pcIndexed, pcIndexedOffset];

  //

  const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  for (let i = 0; i < 40; i++) {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    spheres.push(sphere);
  }

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  //

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = threshold;

  //

  stats = new Stats();
  container.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("pointermove", onPointerMove);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  camera.applyMatrix4(rotateY);
  camera.updateMatrixWorld();

  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(pointclouds, false);
  intersection = intersections.length > 0 ? intersections[0] : null;

  if (toggle > 0.02 && intersection !== null) {
    spheres[spheresIndex].position.copy(intersection.point);
    spheres[spheresIndex].scale.set(1, 1, 1);
    spheresIndex = (spheresIndex + 1) % spheres.length;

    toggle = 0;
  }

  for (let i = 0; i < spheres.length; i++) {
    const sphere = spheres[i];
    sphere.scale.multiplyScalar(0.98);
    sphere.scale.clampScalar(0.01, 1);
  }

  toggle += clock.getDelta();

  renderer.render(scene, camera);
}
 */
