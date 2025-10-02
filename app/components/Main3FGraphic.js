"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useHelper } from "@react-three/drei";
import { DirectionalLightHelper } from "three";
import MainHeader from "./MainHeader";
import AboutLines from "./AboutLines";
import Mypage from "./Mypage";
import { BsChevronCompactLeft, BsChevronCompactRight } from "react-icons/bs";
import { AnimatePresence, motion } from "framer-motion";
import { FaSquareFull } from "react-icons/fa";
import { BLACK } from "../styles/colorConfig";
import TabPlanePictogram from "./TabPlanePictogram";
import RingPictogram from "./RingPictogram";
import { useSpring, to as fmTo } from "@react-spring/core"; // 이미 쓰는 framer만으로도 가능하지만, 부드럼용 예시

const RING_COUNT = 80;
const RING_RADIUS = 140;
const RING_SPEED = 0.003;

const COLORS = {
  background: "#1a1a1a",
  object: "rgba(50, 50, 50, 1)",
  tab: "rgba(50, 50, 50)",
  light: "#fff",
};

function CameraZoom({ mode }) {
  const { camera, size } = useThree();

  // default에서 약간 확대, mypage에서 기본값
  const targetZoom = mode === "default" ? 1.5 : 1.0;

  // 부드러운 전환: framer-motion만 쓰고 싶다면 useMotionValue/useSpring로 대체 가능
  const { z } = useSpring({
    z: targetZoom,
    config: { tension: 180, friction: 20 },
  });

  useFrame(() => {
    const zoom = z.get ? z.get() : targetZoom; // (react-spring / framer 둘 중 택1)
    camera.zoom = zoom; // ★ zoom으로 전체 장면 확대/축소
    camera.updateProjectionMatrix();
  });

  // 리사이즈 때 aspect 갱신(안전)
  React.useEffect(() => {
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function PlaneWithTabs({ hovered, onPreviewRequest }) {
  const texture = useLoader(THREE.TextureLoader, "/images/texture.jpg");
  const displacement = useLoader(
    THREE.TextureLoader,
    "/images/displacement.jpg"
  );
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
      onClick={() => onPreviewRequest("card")}
    >
      <mesh name="plane-mesh" userData={{ type: "plane" }}>
        <planeGeometry args={[200, 120, 128, 128]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff55" : COLORS.object}
          transparent
          opacity={0.4 + 0.3 * hovered}
          side={THREE.DoubleSide}
        />
        {/* <meshStandardMaterial
          map={texture}
          displacementMap={displacement}
          displacementScale={-5}
          side={THREE.DoubleSide}
        /> */}
      </mesh>
      {/* <mesh
        name="plane-mesh"
        userData={{ type: "plane" }}
        rotation={[Math.PI / 16, -Math.PI / 16, 0]}
      >
        <planeGeometry args={[220, 130, 20, 10]} />
        <meshStandardMaterial wireframe={true} />
      </mesh> */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[i * 25 - 80, 64, 0.1]}
          name="plane-tab"
          userData={{ type: "plane" }}
        >
          <planeGeometry args={[20, 10, 128, 128]} />
          <meshStandardMaterial
            color={hovered ? "#fff" : COLORS.object}
            transparent
            opacity={0.4 + 0.3 * hovered}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

const ENTRANCE_OFFSET = 80; // 시작 시 바깥쪽으로 얼마나 떨어져서 들어올지(px)
const STAGGER = 0.02; // 플레인별 지연(초)
const DURATION = 0.9; // 한 플레인이 들어오는 데 걸리는 시간(초)

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/** 개별 플레인: 위치/불투명도/색을 프레임마다 업데이트 */
function RingPlane({
  outDir, // 원점→플레인 방향 (정규화)
  quat, // 플레인이 원점을 향하도록 고정된 회전
  delay, // 개별 스태거 지연
  hoveredRef, // 호버 상태 참조
  currentRadiusRef, // 부모에서 관리하는 부드러운 반지름
  colorOn, // hovered true일 때 색
  colorOff, // hovered false일 때 색
}) {
  const meshRef = useRef();
  const matRef = useRef();
  const startedAt = useRef(null);

  useFrame((state) => {
    if (!startedAt.current) startedAt.current = state.clock.getElapsedTime();
    const elapsed = state.clock.getElapsedTime() - startedAt.current;

    // 0~1 진행도 (스태거 반영)
    const p = THREE.MathUtils.clamp((elapsed - delay) / DURATION, 0, 1);
    const e = easeOutCubic(p);

    // 반지름: 바깥에서 최종 반지름으로 미끄러지듯
    const r = currentRadiusRef.current + ENTRANCE_OFFSET * (1 - e);

    // 위치 갱신 (그룹 로컬좌표)
    // outDir은 원점→플레인 방향이므로 그냥 r 곱하면 됨
    if (meshRef.current) {
      meshRef.current.position.copy(outDir).multiplyScalar(r);
      meshRef.current.quaternion.copy(quat);
    }

    // 머티리얼: 색 + 불투명도(등장 페이드인)
    const hovered = hoveredRef.current;
    const baseOpacity = 0.4 + 0.3 * (hovered ? 1 : 0); // 기존 로직 반영
    const targetOpacity = baseOpacity * (0.2 + 0.8 * e);
    if (matRef.current) {
      matRef.current.opacity = targetOpacity;
      const targetColor = hovered ? colorOn : colorOff;
      matRef.current.color.set(targetColor);
    }
  });

  return (
    <mesh ref={meshRef} userData={{ type: "ring" }}>
      <planeGeometry args={[60, 40, 128, 128]} />
      <meshStandardMaterial
        ref={matRef}
        transparent
        side={THREE.DoubleSide}
        opacity={0} // 시작은 투명
      />
    </mesh>
  );
}

function ImageRing({ hovered, onPreviewRequest }) {
  const group = useRef();
  const speed = useRef(0);
  const tiltGroup = useRef();
  const currentRadius = useRef(RING_RADIUS);
  const hoveredRef = useRef(hovered);
  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  // (선택) 텍스처 로딩 — 사용 안 해도 에러는 없음
  useLoader(THREE.TextureLoader, "/images/texture.jpg");
  useLoader(THREE.TextureLoader, "/images/displacement.jpg");

  // 각 플레인의 '방사 방향(outDir)'과 '회전(quat)', '스태거 지연(delay)'을 미리 계산
  const planes = useMemo(() => {
    const arr = [];
    const mid = (RING_COUNT - 1) / 2; // 중앙에서 좌우로 퍼지는 느낌의 스태거
    for (let j = 0; j < RING_COUNT; j++) {
      const angle = (Math.PI * 2 * j) / RING_COUNT;

      // 원점 → 플레인(반지름 1로 정규화한 방향)
      const outDir = new THREE.Vector3(
        0,
        Math.cos(angle),
        Math.sin(angle)
      ).normalize();

      // 플레인이 원점을 향하도록: (0,1,0) → (원점-플레인) 방향
      const inDir = outDir.clone().multiplyScalar(-1); // 플레인→원점
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        inDir
      );

      // 중앙에서 바깥으로 퍼지는 스태거(원하면 j*STAGGER로 단순화 가능)
      const order = Math.abs(j - mid); // 중앙에 가까울수록 delay 작게
      const delay = order * STAGGER;

      arr.push({ j, outDir, quat, delay });
    }
    return arr;
  }, []);

  // 회전/반지름/기울기 애니메이션(기존 로직 유지)
  useFrame(() => {
    // 1) 회전 속도 부드럽게
    const targetSpeed = hovered ? RING_SPEED * 6 : RING_SPEED;
    speed.current = THREE.MathUtils.lerp(speed.current, targetSpeed, 0.03);
    if (group.current) group.current.rotation.x += speed.current;

    // 2) 반지름 부드럽게
    const targetRadius = hovered ? RING_RADIUS + 20 : RING_RADIUS;
    currentRadius.current = THREE.MathUtils.lerp(
      currentRadius.current,
      targetRadius,
      0.05
    );

    // 3) 기울기/위치 부드럽게
    if (tiltGroup.current) {
      tiltGroup.current.rotation.x = THREE.MathUtils.lerp(
        tiltGroup.current.rotation.x,
        hovered ? 0.5 : -0.1,
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

  return (
    <group ref={tiltGroup} onClick={() => onPreviewRequest("page")}>
      <group ref={group} name="ring">
        {/* 투명한 토러스: 호버 영역(반지름은 고정이라도 상관없음) */}
        <mesh
          name="ring-hover-area"
          rotation={[0, Math.PI / 2, 0]}
          userData={{ type: "ring" }}
        >
          <torusGeometry args={[RING_RADIUS, 35, 60, 80]} />
          <meshBasicMaterial transparent opacity={0.1} depthWrite={false} />
        </mesh>

        {/* 플레인들: 미끄러지듯 조립 */}
        {planes.map(({ j, outDir, quat, delay }) => (
          <RingPlane
            key={j}
            outDir={outDir}
            quat={quat}
            delay={delay}
            hoveredRef={hoveredRef}
            currentRadiusRef={currentRadius}
            colorOn="#ffffff"
            colorOff={COLORS.object}
          />
        ))}
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
  mode,
  hoveredPlane,
  hoveredRing,
  setHoveredPlane,
  setHoveredRing,
  onPreviewRequest,
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
    setHoveredRing(false);
    setHoveredPlane(false);
    if (mode === "init") {
      for (const hit of intersects) {
        const obj = hit.object;
        if (obj.userData?.type === "plane") {
          // planeHover = true;
          setHoveredRing(false);
          setHoveredPlane(true);
          break;
        } else if (obj.userData?.type === "ring") {
          // ringHover = true;
          setHoveredPlane(false);
          setHoveredRing(true);
          break;
        }
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        color={COLORS.light}
        // ref={dirLightRef}
        intensity={0.9}
        position={[-3, 0, 3]}
        castShadow
      />
      <PlaneWithTabs
        hovered={hoveredPlane}
        onPreviewRequest={onPreviewRequest}
      />
      <ImageRing hovered={hoveredRing} onPreviewRequest={onPreviewRequest} />

      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

function Main3FGraphic({ onPreviewRequest, initialData, setTrigger }) {
  const [hoveredPlane, setHoveredPlane] = useState(false);
  const [hoveredRing, setHoveredRing] = useState(false);
  const [mode, setMode] = useState("default"); // "default" | "mypage"
  const [id, setId] = useState("");
  console.log(initialData);

  // 헤더에서 호출하는 모드 변경 핸들러를 인터셉트:
  // - about: 모드 변경 없이 100vh 아래로 스크롤
  // - mypage: 모드 = "mypage"
  // - default: 모드 = "default"
  const handleHeaderModeChange = useCallback((next) => {
    if (next === "about") {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      return;
    }
    if (next === "mypage") {
      window.scrollTo({ top: -1 * window.innerHeight, behavior: "smooth" });
      setMode("mypage");
      return;
    }
    setMode("default");
  }, []);

  // 공통 전환
  const TRANSITION = { type: "spring", stiffness: 100, damping: 20 };

  // 캔버스 래퍼 이동(요구사항: default에서 약간 오른쪽 치우침, mypage에서 살짝 왼쪽 이동)
  const canvasVariants = {
    default: { x: "20vw", opacity: 1, transition: TRANSITION },
    mypage: { x: "-10vw", opacity: 0.9, transition: TRANSITION },
  };

  // AboutLines 가시성(요구사항: mypage에서 opacity 0)
  const aboutVariants = {
    default: { opacity: 1, transition: { ...TRANSITION, duration: 0.25 } },
    mypage: { opacity: 0, transition: { ...TRANSITION, duration: 0.25 } },
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000", // 배경이 있다면 유지/수정
      }}
    >
      {/* 헤더: setMode를 인터셉터로 전달 */}
      <MainHeader setMode={handleHeaderModeChange} setTrigger={setTrigger} />

      {/* Canvas + Overlays */}
      <motion.div
        style={{ position: "relative", width: "100%", height: "100%" }}
        // initial={false}
        animate={mode}
      >
        <motion.div
          style={{
            position: "absolute",
            top: "50%",
            // left: 10,
            width: 380,
            transform: "translateY(-50%)",
            pointerEvents: "none", // 오버레이지만 클릭 막기
            zIndex: 2,
          }}
          variants={aboutVariants}
        >
          {/* <AboutLines /> */}
        </motion.div>

        {/* 3D Canvas (화면 전체에 깔고, variants로 x만 미세 이동) */}
        <motion.div
          variants={canvasVariants}
          style={{
            position: "absolute",
            inset: 0,
            willChange: "transform",
            zIndex: 1,
          }}
        >
          <Canvas
            shadows
            dpr={[1, 2]}
            style={{ width: "100%", height: "100%" }}
            camera={{
              position: [-300, -180, 400],
              rotation: [0.5, -0.79, 0.37],
              fov: 50,
            }}
          >
            <CameraZoom mode={mode} />
            <fog attach="fog" args={["#fefefe", 100, 500]} />
            <SceneContent
              mode={mode}
              hoveredPlane={hoveredPlane}
              hoveredRing={hoveredRing}
              setHoveredPlane={setHoveredPlane}
              setHoveredRing={setHoveredRing}
              onPreviewRequest={onPreviewRequest}
            />
          </Canvas>
        </motion.div>

        {/* 오른쪽 마이페이지 패널 (너비 380px, 슬라이드 인/아웃) */}
        <AnimatePresence>
          {mode === "mypage" && (
            <motion.aside
              key="mypage-panel"
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={TRANSITION}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "100%",
                width: 380,
                background: "rgba(20,20,20,0.9)",
                color: "#fff",
                boxShadow: "0 0 24px rgba(0,0,0,0.35)",
                overflow: "auto",
                willChange: "transform, opacity",
                zIndex: 3,
              }}
            >
              <div style={{ padding: 16 }}>
                {/* Mypage 내에서도 setMode를 사용할 수 있게 전달
                    -> 닫기 시 setMode("default") 호출하면 패널이 오른쪽으로 빠지고 AboutLines 복귀 */}
                <Mypage
                  id={id}
                  setId={setId}
                  initialData={initialData}
                  setMode={setMode}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Main3FGraphic;
