// app/page.js
"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PreviewHeader from "./components/PreviewHeader";
import MemorialPage from "./memorial/MemorialPage";
import { MAIN_THEME } from "./styles/colorConfig";
import SelectModal from "./components/SelectModal";
import SelectModalForAlreadyCreated from "./components/SelectModalForAlreadyCreated";
import { auth, firestore } from "./firebase/firebaseConfig";
import AuthOverlay from "./memorial/AuthOverlay";
import { useRouter } from "next/navigation";
import { useUser } from "./contexts/UserContext";

// SceneWrapper는 R3F 기반 3D 컴포넌트
const Main3FGraphic = dynamic(() => import("./components/Main3FGraphic"), {
  ssr: false,
});

export default function Home() {
  const scrollRef = useRef(null);
  const previewTopRef = useRef(null);
  const [selectedPreview, setSelectedPreview] = useState("card");
  const [isSticky, setIsSticky] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [
    isSelectModalOpenForAlreayCreated,
    setIsSelectModalOpenForAlreayCreated,
  ] = useState(false);
  const [authlayerVisible, setAuthlayerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, initialData, dataLoading } = useUser();

  const [type, setType] = useState("card");
  const router = useRouter();

  const handleScrollToPreview = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  const handleSelected = (newPreview) => {
    setSelectedPreview(newPreview);
    setType(newPreview);
  };
  const handleStart = (selected) => {
    setType(selected);
    setAuthlayerVisible(true);
    setIsSelectModalOpen(false);
  };
  const handleEdit = (type) => {
    router.push(`/${type === "card" ? "card" : "memorial"}`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    if (previewTopRef.current) observer.observe(previewTopRef.current);
    return () => {
      if (previewTopRef.current) observer.unobserve(previewTopRef.current);
    };
  }, []);

  console.log(user, initialData, dataLoading);
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>불러오는 중...</div>
    );
  }

  return (
    <div
      style={{
        overflow: "visible",
        background: "black",
        color: "white",
        fontFamily: "pretendard",
      }}
    >
      {/* 3D 영역 */}
      <div style={{ height: "100vh", position: "relative" }}>
        <Main3FGraphic onPreviewRequest={handleScrollToPreview} />
      </div>

      {/* Sticky 감지용 포인트 */}
      <div ref={previewTopRef}></div>

      {/* 미리보기 영역 */}
      <div ref={scrollRef} style={{ height: "300vh" }}>
        <div
          style={{
            position: isSticky ? "sticky" : "relative",
            top: 0,
            zIndex: 1000,
            background: "black",
            borderBottom: "1px solid #333",
          }}
        >
          <PreviewHeader
            selected={selectedPreview}
            setSelected={handleSelected}
          />
        </div>

        <div style={{}}>
          {selectedPreview === "card" && <div>카드 포맷 미리보기 컴포넌트</div>}
          {selectedPreview === "page" && (
            <div>
              <MemorialPage />
            </div>
          )}
        </div>

        <button
          onClick={() => {
            console.log(isSelectModalOpen);
            if (!user) setIsSelectModalOpen(true);
            else setIsSelectModalOpenForAlreayCreated(true);
          }}
          style={{
            position: isSticky ? "sticky" : "relative",
            margin: "0 auto",
            display: "block",
            padding: "10px 30px",
            borderRadius: 30,
            height: 60,
            fontSize: "1.25rem",
            bottom: isSticky ? "30px" : "calc(200vh + 120px)",
            zIndex: 300,
            background: MAIN_THEME,
            borderBottom: "1px solid #333",
          }}
        >
          직접 만들기
        </button>
        <SelectModal
          type={type}
          isOpen={isSelectModalOpen}
          onClose={() => setIsSelectModalOpen(false)}
          onStart={handleStart}
        />
        {user && initialData && (
          <SelectModalForAlreadyCreated
            type={type}
            isOpen={isSelectModalOpenForAlreayCreated}
            user={user}
            initialData={initialData}
            onClose={() => setIsSelectModalOpenForAlreayCreated(false)}
            onStart={handleEdit}
          />
        )}
        {authlayerVisible && (
          <div>
            <AuthOverlay
              auth={auth}
              firestore={firestore}
              onAuthComplete={() => {
                // router.push(`/${type === "card" ? "card" : "memorial"}`);
                setAuthlayerVisible(false);
                setIsSelectModalOpenForAlreayCreated(true);
                setIsSelectModalOpen(false);
              }}
            />
            <button
              style={{
                position: "fixed",
                top: "30%",
                left: "30%",
                borderRadius: 20,
                textDecoration: "underline",
                padding: "8px 20px",
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                color: "white",
                transition: "all 0.3s ease",
                zIndex: "1300",
              }}
              onClick={() => {
                setAuthlayerVisible(false);
                setIsSelectModalOpen(true);
              }}
            >
              &lt;뒤로 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
