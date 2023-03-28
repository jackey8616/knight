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
  ActionEvent,
  ActionManager,
  ArcRotateCamera,
  BackgroundMaterial,
  CannonJSPlugin,
  Color3,
  Engine,
  ExecuteCodeAction,
  MeshBuilder,
  Scene,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders';

import Ground from './ground';
import Character from './character';

const canvas = ref<HTMLCanvasElement>();
let engine: Engine;
let scene: Scene;
let ground = new Ground(3, 16, true);

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

  const character = await new Character(
    'character', scene, new Vector3(0, 10, 0),
  ).init();

  createKeyboardObservable(scene, character);

  engine.runRenderLoop(() => {
    scene.render();
  });
}

function createEngine(canvas: HTMLCanvasElement): Engine {
  return new Engine(canvas, true, {}, true);
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

function createKeyboardObservable(scene: Scene, character: Character) {
  const actionManager = new ActionManager(scene);
  const inputs = [
    {
      parameter: (event: ActionEvent) => ['w', 'W'].includes(event.sourceEvent.key),
      action: () => character.walkUp(),
    },
    {
      parameter: (event: ActionEvent) => ['s', 'S'].includes(event.sourceEvent.key),
      action: () => character.walkDown(),
    },
    {
      parameter: (event: ActionEvent) => ['a', 'A'].includes(event.sourceEvent.key),
      action: () => character.walkLeft(),
    },
    {
      parameter: (event: ActionEvent) => ['d', 'D'].includes(event.sourceEvent.key),
      action: () => character.walkRight(),
    },
    {
      parameter: (event: ActionEvent) => event.sourceEvent.key === ' ',
      action: () => character.jump(),
    },
  ];
  
  inputs.forEach(({ parameter, action }) => {
    actionManager.registerAction(new ExecuteCodeAction(
      { trigger: ActionManager.OnKeyDownTrigger, parameter },
      () => action(),
    ));
  });

  scene.actionManager = actionManager;
}

onMounted(() => {
  init();
});

onUnmounted(() => {
  engine.dispose();
});
</script>
