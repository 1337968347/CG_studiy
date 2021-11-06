precision highp float;

varying vec3 worldPosition;
varying float depth;
varying vec3 fTexCoord;

uniform sampler2D terrainMap;
uniform vec3 sunColor;

void main() {
    vec3 normal = texture2D(terrainMap, fTexCoord.xz).rgb;
    gl_FragColor = vec4(normal.x, normal.y, normal.z, 0.5);
}