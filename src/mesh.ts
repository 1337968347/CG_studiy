import { makePerlin } from "./noise";

export const baseMesh = (size: number) => {
  const perlinNoise = makePerlin(Math.random());

  // 创建一个简单的矩形. 在这里我们左上和右下顶点被复制了两次。
  // 因为在两个三角面片里，这两个顶点都需要被用到。
  const vertices = new Float32Array(size * size * 6 * 3);
  let k = 0;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      let i = 0;
      let j = 0;
      i = x / size;
      j = y / size;
      vertices[k++] = i;
      vertices[k++] = perlinNoise.getUVPixel(i * 3, j * 3);
      vertices[k++] = j;

      i = x / size;
      j = (y + 1) / size;
      vertices[k++] = i;
      vertices[k++] = perlinNoise.getUVPixel(i * 3, j * 3);
      vertices[k++] = j;

      i = (x + 1) / size;
      j = (y + 1) / size;
      vertices[k++] = i;
      vertices[k++] = perlinNoise.getUVPixel(i * 3, j * 3);
      vertices[k++] = j;

      i = x / size;
      j = y / size;
      vertices[k++] = i;
      vertices[k++] = perlinNoise.getUVPixel(i * 3, j * 3);
      vertices[k++] = j;

      i = (x + 1) / size;
      j = (y + 1) / size;
      vertices[k++] = i;
      vertices[k++] = perlinNoise.getUVPixel(i * 3, j * 3);
      vertices[k++] = j;

      i = (x + 1) / size;
      j = y / size;
      vertices[k++] = i;
      vertices[k++] = perlinNoise.getUVPixel(i * 3, j * 3);
      vertices[k++] = j;
    }
  }

  return vertices;
};
