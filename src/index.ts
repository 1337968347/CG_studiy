import * as Scene from "../engine/scene";
import { baseMesh } from "./mesh";
import { WebGLRenderer } from "../engine/renderer";

let camera: Scene.Camera;
let scene: Scene.Graph;
let renderer: WebGLRenderer;
let material: Scene.Material;
let mesh: Scene.SimpleMesh;

init();

function init() {
  camera = new Scene.Camera([]);
  camera.position = new Float32Array([0, 0, 20]);

  scene = new Scene.Graph();

  scene.append(mesh);

  renderer = new WebGLRenderer();
  renderer.setAnimationLoop(animation);
  renderer.start();
  document.body.appendChild(renderer.domElement);
}

function animation(time: number) {
  renderer.render(scene, camera);
}
