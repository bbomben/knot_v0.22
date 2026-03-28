import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

/* ================= Scene & Renderer ================= */

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
const canvas = renderer.domElement;
canvas.style.width = '100%';
canvas.style.display = 'block';
canvas.style.height = '70vh';
canvas.style.border = '1px solid #333';
canvas.style.borderRadius = '5px';
canvas.style.boxSizing = 'border-box';

/* ================= Canvas Wrapper ================= */

const viewerWrapper = document.createElement('div');
viewerWrapper.style.position = 'relative';
viewerWrapper.style.width = '200%';
viewerWrapper.style.maxWidth = '1550px';
viewerWrapper.style.margin = '0 auto';
viewerWrapper.style.boxSizing = 'border-box';
viewerWrapper.style.display = 'block';

viewerWrapper.appendChild(canvas);
document.body.appendChild(viewerWrapper);

/* ================= Loading Overlay ================= */

const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = `
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: #f0f0f0;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 20;
  border-radius: 5px;
`;

const loadingText = document.createElement('div');
loadingText.style.cssText = `
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  letter-spacing: 0.1em;
`;

loadingOverlay.appendChild(loadingText);
viewerWrapper.appendChild(loadingOverlay);

let dotInterval = null;

function showLoading() {
  loadingOverlay.style.display = 'flex';
  let dots = 0;
  loadingText.textContent = 'LOADING';
  dotInterval = setInterval(() => {
    dots = (dots % 3) + 1;
    loadingText.textContent = 'LOADING' + '.'.repeat(dots);
  }, 400);
}

function hideLoading() {
  clearInterval(dotInterval);
  dotInterval = null;
  loadingOverlay.style.display = 'none';
}

/* ================= Renderer Setup ================= */

renderer.setClearColor(0xffffff);

const DPR = Math.min(
  window.devicePixelRatio,
  window.innerWidth <= 430 ? 2 : 1.5
);
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;

/* ================= Camera ================= */

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000);
camera.position.set(700, 700, 700);

/* ================= Axis Helper ================= */

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

    // Keep ortho frustum in sync on resize
  if (activeCamera === orthoCamera) {
    const aspect = w / h;
    const halfH = (orthoCamera.top + Math.abs(orthoCamera.bottom)) / 2;
    orthoCamera.left   = -halfH * aspect;
    orthoCamera.right  =  halfH * aspect;
    orthoCamera.updateProjectionMatrix();
  }
  renderer.setSize(w, h, false);
}

window.addEventListener('resize', resize);
requestAnimationFrame(resize);

/* ================= Controls ================= */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(1, 4, 4);
controls.maxDistance = 3500;

const initialCameraPosition = camera.position.clone();
const initialTarget = controls.target.clone();

/* ================= Camera Reset Button ================= */

const cameraResetBtn = document.createElement('button');
cameraResetBtn.textContent = 'Reset View';
cameraResetBtn.style.position = 'absolute';
cameraResetBtn.style.top = '15px';
cameraResetBtn.style.left = '15px';
cameraResetBtn.style.padding = '8px 14px';
cameraResetBtn.style.background = '#ffffff';
cameraResetBtn.style.border = '1px solid #333';
cameraResetBtn.style.borderRadius = '6px';
cameraResetBtn.style.cursor = 'pointer';
cameraResetBtn.style.fontWeight = 'bold';
cameraResetBtn.style.zIndex = '10';
cameraResetBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
cameraResetBtn.classList.add('reset-btn');
viewerWrapper.appendChild(cameraResetBtn);

cameraResetBtn.addEventListener('click', () => {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialTarget);
  controls.update();
});

/* ================= View Toggle Button ================= */

const views = ['Perspective', 'Top', 'Front', 'Right'];
let currentViewIndex = 0;

const viewToggleBtn = document.createElement('button');
viewToggleBtn.textContent = 'Perspective';
viewToggleBtn.style.position = 'absolute';
viewToggleBtn.style.top = '52px'; // sits just below Reset View
viewToggleBtn.style.left = '15px';
viewToggleBtn.style.padding = '8px 14px';
viewToggleBtn.style.background = '#ffffff';
viewToggleBtn.style.border = '1px solid #333';
viewToggleBtn.style.borderRadius = '6px';
viewToggleBtn.style.cursor = 'pointer';
viewToggleBtn.style.fontWeight = 'bold';
viewToggleBtn.style.zIndex = '10';
viewToggleBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
viewToggleBtn.style.minWidth = '90px';
viewToggleBtn.classList.add('reset-btn');
viewerWrapper.appendChild(viewToggleBtn);

