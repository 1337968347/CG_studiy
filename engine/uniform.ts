import { getGL, Texture2D, FrameBufferObject } from './glUtils';
export interface GlValue {
  uniform: (location: any) => void;
  value: any;
}

export interface UniformMap {
  [k: string]: GlValue | Texture2D | FrameBufferObject | number;
}

const createGlValue = (set, value) => {
  const setValue = (value): GlValue => {
    const uniform = location => {
      set(location, value);
    };
    return { uniform, value };
  };
  return setValue(value);
};

const gl: WebGLRenderingContext = getGL();

export const Mat4 = value => {
  return createGlValue((location: WebGLUniformLocation) => {
    gl.uniformMatrix4fv(location, false, value);
  }, value);
};

export const Mat3 = value => {
  return createGlValue((location: WebGLUniformLocation) => {
    gl.uniformMatrix3fv(location, false, value);
  }, value);
};

export const Vec3 = value => {
  return createGlValue((location: WebGLUniformLocation) => {
    gl.uniform3fv(location, value);
  }, value);
};

export const Vec4 = value => {
  return createGlValue((location: WebGLUniformLocation) => {
    gl.uniform4fv(location, value);
  }, value);
};

export const Int = value => {
  return createGlValue((location: WebGLUniformLocation) => {
    gl.uniform1i(location, value);
  }, value);
};
