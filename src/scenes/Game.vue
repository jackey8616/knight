<template>
  <canvas
    ref='canvas'
    class='w-full h-full outline-none'
  ></canvas>
</template>

<script setup lang='ts'>
import { onMounted, onUnmounted, ref } from 'vue';
import * as CANNON from 'cannon-es';
import {
  ArcRotateCamera,
  BackgroundMaterial,
  CannonJSPlugin,
  Color3,
  Engine,
  MeshBuilder,
  Scene,
  Vector3,
} from '@babylonjs/core';

import Ground from './ground';

const canvas = ref<HTMLCanvasElement>();
let engine: Engine;
let scene: Scene;
let ground = new Ground(8, true);

function createEngine(canvas: HTMLCanvasElement): Engine {
  return new Engine(canvas, true);
}
function createScene(engine: Engine) {
  const scene = new Scene(engine);
  scene.createDefaultLight();

  const physicsPlugin = new CannonJSPlugin(true, 8, CANNON);
  scene.enablePhysics(new Vector3(0, -9.81, 0), physicsPlugin);

  return scene;
}
function createCamera(scene: Scene) {
  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 4,
    34,
    new Vector3(0, 0, -2),
  );
  camera.attachControl(scene, true);

  return camera;
}
function createSea(scene: Scene) {
  const sea = MeshBuilder.CreateGround('sea', { height: 1000, width: 1000 });

  const material = new BackgroundMaterial('seaMaterial', scene);
  material.useRGBColor = false;
  material.primaryColor = new Color3(0.57, 0.70, 0.83);

  sea.material = material;

  return sea;
}

async function init() {
  if (!canvas.value) {
    console.error('Cannot get canvas DOM');
    return;
  }

  engine = createEngine(canvas.value);
  scene = createScene(engine);
  createCamera(scene);

  createSea(scene);
  ground.init(scene);

  engine.runRenderLoop(() => {
    scene.render();
  });
}


onMounted(() => {
  init();
});

onUnmounted(() => {
  engine.dispose();
});
</script>
