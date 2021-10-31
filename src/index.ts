import * as Scene from "../engine/scene";
import { baseMesh } from "./mesh";

let camera: Scene.Camera;
let scene: Scene.Graph;
let renderer: Scene.WebGLRenderer;
let material: Scene.Material;
let mesh: Scene.Mesh;

init();

function init() {
  camera = new Scene.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.01,
    10
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 20;

  scene = new Scene.Scene();

  material = new Scene.MeshBasicMaterial({ color: 0xff0000 });

  mesh = new Scene.Mesh(baseMesh(200), material);
  scene.add(mesh);

  renderer = new Scene.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight, true);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}

function animation(time: number) {
  renderer.render(scene, camera);
}
