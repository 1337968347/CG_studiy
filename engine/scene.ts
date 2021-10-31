import * as uniform from "./uniform";
import { UniformMap } from "./uniform";
import * as Mesh from "./mesh";
import { mat3, mat4, vec3, vec4 } from "./MV";
import {
  getGL,
  VertexBufferObject,
  Texture2D,
  FrameBufferObject,
  BufferObject,
} from "./glUtils";
import { Shader } from "./shader";
import { WebXr } from "./webXR";

export class Node {
  children: Node[] = [];

  constructor(childrenP: Node[] = []) {
    this.children = childrenP;
  }

  visit(scene: Graph, frame?: XRFrame) {
    this.enter(scene, frame);
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].visit(scene, frame);
    }
    this.exit(scene, frame);
  }

  // overwrite
  exit(_scene: Graph, _frame?: XRFrame) {
    // console.log(scene);
  }

  append(child: any) {
    this.children.push(child);
  }

  // overwrite
  enter(_scene: Graph, _frame?: XRFrame) {
    // console.log(scene);
  }
}

export class Graph {
  gl: WebGLRenderingContext;
  root: Node;
  uniforms: UniformMap = {};
  shaders: Shader[] = [];
  public viewport = {
    x: 0,
    y: 0,
    width: 640,
    height: 480,
  };
  textureUnit: number = 0;
  camera: Camera;
  webXr: WebXr;
  view: XRView;

  constructor(xRSession: XRSession) {
    this.gl = getGL();
    this.attempWebXRInit(xRSession);
    this.root = new Node();
  }

  attempWebXRInit(xRSession: XRSession) {
    if (xRSession) {
      this.webXr = new WebXr(xRSession, this.gl);
    }
  }

