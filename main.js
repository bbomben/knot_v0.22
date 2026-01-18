import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

/* ================= Scene & Renderer ================= */

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
const canvas = renderer.domElement;
canvas.style.width = '90%';
canvas.style.maxWidth = '1550px';
canvas.style.height = '70vh';
canvas.style.margin = '0 auto';
canvas.style.display = 'block';
canvas.style.border = '1px solid #333';
canvas.style.boxSizing = 'border-box';

document.body.appendChild(canvas);
renderer.setClearColor(0xffffff);

/* ================= Camera ================= */

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(700, 700, 700);

/* ================= Axis Helper (SAFE) ================= */

const axisScene = new THREE.Scene();

const axisCamera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0, 10);
axisCamera.position.set(0, 0, 5);
axisCamera.lookAt(0, 0, 0);

const axisHelper = new THREE.AxesHelper(2);
axisScene.add(axisHelper);

const AXIS_LENGTH = 2;

const xLabel = createAxisLabel('X', '#ff0000');
const yLabel = createAxisLabel('Y', '#00aa00');
const zLabel = createAxisLabel('Z', '#0000ff');

xLabel.position.set(AXIS_LENGTH + 0.3, 0, 0);
yLabel.position.set(0, AXIS_LENGTH + 0.3, 0);
zLabel.position.set(0, 0, AXIS_LENGTH + 0.3);

axisHelper.add(xLabel, yLabel, zLabel);

/* ================= Resize ================= */

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', resize);
requestAnimationFrame(resize);

/* ================= Controls ================= */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(1, 4, 4);

/* ================= Lighting ================= */

// Key light
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(600, 800, 400);
scene.add(keyLight);

// Fill light
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-400, 300, -600);
scene.add(fillLight);

// Ambient base
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

/* ================= Loader ================= */

const loader = new GLTFLoader();
let sourceModel = null;
let clones = [];

/* ================= Parameters ================= */

const params = {
  countX: 2,
  countY: 1,
  countZ: 2,
  spacingX: 254,
  spacingY: 196,
  spacingZ: 178,
  scale: 0.5
};

Object.defineProperty(params, 'totalModules', {
  get() {
    return params.countX * params.countY * params.countZ;
  }
});

/* ================= GUI ================= */

const gui = new GUI({ title: 'Array Controls', width: 300 });

function addCount(label, key, min, max) {

  // Read-only display
 const displayCtrl = gui.add(params, key)
    .name(`${label} (${min}–${max})`)
    .listen()
    .disable();
displayCtrl.domElement.classList.add('gui-count-display');

  // Decrement
  gui.add({
    dec: () => {
      params[key] = Math.max(min, params[key] - 1);
      createArray();
      updateButtons();
    }
  }, 'dec').name('−');

  // Increment (store controller reference)
  const incCtrl = gui.add({
    inc: () => {
      if (params[key] < max) {
        params[key]++;
        createArray();
      }
      updateButtons();
    }
  }, 'inc').name('+');

  // Attach metadata so we can update later
  incCtrl.__max = max;
  incCtrl.__key = key;

  incControllers.push(incCtrl);
}
const incControllers = [];

function updateButtons() {
  incControllers.forEach(ctrl => {
    const hitMax = params[ctrl.__key] >= ctrl.__max;
    const btn = ctrl.domElement.querySelector('button');

    if (hitMax) {
      btn.disabled = true;
      btn.textContent = 'Limit Reached';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.textContent = '+';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  });
}
updateButtons();

addCount('Count X', 'countX', 1, 5);
addCount('Count Y', 'countY', 1, 3);
addCount('Count Z', 'countZ', 1, 2);

/* -------- Reset Button (NEW) -------- */

const resetCtrl = gui.add({
  reset: () => {
    params.countX = 1;
    params.countY = 1;
    params.countZ = 1;
    createArray();
  }
}, 'reset').name('Reset');

// 👇 add this
resetCtrl.domElement.classList.add('gui-reset');

/* -------- Total Modules Display -------- */

const totalCtrl = gui.add({ t: 0 }, 't').name(`Total Modules: ${params.totalModules}`);
totalCtrl.domElement.style.pointerEvents = 'none';
totalCtrl.domElement.querySelector('input').style.display = 'none';

/* ================= Load Model ================= */

loader.load('module-sample.glb', gltf => {
  sourceModel = gltf.scene;

  sourceModel.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;

      const edges = new THREE.EdgesGeometry(obj.geometry, 1);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      obj.add(line);
    }
  });

  createArray();
});

/* ================= Array Logic ================= */

function clearArray() {
  clones.forEach(c => scene.remove(c));
  clones = [];
}

function createArray() {
  if (!sourceModel) return;

  clearArray();

  const { countX, countY, countZ, spacingX, spacingY, spacingZ } = params;

  const ox = (countX - 1) * spacingX * 0.5;
  const oy = (countY - 1) * spacingY * 0.5;
  const oz = (countZ - 1) * spacingZ * 0.5;

  for (let x = 0; x < countX; x++) {
    for (let y = 0; y < countY; y++) {
      for (let z = 0; z < countZ; z++) {
        const clone = sourceModel.clone(true);
        clone.scale.setScalar(params.scale);
        clone.position.set(
          x * spacingX - ox,
          y * spacingY - oy,
          z * spacingZ - oz
        );
        scene.add(clone);
        clones.push(clone);
      }
    }
  }

  totalCtrl.name(`Total Modules: ${params.totalModules}`);
}

/* ================= Axis Label Helper ================= */

function createAxisLabel(text, color) {
  const size = 128;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  c.width = c.height = size;

  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, size / 2, size / 2);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthTest: false
    })
  );

  sprite.scale.set(1.2, 1.2, 1.2);
  return sprite;
}

/* ================= Render ================= */

function renderAxisHelper() {
  const size = 120;
  const margin = 5;

  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.setScissorTest(true);

  renderer.setViewport(margin, margin, size, size);
  renderer.setScissor(margin, margin, size, size);
  renderer.render(axisScene, axisCamera);

  renderer.setScissorTest(false);
  renderer.autoClear = true;
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  renderer.clear();
  renderer.render(scene, camera);

  axisHelper.quaternion.copy(camera.quaternion);
  renderAxisHelper();
}

animate();

