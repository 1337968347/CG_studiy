// 采样
export const gird = (size: number) => {
  const buffer = new Float32Array(size * size * 6 * 3);
  let i = 0;

  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      buffer[i++] = x / size;
      buffer[i++] = 0;
      buffer[i++] = y / size;

      buffer[i++] = x / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = x / size;
      buffer[i++] = 0;
      buffer[i++] = y / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = y / size;
    }
  }
  return buffer;
};

export const wireFrame = (input: Float32Array) => {
  const output = new Float32Array(input.length * 2);
  const triangles = input.length / 9;
  for (var t = 0; t < triangles; t++) {
    for (var v1 = 0; v1 < 3; v1++) {
      var v2 = (v1 + 1) % 3;
      for (var i = 0; i < 3; i++) {
        output[t * 18 + v1 * 3 + i] = input[t * 9 + v1 * 3 + i];
        output[t * 18 + v1 * 3 + 9 + i] = input[t * 9 + v2 * 3 + i];
      }
    }
  }
  return output;
};

// 屏幕上一个正方形
export const screen_quad = () => {
  return new Float32Array([
    -1, 1, 0, -1, -1, 0, 1, -1, 0,

    -1, 1, 0, 1, -1, 0, 1, 1, 0,
  ]);
};

export const cute = (scale?: number) => {
  scale = scale || 1;
  return new Float32Array([
    // back
    scale,
    scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,
    -scale,
    scale,

    scale,
    scale,
    scale,
    -scale,
    -scale,
    scale,
    -scale,
    scale,
    scale,

    // front
    -scale,
    scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    scale,
    -scale,

    scale,
    scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    -scale,
    -scale,
    // left
    -scale,
    scale,
    scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    -scale,

    -scale,
    scale,
    scale,
    -scale,
    -scale,
    scale,
    -scale,
    -scale,
    -scale,

    // right
    scale,
    scale,
    scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,
    -scale,

    scale,
    scale,
    scale,
    scale,
    -scale,
    -scale,
    scale,
    -scale,
    scale,

    // top
    scale,
    scale,
    scale,
    -scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,

    scale,
    scale,
    -scale,
    scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,

    // bottom
    -scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    scale,
    -scale,
    scale,

    -scale,
    -scale,
    -scale,
    scale,
    -scale,
    scale,
    scale,
    -scale,
    -scale,
  ]);
};

// 解析Obj格式
export const parseObj = (text: string) => {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [objPositions, objTexcoords, objNormals];

  // same order as `f` indices
  let webglVertexData = [
    [], // positions
    [], // texcoords
    [], // normals
  ];

  function addVertex(vert) {
    const ptn = vert.split("/");
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split("\n");
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      // console.warn('unhandled keyword:', keyword); // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }
  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
};

export default { gird, cute, parseObj, wireFrame, screen_quad };
