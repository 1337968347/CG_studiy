import { Texture2D, FrameBufferObject } from "./engine/glUtils";

export interface GlValue {
  uniform: (location: WebGLUniformLocation, gl: WebGLRenderingContext) => void;
  value: Float32Array | Number;
}

export interface UniformMap {
  [k: string]: GlValue | Texture2D | FrameBufferObject | number;
}
