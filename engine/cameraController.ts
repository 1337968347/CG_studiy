import * as Scene from './scene';
import { mat4, vec3 } from './MV';
import InputHandler from './input';

export default class CameraController {
  input: InputHandler;
  camera: Scene.Camera;

  constructor(input: InputHandler, camera: Scene.Camera) {
    this.input = input;
    this.camera = camera;
  }

  tick() {
    const { x, y } = this.input.getOffsetFromElementCenter();
    this.camera.y += x * 0.00008;
    this.camera.x += y * 0.00008;
    const inverseRotation = this.camera.getInverseRotation();
    const direction = vec3.create();
    if (this.input.keys.W) {
      direction[2] = -1;
    } else if (this.input.keys.S) {
      direction[2] = 1;
    }
    if (this.input.keys.A) {
      direction[0] = -1;
    } else if (this.input.keys.D) {
      direction[0] = 1;
    }
    vec3.normalize(direction)
    // 先获取方向, 然后在这个方向上平移
    mat4.multiplyVec3(inverseRotation, direction);
    vec3.add(this.camera.position, direction);
  }
}
