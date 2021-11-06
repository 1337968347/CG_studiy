attribute vec3 position;

uniform sampler2D terrainMap;
varying vec4 projected;

/// import "transform.glsl"

void main() {
    vec3 heightMap = vec3(position.x, texture2D(terrainMap, vec2(position.x, position.z)).a, position.z);
    transform(heightMap);
    projected = gl_Position;
}