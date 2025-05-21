import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// 1. vertex shader
const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 2. fragment shader
const fragmentShader = `
uniform vec3 uColor;
uniform float opacity;
varying vec3 vPosition;
void main() {
  float dist = length(vPosition.xy);
  float fade = 1.0 - smoothstep(0.05,1000.0, dist);
  gl_FragColor = vec4(uColor, 1.0);
}
`;

// 3. material 생성
const BeamGlowMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("gray"),
    opacity:1.0,
  },
  vertexShader,
  fragmentShader
);

export default BeamGlowMaterial;