  draw(frame?: XRFrame) {
    const gl = this.gl;
    gl.viewport(
      this.viewport.x,
      this.viewport.y,
      this.viewport.width,
      this.viewport.height
    );
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (frame) {
      const eyes = frame.getViewerPose(this.webXr.XRReferenceSpace);
      let baseLayer = frame.session.renderState.baseLayer;
      for (let view of eyes.views) {
        let i = baseLayer.getViewport(view);
        this.viewport = {
          x: i.x,
          y: i.y,
          width: i.width,
          height: i.height,
        };
        gl.viewport(i.x, i.y, i.width, i.height);
        this.setCurrentView(view);
        this.root.visit(this, frame);
      }
    } else {
      this.root.visit(this, frame);
    }
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

  getWebXR() {
    return this.webXr;
  }

  setCamera(camera: Camera) {
    this.camera = camera;
  }

  getCamera() {
    return this.camera;
  }

  // 对VR来说 每双眼睛需要生成一帧不同的图像
  setCurrentView(view: any) {
    this.view = view;
  }

  getCurrentView() {
    return this.view;
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

  enter(scene: Graph) {
    this.fbo.bind();
    scene.gl.clear(scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT);
  }

  exit(scene: Graph) {
    this.fbo.unbind();
    scene.gl.viewport(
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

export class Camera extends Node {
  gl: WebGLRenderingContext;
  children: Node[] = [];
  position: Float32Array;
  x: number = 0.0;
  y: number = 0.0;
  near: number = 0.5;
  far: number = 5000;
  fov: number = 50;
  view: XRView;

  constructor(children: Node[]) {
    super();
    this.children = children;
    this.gl = getGL();
    this.position = vec3.create([0, 0, 0]);
  }

  enter(scene: Graph, frame: XRFrame) {
    scene.pushUniforms();
    if (frame) {
      this.view = scene.getCurrentView();
    }
    const mergePosition = this.getMergePosition();
    const project = this.getProjection(scene);
    const wordView = this.getWorldView();
    const mvp = mat4.create();
    mat4.multiply(project, wordView, mvp);
    scene.uniforms.projection = uniform.Mat4(mvp);
    scene.uniforms.eye = uniform.Vec3(mergePosition);
  }

  exit(scene: Graph) {
    scene.popUniforms();
  }

  setProjection(near: number, far: number, webXR?: WebXr) {
    this.near = near;
    this.far = far;
    if (webXR) {
      webXR.setProjection(near, far);
    }
  }

  // VR 移动的距离加手柄移动的距离
  getMergePosition() {
    if (this.view) {
      return new Float32Array([
        this.view.transform.position.x * 200 + this.position[0],
        this.view.transform.position.y * 200 + this.position[1],
        this.view.transform.position.z * 200 + this.position[2],
      ]);
    }
    return new Float32Array(this.position);
  }

  project(point: Float32Array, scene: Graph) {
    const mvp = mat4.create();
    mat4.multiply(this.getProjection(scene), this.getWorldView(), mvp);
    const projected = mat4.multiplyVec4(mvp, point, vec4.create());
    vec4.scale(projected, 1 / projected[3]);
    return projected;
  }

  getInverseRotation() {
    return mat3.toMat4(mat4.toInverseMat3(this.getWorldView()));
  }

  // project
  getProjection(scene: Graph) {
    if (this.view) {
      return this.view.projectionMatrix;
    }
    return mat4.perspective(
      this.fov,
      scene.viewport.width / scene.viewport.height,
      this.near,
      this.far
    );
  }

  // ModelView
  getWorldView() {
    const mergePosition = this.getMergePosition();
    if (this.view) {
      const modeView = mat4.create();
      mat4.translate(
        mat3.toMat4(mat4.toInverseMat3(this.view.transform.matrix)),
        vec3.negate(mergePosition, vec3.create()),
        modeView
      );

      return modeView;
    }

    // 先平移到标架原点， 然后再旋转
    const matrix = mat4.identity(mat4.create());
    mat4.rotateX(matrix, this.x);
    mat4.rotateY(matrix, this.y);
    mat4.translate(matrix, vec3.negate(mergePosition, vec3.create()));
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

  enter(scene: Graph) {
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

  exit(scene: Graph) {
    scene.popUniforms();
  }
}

export class Mirror extends Transform {
  constructor(children: Node[]) {
    super(children);
  }

  enter(scene: Graph) {
    scene.gl.cullFace(scene.gl.FRONT);
    super.enter.call(this, scene);
  }

  exit(scene: Graph) {
    scene.gl.cullFace(scene.gl.BACK);
    super.exit.call(this, scene);
  }
}

export class CameraFixTransform extends Transform {
  wordMatrix = mat4.create();

  constructor(children: Node[]) {
    super(children);
    this.children = children;
  }

  enter(scene: Graph) {
    scene.pushUniforms();
    // 相机标架
    const aux = mat4.create();
    mat4.multiply(
      mat4.inverse(scene.getCamera().getWorldView()),
      this.wordMatrix,
      aux
    );
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
  constructor(shader: Shader, uniforms: UniformMap) {
    super();
    const screenVbo = new VertexBufferObject(Mesh.screen_quad());
    const mesh = new SimpleMesh({ position: screenVbo });
    const material = new Material(shader, uniforms, [mesh]);
    this.children = [material];
  }
}

export class WebVrRenderTarget extends Node {
  enter(scene: Graph, frame: XRFrame) {
    if (frame) {
      const webXR = scene.getWebXR();
      webXR.bind();
    }
  }

  exit(scene: Graph, frame: XRFrame) {
    if (frame) {
      const webXR = scene.getWebXR();
      webXR.unbind();
    }
  }
}

export class Skybox extends Node {
  children: Node[];
  constructor(shader: Shader, uniforms: UniformMap) {
    super();

    const skyVbo = new VertexBufferObject(Mesh.cute());
    const mesh = new SimpleMesh({ position: skyVbo });
    const material = new Material(shader, uniforms, [mesh]);
    this.children = [material];
  }
}
