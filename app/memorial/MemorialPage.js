"use client";
import React, { act, useEffect, useMemo, useRef, useState } from "react";
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
import Profile from "../components/Profile";
import Lifestory from "../components/Lifestory";
import { auth } from "../firebase/firebaseConfig";
import {
  uploadGalleryImages,
  uploadProfileImage,
} from "../utils/firebaseStorage";
import {
  saveProfileSection,
  saveLifestorySection,
  savePhotoGalleryCategory,
} from "../utils/firebaseDb";
import FloatingToolbar from "../components/FloatingToolBar";
import SuccessOverlay from "../components/SuccessOverlay";
import GalleryNav from "../components/GalleryNav";
import { useRouter } from "next/navigation";
import { BLACK } from "../styles/colorConfig";

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

const MemorialPage = ({ user, initialData }) => {
  const defaultPerson = {
    name: "한정순",
    birthDate: "1920.01.01 - 2020.12.31",
    birthPlace: "전라남도 담양",
    motto: "세상을 밝히는 빛이 되자.",
    lifeStory: `한정순(1944~)은 전라남도 담양에서 태어나 어린 시절 한국전쟁을 겪으며 가족의 온기를 지키려 애썼다. 19세에 서울로 올라와 봉제공장에서 일하며 힘든 노동 속에서도 첫 월급을 받는 감격을 경험했고, 부모님께 선물을 전하며 기쁨을 나눴다. 결혼 후 가정을 꾸리며 자녀를 키웠고, 44세에 우연히 첫사랑과 재회했으나 각자의 삶을 존중하며 이별했다. 인생의 굴곡 속에서도 포기하지 않고 살아온 그녀는, 시간이 흘러도 변치 않는 소중한 기억들을 마음속에 간직하며 강물처럼 흐르는 삶을 받아들인다.`,
    childhood: null,
    experience: null,
    relationship: null,
  };

  const router = useRouter();

  const [person, setPerson] = useState(defaultPerson);
  const [isPreview, setIsPreview] = useState(false);
  const [isBeforeLogin, setIsBeforeLogin] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [profileHasUnsavedChanges, setProfileHasUnsavedChanges] =
    useState(false);
  const [LifeStoryHasUnsavedChanges, setLifeStoryHasUnsavedChanges] =
    useState(false);
  const imagePaths = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => `/images/image${i % 10}.jpeg`);
  }, []);

  const videoPaths = useMemo(() => {
    return Array.from({ length: 2 }, (_, i) => `/videos/video${i}.mp4`);
  }, []);

  useEffect(() => {
    if (!initialData) {
      setImageUrls(imagePaths);
      setVideoUrls(videoPaths);
      setIsBeforeLogin(true);
      setIsPreview(true);
      return;
    }

    const profile = initialData.profile || {};
    const lifestory = initialData.lifestory || {};
    const gallery = initialData?.photoGallery || {};
    const images = [];
    const videos = [];

    //업데이트 필요
    //미디어를 **인덱스와 함께** imageurl와 videourl에 넣어서
    //imagering 렌더링시 텍스쳐 배열 만들때 인덱스 순서에 맞게 texture를 재구성할수 있게

    // 1. 유년시절
    gallery.childhood?.forEach(({ url }) => {
      if (url.endsWith(".mp4")) videos.push(url);
      else images.push(url);
    });

    // 2. 경험
    gallery.experience?.forEach((exp) => {
      exp.photos?.forEach((photo) => {
        if (photo.url.endsWith(".mp4")) videos.push(photo.url);
        else images.push(photo.url);
      });
    });

    // 3. 관계
    Object.values(gallery.relationship || {}).forEach((rel) => {
      rel.photos?.forEach((url) => {
        if (url.endsWith(".mp4")) videos.push(url);
        else images.push(url);
      });
    });

    setImageUrls(images);
    setVideoUrls(videos);

    setPerson({
      name: profile.name ?? defaultPerson.name,
      birthDate: profile.birthDate ?? defaultPerson.birthDate,
      birthPlace: profile.birthPlace ?? defaultPerson.birthPlace,
      profileImageUrl: profile.profileImageUrl ?? defaultPerson.profileImageUrl,
      motto: lifestory.motto ?? defaultPerson.motto,
      lifeStory: lifestory.story ?? defaultPerson.lifeStory,
      threadId: lifestory.threadId ?? defaultPerson.threadId,
      childhood: profile.childhood ?? defaultPerson.childhood,
      experience: profile.experience ?? defaultPerson.experience,
      relationship: profile.relationship ?? defaultPerson.relationship,
      photoGallery: gallery ?? null,
    });
    setIsBeforeLogin(false);
  }, [initialData]);

  const handlePersonChange = (updatedPerson) => {
    setPerson(updatedPerson);
  };

  async function handleSave({ person, file, storagePath, type, galleryData }) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("로그인이 필요합니다.");

      let profileImageUrl = null;

      // 🔸 프로필 이미지 처리
      if (file && storagePath.includes("profile.jpg")) {
        profileImageUrl = await uploadProfileImage(file, user.uid);
      }

      // 🔸 Firestore용 데이터 준비
      const profileData = {
        name: person.name,
        birthDate: person.birthDate,
        birthPlace: person.birthPlace,
        motto: person.motto,
        story: person.lifeStory,
        threadId: person.threadId,
        ...(profileImageUrl && { profileImageUrl }),
      };

      // 🔸 각 섹션별 저장
      if (type === "profile" || type === "all") {
        await saveProfileSection(user.uid, profileData);
      }
      if (type === "lifestory" || type === "all") {
        await saveLifestorySection(user.uid, profileData);
      }
      if ((type === "gallery" || type === "all") && galleryData) {
        const processedGallery = {};
        for (const category in galleryData) {
          const files = galleryData[category].map((item) => item.file);
          const captions = galleryData[category].map((item) => item.caption);
          const urls = await uploadGalleryImages(files, user.uid, category);
          processedGallery[category] = urls.map((url, i) => ({
            url,
            caption: captions[i],
          }));
          await savePhotoGalleryCategory(
            user.uid,
            category,
            galleryData[category]
          );
        }
      }

      setShowSuccessOverlay(true);
      console.log("저장 완료");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  }

  const controlsRef = useRef(null);
  const [showAuthOverlay, setShowAuthOverlay] = useState(true);
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

  const isSmallScreen = width < 768; // 가로폭 500px 이하 여부
  const isSceneOffset = width < 768; // 가로폭 500px 이하 여부
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
    // setForcedCategory((prev) => (prev === catName ? null : catName));
    setForcedCategory(catName);
    if (!catName) setForcedSubcategory(null);
    // setForcedSubcategory(null); // 메인 카테고리 잠금 시 서브 잠금 해제
  }

  function handleLockSubcategory(sub) {
    // setForcedCategory("소중한 사람");
    // setForcedSubcategory((prev) => (prev === sub ? null : sub));
    console.log(sub);
    setForcedSubcategory(sub);
    // if (forcedSubcategory === null) setForcedCategory(null);
    ringRef.current?.goToCategory(sub);
  }

  function handleSubcategoryChange(name) {
    setActiveSubCategory(name);
  }

  function handleSubcategoryClick(name) {
    setActiveSubCategory(name);
    setForcedSubcategory(name);
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
    // width: isSmallScreen ? "1200px" : "120vw",
    width: "100vw",
    minWidth: "1200px",
    height: "100vh",
    overflow: "scroll",

    // isOpen이면 오른쪽으로 100px 살짝 이동
    // transform: isSmallScreen ? "translateY(40%)" : null,
    transition: "all 0.5s ease",
  };

  // < 버튼 스타일 (이미지가 열려있을 때만 표시)
  const arrowButtonStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    // zIndex: 200,
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

  useEffect(() => {
    const onScroll = () => {
      setAtTop(isAtTop());
      setAtBottom(isAtBottom());
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  // 섹션 기준 스크롤 이동
  const handleScrollUp = () => {
    const vh = window.innerHeight;
    const current = window.scrollY;
    const target = Math.max(0, Math.floor(current / vh - 1) * vh);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  const handleScrollDown = () => {
    const vh = window.innerHeight;
    const current = window.scrollY;
    const maxHeight = document.body.scrollHeight;
    const target = Math.min(maxHeight, Math.ceil(current / vh + 1) * vh);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  const isAtTop = () => window.scrollY <= 10;
  const isAtBottom = () => {
    const vh = window.innerHeight;
    return window.scrollY >= document.body.scrollHeight - vh - 10;
  };

  // 전체 저장용 구조만 준비
  const handleSaveAll = async () => {
    try {
      console.log("전체 저장 실행 (섹션별 저장 호출 예정)");
      // profile 저장 → await saveProfileSection()
      // lifestory 저장 → await saveLifestorySection()
      // photogallery 저장 → await savePhotoGalleryCategory()
    } catch (e) {
      console.error("전체 저장 실패", e);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload(); // 간단히 새로고침으로 로그인 화면으로
  };

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
      setForcedCategory(catName);
      ringRef.current.goToCategory(catName);
    }
  }

  // ring에서 "현재 왼쪽 카테고리" 바뀔 때
  function handleCategoryChange(catName) {
    if (forcedCategory && catName !== forcedCategory) {
      setForcedCategory(null);
    }
    setActiveCategory(catName);
  }
  console.log(isBeforeLogin, isPreview);

  return (
    <div
      style={{
        position: "relative",
        fontFamily: "pretendard",
        backgroundColor: BLACK,
      }}
    >
      {!isBeforeLogin && (
        <FloatingToolbar
          onScrollUp={handleScrollUp}
          onScrollDown={handleScrollDown}
          isTop={atTop}
          isBottom={atBottom}
          onSaveAll={handleSaveAll}
          onLogout={handleLogout}
          isPreview={isPreview}
          setIsPreview={setIsPreview}
        />
      )}

      {showSuccessOverlay && (
        <SuccessOverlay hideOverlay={() => setShowSuccessOverlay(false)} />
      )}

      {/* 미리보기 모드 안내 표시 */}
      {!isBeforeLogin && isPreview && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            backgroundColor: "#00000099",
            color: "#fff",
            borderRadius: "8px",
            padding: "8px 16px",
            fontWeight: "400",
          }}
        >
          미리보기 중이에요. 편집으로 돌아가려면 미리보기 해제를 클릭해주세요
        </div>
      )}
      <div
        style={{
          margin: "0px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          justifyItems: "center",
          width: "100vw",
          overflowX: "hidden",
        }}
      >
        <Profile
          person={person}
          onPersonChange={handlePersonChange}
          onSave={handleSave}
          userId={user?.uid}
          isPreview={isPreview}
          profileHasUnsavedChanges={profileHasUnsavedChanges}
          setProfileHasUnsavedChanges={(b) => setProfileHasUnsavedChanges(b)}
        />
        <Lifestory
          person={person}
          onPersonChange={handlePersonChange}
          onSave={handleSave}
          userId={user?.uid}
          isPreview={isPreview}
          LifeStoryHasUnsavedChanges={LifeStoryHasUnsavedChanges}
          setLifeStoryHasUnsavedChanges={(b) =>
            setLifeStoryHasUnsavedChanges(b)
          }
        />

        <div
          className="photoGallery"
          style={{
            display: "flex",
            flexWrap: "wrap",
            transformStyle: "preserve-3d",
            position: "relative",
            width: "100%",
            maxWidth: "768px",
            overflow: "hidden",
            height: "150vh",
            backgroundColor: "#1a1a1a",
          }}
        >
          <div style={{ width: "100%", height: "150vh", position: "relative" }}>
            {/* 1) 왼쪽 이미지 슬라이딩 영역 */}
            <div
              style={{
                width: "100%",
                height: "auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignContent: "center",
              }}
            >
              {!isBeforeLogin && !isPreview && (
                <button
                  onClick={() => router.push("/gallery")}
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    padding: "8px 16px",
                    backgroundColor: "#7f1d1d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    zIndex: 1000,
                  }}
                >
                  갤러리 편집
                </button>
              )}
              <div style={leftPaneStyle}>
                <div
                  style={{
                    color: "#fefefe",
                    // padding: isSmallScreen ? " 30px 15px" : "3vw 5vw 0vw 5vw",
                    padding: "50px 20px",
                  }}
                >
                  <strong style={{ color: "#fefefe", fontSize: "1.8rem" }}>
                    {person.name}님의 영상기록관
                  </strong>
                  {/* <p
                    style={{
                      color: "#fefefe",
                      fontSize: "1rem",
                      marginTop: "20px",
                    }}
                  >
                    {person.name}님이 살아온 삶을 사진을 통해 돌아보세요.
                  </p> */}
                </div>
              </div>
              {/* 2) ThreeFiberScene (오른쪽으로 이동) */}
              <div style={rightPaneStyle}>
                {/* {forcedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "20px",
                      // zIndex: 1000,
                      color: "#ffffff",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                    onClick={() => setForcedCategory(null)}
                  >
                    카테고리 선택 해제하기
                  </motion.div>
                )} */}

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
                    person={person}
                    imageUrls={imageUrls}
                    videoUrls={videoUrls}
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
                {/* <RingCategoryNav
                  activeCategory={activeCategory}
                  activeSubCategory={activeSubCategory}
                  forcedCategory={forcedCategory}
                  forcedSubcategory={forcedSubcategory}
                  onCategoryClick={handleCategoryClick}
                  onLockCategory={handleLockCategory}
                  onSubcategoryClick={handleSubcategoryClick}
                  onLockSubcategory={handleLockSubcategory}
                /> */}
              </div>
            </div>
          </div>
          <GalleryNav
            person={person}
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
  );
};

export default MemorialPage;
