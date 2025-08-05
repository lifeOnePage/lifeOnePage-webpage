"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useHelper } from "@react-three/drei";
import { DirectionalLightHelper } from "three";
import MainHeader from "./MainHeader";
import AboutLines from "./AboutLines";
import Mypage from "./Mypage";
import { BsChevronCompactLeft, BsChevronCompactRight } from "react-icons/bs";
import { motion } from "framer-motion";
import { FaSquareFull } from "react-icons/fa";
import { BLACK } from "../styles/colorConfig";
import TabPlanePictogram from "./TabPlanePictogram";
import RingPictogram from "./RingPictogram";

const RING_COUNT = 80;
const RING_RADIUS = 140;
const RING_SPEED = 0.003;

const COLORS = {
  background: "#1a1a1a",
  object: "rgba(50, 50, 50, 1)",
  tab: "rgba(50, 50, 50)",
  light: "#fff",
};

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
      onClick={()=>onPreviewRequest("card")}
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

function ImageRing({ hovered, onPreviewRequest }) {
  const group = useRef();
  const speed = useRef(0);
  const tiltGroup = useRef();
  const currentRadius = useRef(RING_RADIUS);
  const texture = useLoader(THREE.TextureLoader, "/images/texture.jpg");
  const displacement = useLoader(
    THREE.TextureLoader,
    "/images/displacement.jpg"
  );
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

  const ringMeshes = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, j) => j); // index만 저장
  }, []);

  return (
    <group ref={tiltGroup} onClick={()=>onPreviewRequest("page")}>
      <group ref={group} name="ring">
        {/* 투명한 토러스 호버 영역 */}
        <mesh
          name="ring-hover-area"
          rotation={[0, Math.PI / 2, 0]}
          userData={{ type: "ring" }}
        >
          <torusGeometry args={[RING_RADIUS, 35, 60, 80]} />
          <meshBasicMaterial
            transparent={true}
            // wireframe={true}
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
              <planeGeometry args={[60, 40, 128, 128]} />
              <meshStandardMaterial
                color={hovered ? "#fff" : COLORS.object}
                transparent
                opacity={0.4 + 0.3 * hovered}
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
  mode,
  hoveredPlane,
  hoveredRing,
  setHoveredPlane,
  setHoveredRing,
  onPreviewRequest
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
      <PlaneWithTabs hovered={hoveredPlane}  onPreviewRequest={onPreviewRequest}/>
      <ImageRing hovered={hoveredRing} onPreviewRequest={onPreviewRequest} />

      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

function Main3FGraphic({ onPreviewRequest, initialData }) {
  const [hoveredPlane, setHoveredPlane] = useState(false);
  const [hoveredRing, setHoveredRing] = useState(false);
  const [mode, setMode] = useState("init"); // init, about, mypage
  const [id, setId] = useState("");
  const variants = {
    about: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 1,
        ease: "easeIn",
        duration: 0.5,
      },
    },
    init: {
      x: "-30%",
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 1,
        ease: "easeIn",
        duration: 0.5,
      },
    },
    mypage: {
      x: "-60%",
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 1,
        ease: "easeIn",
        duration: 0.5,
      },
    },
  };
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <MainHeader />
      <motion.div
        style={{
          position: "fixed",
          left: 30,
          top: 100,
          transform: "translateY(-50%)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        initial="rest"
        whileHover="hover" // 자식들이 variants.hover 상태로 전환
        animate={mode}
        onClick={() => {
          console.log("about");
          setMode("about");
        }}
      >
        <motion.div
          variants={{
            rest: { x: 0, color: "#ffffff33" },
            about: {
              x: -8,
              color: "#ffffff00",
              transition: { ease: "easeIn", duration: 0.7 },
            },
          }}
        >
          <BsChevronCompactLeft size={40} />
        </motion.div>
        <motion.span
          variants={{
            rest: { opacity: 0, x: -10 },
            about: { opacity: 1, x: -20, transition: { duration: 0.25 } },
          }}
          style={{
            fontSize: 18,
            color: "#fff",
          }}
        >
          About
        </motion.span>
      </motion.div>
      <motion.div
        style={{
          position: "fixed",
          left: "50vw",
          top: 100,
          transform: "translateX(-50%) translateY(-50%)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        initial="rest"
        whileHover="hover" // 자식들이 variants.hover 상태로 전환
        animate={mode}
        onClick={() => {
          console.log("init");
          setMode("init");
        }}
      >
        {" "}
        <motion.div
          variants={{
            rest: { x: 0, color: "#ffffff33" },
            init: {
              color: "#fff",
              transition: { ease: "easeIn", duration: 0.7 },
            },
          }}
        >
          <FaSquareFull size={20} />
        </motion.div>
      </motion.div>
      <motion.div
        style={{
          position: "fixed",
          right: 30,
          top: 100,
          transform: "translateY(-50%)",
          zIndex: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        initial="rest"
        whileHover="hover" // 자식들이 variants.hover 상태로 전환
        animate={mode}
        onClick={() => {
          console.log("mypage");
          setMode("mypage");
        }}
      >
        <motion.span
          variants={{
            rest: { opacity: 0, x: -8 },
            mypage: { opacity: 1, x: 0, transition: { duration: 0.25 } },
          }}
          style={{
            fontSize: 18,
            color: "#fff",
          }}
        >
          Mypage
        </motion.span>
        <motion.div
          variants={{
            rest: { x: -8, color: "#ffffff33" },
            mypage: {
              x: 0,
              color: "#ffffff00",
              transition: { ease: "easeIn", duration: 0.7 },
            },
          }}
        >
          <BsChevronCompactRight size={40} />
        </motion.div>
      </motion.div>
      <motion.div
        style={{ position: "relative", width: "100vw", height: "100vh" }}
        initial="init"
        animate={mode}
      >
        <motion.div variants={variants}>
          <div
            style={{
              position: "relative",
              width: "200vw",
              height: "100vh",
              display: "flex",
            }}
          >
            <motion.div
              style={{
                position: "relative",
                width: "30vw",
                height: "100vh",
              }}
              initial="init"
              animate={mode}
            >
              <motion.div
                variants={{
                  init: { opacity: 0, x: -100, y: "-50%" },
                  about: {
                    opacity: 1,
                    x: 0,
                    y: "-50%",
                    transition: { duration: 0.25 },
                  },
                }}
                style={{
                  position: "absolute", // 부모 제약 없이 화면 기준
                  top: "50%", // 세로 중앙
                  transform: "translateY(-50%)", // 축 기준 정확히 중앙
                }}
              >
                <AboutLines />
              </motion.div>
            </motion.div>
            <motion.div
              variants={{
                init: { scale: 1, opacity: 1 },
                about: {
                  scale: 2,
                  opacity: 0.5,
                },
                mypage: {
                  opacity: 0.5,
                },
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                duration: 1,
                ease: "easeIn",
                duration: 0.5,
              }}
            >
              <Canvas
                shadows={true}
                style={{
                  height: "100vh",
                  width: "100vw",
                  // background: COLORS.background,
                }}
                camera={{
                  position: [-300, -180, 400],
                  rotation: [0.5, -0.79, 0.37],
                  fov: 50,
                }}
              >
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
            <motion.div
              style={{
                position: "relative",
                width: "30vw",
                height: "100vh",
              }}
              initial="init"
              animate={mode}
            >
              <motion.div
                variants={{
                  init: { opacity: 0, x: 0, y: "-50%" },
                  mypage: {
                    opacity: 1,
                    x: 100,
                    y: "-50%",
                    transition: { duration: 0.25 },
                  },
                }}
                style={{
                  position: "absolute", // 부모 제약 없이 화면 기준
                  top: "50%", // 세로 중앙
                  left: -100,
                  transform: "translateY(-50%)", // 축 기준 정확히 중앙
                  color: "#fff",
                  width: "80%",
                }}
              >
                <Mypage id={id} setId={setId} initialData={initialData} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

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
