"use client";
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useMemo,
  useState,
  useEffect,
} from "react";
import * as THREE from "three";
import { useThree, useLoader, useFrame } from "@react-three/fiber";
import BeamGlowMaterial from "./BeamGlowMaterial";
import { extend } from "@react-three/fiber";
import useVideoTexture from "../hooks/useVideoTexture";
// import { Html } from "next/document";
import { Html } from "@react-three/drei";
import { fetchUserData } from "../utils/firebaseDb";
import { auth } from "../firebase/firebaseConfig";
import { createcatsAndSubcats, setCatSubCat } from "../utils/createCatInfo";

extend({ BeamGlowMaterial });

// import { Select } from '@react-three/postprocessing';

function ImageRingComponent(
  {
    person,
    imageUrls,
    videoUrls,
    forcedCategory, // 우선순위 카테고리
    forcedSubcategory, // ✅ 추가
    controlsRef,
    onSubcategoryChange, // ✅ 추가
    topImageRef,
    onImageClick, // 메시 클릭 -> 사진 경로
    onLeftmostChange, // 왼쪽 사진 경로
    onCategoryChange, // 현재 왼쪽 카테고리
    onRotationStateChange, // 회전 시작/끝시 상위에 알림(OrbitControls 제어용), optional
  },
  ref
) {
  const groupRef = useRef();
  const leftMostMeshRef = useRef();
  const spriteRef = useRef();
  const geometryRef = useRef();
  const { camera, gl: renderer } = useThree();
  // const beamRef = useRef();
  // const beamRightRef = useRef();
  const beamPlaneLeftRef = useRef();
  const beamPlaneRightRef = useRef();
  const leftBeamTrapezoidRef = useRef();
  const rightBeamTrapezoidRef = useRef();

  const material = useRef();
  const [leftmostImg, setLeftmostImg] = useState(null);
  const spriteTargetPos = useRef(new THREE.Vector3()); // 목적지
  const leftmostIndexRef = useRef(-1);
  const beamMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "white",
        // transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // console.log("imageUrls:", imageUrls,"videoUrls:", videoUrls)
  const [isMuted, setIsMuted] = useState(true);
  const [leftmostVideoElement, setLeftmostVideoElement] = useState(null);
  const [categories, setCategories] = useState([
    { name: "유년시절", start: 0, end: 16 },
    { name: "소중한 경험", start: 17, end: 45 },
    { name: "소중한 사람", start: 46, end: 99 },
  ]);
  const [subcategories, setSubcategories] = useState([
    { name: "사랑하는 가족", start: 46, end: 63 }, // 18개
    { name: "즐거운 친구들", start: 64, end: 81 }, // 18개
    { name: "귀여운 초코", start: 82, end: 99 }, // 18개
  ]);
  const [idxTotal, setIdxTotal] = useState(100);

  function handleVolumeToggle() {
    if (!leftmostVideoElement) return;
    const nextMute = !isMuted;
    leftmostVideoElement.muted = nextMute;
    leftmostVideoElement.volume = nextMute ? 0 : 1; // 볼륨을 0 or 1로
    setIsMuted(nextMute);
  }

  // ✅ 이미지 텍스처
  const loadedImgTextures = useLoader(THREE.TextureLoader, imageUrls);

  // ✅ 비디오 텍스처
  const [loadedVideoTextures, loadedVideoElements] = useVideoTexture(videoUrls);

  // ✅ 최종 텍스처 배열 구성
  const textures = useMemo(() => {
    const result = [...loadedImgTextures];
    // 예시: 영상 일부만 적용
    if (loadedVideoTextures.length > 0) result[1] = loadedVideoTextures[0];
    if (loadedVideoTextures.length > 1) result[3] = loadedVideoTextures[1];
    return result;
  }, [loadedImgTextures, loadedVideoTextures]);

  async function setCatSubCat(person) {
    const { total, cats, subcats } = await createcatsAndSubcats(
      person.photoGallery
    );

    console.log(cats, subcats);
    await setCategories(cats);
    await setSubcategories(subcats);
    await setIdxTotal(total);
  }

  useEffect(() => {
    setCatSubCat(person);
  }, [person]);
  // console.log(categories)

  function getSubcategoryForIndex(i) {
    return subcategories.find((sub) => i >= sub.start && i <= sub.end);
  }

  /** 인덱스가 속한 카테고리 찾기 */
  function getCategoryForIndex(i) {
    return categories.find((cat) => i >= cat.start && i <= cat.end);
  }

  const imagePaths = useMemo(() => imageUrls, [imageUrls]);
  const videoPaths = useMemo(() => videoUrls, [videoUrls]);

  useEffect(() => {
    textures.forEach((texture) => {
      if (!texture) return; // 🔐 null 체크 추가
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.center.set(0.5, 0.5);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
    });

    setLeftmostImg(textures[0]);
  }, [textures]);
  useEffect(() => {
    if (!leftmostImg || !geometryRef.current) return;

    const textureSource = leftmostImg.image || leftmostImg.source?.data || null;

    // 비디오일 경우: 아직 로딩 안됐으면 기다림
    if (textureSource instanceof HTMLVideoElement) {
      const video = textureSource;

      const handleReady = () => {
        if (video.readyState >= 2) {
          applyGeometryFromTexture(leftmostImg);
        }
      };

      if (video.readyState >= 2) {
        applyGeometryFromTexture(leftmostImg);
      } else {
        video.addEventListener("loadeddata", handleReady, { once: true });
      }

      return () => {
        video.removeEventListener("loadeddata", handleReady);
      };
    } else {
      // 일반 이미지 텍스처
      applyGeometryFromTexture(leftmostImg);
    }
  }, [leftmostImg]);
  useEffect(() => {
    if (!leftmostImg) return;

    const isVideo = leftmostImg instanceof THREE.VideoTexture;
    // console.log(isVideo);
    if (isVideo) {
      const index = textures.findIndex((t) => t === leftmostImg);
      console.log(index, loadedVideoElements);
      if (index !== -1 && loadedVideoElements[0] instanceof HTMLVideoElement) {
        setLeftmostVideoElement(loadedVideoElements[0]);
        console.log(leftmostVideoElement);
      }
    } else {
      setLeftmostVideoElement(null);
    }
  }, [leftmostImg, loadedVideoElements]);

  useEffect(() => {
    if (!leftmostImg || !spriteRef.current || !camera) return;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const up = camera.up.clone();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const offset = new THREE.Vector3()
      .add(forward.clone().multiplyScalar(180))
      .add(right.clone().multiplyScalar(-60))
      .add(up.clone().multiplyScalar(70));

    // 목적지 위치
    const target = camera.position.clone().add(offset);
    spriteTargetPos.current.copy(target);

    // 초기 위치: target에서 왼쪽으로 더 밀어서 시작
    const start = target.clone().add(right.clone().multiplyScalar(-60));
    spriteRef.current.position.copy(start);
  }, [leftmostImg]);

  /** 초기 원형 좌표 */
  const positionsRef = useRef([]);
  if (positionsRef.current.length === 0) {
    const arr = [];
    for (let j = 0; j < 100; j++) {
      const angle = (Math.PI / 50) * j;
      arr.push({
        x: 160 * Math.cos(angle),
        y: 0,
        z: 160 * Math.sin(angle),
      });
    }
    positionsRef.current = arr;
  }

  /** mesh 저장 */
  const meshArray = useRef([]);

  // 초기화 시
  // const positionsRef = useRef([]);
  const anglesRef = useRef([]);

  if (positionsRef.current.length === 0 || anglesRef.current.length === 0) {
    const posArr = [];
    const angleArr = [];
    for (let j = 0; j < 100; j++) {
      const angle = (Math.PI / 50) * j;
      posArr.push({
        x: 160 * Math.cos(angle),
        y: 0,
        z: 160 * Math.sin(angle),
      });
      angleArr.push(angle);
    }
    positionsRef.current = posArr;
    anglesRef.current = angleArr;
  }

  const planes = [];
  for (let j = 0; j < 100; j++) {
    const pos = positionsRef.current[j];
    const angle = (Math.PI / 50) * j;
    planes.push(
      <mesh
        key={j}
        ref={(el) => {
          if (el) meshArray.current[j] = el;
        }}
        position={[pos.x, pos.y, pos.z]}
        rotation={[0, -angle, 0]} // 이부분
        onClick={(e) => {
          e.stopPropagation();
          onImageClick?.(j > idxTotal ? imagePaths[j] : null);
        }}
      >
        <planeGeometry args={[70, 55]} />
        <meshLambertMaterial
          map={j < idxTotal ? textures[j] : null}
          side={THREE.DoubleSide}
          transparent
          opacity={1}
        />
      </mesh>
    );
  }

  /** 회전 애니메이션 상태 */
  const [isRotating, setIsRotating] = useState(false);
  const currentAngleRef = useRef(0);
  const targetAngleRef = useRef(0);

  /** 매 프레임: 회전 보간 + 왼쪽 메시 튀어나오기 + 카테고리 반투명 */
  const prevCatRef = useRef(null);
  const prevLeftmostRef = useRef(null);

  useEffect(() => {
    console.log("🌀 useEffect triggered with forcedCategory:", forcedCategory);

    if (!controlsRef.current) {
      console.log("❌ controlsRef is null");
      return;
    }

    if (!forcedCategory && !forcedSubcategory) {
      console.log("✅ forcedCategory is null → 회전 제약 해제");
      controlsRef.current.minAzimuthAngle = -Infinity;
      controlsRef.current.maxAzimuthAngle = Infinity;
      return;
    }

    console.log("🎯 forcedCategory:", forcedCategory);
    const cat = categories.find((c) => c.name === forcedCategory);
    const sub = subcategories.find((s) => s.name === forcedSubcategory);
    console.log(cat, sub);
    const target = sub ? sub : cat;
    if (!target) return;

    const anglePerIndex = Math.PI / 50;
    const indexRange = Math.abs(target.end - target.start); // 인덱스 개수
    const totalAngle = Math.abs(anglePerIndex) * indexRange;

    const current = controlsRef.current.getAzimuthalAngle();

    const min = Math.min(current, current - totalAngle);
    const max = Math.max(current, current - totalAngle);

    controlsRef.current.minAzimuthAngle = min;
    controlsRef.current.maxAzimuthAngle = max;
    // console.log(min, max);

    // 현재 각도가 범위 밖이면 클램프
    if (current < min || current > max) {
      controlsRef.current.setAzimuthalAngle(
        THREE.MathUtils.clamp(current, min, max)
      );
      controlsRef.current.update();
    }
    // ✅ 카메라 이동 이후 스프라이트 위치 다시 계산!
    setTimeout(() => {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const up = camera.up.clone();
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();

      const offset = new THREE.Vector3()
        .add(forward.clone().multiplyScalar(200))
        .add(right.clone().multiplyScalar(-60))
        .add(up.clone().multiplyScalar(70));

      const target = camera.position.clone().add(offset);
      spriteTargetPos.current.copy(target);

      // sprite 실제 위치도 업데이트
      spriteRef.current?.position.copy(
        target.clone().add(right.clone().multiplyScalar(-60))
      );
    }, 0); // 다음 tick에서 실행 (카메라 갱신 이후)
  }, [forcedCategory, forcedSubcategory]);

  useFrame((state, delta) => {
    /** 1) 부드러운 회전 (lerp) */
    if (isRotating) {
      let cur = currentAngleRef.current;
      let tar = targetAngleRef.current;
      const speed = 3; // 라디안/초
      const diff = tar - cur;
      const step = speed * delta;

      if (Math.abs(diff) < step) {
        // 도착
        cur = tar;
        setIsRotating(false);
        onRotationStateChange?.(false);
      } else {
        cur += step * Math.sign(diff);
      }

      currentAngleRef.current = cur;
      if (groupRef.current) {
        groupRef.current.rotation.y = cur;
      }
  
    }

    /** 2) 항상 "왼쪽 메시" 찾아서 튀어나오기 & 반투명 처리 */
    const children = meshArray.current;
    if (!children?.length || !groupRef.current) return;

    // (a) 먼저 로컬 포지션 모두 reset
    for (let i = 0; i < 100; i++) {
      const orig = positionsRef.current[i];
      children[i].position.set(orig.x, orig.y, orig.z);
    }

    // (b) 가장 왼쪽 찾기
    let minX = Infinity;
    let candidateIndex = -1;
    for (let i = 0; i < 100; i++) {
      const mesh = children[i];
      if (!mesh?.isMesh) continue;
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      worldPos.project(camera); // -1 ~ +1
      if (worldPos.x < minX) {
        minX = worldPos.x;
        candidateIndex = i;
      }
    }
    leftmostIndexRef.current = candidateIndex; // 💡 이 줄 추가
    
    if (candidateIndex < 0) return;

    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    // Y축 기준 회전각 계산 (xz 평면)
    const groupRotationY = groupRef.current?.rotation.y ?? 0;

    const flatAngle = Math.atan2(cameraDir.x, cameraDir.z);
    const relativeAngle = flatAngle - groupRotationY;

    const xTilt = THREE.MathUtils.degToRad(30); // 위를 바라보게 하는 x축 회전

    // 카메라와 group을 기준으로 메시 전체가 평행하게 되도록
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    const up = camera.up.clone();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const tiltAxis = right; // 카메라 기준의 오른쪽 방향 → 이게 사용자 기준의 x축

    const baseQuat = new THREE.Quaternion().setFromAxisAngle(tiltAxis, xTilt);

    for (let i = 0; i < 100; i++) {
      const mesh = meshArray.current[i];
      if (!mesh?.isMesh) continue;

      const lookQuat = new THREE.Quaternion();
      lookQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), relativeAngle);

      // x축 기울기 쿼터니언
      const tiltQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        xTilt
      );

      // 합쳐서 적용
      const finalQuat = lookQuat.multiply(tiltQuat); // 순서 중요
      mesh.setRotationFromQuaternion(finalQuat);
    }

    const candidate = children[candidateIndex];
    leftMostMeshRef.current = candidate;

    const angle = anglesRef.current[candidateIndex];

    if (typeof angle !== "number") {
      console.warn("⛔ angle 값이 이상함!", angle, candidateIndex);
      return;
    }
    const direction = new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    ).normalize();

    // 원래 위치에서 방향 벡터로 밀기
    console.log();
    const origPos = positionsRef.current[candidateIndex];
    // console.log(candidateIndex)
    const scalar =
      candidateIndex > idxTotal ||
      candidateIndex == 0 ||
      candidateIndex == idxTotal - 1
        ? 0
        : 60;
    const offset = direction.clone().multiplyScalar(scalar); // 30 정도 앞으로
    // console.log(THREE.MathUtils.lerp);
    leftMostMeshRef.current.position.x = THREE.MathUtils.lerp(
      origPos.x,
      origPos.x + offset.x,
      1.0
    );
    leftMostMeshRef.current.position.z = THREE.MathUtils.lerp(
      origPos.z,
      origPos.z + offset.z,
      1.0
    );

    // .lerp( new
    //   THREE.Vector3(
    //     origPos.x + offset.x,
    //     0, // 높이 추가
    //     origPos.z + offset.z
    //   ), 1.0
    // );
    // console.log(candidate.position);

    // (d) 해당 인덱스의 카테고리
    const cat = getCategoryForIndex(candidateIndex);
    if (!cat) return;
    // (C) 강조할 카테고리 결정: 만약 forcedCategory가 있으면 그거 우선, 없으면 realCat
    let finalCatName = null;
    if (forcedCategory) {
      finalCatName = forcedCategory;
    } else {
      finalCatName = cat?.name ?? null;
    }

    const subcat = getSubcategoryForIndex(candidateIndex);
    if (cat?.name !== "유년시절" && subcat) {
      // subcategory 전달
      onSubcategoryChange?.(subcat.name);
    } else {
      onSubcategoryChange?.(null);
    }

    // (e) 투명도: cat 범위만 1, else 0.2
    for (let i = 0; i < 100; i++) {
      const mesh = children[i];
      if (!mesh?.material) continue;

      const isInCategory = i >= cat.start && i <= cat.end;
      // console.log(isInCategory);

      // target 값 설정
      const targetY = isInCategory ? 0 : 0;

      // 현재 y 위치에서 targetY로 lerp
      mesh.position.lerp(mesh.position.clone().setY(targetY), 0.08);

      // 불투명도도 그대로 유지
      mesh.material.opacity = isInCategory ? 0.6 : 0.1;
    }

    // (f) 콜백(왼쪽사진, 카테고리)이 바뀌었으면 상위 알림
    // 왼쪽 path
    // (E) onCategoryChange, onLeftmostChange 콜백
    // if (!forcedCategory) {
    // 왼쪽 메시 경로
    // console.log("no forcedcategory");
    const pathIndex = candidateIndex < idxTotal ? candidateIndex : 0;
    // console.log(pathIndex)
    onLeftmostChange?.(imagePaths[pathIndex]);
    onCategoryChange?.(cat?.name);
    setLeftmostImg(textures[pathIndex]);
    // console.log(leftmostImg)
    // } else {
    //   // console.log("forcedcategory:", forcedCategory);
    //   const pathIndex = candidateIndex % 10;
    //   onLeftmostChange?.(imagePaths[pathIndex]);
    //   // 만약 forcedCategory가 있으면, 굳이 realCat 정보로 바꾸지 않음.
    //   onCategoryChange?.(forcedCategory);
    // }

    if (spriteRef.current && camera) {
      // 카메라 기준으로 offset 재계산
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      const up = camera.up.clone();
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();

      const offset = new THREE.Vector3()
        .add(forward.clone().multiplyScalar(200)) // 앞
        .add(right.clone().multiplyScalar(-60)) // 왼쪽
        .add(up.clone().multiplyScalar(70)); // 위

      const newTarget = camera.position.clone().add(offset);
      spriteTargetPos.current.copy(newTarget);

      // 실제 위치 부드럽게 보간해서 이동
      // spriteRef.current.position.lerp(
      //   newTarget.clone().add(right.clone().multiplyScalar(-60)),
      //   0.1 // 부드러운 이동
      // );

      // 회전도 카메라와 동일하게 유지
      spriteRef.current.quaternion.copy(camera.quaternion);
    }

    {
      // console.log(
      //   spriteRef.current,
      //   leftmostIndexRef.current,
      //   meshArray.current[leftmostIndexRef.current],
      //   geometryRef.current
      // )
      // if (
      //   !spriteRef.current ||
      //   !meshArray.current[leftmostIndexRef.current] ||
      //   !geometryRef.current
      // )
      //   return;
      if (leftmostIndexRef.current >= idxTotal) return;

      const sprite = spriteRef.current;
      const thumbnail = meshArray.current[leftmostIndexRef.current];

      // 월드 좌표 구하기
      const originCenter = new THREE.Vector3();
      thumbnail.getWorldPosition(originCenter);

      const spriteCenter = new THREE.Vector3();
      sprite.getWorldPosition(spriteCenter);

      const mid = originCenter.clone().add(spriteCenter).multiplyScalar(0.5);
      // 각 메시의 높이
      const thumbHeight = thumbnail.geometry.parameters.height || 75;
      const spriteHeight = geometryRef.current.parameters.height || 200;

      // 메시 폭 가져오기
      const thumbWidth = thumbnail.geometry.parameters.width || 100;
      const spriteWidth = geometryRef.current.parameters.width || 200;

      // ✅ 메시 월드 회전 가져오기
      const thumbWorldQuat = new THREE.Quaternion();
      thumbnail.getWorldQuaternion(thumbWorldQuat);

      const spriteWorldQuat = new THREE.Quaternion();
      sprite.getWorldQuaternion(spriteWorldQuat);

      // 방향 벡터 (local space 기준)
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3(1, 0, 0);

      // ✅ 월드 기준 회전 적용
      const thumbUp = up.clone().applyQuaternion(thumbWorldQuat);
      const thumbRight = right.clone().applyQuaternion(thumbWorldQuat);

      const spriteUp = up.clone().applyQuaternion(spriteWorldQuat);
      const spriteRight = right.clone().applyQuaternion(spriteWorldQuat);

      // ✅ 모서리 위치 계산
      const halfHeight = thumbHeight / 2;
      const halfWidth = thumbWidth / 2;

      const leftBottom = originCenter
        .clone()
        .add(thumbUp.clone().multiplyScalar(halfHeight))
        .add(thumbRight.clone().multiplyScalar(halfWidth));

      const rightBottom = originCenter
        .clone()
        .add(thumbUp.clone().multiplyScalar(halfHeight))
        .add(thumbRight.clone().multiplyScalar(halfWidth - 1));

      const leftTop = spriteCenter
        .clone()
        .add(spriteUp.clone().multiplyScalar(-spriteHeight / 2))
        .add(spriteRight.clone().multiplyScalar(-spriteWidth / 2));

      const rightTop = spriteCenter
        .clone()
        .add(spriteUp.clone().multiplyScalar(-spriteHeight / 2))
        .add(spriteRight.clone().multiplyScalar(-spriteWidth / 2 + 1));

      const relativeLeftBottom = leftBottom.clone().sub(mid);
      const relativeRightBottom = rightBottom.clone().sub(mid);
      const relativeLeftTop = leftTop.clone().sub(mid);
      const relativeRightTop = rightTop.clone().sub(mid);

      const left_vertices = new Float32Array([
        relativeLeftBottom.x,
        relativeLeftBottom.y,
        relativeLeftBottom.z,
        relativeRightBottom.x,
        relativeRightBottom.y,
        relativeRightBottom.z,
        relativeLeftTop.x,
        relativeLeftTop.y,
        relativeLeftTop.z,
        relativeRightTop.x,
        relativeRightTop.y,
        relativeRightTop.z,
      ]);

      const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(left_vertices, 3)
      );
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      geometry.computeVertexNormals();

      // apply
      leftBeamTrapezoidRef.current.geometry.dispose();
      leftBeamTrapezoidRef.current.geometry = geometry;

      leftBeamTrapezoidRef.current.position.copy(mid);

      const worldPos = new THREE.Vector3();
      leftBeamTrapezoidRef.current.getWorldPosition(worldPos);
      // console.log("사다리꼴", worldPos);

      //오른쪽에 똑같이
      const right_leftBottom = originCenter
        .clone()
        .add(thumbUp.clone().multiplyScalar(halfHeight))
        .add(thumbRight.clone().multiplyScalar(-halfWidth - 1));

      const right_rightBottom = originCenter
        .clone()
        .add(thumbUp.clone().multiplyScalar(halfHeight))
        .add(thumbRight.clone().multiplyScalar(-halfWidth));

      const right_leftTop = spriteCenter
        .clone()
        .add(spriteUp.clone().multiplyScalar(-spriteHeight / 2))
        .add(spriteRight.clone().multiplyScalar(spriteWidth / 2 - 1));

      const right_rightTop = spriteCenter
        .clone()
        .add(spriteUp.clone().multiplyScalar(-spriteHeight / 2))
        .add(spriteRight.clone().multiplyScalar(spriteWidth / 2));

      const right_relativeLeftBottom = right_leftBottom.clone().sub(mid);
      const right_relativeRightBottom = right_rightBottom.clone().sub(mid);
      const right_relativeLeftTop = right_leftTop.clone().sub(mid);
      const right_relativeRightTop = right_rightTop.clone().sub(mid);

      const right_vertices = new Float32Array([
        right_relativeLeftBottom.x,
        right_relativeLeftBottom.y,
        right_relativeLeftBottom.z,
        right_relativeRightBottom.x,
        right_relativeRightBottom.y,
        right_relativeRightBottom.z,
        right_relativeLeftTop.x,
        right_relativeLeftTop.y,
        right_relativeLeftTop.z,
        right_relativeRightTop.x,
        right_relativeRightTop.y,
        right_relativeRightTop.z,
      ]);

      const right_indices = new Uint16Array([0, 1, 2, 2, 0, 3]);

      const right_geometry = new THREE.BufferGeometry();
      right_geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(right_vertices, 3)
      );
      right_geometry.setIndex(new THREE.BufferAttribute(right_indices, 1));
      right_geometry.computeVertexNormals();

      // apply
      rightBeamTrapezoidRef.current.geometry.dispose();
      rightBeamTrapezoidRef.current.geometry = right_geometry;

      rightBeamTrapezoidRef.current.position.copy(mid);
    }
  });

  /** 카테고리 클릭 -> 목표 각도로 세팅 -> 회전 시작 */
  function goToCategory(catNameOrSubName) {
    const cat = categories.find((c) => c.name === catNameOrSubName);
    const sub = subcategories.find((s) => s.name === catNameOrSubName);
    console.log(cat, sub);
    const targetIndex = cat?.start ?? sub?.start;
    if (!cat && !sub) return;

    const currentLeftmostIndex = leftmostIndexRef.current;
    if (currentLeftmostIndex === -1) return;

    const anglePerIndex = -Math.PI / 50;
    const diff = targetIndex - currentLeftmostIndex;

    const deltaAngle = -anglePerIndex * diff;

    targetAngleRef.current = currentAngleRef.current + deltaAngle;
    setIsRotating(true);
    onRotationStateChange?.(true);
  }

  function goToSubcategory(subName) {
    const sub = subcategories.find((s) => s.name === subName);
    if (!sub) return;

    const currentLeftmostIndex = leftmostIndexRef.current;
    if (currentLeftmostIndex === -1) return;

    const targetIndex = sub.start;
    const anglePerIndex = -Math.PI / 50;
    const diff = targetIndex - currentLeftmostIndex;

    const deltaAngle = -anglePerIndex * diff;

    targetAngleRef.current = currentAngleRef.current + deltaAngle;
    setIsRotating(true);
    onRotationStateChange?.(true);
  }

  function updateLeftmost() {
    // 빈 함수 or optional
  }
  function applyGeometryFromTexture(texture) {
    const source = texture.image || texture.source?.data;
    if (!source || !geometryRef.current) return;

    const width = source.videoWidth || source.width;
    const height = source.videoHeight || source.height;
    const aspect = width / height;

    const targetHeight = 100;
    const targetWidth = targetHeight * aspect;

    geometryRef.current.dispose();
    geometryRef.current = new THREE.PlaneGeometry(targetWidth, targetHeight);
    spriteRef.current.geometry = geometryRef.current;

    // ✅ map도 다시 세팅 (안전하게)
    if (spriteRef.current.material) {
      spriteRef.current.material.map = texture;
      spriteRef.current.material.needsUpdate = true;
    }
  }

  useImperativeHandle(ref, () => ({
    goToCategory,
    goToSubcategory,
    updateLeftmost,
  }));

  // console.log(leftmostVideoElement, geometryRef.current);

  return (
    <>
      <group ref={groupRef}>{planes}</group>
      <mesh ref={leftMostMeshRef}/>
      {leftmostVideoElement && geometryRef.current && (
        <Html
          position={[
            0,
            -(geometryRef.current.parameters.height ?? 100) / 2 - 20,
            0,
          ]}
          center
        >
          <button
            style={{ cursor: "pointer", color: "white" }}
            onClick={handleVolumeToggle}
          >
            {isMuted ? "unmuted" : "muted"}
          </button>
        </Html>
      )}

      <mesh ref={spriteRef}>
        <planeGeometry ref={geometryRef} args={[1, 1]} />{" "}
        {/* 초기 사이즈 아무거나 */}
        <meshBasicMaterial map={leftmostImg} />
      </mesh>
      <mesh ref={leftBeamTrapezoidRef}>
        <meshBasicMaterial
          color="white"
          opacity={0.8}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={rightBeamTrapezoidRef}>
        <meshBasicMaterial
          color="white"
          opacity={0.8}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export default forwardRef(ImageRingComponent);
