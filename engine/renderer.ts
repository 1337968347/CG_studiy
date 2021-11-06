import * as Scene from '../engine/scene';
import { mat4, vec3 } from './MV';

const KEYNAME = {
  32: 'SPACE',
  13: 'ENTER',
  9: 'TAB',
  8: 'BACKSPACE',
  16: 'SHIFT',
  17: 'CTRL',
  18: 'ALT',
  20: 'CAPS_LOCK',
  144: 'NUM_LOCK',
  145: 'SCROLL_LOCK',
  37: 'LEFT',
  38: 'UP',
  39: 'RIGHT',
  40: 'DOWN',
  33: 'PAGE_UP',
  34: 'PAGE_DOWN',
  36: 'HOME',
  35: 'END',
  45: 'INSERT',
  46: 'DELETE',
  27: 'ESCAPE',
  19: 'PAUSE',
};

const clamp = (a: number, b: number, c: number) => {
  return a < b ? b : a > c ? c : a;
};

const pointerCoord = (ev: any): { x: number; y: number } => {
  // get X coordinates for either a mouse click
  // or a touch depending on the given event
  if (ev) {
    const changedTouches = ev.changedTouches;
    if (changedTouches && changedTouches.length > 0) {
      const touch = changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    if (ev.pageX !== undefined) {
      return { x: ev.pageX, y: ev.pageY };
    }
  }
  return { x: 0, y: 0 };
};

export class CameraController {
  input: InputHandler;

  constructor(input: InputHandler) {
    this.input = input;
  }

  tick(camera: Scene.Camera) {
    const { x, y } = this.input.getOffsetFromElementCenter();
    camera.y += x * 0.0001;
    camera.x += y * 0.0001;
    const inverseRotation = camera.getInverseRotation();
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
    vec3.normalize(direction);
    // 先获取方向, 然后在这个方向上平移
    mat4.multiplyVec3(inverseRotation, direction);
    vec3.add(camera.position, direction);
  }
}

export default class InputHandler {
  keys: { [k: string]: boolean } = {};
  offset: { x: number; y: number } = { x: 0, y: 0 };
  mouse: { down: boolean; x: number; y: number } = { down: false, x: 0, y: 0 };
  onClick = undefined;
  onKeyUp = undefined;
  onKeyDown = undefined;
  width: number = 0;
  height: number = 0;
  hasFocus: boolean = true;
  element: HTMLCanvasElement = undefined;

  constructor(element: HTMLCanvasElement) {
    this.element = element;
    this.bind(element);
    this.reset();
  }

  bind(element: HTMLCanvasElement) {
    if (!element) return;
    this.element = element;
    const elementRect = element.getBoundingClientRect();
    this.offset = { x: elementRect.left, y: elementRect.top };
    // 绑定监听事件
    document.onkeydown = (e) => this.keyDown(e.keyCode);
    document.onkeyup = (e) => this.keyUp(e.keyCode);
    window.onclick = (e) => {
      if (e.target === element) {
        focus();
      } else {
        blur();
      }
    };

    this.element.onmousedown = (e) => {
      const { x, y } = pointerCoord(e);
      this.mouseDown(x, y);
    };
    this.element.ontouchstart = (e) => {
      const { x, y } = pointerCoord(e);
      this.mouseDown(x, y);
    };
    document.ontouchmove = (e) => {
      const { x, y } = pointerCoord(e);
      this.mouseMove(x, y);
    };
    document.onmousemove = (e) => {
      const { x, y } = pointerCoord(e);
      this.mouseMove(x, y);
    };
    document.ontouchend = this.mouseUp;
    document.ontouchcancel = this.mouseUp;
    document.onmouseup = this.mouseUp;
  }

  // 获取鼠标点击点距离元素中心的距离
  getOffsetFromElementCenter() {
    if (!this.element) {
      return { x: 0, y: 0 };
    }
    if (this.mouse.down) {
      return {
        x: this.mouse.x - this.element.width * 0.5,
        y: this.mouse.y - this.element.height * 0.5,
      };
    }
    return { x: 0, y: 0 };
  }

  focus = () => {
    if (!this.hasFocus) {
      this.hasFocus = true;
      this.reset();
    }
  };
  blur = () => {
    this.hasFocus = false;
    this.reset();
  };

  mouseMove = (pageX: number, pageY: number) => {
    if (!this.mouse.down) return;
    this.mouse.x = clamp(pageX - this.offset.x, 0, this.element.width);
    this.mouse.y = clamp(pageY - this.offset.y, 0, this.element.height);
  };

  mouseDown = (pageX: number, pageY: number) => {
    this.mouse.down = true;
    this.mouse.x = clamp(pageX - this.offset.x, 0, this.element.width);
    this.mouse.y = clamp(pageY - this.offset.y, 0, this.element.height);
  };

  mouseUp = () => {
    this.mouse.down = false;
    if (this.hasFocus && this.onClick) {
      this.onClick(this.mouse.x, this.mouse.y);
    }
  };

  keyDown = (key: number) => {
    const keyName = this.getKeyName(key);
    const wasKeyDown = this.keys[keyName];
    this.keys[keyName] = true;
    if (this.onKeyDown && !wasKeyDown) {
      this.onKeyDown(keyName);
    }
    return this.hasFocus;
  };

  keyUp = (key: number) => {
    var name = this.getKeyName(key);
    this.keys[name] = false;
    if (this.onKeyUp) {
      this.onKeyUp(name);
    }
    return this.hasFocus;
  };

  reset = () => {
    this.keys = {};
    for (let i = 65; i < 128; i++) {
      this.keys[String.fromCharCode(i)] = false;
    }

    for (let i in KEYNAME) {
      this.keys[KEYNAME[i]] = false;
    }
    this.mouse = { down: false, x: 0, y: 0 };
  };

  getKeyName = (key: number) => {
    return KEYNAME[key] || String.fromCharCode(key);
  };
}

export class Clock {
  isRunning: boolean = false;
  now: number;
  timerId: number | null = null;
  onTick: Function;
  loopFunc: Function;

  constructor() {}

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.now = new Date().getTime();

    const timerLoop = (func: Function) => {
      this.timerId = setTimeout(func, 16);
    };

    // raf
    this.loopFunc = window.requestAnimationFrame.bind(window) || timerLoop;

    const animationFunc = (time: number) => {
      if (this.isRunning) {
        this.tick(time);
        this.loopFunc(animationFunc);
      }
    };

    // start
    this.loopFunc(animationFunc);
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  tick(tickTime: number) {
    this.onTick && this.onTick((tickTime - this.now) / 1000);
    this.now = tickTime;
  }

  setAnimationLoop(onTick: Function) {
    this.onTick = onTick;
  }
}

export class WebGLRenderer {
  clock: Clock;
  domElement: HTMLCanvasElement;
  cameraController: CameraController;
  inputHandler: InputHandler;
  gl: WebGLRenderingContext;

  constructor() {
    this.clock = new Clock();
    this.domElement = document.createElement('canvas');
    this.gl = this.domElement.getContext('webgl2');

    this.gl.enable(this.gl.DEPTH_TEST);
    this.inputHandler = new InputHandler(this.domElement);
    this.cameraController = new CameraController(this.inputHandler);
  }

  start() {
    this.clock.start();
  }

  stop() {
    if (this.clock.isRunning) {
      this.clock.stop();
    }
  }

  getGLRenderContext() {
    return this.gl;
  }

  setAnimationLoop(aniLoop: Function) {
    this.clock.setAnimationLoop(aniLoop);
  }

  render(scene: Scene.Graph, camera: Scene.Camera) {
    this.cameraController.tick(camera);
    camera.use(scene);
    scene.draw(camera, this.gl);
  }
}
