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
  // uploadGalleryImages,
  uploadProfileImage,
} from "../utils/firebaseStorage";
import {
  saveProfileSection,
  saveLifestorySection,
  savePhotoGalleryCategory,
} from "../utils/firebaseDb";
import FloatingToolbar from "../components/FloatingToolBar";
import SuccessOverlay from "../components/SuccessOverlay";
import ScrollUpOneViewportButton from "../components/ScrollUpOneViewportButton";
import GalleryNav from "../components/GalleryNav";
import { useRouter } from "next/navigation";
import { BLACK } from "../styles/colorConfig";
import { Timestamp } from "firebase/firestore";
import { FiEyeOff } from "react-icons/fi";
import { useUser } from "../contexts/UserContext";

const MemorialPage = ({ uid, initialData, isMe }) => {
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
  const [leftmostPath, setLeftmostPath] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [forcedCategory, setForcedCategory] = useState(null);
  const [forcedSubcategory, setForcedSubcategory] = useState(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(true);
  const [selectedImage, setSelectedImage] = useState("/images/img3.png");
  const [isOpen, setIsOpen] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [profileUrl, setProfileUrl] = useState("/images/portrait.jpg");
  const [profileFile, setProfileFile] = useState(null);

  const topImageRef = useRef();
  const controlsRef = useRef(null);
  const ringRef = useRef();

  const { setDataLoading } = useUser();

  const { width, height } = useWindowSize();

  const imagePaths = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => `/images/image${i % 10}.jpeg`);
  }, []);

  const videoPaths = useMemo(() => {
    return Array.from({ length: 2 }, (_, i) => `/videos/video${i}.mp4`);
  }, []);

  const isTypingIntoEditable = (e) => {
    const el = e.target || document.activeElement;
    if (!el) return false;
    if (el.isContentEditable) return true;
    const closestEditable = el.closest?.(
      '[contenteditable="true"], [role="textbox"]'
    );
    if (closestEditable) return true;

    const tag = (el.tagName || "").toLowerCase();
    if (tag === "textarea") return true;
    if (tag === "input") return true; // 모든 input에서 스냅 키 무시(안전)

    return false;
  };

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
    setDataLoading(false);
    if (!isMe) {
      setIsBeforeLogin(true);
      setIsPreview(true);
      return;
    }

    setIsBeforeLogin(false);
    setIsPreview(false);
  }, [initialData]);
  const handlePersonChange = (updatedPerson) => {
    setIsUpdated(true);
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
        ...(initialData.profile.name !== person.name && { name: person.name }),
        ...(initialData.profile.birthDate !== person.birthDate && {
          birthDate: person.birthDate,
        }),
        ...(initialData.profile.birthPlace !== person.birthPlace && {
          birthPlace: person.birthPlace,
        }),
        ...(profileImageUrl && { profileImageUrl }),
      };
      console.log(initialData.lifestory);
      console.log(person);
      console.log(initialData.lifestory !== person);
      const storyData = {
        ...(initialData.lifestory?.motto !== person.motto && {
          motto: person.motto,
        }),
        ...(initialData.lifestory?.story !== person.lifeStory && {
          story: person.lifeStory,
        }),
      };

      // 🔸 각 섹션별 저장
      if ((type === "profile" || type === "all") && profileData) {
        await saveProfileSection(user.uid, profileData);
      }
      if ((type === "lifestory" || type === "all") && storyData) {
        await saveLifestorySection(user.uid, storyData);
      }
      // if (type === "gallery" && galleryData) {
      //   const processedGallery = {};
      //   for (const category in galleryData) {
      //     const files = galleryData[category].map((item) => item.file);
      //     const captions = galleryData[category].map((item) => item.caption);
      //     const urls = await uploadGalleryImages(files, user.uid, category);
      //     processedGallery[category] = urls.map((url, i) => ({
      //       url,
      //       caption: captions[i],
      //     }));
      //     await savePhotoGalleryCategory(
      //       user.uid,
      //       category,
      //       galleryData[category]
      //     );
      //   }
      // }

      setShowSuccessOverlay(true);
      setIsUpdated(false);
      console.log("저장 완료");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  }

  // 뷰포트가 가로가 더 길면(true = landscape),
  // 세로에 맞춰서 보여줌(height: 100vh, width: auto)
  // 세로가 더 길면(width: 100vw, height: auto)
  const isLandscape = width > height;

  const isSmallScreen = width < 768;

  const leftPaneStyle = {
    position: "relative",
    width: "auto",
    // transform: imageTransformValue,
    // transition: "transform 0.5s ease",
    color: "#fefefe",
    margin: "30px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

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

  //스크롤값 감지
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty("--scroll", scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // threefiber 씬 스타일
  const rightPaneStyle = isSmallScreen
    ? {
        position: "relative",
        // width: isSmallScreen ? "1200px" : "120vw",
        width: "100%",
        minWidth: "1100px",
        height: "100vh",
        display: "flex",

        // transform: "translateX(50%)",
        // overflow: "scroll",
        transition: "all 0.5s ease",
      }
    : {
        position: "relative",
        // width: isSmallScreen ? "1200px" : "120vw",
        width: "150%",
        // minWidth: "1100px",
        height: "100vh",
        transform: "translateX(10%)",
        display: "flex",
        // overflow: "scroll",
        transition: "all 0.5s ease",
      };

  //스크롤값 섹션 감지
  useEffect(() => {
    const onScroll = () => {
      setAtTop(isAtTop());
      setAtBottom(isAtBottom());
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 섹션 기준 스크롤 위로 이동
  const handleScrollUp = () => {
    const vh = window.innerHeight;
    const current = window.scrollY;
    const target = Math.max(0, Math.floor(current / vh - 1) * vh);
    window.scrollTo({ top: target, behavior: "smooth" });
  };
  // 섹션 기준 스크롤 아래로 이동
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
    // window.location.reload(); // 간단히 새로고침으로 로그인 화면으로

    router.push(`/`);
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
  console.log(isPreview);

  return (
    <div
      style={{
        position: "relative",
        fontFamily: "pretendard",
        backgroundColor: BLACK,
        zIndex: 1000,
        overscrollBehaviorY: "contain",
      }}
    >
      <ScrollUpOneViewportButton step={1} />
      {isMe && (
        <FloatingToolbar
          person={person}
          userId={uid}
          file={profileFile}
          url={profileUrl}
          onScrollUp={handleScrollUp}
          onScrollDown={handleScrollDown}
          isTop={atTop}
          isBottom={atBottom}
          onSave={handleSave}
          onLogout={handleLogout}
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          isUpdated={isUpdated}
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
            minWidth: 280,
            maxWidth: 500,
            width: "60vw",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "center",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            backgroundColor: "#00000099",
            color: "#fff",
            borderRadius: "8px",
            padding: "10px 16px",
            fontWeight: "400",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          미리보기 중이에요.{" "}
          <div style={{ display: "flex", gap: 10 }}>
            <FiEyeOff size={20} />를 눌러 편집을 계속할 수 있어요
          </div>
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
          setIsUpdated={setIsUpdated}
          onSave={handleSave}
          userId={uid}
          isPreview={isPreview}
          profileHasUnsavedChanges={profileHasUnsavedChanges}
          setProfileHasUnsavedChanges={(b) => setProfileHasUnsavedChanges(b)}
          onUrlChange={(u) => setProfileUrl(u)}
          onFileChange={(f) => setProfileFile(f)}
          file={profileFile}
          url={profileUrl}
        />
        <Lifestory
          person={person}
          userName={person.name}
          onPersonChange={handlePersonChange}
          onSave={handleSave}
          userId={uid}
          isPreview={isPreview}
          LifeStoryHasUnsavedChanges={LifeStoryHasUnsavedChanges}
          setLifeStoryHasUnsavedChanges={(b) => setIsUpdated(b)}
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
              <div style={leftPaneStyle}>
                <p style={{ fontSize: "3rem", fontFamily:"Cormorant Garamond", fontStyle:"oblique 40deg" }}>
                  <style>
                    @import
                    url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&display=swap');
                  </style>
                  Life-Reels
                </p>
                <p style={{color:"#aaa"}}>
                  Life-Reels는 소중한 기억을 한 곳에 모아 만들어진 {person.name}님만의 특별한 영화입니다.
                </p>
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
              {/* <p style={{ margin:20, color: "#fefefe", fontSize: "1rem" }}>
                  {person.name}님의 영상기록관
                </p> */}

              {/* 2) ThreeFiberScene (오른쪽으로 이동) */}
              <div style={leftPaneStyle}>
                {/* <div
                  style={{
                    color: "#fefefe",
                    margin: "30px 20px",
                  }}
                > */}
                {/* <strong style={{ color: "#fefefe", fontSize: "1.8rem" }}>
                  {person.name}님의 영상기록관
                </strong> */}

                {/* </div> */}
                {!isBeforeLogin && !isPreview && (
                  <button
                    onClick={() => {
                      if (isUpdated)
                        alert(
                          "아직 저장되지 않은 변경사항이 있어요. 저장하시겠어요?"
                        );
                      router.push("/gallery");
                    }}
                    style={{
                      // position: "absolute",
                      // top: 60,
                      // right: 20,
                      padding: "8px 16px",
                      backgroundColor: "#7f1d1d",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      zIndex: 2000,
                      cursor: "pointer",
                    }}
                  >
                    갤러리 편집
                  </button>
                )}
              </div>
              <div style={rightPaneStyle}>
                <Canvas
                  camera={{ position: [0, 10, 400], fov: 75 }}
                  pointerEvents={false}
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[100, 200, 300]} intensity={1} />

                  <OrbitControls
                    ref={controlsRef}
                    enableZoom={false}
                    enablePan={false}
                    // onChange: 카메라 조작 중 실시간 업데이트가 필요하다면
                    // onEnd: 조작이 끝난 뒤 한 번만
                    enabled={!isRotating}
                    // enabled={false}
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
              </div>
              {/* <GalleryNav
                person={person}
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
      </div>
    </div>
  );
};

export default MemorialPage;
