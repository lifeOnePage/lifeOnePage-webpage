"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useHelper } from "@react-three/drei";
import { DirectionalLightHelper } from "three";

const RING_COUNT = 80;
const RING_RADIUS = 160;
const RING_SPEED = 0.003;

const COLORS = {
  background: "#1a1a1a",
  object: "rgba(150, 150, 150, 1)",
  tab: "rgba(128, 128, 128)",
  light: "#fff",
};

function PlaneWithTabs({ hovered }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(
        ref.current.position.x,
        hovered ? -80 : -20,
        0.05
      );
      ref.current.rotation.z = THREE.MathUtils.lerp(
        ref.current.rotation.z,
        hovered ? 0.3 : 0,
        0.05
      );
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        hovered ? Math.PI / 8 + 0.2 : Math.PI / 8,
        0.05
      );
      ref.current.position.z = THREE.MathUtils.lerp(
        ref.current.position.z,
        hovered ? 10 : 0,
        0.05
      );
    }
  });

  return (
    <group
      ref={ref}
      position={[0, 0, 0]}
      rotation={[Math.PI / 8, 0, 0]}
      name="plane"
    >
      <mesh name="plane-mesh">
        <planeGeometry args={[200, 120]} />
        <meshStandardMaterial
          color={hovered ? "#fff" : COLORS.object}
          transparent
          opacity={0.7 + 0.3 * hovered}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[i * 25 - 80, 64, 0.1]} name="plane-tab">
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial
            color={hovered ? "#fff" : COLORS.object}
            transparent
            opacity={0.7 + 0.3 * hovered}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function ImageRing({ hovered }) {
  const group = useRef();
  const speed = useRef(0);
  const tiltGroup = useRef();
  const currentRadius = useRef(RING_RADIUS);

  useFrame(() => {
    // 1. 회전 속도 부드럽게 변화
    const targetSpeed = hovered ? RING_SPEED * 6 : RING_SPEED;
    speed.current = THREE.MathUtils.lerp(speed.current, targetSpeed, 0.03);

    if (group.current) {
      group.current.rotation.x += speed.current;
    }

    // 2. 반지름 부드럽게 변화
    const targetRadius = hovered ? RING_RADIUS + 20 : RING_RADIUS;
    currentRadius.current = THREE.MathUtils.lerp(
      currentRadius.current,
      targetRadius,
      0.05
    );

    // 3. 기울기, 위치 변화
    if (tiltGroup.current) {
      tiltGroup.current.rotation.x = THREE.MathUtils.lerp(
        tiltGroup.current.rotation.x,
        hovered ? 0.8 : -0.1,
        0.05
      );
      tiltGroup.current.rotation.y = THREE.MathUtils.lerp(
        tiltGroup.current.rotation.y,
        hovered ? -0.1 : -0.2,
        0.05
      );
      tiltGroup.current.rotation.z = THREE.MathUtils.lerp(
        tiltGroup.current.rotation.z,
        hovered ? -0.4 : 0,
        0.05
      );
      tiltGroup.current.position.x = THREE.MathUtils.lerp(
        tiltGroup.current.position.x,
        hovered ? 20 : 0,
        0.05
      );
      tiltGroup.current.position.z = THREE.MathUtils.lerp(
        tiltGroup.current.position.z,
        hovered ? 10 : 0,
        0.05
      );
    }
  });

  const ringMeshes = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, j) => j); // index만 저장
  }, []);

  return (
    <group ref={tiltGroup}>
      <group ref={group} name="ring">
        {/* 투명한 토러스 호버 영역 */}
        <mesh
          name="ring-hover-area"
          rotation={[0, Math.PI / 2, 0]}
          userData={{ type: "ring" }}
        >
          <torusGeometry args={[RING_RADIUS, 30, 30, 40]} />
          <meshBasicMaterial
            transparent
            wireframe={true}
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>

        {ringMeshes.map((j) => {
          const angle = (Math.PI * 2 * j) / RING_COUNT;
          // const radius = currentRadius.current;

          const position = new THREE.Vector3(
            0,
            RING_RADIUS * Math.cos(angle),
            RING_RADIUS * Math.sin(angle)
          );
          const direction = new THREE.Vector3()
            .subVectors(new THREE.Vector3(0, 0, 0), position)
            .normalize();
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction
          );

          return (
            <mesh
              key={j}
              position={position}
              quaternion={quaternion}
              userData={{ type: "ring" }}
            >
              <planeGeometry args={[60, 40]} />
              <meshStandardMaterial
                color={hovered ? "#fff" : COLORS.object}
                opacity={0.5 + 0.3 * hovered}
                transparent
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function HoverDescription({ align, visible, title, text, onPreviewRequest }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [align]: visible ? 0 : "-40%",
        transform: "translateY(-50%)",
        transition: "all 0.5s ease",
        color: "white",
        padding: "24px",
        width: "30vw",
        background: "rgba(0,0,0,0.6)",
        textAlign: align === "left" ? "left" : "right",
        pointerEvents: "none",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{title}</h2>
      <p>{text}</p>
      <br />
      <button
        onClick={onPreviewRequest}
        style={{ marginTop: "8px", pointerEvents: "auto", cursor: "pointer" }}
      >
        미리보기 보기
      </button>
    </div>
  );
}

function SceneContent({
  hoveredPlane,
  hoveredRing,
  setHoveredPlane,
  setHoveredRing,
}) {
  const raycasterRef = useRef(new THREE.Raycaster());
  const { mouse, camera, scene } = useThree();
  const dirLightRef = useRef();

  // helper 연결
  useHelper(dirLightRef, DirectionalLightHelper, 50, "hotpink");
  // console.log(camera.position);
  // console.log(camera.rotation);
  useFrame(() => {
    const raycaster = raycasterRef.current;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // let planeHover = false;
    // let ringHover = false;

    for (const hit of intersects) {
      const obj = hit.object;
      if (obj.name?.includes("plane")) {
        // planeHover = true;
        setHoveredRing(false);
        setHoveredPlane(true);
        break;
      } else if (obj.userData?.type === "ring") {
        // ringHover = true;
        setHoveredPlane(false);
        setHoveredRing(true);
      }
    }

    
    
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        color={COLORS.light}
        // ref={dirLightRef}
        intensity={0.9}
        position={[-3, 0, 3]}
        castShadow
      />
      <PlaneWithTabs hovered={hoveredPlane} />
      <ImageRing hovered={hoveredRing} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

function Main3FGraphic({ onPreviewRequest }) {
  const [hoveredPlane, setHoveredPlane] = useState(false);
  const [hoveredRing, setHoveredRing] = useState(false);
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas
        style={{ height: "100%", width: "100%", background: COLORS.background }}
        camera={{
          position: [-150, -200, 300],
          rotation: [
            0.5544033973614877, -0.392225262284232, 0.2324024567973883,
          ],
          fov: 50,
        }}
      >
        <fog attach="fog" args={["#fefefe", 100, 500]} />
        <SceneContent
          hoveredPlane={hoveredPlane}
          hoveredRing={hoveredRing}
          setHoveredPlane={setHoveredPlane}
          setHoveredRing={setHoveredRing}
        />
      </Canvas>

      <HoverDescription
        align="left"
        visible={hoveredPlane}
        title="Life Card"
        text="이곳은 탭형 인터페이스를 표현한 오브젝트입니다."
        onPreviewRequest={onPreviewRequest}
      />
      <HoverDescription
        align="right"
        visible={hoveredRing}
        title="Life Page"
        text="이곳은 이미지가 링 형태로 배치된 오브젝트입니다."
        onPreviewRequest={onPreviewRequest}
      />
    </div>
  );
}
export default Main3FGraphic;
