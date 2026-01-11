import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

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

document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(700, 700, 700);

renderer.setClearColor(0xFFFFFF);

// Get actual canvas dimensions after DOM insertion and CSS media queries are applied
// Use requestAnimationFrame to ensure layout has been calculated
requestAnimationFrame(() => {
  const containerWidth = canvas.clientWidth;
  const containerHeight = canvas.clientHeight;
  
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
});

// Define resize handler
const onWindowResize = () => {
  const containerWidth = canvas.clientWidth;
  const containerHeight = canvas.clientHeight;
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
  updateScaleForViewport();
};

// Adjust model scale and spacing based on viewport
const updateScaleForViewport = () => {
  const baseScale = 0.5;
  const baseSpacingX = 254;
  const baseSpacingY = 196;
  const baseSpacingZ = 178;
  
  const isMobile = window.innerWidth < 768;
  const isSmallMobile = window.innerWidth < 480;
  
  let scaleFactor;
  
  if (isSmallMobile) {
    scaleFactor = 0.5; // iPhone SE, small phones
  } else if (isMobile) {
    scaleFactor = 0.2; // iPad, larger phones
  } else {
    scaleFactor = 1; // Desktop
  }
  
  params.scale = baseScale * scaleFactor;
  params.spacingX = baseSpacingX * scaleFactor;
  params.spacingY = baseSpacingY * scaleFactor;
  params.spacingZ = baseSpacingZ * scaleFactor;
  
  createArray();
};

// Listen for resize events
window.addEventListener('resize', onWindowResize);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 10;
controls.maxDistance = 1500;
controls.target = new THREE.Vector3(1, 4, 4);
controls.update();

const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dirLight.position.set(3, 0.9, 4);
scene.add(dirLight);

scene.add(new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 2));

const loader = new GLTFLoader();

let sourceModel = null;
let clones = [];

const params = {
  countX: 2,
  countY: 1,
  countZ: 2,
  spacingX: 254,
  spacingY: 196,
  spacingZ: 178,
  showEdges: true,
  edgeColor: 0x000000,
  scale: 0.5,
  rebuild: () => createArray()
};

const gui = new GUI({
  title: 'Array Controls',      // Panel title
  width: 300,                    // Panel width
  closeFolders: false            // Keep folders open by default
});

// Add countX controls
gui.add(params, 'countX').listen().name('Count X');
gui.add({ decrease: () => { params.countX = Math.max(1, params.countX - 1); createArray(); } }, 'decrease').name('−');
gui.add({ increase: () => { params.countX = Math.min(5, params.countX + 1); createArray(); } }, 'increase').name('+');

// Add countY controls
gui.add(params, 'countY').listen().name('Count Y');
gui.add({ decrease: () => { params.countY = Math.max(1, params.countY - 1); createArray(); } }, 'decrease').name('−');
gui.add({ increase: () => { params.countY = Math.min(3, params.countY + 1); createArray(); } }, 'increase').name('+');

// Add countZ controls
gui.add(params, 'countZ').listen().name('Count Z');
gui.add({ decrease: () => { params.countZ = Math.max(1, params.countZ - 1); createArray(); } }, 'decrease').name('−');
gui.add({ increase: () => { params.countZ = Math.min(5, params.countZ + 1); createArray(); } }, 'increase').name('+');

/* gui.add(params, 'rebuild'); */

loader.load('module-sample.glb', (gltf) => {
  sourceModel = gltf.scene;
  sourceModel.traverse(n => { if (n.isMesh) n.castShadow = true; });
  sourceModel.scale.set(params.scale, params.scale, params.scale);
  createArray();
}, undefined, (err) => {
  console.error('GLTF load error:', err);
});

function clearArray() {
  for (const c of clones) {
    scene.remove(c);
    disposeEdges(c);
  }
  clones = [];
}

function disposeEdges(root) {
  root.traverse((child) => {
    if (child.isLineSegments) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  });
}

function createEdgesForClone(clone) {
  clone.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const edgesGeo = new THREE.EdgesGeometry(child.geometry);
      const mat = new THREE.LineBasicMaterial({
        color: params.edgeColor,
        depthTest: true,
        depthWrite: false
      });
      const lines = new THREE.LineSegments(edgesGeo, mat);
      lines.renderOrder = 999; // draw on top
      child.add(lines);
    }
  });
}

function createArray() {
  if (!sourceModel) return;
  clearArray();

  const cx = params.countX;
  const cy = params.countY;
  const cz = params.countZ;
  const sx = params.spacingX;
  const sy = params.spacingY;
  const sz = params.spacingZ;

  const offsetX = (cx - 1) * sx * 0.5;
  const offsetY = (cy - 1) * sy * 0.5;
  const offsetZ = (cz - 1) * sz * 0.5;

  for (let ix = 0; ix < cx; ix++) {
    for (let iy = 0; iy < cy; iy++) {
      for (let iz = 0; iz < cz; iz++) {
        const clone = sourceModel.clone(true);
        clone.scale.set(params.scale, params.scale, params.scale);
        clone.position.set(ix * sx - offsetX, iy * sy - offsetY, iz * sz - offsetZ);

        if (params.showEdges) {
          createEdgesForClone(clone);
        }

        scene.add(clone);
        clones.push(clone);
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