// Ortho camera shared instance
const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
let activeCamera = camera; // start with perspective

function setView(viewName) {
  const dist = 1200;

  // Sync ortho frustum to canvas aspect
  const aspect = canvas.clientWidth / canvas.clientHeight;

  if (viewName === 'Perspective') {
    activeCamera = camera;
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialTarget);
    controls.object = camera;
    controls.enableRotate = true;
    controls.update();

  } else {
    activeCamera = orthoCamera;
    controls.object = orthoCamera;
    controls.enableRotate = false; // lock rotation in elevation views

    // Compute scene center for orbit target
    if (instancedMeshes.length) {
      tmpBox.setFromObject(arrayGroup);
      tmpBox.getCenter(tmpCenter);
    } else {
      tmpCenter.set(0, 0, 0);
    }

    controls.target.copy(tmpCenter);

   if (viewName === 'Top') {
  // Look down from +Y
  orthoCamera.position.set(tmpCenter.x, tmpCenter.y + dist, tmpCenter.z);
  orthoCamera.up.set(0, 0, -1);

} else if (viewName === 'Front') {
  // Look from +Z
  orthoCamera.position.set(tmpCenter.x, tmpCenter.y, tmpCenter.z + dist);
  orthoCamera.up.set(0, 1, 0);

} else if (viewName === 'Right') {
  // Look from +X
  orthoCamera.position.set(tmpCenter.x + dist, tmpCenter.y, tmpCenter.z);
  orthoCamera.up.set(0, 1, 0);
}

    orthoCamera.lookAt(tmpCenter);

    // Scale frustum to show the scene at a reasonable size
    const halfH = dist * 0.5;
    orthoCamera.left   = -halfH * aspect;
    orthoCamera.right  =  halfH * aspect;
    orthoCamera.top    =  halfH;
    orthoCamera.bottom = -halfH;
    orthoCamera.near   = 0.1;
    orthoCamera.far    = 10000;
    orthoCamera.updateProjectionMatrix();

    controls.update();
  }
}

viewToggleBtn.addEventListener('click', () => {
  currentViewIndex = (currentViewIndex + 1) % views.length;
  const next = views[currentViewIndex];
  viewToggleBtn.textContent = views[(currentViewIndex + 1) % views.length]; // show NEXT view label
  setView(next);
});

/* ================= Lighting ================= */

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(600, 800, 400);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-400, 300, -600);
scene.add(fillLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.35));

/* ================= Grid ================= */

const grid = new THREE.GridHelper(5000, 100, 0x888888, 0xdddddd);
grid.position.y = 0;
scene.add(grid);

/* ================= Loader ================= */

const loader = new GLTFLoader();
let activeModelKey = 'moduleA';
let sourceModel = null;

let instancedMeshes = [];
let edgeLines = [];

/* ================= Parameters ================= */

const params = {
  countX: 2,
  countY: 2,
  countZ: 1,
  spacingX: 254,
  spacingY: 196,
  spacingZ: 178,
  scale: 0.5,
  showDimensions: true,
  units: 'Metric'
};

Object.defineProperty(params, 'totalModules', {
  get() { return params.countX * params.countY * params.countZ; }
});

/* ================= Model Registry ================= */

const MODEL_DEFS = {
  moduleA: {
    label: 'Module A',
    url: 'module-sample.glb',
    spacing: { x: 254, y: 196, z: 178 },
    scale: 0.5,
    layerNames: [
      'knots', 'knots_1', 'knots_2', 'knots_3',
      'knots_4', 'knots_5', 'knots_6', 'knots_7', 'knots_8'
    ]
  },
  moduleB: {
    label: 'Module B',
    url: 'module-square-sample.glb',
    spacing: { x: 188, y: 196, z: 178 },
    scale: 0.5,
    layerNames: [
      'knots', 'knots_1', 'knots_2', 'knots_3',
      'knots_4', 'knots_5', 'knots_6', 'knots_7', 'knots_8'
    ]
  },
  moduleC: {
    label: 'Module C',
    url: 'module-squat-sample.glb',
    spacing: { x: 303.3, y: 146.1, z: 178 },
    scale: 0.5,
    layerNames: [
      'knots', 'knots_1', 'knots_2', 'knots_3',
      'knots_4', 'knots_5', 'knots_6', 'knots_7', 'knots_8'
    ]
  },
};

/* ================= Material Cache ================= */

const materialCache = new Map();

