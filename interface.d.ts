import { Texture2D, FrameBufferObject } from "./engine/glUtils";

export interface GlValue {
  uniform: (location: any, gl: WebGLRenderingContext) => void;
  value: any;
}

export interface UniformMap {
  [k: string]: GlValue | Texture2D | FrameBufferObject | number;
}
