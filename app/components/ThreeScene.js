// ThreeScene.js
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ImageRing from './ImageRing'; // or wherever
// ...

export default function ThreeFiberScene({ ref, onLeftmostChange, onCategoryChange, onImageClick, onControlChange}) {
  const ringRef = useRef();

  return (
    <Canvas camera={{ position: [0, 150, 400], fov: 75 }} >
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 200, 300]} intensity={1} />

      <OrbitControls
        enableZoom={false}
        // onChange: 카메라 조작 중 실시간 업데이트가 필요하다면
        // onEnd: 조작이 끝난 뒤 한 번만
        onChange={onControlChange}
      />

      <ImageRing ref={ref} onImageClick={onImageClick} onCategoryChange={onCategoryChange} onLeftmostChange={onLeftmostChange} />
    </Canvas>
  );
}