function getSharedMaterial(colorHex) {
  if (!materialCache.has(colorHex)) {
    materialCache.set(colorHex, new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.6,
      metalness: 0.05
    }));
  }
  return materialCache.get(colorHex);
}

/* ================= Layer Material Control ================= */

const layerMaterialParams = {
  layerName: [
    'knots', 'knots_1', 'knots_2', 'knots_3',
    'knots_4', 'knots_5', 'knots_6', 'knots_7', 'knots_8'
  ],
  color: 'Light Grey'
};

const layerColors = {
  'Light Grey': 0xFFFFFF,
  'Red': 0xFF0000,
  'Black': 0x303234,
  'Yellow': 0xFFFF00,
};

const arrayGroup = new THREE.Group();
scene.add(arrayGroup);

/* ================= GUI ================= */

const gui = new GUI({ title: 'Array Controls', width: 300 });

const modelParams = { model: activeModelKey };

gui.add(
  modelParams,
  'model',
  Object.fromEntries(Object.entries(MODEL_DEFS).map(([k, v]) => [v.label, k]))
)
.name('Module Type')
.onChange(key => {
  activeModelKey = key;
  loadModel(key);
});

gui
  .add(layerMaterialParams, 'color', Object.keys(layerColors))
  .name('Knot Colour')
  .onChange(() => {
    updateInstancedMaterials();
    updateDimensions();
  });

gui
  .add(params, 'showDimensions')
  .name('Dimensions')
  .onChange(value => { dimensionGroup.visible = value; });

gui
  .add(params, 'units', ['Metric', 'Imperial'])
  .name('Units')
  .onChange(() => updateDimensions());

function addCount(label, key, min, max) {
  const displayCtrl = gui.add(params, key)
    .name(`${label} (${min}–${max})`)
    .listen()
    .disable();
  displayCtrl.domElement.classList.add('gui-count-display');

  gui.add({
    dec: () => {
      params[key] = Math.max(min, params[key] - 1);
      createArray();
      updateButtons();
    }
  }, 'dec').name('−');

  const incCtrl = gui.add({
    inc: () => {
      if (params[key] < max) {
        params[key]++;
        createArray();
      }
      updateButtons();
    }
  }, 'inc').name('+');

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

addCount('Count X', 'countX', 1, 10);
addCount('Count Y', 'countY', 1, 10);
addCount('Count Z', 'countZ', 1, 2);

const resetCtrl = gui.add({
  reset: () => {
    params.countX = 1;
    params.countY = 1;
    params.countZ = 1;
    createArray();
    updateButtons();
  }
}, 'reset').name('RESET');
resetCtrl.domElement.classList.add('gui-reset');

const totalCtrl = gui.add({ t: 0 }, 't').name(`Total Modules: ${params.totalModules}`);
totalCtrl.domElement.style.pointerEvents = 'none';
totalCtrl.domElement.querySelector('input').style.display = 'none';
totalCtrl.domElement.classList.add('gui-total-display');

/* ================= Draggable Divider (mobile only) ================= */

const divider = document.createElement('div');
divider.className = 'drag-divider';
divider.innerHTML = `<div class="drag-handle"></div>`;

const guiEl = document.querySelector('.lil-gui');
document.body.insertBefore(divider, guiEl);

let startY = null;
let currentCanvasH = window.innerHeight * 0.45;

divider.addEventListener('touchstart', e => {
  startY = e.touches[0].clientY;
  divider.style.background = '#ff0000';
}, { passive: true });

divider.addEventListener('touchmove', e => {
  if (startY === null) return;
  const dy = e.touches[0].clientY - startY;
  const newH = Math.min(Math.max(currentCanvasH + dy, 150), window.innerHeight - 200);
  canvas.style.setProperty('height', newH + 'px', 'important');
  resize();
}, { passive: true });

divider.addEventListener('touchend', e => {
  if (startY !== null) {
    const dy = e.changedTouches[0].clientY - startY;
    currentCanvasH = Math.min(Math.max(currentCanvasH + dy, 150), window.innerHeight - 200);
  }
  startY = null;
  divider.style.background = '#222';
});

/* ================= Model Loader ================= */

function loadModel(key) {
  const def = MODEL_DEFS[key];
  if (!def) return;

  fullClear();
  showLoading();

  // Let the browser paint the overlay before starting the load
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loader.load(def.url, gltf => {
        sourceModel = gltf.scene;
        params.spacingX = def.spacing.x;
        params.spacingY = def.spacing.y;
        params.spacingZ = def.spacing.z;
        params.scale = def.scale;
        layerMaterialParams.layerName = def.layerNames;
        setTimeout(() => {
          hideLoading();
          createArray();
        }, 150);
      });
    });
  });
}
loadModel(activeModelKey);

