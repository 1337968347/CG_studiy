import * as Scene from "../engine/scene";
import Mesh, { makePerlinNoise } from "../engine/mesh";
import { WebGLRenderer } from "../engine/renderer";
import { VertexBufferObject, setCanvasFullScreen } from "../engine/glUtils";
import Loader from "../engine/loader";
import { ShaderManager } from "../engine/shader";
import { mat3, mat4 } from "../engine/MV";

let camera: Scene.Camera;
let scene: Scene.Graph;
let renderer: WebGLRenderer = new WebGLRenderer();
let material: Scene.Material;
let mesh: Scene.SimpleMesh;
let loader: Loader;
let shaderManager: ShaderManager;
const gl = renderer.getGLRenderContext();

loader = new Loader("./shader/");
loader.load(["terrain.vert", "terrain.frag" , 'transform.glsl']);
loader.setOnRendy(init);

function init() {
  // 资源管理相关

  shaderManager = new ShaderManager(loader.resources, gl);

  const terrainShader = shaderManager.get("terrain");

  camera = new Scene.Camera();
  camera.position = new Float32Array([0, 0, 0]);

  const moutainVBO = new VertexBufferObject(Mesh.gird(100), gl);

  mesh = new Scene.SimpleMesh({ position: moutainVBO });
  const transform = new Scene.Transform([mesh]);
  material = new Scene.Material(terrainShader, {}, [transform]);

  scene = new Scene.Graph();

  scene.append(material);

  initModeView();
  renderer.setAnimationLoop(animation);
  renderer.start();
  document.body.appendChild(renderer.domElement);
  setCanvasFullScreen(renderer.domElement, scene);

  function initModeView() {
    const FAR_AWAY = 100;
    mat4.translate(
      transform.wordMatrix,
      new Float32Array([-0.5 * FAR_AWAY, 0, -0.5 * FAR_AWAY])
    );
    mat4.scale(transform.wordMatrix, new Float32Array([FAR_AWAY, 1, FAR_AWAY]));
  }
}

function animation(time: number) {
  renderer.render(scene, camera);
}
