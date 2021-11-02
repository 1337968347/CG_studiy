import * as Scene from "../engine/scene";

export class Clock {
  isRunning: boolean = false;
  now: number;
  timerId: number | null = null;
  onTick: Function;
  loopFunc: Function;
  webXRSession?: XRSession;

  constructor(xRSession?: XRSession) {
    if (xRSession) {
      this.webXRSession = xRSession;
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.now = new Date().getTime();

    const timerLoop = (func: Function) => {
      this.timerId = setTimeout(func, 16);
    };

    // raf
    this.loopFunc = this.webXRSession
      ? this.webXRSession.requestAnimationFrame
      : window.requestAnimationFrame || timerLoop;

    const animationFunc = (time: number, frame: XRFrame) => {
      if (this.isRunning) {
        this.tick(time, frame);
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

    if (this.webXRSession) {
      this.webXRSession.end();
      this.webXRSession = undefined;
    }
  }

  tick(tickTime: number, xrFrame: XRFrame) {
    this.onTick && this.onTick((tickTime - this.now) / 1000, xrFrame);
    this.now = tickTime;
  }

  setAnimationLoop(onTick: Function) {
    this.onTick = onTick;
  }
}

export class WebGLRenderer {
  clock: Clock;
  domElement: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  xrSession: XRSession;
  xRReferenceSpace: XRReferenceSpace;

  constructor(xrSession?: XRSession) {
    this.clock = new Clock(xrSession);
    this.domElement = document.createElement("canvas");
    this.gl = this.domElement.getContext("webgl2");
    this.xrSession = xrSession;
    xrSession.requestReferenceSpace("local").then((xRReferenceSpace) => {
      this.xRReferenceSpace = xRReferenceSpace;
    });
  }

  start() {
    this.clock.start();
  }

  stop() {
    if (this.clock.isRunning) {
      this.clock.stop();
    }
  }

  setAnimationLoop(aniLoop: Function) {
    this.clock.setAnimationLoop(aniLoop);
  }

  render(scene: Scene.Graph, camera: Scene.Camera, xrFrame: XRFrame) {
    if (xrFrame) {
      const eyes = xrFrame.getViewerPose(this.xRReferenceSpace);
      let baseLayer = xrFrame.session.renderState.baseLayer;
      for (let xrView of eyes.views) {
        let viewPort = baseLayer.getViewport(xrView);
        this.gl.viewport(
          viewPort.x,
          viewPort.y,
          viewPort.width,
          viewPort.height
        );
        scene.viewport = {
          x: viewPort.x,
          y: viewPort.y,
          width: viewPort.width,
          height: viewPort.height,
        };

        camera.use(scene, xrView);
        scene.draw(camera, xrFrame);
      }
    } else {
      camera.use(scene);
      scene.draw(camera);
    }
  }
}
