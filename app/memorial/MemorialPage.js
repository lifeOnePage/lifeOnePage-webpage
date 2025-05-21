"use client";
import React, { act, useEffect, useRef, useState } from "react";
import Image from "next/image";
import svgIllustration from "../../public/graphic.svg";
import ImageSlider from "./ImageSlider";
import ThreeFiberScene from "../components/ThreeScene";
import useWindowSize from "../hooks/useWindowSize";
import { motion } from "framer-motion";
import { timelineData } from "./timelineData";
import Timeline from "../components/Timeline";
import RingCategoryNav from "../components/RingCategoryNav";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ImageRing from "../components/ImageRing";

const person = {
  name: "한정순",
  birthDate: "1920.01.01 - 2020.12.31",
  birthPlace: "전라남도 담양",
  motto: "세상을 밝히는 빛이 되자.",
  lifeStory: `한정순(1944~)은 전라남도 담양에서 태어나 어린 시절 한국전쟁을 겪으며 가족의 온기를 지키려 애썼다. 19세에 서울로 올라와 봉제공장에서 일하며 힘든 노동 속에서도 첫 월급을 받는 감격을 경험했고, 부모님께 선물을 전하며 기쁨을 나눴다. 결혼 후 가정을 꾸리며 자녀를 키웠고, 44세에 우연히 첫사랑과 재회했으나 각자의 삶을 존중하며 이별했다. 인생의 굴곡 속에서도 포기하지 않고 살아온 그녀는, 시간이 흘러도 변치 않는 소중한 기억들을 마음속에 간직하며 강물처럼 흐르는 삶을 받아들인다.`,
};
const profilePath = "/images/portrait.jpg";
const svgGraphic = "/graphic.svg";
const p = 10;
const xf = -300;
const f = -200;
const mf = -100;
const mn = 100;
const n = 200;
const xn = 300;
function scaleFactor(transZ, perspective) {
  const scaleRecover = 1 + (transZ * -1) / perspective;
  // console.log(scaleRecover)
  return scaleRecover;
}
const parallexTransform = (factor, perspective) =>
  `translate3d(0,0,${factor}px) scale(${scaleFactor(factor, perspective)})`;

