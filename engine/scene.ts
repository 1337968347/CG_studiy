import * as Mesh from "./mesh";
import { mat3, mat4, vec3, vec4 } from "./MV";
import {
  VertexBufferObject,
  Texture2D,
  FrameBufferObject,
  BufferObject,
  uniform,
} from "./glUtils";

import { Shader } from "./shader";
import { UniformMap } from "../interface";

export class Node {
  children: Node[] = [];

  constructor(childrenP: Node[] = []) {
    this.children = childrenP;
  }

  visit(scene: Graph, camera: Camera, gl: WebGLRenderingContext) {
    this.enter(scene, camera, gl);
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].visit(scene, camera, gl);
    }
    this.exit(scene, camera, gl);
  }

  // overwrite
  exit(_scene: Graph, _camera: Camera, gl: WebGLRenderingContext) {
    // console.log(scene);
  }

  append(child: any) {
    this.children.push(child);
  }

  // overwrite
  enter(_scene: Graph, _camera: Camera, gl: WebGLRenderingContext) {
    // console.log(scene);
  }
}

export class Graph {
  root: Node;
  uniforms: UniformMap = {};
  shaders: Shader[] = [];
  textureUnit: number = 0;
  public viewport = {
    x: 0,
    y: 0,
    width: 640,
    height: 480,
  };

  constructor() {
    this.root = new Node();
  }

  append(node: Node) {
    this.root.append(node);
  }

  draw(camera: Camera, gl: WebGLRenderingContext) {
    gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.root.visit(this, camera, gl);
  }

  pushUniforms() {
    this.uniforms = Object.create(this.uniforms);
  }

  popUniforms() {
    this.uniforms = Object.getPrototypeOf(this.uniforms);
  }

  pushTextura() {
    return this.textureUnit++;
  }

  popTextura() {
    this.textureUnit--;
  }

  pushShader(shader: Shader) {
    this.shaders.push(shader);
  }

  popShader() {
    this.shaders.pop();
  }

  getShader() {
    return this.shaders[this.shaders.length - 1];
  }
}

// 渲染场景到FrameBufferObject上
export class RenderTarget extends Node {
  fbo: FrameBufferObject;
  children: Node[] = [];

  constructor(fbo: FrameBufferObject, children: Node[]) {
    super();
    this.fbo = fbo;
    this.children = children;
  }

  enter(scene: Graph, _camera: Camera, gl: WebGLRenderingContext) {
    this.fbo.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  exit(scene: Graph, _camera: Camera, gl: WebGLRenderingContext) {
    this.fbo.unbind();
    gl.viewport(
      scene.viewport.x,
      scene.viewport.y,
      scene.viewport.width,
      scene.viewport.height
    );
  }
}

export class Material extends Node {
  shader: Shader;
  uniforms: UniformMap;
  children: Node[] = [];

  constructor(shader: Shader, uniforms: UniformMap, children: Node[]) {
    super();
    this.shader = shader;
    this.uniforms = uniforms;

    this.children = children;
  }

  enter(scene: Graph) {
    scene.pushShader(this.shader);
    this.shader.use();
    Uniforms.prototype.enter.call(this, scene);
  }

  exit(scene: Graph) {
    scene.popShader();
    Uniforms.prototype.exit.call(this, scene);
  }
}

export class Camera {
  position: Float32Array;
  x: number = 0.0;
  y: number = 0.0;
  near: number = 0.5;
  far: number = 5000;
  fov: number = 50;

  constructor() {
    this.position = vec3.create([0, 0, 0]);
  }

  use(scene: Graph) {
    scene.pushUniforms();
    const position = new Float32Array(this.position);

    const project = this.getProjection();
    const wordView = this.getWorldView();
    const mvp = mat4.create();
    mat4.multiply(project, wordView, mvp);
    scene.uniforms.projection = uniform.Mat4(mvp);
    scene.uniforms.eye = uniform.Vec3(position);
    scene.popUniforms();
  }

  setProjection(near: number, far: number) {
    this.near = near;
    this.far = far;
  }

  project(point: Float32Array) {
    const mvp = mat4.create();
    mat4.multiply(this.getProjection(), this.getWorldView(), mvp);
    const projected = mat4.multiplyVec4(mvp, point, vec4.create());
    vec4.scale(projected, 1 / projected[3]);
    return projected;
  }

  getInverseRotation() {
    return mat3.toMat4(mat4.toInverseMat3(this.getWorldView()));
  }

  // project
  getProjection() {
    return mat4.perspective(this.fov, 1, this.near, this.far);
  }

