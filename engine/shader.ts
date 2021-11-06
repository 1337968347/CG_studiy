import { UniformMap } from '../interface';
/**
 * 创建一个Shader
 * @param gl
 * @param shaderType
 * @param source
 * @returns
 */
const makeShader = (gl: WebGLRenderingContext, shaderType: number, source: string) => {
  const shader = gl.createShader(shaderType);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader), shaderType, source);
    throw 'Compiler exception: "' + gl.getShaderInfoLog(shader) + '"';
  }
  return shader;
};

/**
 * 创建一个WebGLProgram
 * @param gl
 * @param vertexSource
 * @param fragmentSource
 * @returns
 */
const makeProgram = (gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) => {
  const vertexShader = makeShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw 'Linker exception: ' + gl.getProgramInfoLog(program);
  }
  return program;
};

/**
 * 创建一个shader
 * @param gl
 * @param vertexSource
 * @param fragmentSource
 * @returns
 */
export class Shader {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniformLocations: { [key: string]: WebGLUniformLocation } = {};

  constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl;
    this.program = makeProgram(this.gl, vertexSource, fragmentSource);
  }

  use() {
    this.gl.useProgram(this.program);
  }

  uniforms(values: UniformMap) {
    for (let name in values) {
      const value = values[name];
      let location: WebGLUniformLocation;

      if (this.uniformLocations[name] !== undefined) {
        location = this.uniformLocations[name];
      } else {
        location = this.gl.getUniformLocation(this.program, name);
        this.uniformLocations[name] = location;
      }
      // 着色器中没有用到这个变量
      if (location === null) {
        continue;
      }
      if (typeof value === 'number') {
        this.gl.uniform1f(location, value);
      } else {
        value.uniform(location, this.gl);
      }
    }
  }

  getAttribLocation(name: string) {
    const location = this.gl.getAttribLocation(this.program, name);
    if (location < 0) throw 'attribute not found';
    return location;
  }
}

export class ShaderManager {
  shaders: { [propName: string]: Shader } = {};
  importExpression = /\/\/\/\s*import "([^"]+)"/g;
  resources: any;
  gl: WebGLRenderingContext;

  constructor(resources: any, gl: WebGLRenderingContext) {
    this.resources = resources;
    this.gl = gl;
  }

  get(vertex: string, frag?: string) {
    if (!frag) {
      frag = vertex + '.frag';
      vertex = vertex + '.vert';
    }
    const key = `${vertex}-${frag}`;
    if (!(key in this.resources)) {
      this.shaders[key] = new Shader(this.gl, this.getSource(vertex), this.getSource(frag));
    }
    return this.shaders[key];
  }

  getSource(shaderPath: string) {
    const name = this._getSourceName(shaderPath);
    const path = name;
    const shaderSourceStr: string = this.resources[path];
    if (shaderSourceStr == undefined) {
      throw new Error(`cant found ${shaderPath} Source`);
    }
    return shaderSourceStr.replace(this.importExpression, (_, name) => {
      return this.getSource(name);
    });
  }

  _getSourceName(name) {
    const nameArr = name.split('/');
    return nameArr[nameArr.length - 1];
  }
}
