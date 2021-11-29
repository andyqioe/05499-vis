import * as THREE from "./node_modules/three/build/three.module.js";

import Stats from "./node_modules/three/examples/jsm/libs/stats.module.js";
import { GUI } from "./node_modules/three/examples/jsm/libs/lil-gui.module.min.js";

import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer, stats, controls;
let guiStatsEl;

let mesh, sphere;
const amount = parseInt(window.location.search.substr(1)) || 10;
console.log(amount);
const count = Math.pow(amount, 3);
const dummy = new THREE.Object3D();
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const rotation = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();
const randScale = [1.075, 0.925];
const randLen = randScale.length;

const dummy_color = new THREE.Color(0xff0000);

const colorArray = [
  new THREE.Color(0xff0000),
  new THREE.Color(0xff8000),
  new THREE.Color(0xffff00),
  new THREE.Color(0xbff542),
  new THREE.Color(0x00ff00),
];
const colorArrLen = colorArray.length;
/* Color models the social reputation of the node
 * GREEN : "0, 255, 0"
 * RED : "255, 0, 0"
 *
 * red = bad
 * green = good
 *
 * Social reputation index: 1 - 100
 * 100/100 = 0, 255, 0
 * 75/100 = 127, 255, 0
 * 50/100 = 127, 127, 0
 * 25/100 = 185, 60
 * 0/100 = 255, 0, 0
 *
 */
init();
animate();

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
    position.z = Math.random() * 40 - 20;
    position.y = 0;

    /* position.y = Math.random() * 40 - 20; */

    /* rotation.x = Math.random() * 2 * Math.PI;
    rotation.y = Math.random() * 2 * Math.PI;
    rotation.z = Math.random() * 2 * Math.PI; */

    /* quaternion.setFromEuler(rotation); */

    scale.x = scale.y = scale.z = 1;
    matrix.compose(position, quaternion, scale);
  };
})();

/* ****************************************************************************
 * pickColor
 *
 *
 * converts social reputation to colorindex
 */
function pickColor() {
  let val = ((Math.random() * 100) / 100) * colorArrLen;
  return colorArray[Math.floor(val)];
}

/* ****************************************************************************
 * generateRandomIndex
 *
 *
 * generates a random scaling factor from index
 */
function generateRandomIndex() {
  let val = Math.random() * randLen;
  return randScale[Math.floor(val)];
}

/* ****************************************************************************
 * generateRandomIndex
 *
 *
 *
 */
const generateEdges = (function () {
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  return function (matrix) {
    return;
  };
})();
/* ****************************************************************************
 * Init
 *
 *
 * Initializes the camera, scene, and background
 */
function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(70, width / height, 1, 100);
  camera.position.z = 40;
  camera.position.y = 15;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 50, 200);
  /* scene.background = new THREE.Color(0xffffff); */

  const loader = new THREE.BufferGeometryLoader();
  loader.load("models/json/suzanne_buffergeometry.json", function (geometry) {
    geometry.computeVertexNormals();
    geometry.scale(0.5, 0.5, 0.5);

    /* const material = new THREE.MeshNormalMaterial(); */
    // check overdraw
    const material = new THREE.MeshBasicMaterial({
      /* color: 0xff0000, */
      opacity: 0.75,
      transparent: true,
    });
    material.needsUpdate = true;
    sphere = new THREE.IcosahedronGeometry(0.1, 10);
    mesh = new THREE.InstancedMesh(sphere, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame

    /* Initialize matrix */
    for (let i = 0; i < count; i++) {
      randomizeMatrix(matrix);
      mesh.setMatrixAt(i, matrix);
    }

    scene.add(mesh);

    // gui

    const gui = new GUI();
    gui.add(mesh, "count", 0, count);

    const perfFolder = gui.addFolder("Performance");

    guiStatsEl = document.createElement("div");
    guiStatsEl.classList.add("gui-stats");

    perfFolder.$children.appendChild(guiStatsEl);
    perfFolder.open();

    guiStatsEl.innerHTML = ["05499 data vis"].join("<br/>");
  });

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  /* stats = new Stats();
  document.body.appendChild(stats.dom); */

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
  /* stats.update(); */
}

function render() {
  const interval = Date.now() % 4;
  if (mesh && interval == 0) {
    /* const time = Date.now() * 0.001; */

    /* mesh.rotation.x = Math.sin(time / 12);
    mesh.rotation.y = Math.sin(time / 12); */

    let i = 0;
    const offset = (amount - 1) / 2;

    for (let x = 0; x < amount; x++) {
      for (let y = 0; y < amount; y++) {
        for (let z = 0; z < amount; z++) {
          mesh.getMatrixAt(i, matrix);
          /* dummy.position.set(offset - x, offset - y, offset - z);
          dummy.rotation.y =
            Math.sin(x / 4 + time) +
            Math.sin(y / 4 + time) +
            Math.sin(z / 4 + time);
          dummy.rotation.z = dummy.rotation.y * 2;
					
          dummy.updateMatrix(); */

          /* Decompose matrix, update positioning, and reupdate */
          let a = generateRandomIndex();

          matrix.decompose(position, quaternion, scale);
          scale.y *= a;
          scale.x *= a;
          scale.z *= a;
          matrix.compose(position, quaternion, scale);
          mesh.setColorAt(i, pickColor());
          mesh.setMatrixAt(i, matrix);
          i++;
        }
      }
    }
    mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }

  renderer.render(scene, camera);
}
