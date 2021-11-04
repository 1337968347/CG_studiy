import * as Scene from "../engine/scene";
import { gird, screen_quad } from "../engine/mesh";
import { WebGLRenderer } from "../engine/renderer";
import { VertexBufferObject, setCanvasFullScreen } from "../engine/glUtils";
import Loader from "../engine/loader";
import { ShaderManager } from "../engine/shader";

let camera: Scene.Camera;
let scene: Scene.Graph;
let renderer: WebGLRenderer = new WebGLRenderer();
let material: Scene.Material;
let mesh: Scene.SimpleMesh;
let loader: Loader;
let shaderManager: ShaderManager;
const gl = renderer.getGLRenderContext();

loader = new Loader("./shader/");
loader.load([ "terrain.vert", "terrain.frag"]);
loader.setOnRendy(init);

function init() {
  renderer = new WebGLRenderer();

  // 资源管理相关

  shaderManager = new ShaderManager(loader.resources, gl);

  const terrainShader = shaderManager.get("terrain");

  camera = new Scene.Camera();
  camera.position = new Float32Array([0, 0, 0]);

  const moutainVBO = new VertexBufferObject(screen_quad(), gl);

  mesh = new Scene.SimpleMesh({ position: moutainVBO });
  material = new Scene.Material(terrainShader, {}, [mesh]);
  scene = new Scene.Graph();

  scene.append(material);

  renderer.setAnimationLoop(animation);
  renderer.start();
  document.body.appendChild(renderer.domElement);
  setCanvasFullScreen(renderer.domElement, scene);
}

function animation(time: number) {
  renderer.render(scene, camera);
}
