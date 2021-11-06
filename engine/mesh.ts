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
      buffer[i++] = 0.5;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0.5;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = x / size;
      buffer[i++] = 0.5;
      buffer[i++] = y / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0.5;
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

export const makePerlinNoise = (seed: number) => {
  const perm = new Array(512);
  const gradP = new Array(512);

  const dot = (v1: number[], v2: number[]) => {
    return v1[0] * v2[0] + v1[1] * v2[1];
  };

  const p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62,
    94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111,
    229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
    28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115,
    121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  const grad3 = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];

  const fade = (t: number) => {
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  const lerp = (u: number, v: number, a: number) => {
    return u * (1 - a) + v * a;
  };

  const init = () => {
    if (seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    for (let i = 0; i < 256; i++) {
      let v: number;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed >> 8) & 255);
      }
      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  init();

  /**
   *
   * @param {*} u [0,1)
   * @param {*} v [0,1)
   */
  const getUVPixel = (u: number, v: number) => {
    // 当前晶格左上角的坐标
    const xInt = ~~u & 255;
    const yInt = ~~v & 255;

    // 小数部分
    let u1 = u - xInt;
    let v1 = v - yInt;

    const g00 = dot(gradP[xInt + perm[yInt]], [u1, v1]);

    const g01 = dot(gradP[xInt + perm[yInt + 1]], [u1, v1 - 1]);

    const g10 = dot(gradP[xInt + 1 + perm[yInt]], [u1 - 1, v1]);

    const g11 = dot(gradP[xInt + 1 + perm[yInt + 1]], [u1 - 1, v1 - 1]);

    const u2 = fade(u1);
    const v2 = fade(v1);

    return Math.abs(lerp(lerp(g00, g10, u2), lerp(g01, g11, u2), v2));
  };

  return { getUVPixel };
};

const getNoiseImageData = (size: number) => {
  const noise = makePerlinNoise(123);
  const imageData = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const p = noise.getUVPixel(i / 30, j / 30);
      imageData[(i * size + j) * 4 + 0] = 0;
      imageData[(i * size + j) * 4 + 1] = 0;
      imageData[(i * size + j) * 4 + 2] = 0;
      imageData[(i * size + j) * 4 + 3] = (1 - p) * 255;
    }
  }
  return new ImageData(imageData, size, size);
};

export default {
  gird,
  cute,
  wireFrame,
  screen_quad,
  makePerlinNoise,
  getNoiseImageData,
};
