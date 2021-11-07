import * as Scene from '../engine/scene';
import Mesh, { makePerlinNoise } from '../engine/mesh';
import { WebGLRenderer } from '../engine/renderer';
import { VertexBufferObject, setCanvasFullScreen, Texture2D, uniform } from '../engine/glUtils';
import Loader from '../engine/loader';
import { ShaderManager } from '../engine/shader';
import { mat4, vec3 } from '../engine/MV';

let camera: Scene.Camera;
let scene: Scene.Graph;
let renderer: WebGLRenderer = new WebGLRenderer();
let material: Scene.Material;
let mesh: Scene.SimpleMesh;
let loader: Loader;
let shaderManager: ShaderManager;
const gl = renderer.getGLRenderContext();

loader = new Loader('./shader/');
loader.load(['terrain.vert', 'terrain.frag', 'transform.glsl', 'sunlight.glsl']);
loader.setOnRendy(init);

const makeNoiseImg = (size: number) => {
  // 生成随机种子的柏林噪音
  const noise = makePerlinNoise(Math.random());
  const greyImageArray = new Array(size * size * 4);
  const imageArray = new Array(size * size * 4);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const p = noise.getUVPixel(i / 100, j / 100);
      greyImageArray[(i * size + j) * 4 + 0] = 0;
      greyImageArray[(i * size + j) * 4 + 1] = 0;
      greyImageArray[(i * size + j) * 4 + 2] = 0;
      greyImageArray[(i * size + j) * 4 + 3] = p;
    }
  }

  const getPixelIndex = (i, j) => {
    return (i * size + j) * 4;
  };

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const center = [i / (2 * size), j / size, greyImageArray[getPixelIndex(i, j) + 3] || 0];
      const left = [(i - 1) / (2 * size), j / size, greyImageArray[getPixelIndex(i - 1, j) + 3] || 0];
      const right = [(i + 1) / (2 * size), j / size, greyImageArray[getPixelIndex(i + 1, j) + 3] || 0];
      const top = [i / (2 * size), (j - 1) / size, greyImageArray[getPixelIndex(i, j - 1) + 3] || 0];
      const bottom = [i / (2 * size), (j + 1) / size, greyImageArray[getPixelIndex(i, j + 1) + 3] || 0];

      // 水平向量
      const v = vec3.create();
      vec3.subtract(right, left, v);

      const h = vec3.create();
      // 水平向量
      vec3.subtract(bottom, top, h);

      const p = vec3.normalize(vec3.cross(v, h));
      const a = center[2];
      imageArray[(i * size + j) * 4 + 0] = p[0] * 255;
      imageArray[(i * size + j) * 4 + 1] = p[1] * 255;
      imageArray[(i * size + j) * 4 + 2] = p[2] * 255;
      imageArray[(i * size + j) * 4 + 3] = a * 255;
    }
  }
  const imagedata = new ImageData(new Uint8ClampedArray(imageArray), size, size);

  return imagedata;
};

function init() {
  // 资源管理相关

  shaderManager = new ShaderManager(loader.resources, gl);

  const terrainShader = shaderManager.get('terrain');
  const terrainTexture = new Texture2D(makeNoiseImg(512), gl);

  camera = new Scene.Camera();
  camera.position = new Float32Array([0, 50, 0]);
  camera.y = -30

  const moutainVBO = new VertexBufferObject(Mesh.gird(512), gl);

  mesh = new Scene.SimpleMesh({ position: moutainVBO });
  const transform = new Scene.Transform([mesh]);
  material = new Scene.Material(
    terrainShader,
    {
      sunColor: uniform.Vec3([0.8, 0.5, 0.5]),
      sunDirection: uniform.Vec3(vec3.normalize(new Float32Array([0.3, -0.6, 0.2]))),
      terrainMap: terrainTexture,
    },
    [transform],
  );

  scene = new Scene.Graph();

  scene.append(material);

  renderer.setAnimationLoop(animation);
  renderer.start();
  document.body.appendChild(renderer.domElement);
  setCanvasFullScreen(renderer.domElement, scene);

  initModeView();

  function initModeView() {
    const FAR_AWAY = 1500;
    const HEIGHT = 400;
    mat4.translate(transform.wordMatrix, new Float32Array([-FAR_AWAY / 2, -HEIGHT / 2, -FAR_AWAY / 2]));
    mat4.scale(transform.wordMatrix, new Float32Array([FAR_AWAY, HEIGHT, FAR_AWAY]));
  }
}

function animation(time: number) {
  renderer.render(scene, camera);
}
