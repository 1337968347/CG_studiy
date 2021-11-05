import * as Scene from "./scene";
import { GlValue } from "../interface";

const createGlValue = (set, value) => {
  const setValue = (value): GlValue => {
    const uniform = (location) => {
      set(location, value);
    };
    return { uniform, value };
  };
  return setValue(value);
};

export const Mat4 = (value) => {
  return createGlValue(
    (location: WebGLUniformLocation, gl: WebGLRenderingContext) => {
      gl.uniformMatrix4fv(location, false, value);
    },
    value
  );
};

export const Mat3 = (value) => {
  return createGlValue(
    (location: WebGLUniformLocation, gl: WebGLRenderingContext) => {
      gl.uniformMatrix3fv(location, false, value);
    },
    value
  );
};

export const Vec3 = (value) => {
  return createGlValue(
    (location: WebGLUniformLocation, gl: WebGLRenderingContext) => {
      gl.uniform3fv(location, value);
    },
    value
  );
};

export const Vec4 = (value) => {
  return createGlValue(
    (location: WebGLUniformLocation, gl: WebGLRenderingContext) => {
      gl.uniform4fv(location, value);
    },
    value
  );
};

export const Int = (value) => {
  return createGlValue(
    (location: WebGLUniformLocation, gl: WebGLRenderingContext) => {
      gl.uniform1i(location, value);
    },
    value
  );
};

export const uniform = {
  Mat4,
  Mat3,
  Vec3,
  Vec4,
  Int,
};
export class Texture2D {
  gl: WebGLRenderingContext;
  texture: WebGLTexture;
  image: HTMLImageElement;
  unit: number = -1;

  constructor(image: HTMLImageElement, gl: WebGLRenderingContext) {
    this.image = image;
    this.gl = gl;
    this.texture = this.gl.createTexture();
    this.bindTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  bindTexture(unit?: number) {
    if (unit !== undefined) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.unit = unit;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  unbindTexture() {
    this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  uniform(location: WebGLUniformLocation) {
    this.gl.uniform1i(location, this.unit);
  }
}

export class FrameBufferObject {
  width: number;
  height: number;
  gl: WebGLRenderingContext;
  frameBuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  depth: WebGLRenderbuffer;
  unit = -1;

  constructor(
    gl: WebGLRenderingContext,
    width: number,
    height: number,
    format?: number
  ) {
    this.width = width;
    this.height = height;
    this.gl = gl;
    // FBO 对帧缓存进行操作
    this.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // 创建一个空的纹理
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      format || gl.UNSIGNED_BYTE,
      null
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 存储数据，例如图像，或者可以是渲染操作的源或目标。
    this.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
    // 创建并初始化渲染缓冲区对象的数据存储。
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height
    );
    // 将纹理对象关联到FBO
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.depth
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
    this.gl.viewport(0, 0, this.width, this.height);
  }

  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  bindTexture(unit?: number) {
    if (unit !== undefined) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.unit = unit;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  unbindTexture() {
    this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  uniform(location: WebGLUniformLocation) {
    this.gl.uniform1i(location, this.unit);
  }
}

/**
 * 创建一个存储对象。可以在场景图遍历的过程中动态bind
 */
export class BufferObject {
  gl: WebGLRenderingContext;
  buffer: WebGLBuffer;
  length: number;
  constructor(vertexData: Float32Array, gl: WebGLRenderingContext) {
    this.gl = gl;
    this.buffer = this.gl.createBuffer();
    this.bind();
    this.length = vertexData.length;
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.STATIC_DRAW);
    this.unbind();
  }

  bind() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
  }

  unbind() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }
}
export class VertexBufferObject extends BufferObject {
  gl: WebGLRenderingContext;
  buffer: WebGLBuffer;
  length: number;
  constructor(vertexData: Float32Array, gl: WebGLRenderingContext) {
    super(vertexData, gl);
  }

  drawTriangles() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.length / 3);
  }
}

// 获取图片的RGBA数组
export const getImageData = (imageEl: HTMLImageElement) => {
  const canvasEl = document.createElement("canvas");
  const ctx = canvasEl.getContext("2d");
  canvasEl.width = imageEl.width;
  canvasEl.height = imageEl.height;
  ctx.drawImage(imageEl, 0, 0);
  return ctx.getImageData(0, 0, imageEl.width, imageEl.height);
};

// 获取图片指定纹理地址的高度
export const sampleHeight = (imgData: ImageData, u: number, v: number) => {
  // ~~ 符号是向下取整
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0.0;
  var x = ~~(imgData.width * u),
    y = ~~(imgData.height * v),
    i = (y * imgData.width + x) * 4 + 3;
  return imgData.data[i] / 255;
};

export const setCanvasFullScreen = (
  canvas: HTMLCanvasElement,
  scene: Scene.Graph
) => {
  const onResize = () => {
    canvas.width = scene.viewport.width = window.innerWidth;
    canvas.height = scene.viewport.height = window.innerHeight;
  };
  window.addEventListener("resize", onResize, false);
  onResize();
};
