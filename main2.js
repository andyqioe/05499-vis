/* Imports */
import * as THREE from "./node_modules/three/build/three.module.js";
import Stats from "./node_modules/three/examples/jsm/libs/stats.module.js";
import { GUI } from "./node_modules/three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import data from "./data.js";

/* import * as data from "./asd.json"; */
/* import * as data from "./json/data.json"; */
/* import * as req from "./require.js"; */

/* Global variables */
let camera, scene, renderer, stats, controls;
let guiStatsEl;
let mesh, sphere;

const amount = parseInt(window.location.search.substr(1)) || 10;
/* const count = Math.pow(amount, 3); */
const count = 150
const dummy = new THREE.Object3D();
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();
const randScale = [1.075, 0.925];
const randLen = randScale.length;

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
const colorArray = [
  new THREE.Color(0xff0000),
  new THREE.Color(0xff8000),
  new THREE.Color(0xffff00),
  new THREE.Color(0xbff542),
  new THREE.Color(0x00ff00),
];
const colorArrLen = colorArray.length;
const matrixPoints = [];

/* Search parameters */
const radii = 25 ** 2;

/* json */
const payoffLen = 150;
const repLen = 150;

/* ****************************************************************************
 * ALGORITHM IMPLEMENTATION
 *
 *
 * Sets the position, rotation, and scale of the mesh objects
 *
 * ALGORITHM IMPLEMENTATION
 ******************************************************************************/

/* Initialize renderer */
restructureData();
init();
animate();

/* ****************************************************************************
 * restructureData
 *
 *
 * restructures data
 */
function restructureData() {
	console.log(data)
	for (let i = 0; i < data.length; i++) {
		data[i]["reputation"] = data[i]["reputation"].map(val => val + 0.5)
		data[i]["payoff"] = data[i]["payoff"].map(val => val + 1)
	}
	console.log(data)
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
    position.z = Math.random() * 40 - 20;
    position.y = Math.random() * 40 - 20;
    /* position.y = 0; */

    matrixPoints.push(position.x, position.y, position.z); /* key:value pair */

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
 * getDist()
 *
 *
 *
 */

function getDist(x1, y1, z1, x2, y2, z2) {
  /* var x1 = p1[0];
  var y1 = p1[1];
  var z1 = p1[2];

  var x2 = p2[0];
  var y2 = p2[1];
  var z2 = p2[2]; */

  console.log(
    Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
  );
  return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2);
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

  return function (i, j) {
    const points = [];
    const material = new THREE.LineDashedMaterial({
      color: 0x383838,
      linewidth: 0.001,
      scale: 1,
      dashSize: 1,
      gapSize: 0.5,
    });

    mesh.getMatrixAt(i, matrix);
    matrix.decompose(position, quaternion, scale);
    /* let p1 = (position.x, position.y, position.z); */
    points.push(new THREE.Vector3(position.x, position.y, position.z));

    /* let neighbors = matrixPoints.filter(
      (x, y, z) => getDist(position.x, position.y, position.z, x, y, z) < radii
    ); */

    /* console.log(neighbors.length);
    console.log("HI"); */

    mesh.getMatrixAt(j, matrix);
    matrix.decompose(position, quaternion, scale);
    points.push(new THREE.Vector3(position.x, position.y, position.z));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
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
  camera.position.z = 15;
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
      opacity: 0.75,
      transparent: true,
    });

    sphere = new THREE.IcosahedronGeometry(0.1, 5);
    mesh = new THREE.InstancedMesh(sphere, material, count);
    material.needsUpdate = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame

    /* Initialize matrix */
    for (let i = 0; i < count; i++) {
      randomizeMatrix(matrix);
      mesh.setMatrixAt(i, matrix);
			mesh.setColorAt(i, pickColor())
    }

    scene.add(mesh);
    /* generateEdges(0, 0); */
    /* Create edges */

		/* for (let i = 0; i < count; i++) {
      if (Math.random() < 0.5) {
        continue;
      }
      for (let j = 0; j < count; j++) {
        generateEdges(Math.floor(i), Math.floor(j));
      }
    } */

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
}

function render() {
  const interval = Date.now() % 4;
  if (mesh && interval == 0) {
    /* const time = Date.now() * 0.001; */

    /* mesh.rotation.x = Math.sin(time / 12);
    mesh.rotation.y = Math.sin(time / 12); */

    /* const offset = (amount - 1) / 2; */

		for (let i = 0; i < count; i++) {
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
		}
    mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }
  renderer.render(scene, camera);
}
