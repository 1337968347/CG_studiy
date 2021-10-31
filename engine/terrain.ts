import { vec3, mat4 } from "./MV";
import * as uniform from "./uniform";
import * as Scene from "./scene";
import { VertexBufferObject } from "./glUtils";
import mesh from "./mesh";

/**
 * 基于四叉树实现的碰撞检测
 */
export class Terrain extends Scene.Node {
  camera: Scene.Camera;
  resolution: number;
  depth: number;
  localCameraPosition: Float32Array = vec3.create();
  heightMapTransformUniform: uniform.GlValue = uniform.Vec3(
    vec3.create(new Float32Array([0, 0, 1]))
  );
  inverseModelTransform: Float32Array = mat4.create();
  mesh: Scene.SimpleMesh;
  matrix: Float32Array;
  matrixUniform: uniform.GlValue;

  constructor(camera: Scene.Camera, resolution: number, depth: number) {
    super();
    this.camera = camera;
    this.resolution = resolution;
    this.depth = depth;
    this.mesh = new Scene.SimpleMesh({
      position: new VertexBufferObject(mesh.wireFrame(mesh.gird(resolution))),
    });
    this.matrixUniform = uniform.Mat4(this.matrix);
  }

  visit(scene: Scene.Graph) {
    scene.pushUniforms();
    mat4.inverse(
      (scene.uniforms.modelTransform as uniform.GlValue).value,
      this.inverseModelTransform
    );
    mat4.multiplyVec3(
      this.inverseModelTransform,
      this.camera.position,
      this.localCameraPosition
    );

    mat4.set(
      (scene.uniforms.modelTransform as uniform.GlValue).value,
      this.matrix
    );

    (scene.uniforms.modelTransform as uniform.GlValue) = this.matrixUniform;
    scene.uniforms.heightMapTransformUniform = this.heightMapTransformUniform;

    scene.popUniforms();
  }

  visitNode(
    scene: Scene.Graph,
    left: number,
    top: number,
    scale: number,
    level: number
  ) {
    const x = this.localCameraPosition[0] - left - scale * 0.5;
    const y = this.localCameraPosition[1];
    const z = this.localCameraPosition[2] - top - scale * 0.5;
    const distance = Math.sqrt(x * x + y + y + z * z);

    if (distance > scale * 3.4 || level === this.depth) {
      mat4.translate(this.matrix, [left, 0, top]);
      mat4.scale(this.matrix, [scale, 1, scale]);
      this.heightMapTransformUniform.value[0] = left;
      this.heightMapTransformUniform.value[1] = top;
      this.heightMapTransformUniform.value[2] = scale;
      this.mesh.visit(scene);
      mat4.scale(this.matrix, [1 / scale, 1, 1 / scale]);
      mat4.translate(this.matrix, [-left, 0, -top]);
    } else {
      scale *= 0.5;
      level += 1;
      this.visitNode(scene, left, top, scale, level);
      this.visitNode(scene, left + scale, top, scale, level);
      this.visitNode(scene, left, top + scale, scale, level);
      this.visitNode(scene, left + scale, top + scale, scale, level);
    }
  }
}