  // ModelView
  getWorldView() {
    const position = new Float32Array(this.position);
    // 先平移到标架原点， 然后再旋转
    const matrix = mat4.identity(mat4.create());
    mat4.rotateX(matrix, this.x);
    mat4.rotateY(matrix, this.y);
    mat4.translate(matrix, vec3.negate(position, vec3.create()));
    return matrix;
  }
}

export class SimpleMesh extends Node {
  bufferGeometry: { [key: string]: BufferObject };
  constructor(BufferGeometry: { [key: string]: BufferObject }) {
    super();
    this.bufferGeometry = BufferGeometry;
  }

  visit(scene: Graph) {
    const shader = scene.getShader();
    shader.uniforms(scene.uniforms);
    for (const name of Object.keys(this.bufferGeometry)) {
      const bufferObject = this.bufferGeometry[name];
      bufferObject.bind();
      if (bufferObject instanceof VertexBufferObject) {
        bufferObject.drawTriangles();
      }
    }

    for (const name of Object.keys(this.bufferGeometry)) {
      const bufferObject = this.bufferGeometry[name];
      bufferObject.unbind();
    }
  }
}

export class Transform extends Node {
  children: Node[] = [];
  wordMatrix = mat4.create();
  aux = mat4.create();

  constructor(children: Node[]) {
    super();
    this.children = children;
    mat4.identity(this.wordMatrix);
  }

  enter(scene: Graph, _camera: Camera, _gl: WebGLRenderingContext) {
    scene.pushUniforms();
    if (scene.uniforms.modelTransform) {
      mat4.multiply(
        (scene.uniforms.modelTransform as any).value,
        this.wordMatrix,
        this.aux
      );
      scene.uniforms.modelTransform = uniform.Mat4(this.aux);
    } else {
      scene.uniforms.modelTransform = uniform.Mat4(this.wordMatrix);
    }
  }

  exit(scene: Graph, _camera: Camera, _gl: WebGLRenderingContext) {
    scene.popUniforms();
  }
}

export class Mirror extends Transform {
  constructor(children: Node[]) {
    super(children);
  }

  enter(scene: Graph, _camera: Camera, gl: WebGLRenderingContext) {
    gl.cullFace(gl.FRONT);
    super.enter.call(this, scene);
  }

  exit(scene: Graph, _camera: Camera, gl: WebGLRenderingContext) {
    gl.cullFace(gl.BACK);
    super.exit.call(this, scene);
  }
}

export class CameraFixTransform extends Node {
  wordMatrix = mat4.create();

  constructor(children: Node[]) {
    super(children);
    this.children = children;
    mat4.identity(this.wordMatrix);
  }

  enter(scene: Graph, camera: Camera) {
    scene.pushUniforms();
    // 相机标架
    const aux = mat4.create();
    mat4.multiply(mat4.inverse(camera.getWorldView()), this.wordMatrix, aux);
    scene.uniforms.modelTransform = uniform.Mat4(aux);
  }

  exit(scene: Graph) {
    scene.popUniforms();
  }
}

export class Uniforms extends Node {
  uniforms: UniformMap;
  children: Node[];

  constructor(uniforms: UniformMap, children: Node[]) {
    super();
    this.uniforms = uniforms;
    this.children = children;
  }

  enter(scene: Graph) {
    scene.pushUniforms();
    for (let uniform in this.uniforms) {
      const value = this.uniforms[uniform];
      if (value instanceof Texture2D || value instanceof FrameBufferObject) {
        value.bindTexture(scene.pushTextura());
      }
      // 把this.uniform 绑定到Scene的uniform属性上去
      scene.uniforms[uniform] = value;
    }
  }

  exit(scene: Graph) {
    for (let uniform in this.uniforms) {
      const value = this.uniforms[uniform];
      if (value instanceof Texture2D || value instanceof FrameBufferObject) {
        value.unbindTexture();
        scene.popTextura();
      }
    }
    scene.popUniforms();
  }
}

export class PostProcess extends Node {
  children: Node[];
  constructor(
    shader: Shader,
    uniforms: UniformMap,
    gl: WebGLRenderingContext
  ) {
    super();
    const screenVbo = new VertexBufferObject(Mesh.screen_quad(), gl);
    const mesh = new SimpleMesh({ position: screenVbo });
    const material = new Material(shader, uniforms, [mesh]);
    this.children = [material];
  }
}

export class Skybox extends Node {
  children: Node[];
  constructor(
    shader: Shader,
    uniforms: UniformMap,
    gl: WebGLRenderingContext
  ) {
    super();

    const skyVbo = new VertexBufferObject(Mesh.cute(), gl);
    const mesh = new SimpleMesh({ position: skyVbo });
    const material = new Material(shader, uniforms, [mesh]);
    this.children = [material];
  }
}