/* ================= Array Logic ================= */

function fullClear() {
  instancedMeshes.forEach(im => {
    arrayGroup.remove(im);
    im.geometry.dispose();
  });
  instancedMeshes = [];

  edgeLines.forEach(el => {
    arrayGroup.remove(el);
    el.geometry.dispose();
  });
  edgeLines = [];
}

function clearEdges() {
  edgeLines.forEach(el => {
    arrayGroup.remove(el);
    el.geometry.dispose();
  });
  edgeLines = [];
}

function createArray() {
  if (!sourceModel) return;

  const { countX, countY, countZ, spacingX, spacingY, spacingZ, scale } = params;
  const count = countX * countY * countZ;

  const ox = (countX - 1) * spacingX * 0.5;
  const oz = (countZ - 1) * spacingZ * 0.5;

  const positions = [];
  for (let x = 0; x < countX; x++) {
    for (let y = 0; y < countY; y++) {
      for (let z = 0; z < countZ; z++) {
        positions.push(new THREE.Vector3(
          x * spacingX - ox,
          y * spacingY,
          z * spacingZ - oz
        ));
      }
    }
  }

  const dummy = new THREE.Object3D();
  const knotColorHex = layerColors[layerMaterialParams.color];
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

  const meshes = [];
  sourceModel.traverse(obj => { if (obj.isMesh) meshes.push(obj); });

  const canReuseInstances = instancedMeshes.length === meshes.length &&
    instancedMeshes[0]?.count === count;

  if (!canReuseInstances) {
    instancedMeshes.forEach(im => {
      arrayGroup.remove(im);
      im.geometry.dispose();
    });
    instancedMeshes = [];

    meshes.forEach(mesh => {
      const isKnot = layerMaterialParams.layerName.includes(mesh.name) ||
        layerMaterialParams.layerName.includes(mesh.parent?.name);
      const colorHex = isKnot ? knotColorHex : (
        mesh.material?.color ? mesh.material.color.getHex() : 0xcccccc
      );
      const im = new THREE.InstancedMesh(mesh.geometry, getSharedMaterial(colorHex), count);
      im.castShadow = true;
      arrayGroup.add(im);
      instancedMeshes.push(im);
    });
  }

  // Update matrices — fast path
  meshes.forEach((mesh, mi) => {
    const im = instancedMeshes[mi];
    im.count = count;
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.scale.setScalar(scale);
      dummy.rotation.copy(mesh.rotation);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });

  // Rebuild edge lines
  clearEdges();
  meshes.forEach(mesh => {
    const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 1);
    const posArray = edgesGeom.attributes.position.array;
    const allEdgePoints = [];

    positions.forEach(pos => {
      for (let i = 0; i < posArray.length; i += 3) {
        const v = new THREE.Vector3(posArray[i], posArray[i + 1], posArray[i + 2]);
        mesh.localToWorld(v);
        v.multiplyScalar(scale);
        v.add(pos);
        allEdgePoints.push(v);
      }
    });

    const mergedGeom = new THREE.BufferGeometry().setFromPoints(allEdgePoints);
    const line = new THREE.LineSegments(mergedGeom, edgeMaterial);
    arrayGroup.add(line);
    edgeLines.push(line);
    edgesGeom.dispose();
  });

  totalCtrl.name(`Total Modules: ${params.totalModules}`);
  updateDimensions();
}

function updateInstancedMaterials() {
  if (!sourceModel) return;
  const knotColorHex = layerColors[layerMaterialParams.color];
  const meshes = [];
  sourceModel.traverse(obj => { if (obj.isMesh) meshes.push(obj); });

  instancedMeshes.forEach((im, i) => {
    const mesh = meshes[i];
    if (!mesh) return;
    const isKnot = layerMaterialParams.layerName.includes(mesh.name) ||
      layerMaterialParams.layerName.includes(mesh.parent?.name);
    if (isKnot) {
      im.material = getSharedMaterial(knotColorHex);
    }
  });
}

/* ================= Dimension Helpers ================= */

const dimensionGroup = new THREE.Group();
scene.add(dimensionGroup);

const tmpBox = new THREE.Box3();
const tmpSize = new THREE.Vector3();
const tmpCenter = new THREE.Vector3();

let currentGap = 100;

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

