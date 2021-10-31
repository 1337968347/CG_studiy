export class WebXr {
  webXRSession: XRSession;
  baseLayer: XRWebGLLayer;
  XRReferenceSpace: XRReferenceSpace;
  gl: WebGLRenderingContext;

  constructor(webXRSession: XRSession, gl: WebGLRenderingContext) {
    this.webXRSession = webXRSession;
    this.gl = gl;
    this.init();
  }

  async init() {
    this.baseLayer = new XRWebGLLayer(this.webXRSession, this.gl);
    this.XRReferenceSpace = await this.webXRSession.requestReferenceSpace(
      "local"
    );
  }

  setProjection(near: number, far: number) {
    this.webXRSession.updateRenderState({
      baseLayer: this.baseLayer,
      depthFar: far,
      depthNear: near,
    });
  }

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.baseLayer.framebuffer);
  }

  unbind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