const MemorialPage = () => {
  // console.log(parallexTransform(xf, p))
  // console.log(parallexTransform(f, p))
  // console.log(parallexTransform(mf, p))
  // console.log(parallexTransform(mn, p))
  // console.log(parallexTransform(n, p))

  const controlsRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState("/images/img3.png");

  const [isOpen, setIsOpen] = useState(true);

  const { width, height } = useWindowSize();
  // “내가 클릭해서 강제로 보여주는 카테고리” (우선순위)
  // const [forcedCategory, setForcedCategory] = useState(null);

  const [isRotating, setIsRotating] = useState(false);
  const topImageRef = useRef();

  // 뷰포트가 가로가 더 길면(true = landscape),
  // 세로에 맞춰서 보여줌(height: 100vh, width: auto)
  // 세로가 더 길면(width: 100vw, height: auto)
  const isLandscape = width > height;

  const isSmallScreen = width <= 640; // 가로폭 500px 이하 여부
  const isSceneOffset = width <= 400; // 가로폭 500px 이하 여부
  const threeSceneOffset = isSceneOffset ? "30vw" : "200px";

  const imageStyle = isSmallScreen
    ? {
        width: isLandscape ? "auto" : "80vw",
        height: "200px",

        objectFit: "cover",
      }
    : {
        width: isLandscape ? "auto" : "80vw",
        height: isLandscape ? "80vh" : "auto",
        maxHeight: "500px",
        objectFit: "cover",
      };
  const leftPaneStyle = isSmallScreen
    ? {
        position: "relative",
        width: "auto",
        height: "30vh",
        // transform: imageTransformValue,
        transition: "transform 0.5s ease",
      }
    : {
        position: "relative",
        width: "auto",
        height: "auto",
        maxHeight: "400px",
        // transform: imageTransformValue,
        transition: "transform 0.5s ease",
      };

  const [leftmostPath, setLeftmostPath] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [forcedCategory, setForcedCategory] = useState(null);
  const [forcedSubcategory, setForcedSubcategory] = useState(null);

  function handleLockCategory(catName) {
    ringRef.current?.goToCategory(catName);
    setForcedCategory((prev) => (prev === catName ? null : catName));
    setForcedSubcategory(null); // 메인 카테고리 잠금 시 서브 잠금 해제
  }

  function handleLockSubcategory(sub) {
    setForcedCategory("소중한 사람");
    setForcedSubcategory((prev) => (prev === sub ? null : sub));
    // if (forcedSubcategory === null) setForcedCategory(null);
    ringRef.current?.goToCategory(sub);
  }

  function handleSubcategoryChange(name) {
    setActiveSubCategory(name);
  }

  function handleSubcategoryClick(name) {
    setActiveSubCategory(name);
    setForcedSubcategory(null);
    ringRef.current?.goToCategory(name);
  }

  // 카메라 움직임에 따라 “현재 가장 왼쪽” 경로가 바뀌면
  const handleLeftmostChange = (path) => {
    // console.log("가장 왼쪽 사진 경로:", path);
    setLeftmostPath(path);
    setIsOpen(true);
    setSelectedImage(path);
  };
  // threeFiberscene에서 이미지를 클릭했을 때 호출
  const handleImageClick = (imgPath) => {
    setSelectedImage(imgPath);
    setIsOpen(true); // 이미지 창 오픈
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty("--scroll", scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // threefiber 씬 스타일
  const rightPaneStyle = {
    position: "relative", // 필요에 따라 조정
    width: isSmallScreen ? "270vw" : "150vw",
    height: "100vh",
    overflow: "scroll",

    // isOpen이면 오른쪽으로 100px 살짝 이동
    transform: isSmallScreen ? "translateY(40%)" : null,
    transition: "all 0.5s ease",
  };

  // < 버튼 스타일 (이미지가 열려있을 때만 표시)
  const arrowButtonStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 200,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
  };

  const ringRef = useRef();
  // 어느 카테고리가 현재 활성화(왼쪽)인지
  const [activeCat, setActiveCat] = useState(null);

  // OrbitControls onChange -> ringRef.current.updateLeftmost()
  // onEnd 써도 좋음(조작 끝날 때만)
  function handleChangeControls() {
    if (ringRef.current) {
      ringRef.current.updateLeftmost();
    }
    // if (!isRotating && forcedCategory !== null) {
    //   setForcedCategory(null);
    // }
  }
  // Nav에서 카테고리 클릭
  function handleCategoryClick(catName) {
    if (ringRef.current) {
      // console.log(catName);
      setActiveCategory(catName);
      ringRef.current.goToCategory(catName);
    }
    setActiveCategory(catName);
  }

  // ring에서 "현재 왼쪽 카테고리" 바뀔 때
  function handleCategoryChange(catName) {
    if (forcedCategory && catName !== forcedCategory) {
      setForcedCategory(null);
    }
    setActiveCategory(catName);
  }

  return (
    <div
      style={{
        perspective: `${p}px`,
        perspectiveOrigin: "top",
        margin: "0px",
        fontFamily: "pretendard",
        width: "100vw",
        height: "450vh",
        backgroundColor: "#f0f0f0",
        overflowX: "hidden",
      }}
    >
      <div
        className="profile"
        style={{
          zIndex: 100,
          transformStyle: "preserve-3d",
          position: "relative",
          width: "100vw",
          height: "100vh",
          backgroundColor: "#ababab",
        }}
      >
        <div
          style={{
            width: "100%",
            justifyItems: "center",
            mixBlendMode: "luminosity",
          }}
        >
          <Image
            src="/images/portrait.jpg"
            alt="Portrait"
            width={0}
            height={0}
            sizes="100vw"
            objectFit="cover"
            quality={100}
            style={{
              width: "auto",
              height: "100vh",
              objectFit: "cover",
              mixBlendMode: "luminosity",
            }}
          ></Image>
        </div>
        <div
          style={{
            transform: `translateY(-50vh)`,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "space-between",
            padding: "50px",
          }}
        >
          <div style={{ width: "auto", color: "#101010" }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 500 }}>{person.name}</p>
          </div>
          <div style={{ width: "auto", color: "#101010", textAlign: "right" }}>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              {person.birthDate}
            </p>
            <p style={{ fontSize: "1rem", fontWeight: 500 }}>
              {person.birthPlace}
            </p>
          </div>
        </div>
      </div>
      <div
        className="lifestory"
        style={{
          zIndex: -1,
          transformStyle: "preserve-3d",
          position: "relative",
          width: "100vw",
          height: "auto",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div
          style={{
            width: "100vw",
            hegith: "auto",
            textAlign: "center",
            justifyContent: "center",
            color: "#1a1a1a",
          }}
        >
          <p
            style={{ fontSize: "1.5rem", fontWeight: 500, padding: "10vw 0px" }}
          >
            "{person.motto}"
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 200, padding: "0px 5vw" }}>
            {person.lifeStory}
          </p>
        </div>
        <div
          style={{
            width: "100vw",
            height: "auto",
            justifyItems: "center",
            margin: isSmallScreen ? "30px 0px 0px 0px " : "3vw 0vw 0vw 0vw",
          }}
        >
          <Timeline />
        </div>
      </div>
      <div
        className="photoGallery"
        style={{
          display: "flex",
          flexWrap: "wrap",
          transformStyle: "preserve-3d",
          position: "relative",
          width: "100vw",
          height: "250vh",
          backgroundColor: "#1a1a1a",
        }}
      >
        <div style={{ width: "100vw", height: "150vh", position: "relative" }}>
          {/* 1) 왼쪽 이미지 슬라이딩 영역 */}
          <div
            style={{
              width: "100vw",
              height: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <div style={leftPaneStyle}>
              <div
                style={{
                  color: "#fefefe",
                  padding: isSmallScreen ? " 30px 15px" : "3vw 5vw 0vw 5vw",
                }}
              >
                <strong style={{ color: "#fefefe", fontSize: "1.8rem" }}>
                  {person.name}님의 영상기록관
                </strong>
                <p
                  style={{
                    color: "#fefefe",
                    fontSize: "1rem",
                    marginTop: "20px",
                  }}
                >
                  {person.name}님이 살아온 삶을 사진을 통해 돌아보세요.
                </p>
              </div>
              {selectedImage && (
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  <div>
                    <p
                      style={{
                        color: "#fefefe",
                        fontSize: "1.15rem",
                        margin: isSmallScreen ? "15px" : "5vw",
                        fontWeight: "300",
                      }}
                    >
                      {person.lifeStory}
                    </p>
                  </div>
                  {/* <div
                    style={{
                      boxShadow: "0px 20px 60px -20px #1a1a1a99",
                      margin: isSmallScreen ? "15px" : "5vw",
                    }}
                  >
                    <Image
                      ref={topImageRef}
                      src={selectedImage}
                      alt="Photo"
                      width={1920}
                      height={1080}
                      quality={100}
                      style={imageStyle}
                    />
                  </div> */}
                </div>
              )}
            </div>
            {/* 2) ThreeFiberScene (오른쪽으로 이동) */}
            <div style={rightPaneStyle}>
              {forcedCategory && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    zIndex: 1000,
                    color: "#ffffff",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                  onClick={() => setForcedCategory(null)}
                >
                  카테고리 선택 해제하기
                </motion.div>
              )}

              <Canvas camera={{ position: [0, 80, 600], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[100, 200, 300]} intensity={1} />

                <OrbitControls
                  ref={controlsRef}
                  enableZoom={false}
                  // onChange: 카메라 조작 중 실시간 업데이트가 필요하다면
                  // onEnd: 조작이 끝난 뒤 한 번만
                  enabled={!isRotating}
                  minPolarAngle={Math.PI / 3} // 아래로 내려가는 각도 제한
                  maxPolarAngle={Math.PI / 3} // 위로 올라가는 각도 제한
                  onChange={handleChangeControls}
                />

                <ImageRing
                  forcedSubcategory={forcedSubcategory}
                  onSubcategoryChange={handleSubcategoryChange}
                  ref={ringRef}
                  controlsRef={controlsRef} // 이렇게 전달
                  topImageRef={topImageRef}
                  forcedCategory={forcedCategory}
                  onLeftmostChange={handleLeftmostChange}
                  onCategoryChange={handleCategoryChange}
                  onImageClick={handleImageClick} // 기존 클릭 콜백
                />
              </Canvas>

              {/* 네비게이션 바 (오른쪽) */}
              <RingCategoryNav
                activeCategory={activeCategory}
                activeSubCategory={activeSubCategory}
                forcedCategory={forcedCategory}
                forcedSubcategory={forcedSubcategory}
                onCategoryClick={handleCategoryClick}
                onLockCategory={handleLockCategory}
                onSubcategoryClick={handleSubcategoryClick}
                onLockSubcategory={handleLockSubcategory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorialPage;
