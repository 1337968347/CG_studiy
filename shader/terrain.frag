precision highp float;

varying vec3 worldPosition;
varying float depth;
varying vec3 fTexCoord;

uniform sampler2D terrainMap;
uniform vec3 eye;

/// import "sunlight.glsl"

void main() {
    vec4 heightPixel = texture2D(terrainMap, fTexCoord.xz);
    vec3 surfaceNormal = normalize(heightPixel.rbg - 0.5);
    vec3 eyeNormal = normalize(eye - worldPosition);
    // gl_FragColor = vec4(sunColor *0.3 + sunLight(surfaceNormal, eyeNormal, 20.0, 0.3, 0.9), 1.0);
    gl_FragColor = vec4(heightPixel.rbg, 1.0);
}