function createDimensionLabel(text) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  c.width = 256;
  c.height = 64;
  ctx.font = '50px Arial';
  ctx.fillStyle = '#030303';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    })
  );
  sprite.scale.set(120, 30, 1);
  return sprite;
}

function drawDimension(start, end, labelText) {
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const gap = currentGap;
  const tickSize = currentGap * 0.4;
  const mid = start.clone().lerp(end, 0.5);
  const gapStart = mid.clone().addScaledVector(direction, -gap / 2);
  const gapEnd = mid.clone().addScaledVector(direction, gap / 2);

  const mat = new THREE.LineBasicMaterial({ color: 0x333333 });

  dimensionGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start, gapStart]), mat
  ));
  dimensionGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([gapEnd, end]), mat
  ));

  function drawTick(point, dir) {
    let up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(dir.y) > 0.99) up.set(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
    dimensionGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        point.clone().addScaledVector(perp, tickSize / 2),
        point.clone().addScaledVector(perp, -tickSize / 2)
      ]), mat
    ));
  }

  drawTick(start, direction);
  drawTick(end, direction);

  const label = createDimensionLabel(labelText);
  label.position.copy(mid);
  dimensionGroup.add(label);
}

function formatDimension(mmValue) {
  if (params.units === 'Metric') {
    return `${mmValue.toFixed(0)} mm`;
  }
  const totalInches = mmValue / 25.4;
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const quarterInches = Math.round(inches * 4) / 4;
  const wholeInches = Math.floor(quarterInches);
  const fraction = quarterInches - wholeInches;
  const fractionMap = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' };
  const fractionText = fractionMap[fraction] || '';
  let finalFeet = feet;
  let finalInches = wholeInches;
  if (wholeInches === 12) { finalFeet += 1; finalInches = 0; }
  return fractionText
    ? `${finalFeet}'-${finalInches} ${fractionText}"`
    : `${finalFeet}'-${finalInches}"`;
}

function updateDimensions() {
  while (dimensionGroup.children.length) {
    const obj = dimensionGroup.children.pop();
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }

  if (!instancedMeshes.length) return;

  tmpBox.setFromObject(arrayGroup);
  tmpBox.getSize(tmpSize);
  tmpBox.getCenter(tmpCenter);

  const min = tmpBox.min;
  const max = tmpBox.max;

  const offsetY = params.spacingX * 0.3;
  const offsetX = params.spacingZ * 0.3;
  const offsetZ = params.spacingX * 0.3;

  drawDimension(
    new THREE.Vector3(min.x, 0, max.z + offsetZ),
    new THREE.Vector3(max.x, 0, max.z + offsetZ),
    formatDimension(tmpSize.x / params.scale)
  );
  drawDimension(
    new THREE.Vector3(min.x - offsetY, min.y, min.z),
    new THREE.Vector3(min.x - offsetY, max.y, min.z),
    formatDimension(tmpSize.y / params.scale)
  );
  drawDimension(
    new THREE.Vector3(max.x + offsetX, 0, min.z),
    new THREE.Vector3(max.x + offsetX, 0, max.z),
    formatDimension(tmpSize.z / params.scale)
  );
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

  const dist = activeCamera.position.distanceTo(controls.target);
  currentGap = Math.min(dist * 0.08, 150);

  dimensionGroup.children.forEach(obj => {
    if (obj.isSprite) {
      obj.scale.set(currentGap, currentGap * 0.25, 1);
      obj.quaternion.copy(activeCamera.quaternion); // <-- updated
    }
  });

  renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  renderer.clear();
  renderer.render(scene, activeCamera); // <-- updated

  axisHelper.quaternion.copy(activeCamera.quaternion); // <-- updated
  renderAxisHelper();
}

animate();

/* ================= Custom Cursor ================= */

const cross = document.querySelector('.cursor-cross');
const lineH = document.querySelector('.crosshair-h');
const lineV = document.querySelector('.crosshair-v');

document.addEventListener('mousemove', e => {
  cross.style.left = e.clientX + 'px';
  cross.style.top  = e.clientY + 'px';
  lineH.style.top  = e.clientY + 'px';
  lineV.style.left = e.clientX + 'px';
});

document.querySelectorAll('a, button, [data-cursor-hover]')
  .forEach(el => {
    el.addEventListener('mouseenter', () => {
      [cross, lineH, lineV].forEach(el => el.classList.add('is-hovering'));
    });
    el.addEventListener('mouseleave', () => {
      [cross, lineH, lineV].forEach(el => el.classList.remove('is-hovering'));
    });
  });