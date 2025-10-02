// app/page.js
"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PreviewHeader from "./components/PreviewHeader";
// import MemorialPage from "./memorial/MemorialPage";
import { MAIN_THEME } from "./styles/colorConfig";
// import SelectModal from "./components/SelectModal";
// import SelectModalForAlreadyCreated from "./components/SelectModalForAlreadyCreated";
import { auth, firestore } from "./firebase/firebaseConfig";
import AuthOverlay from "./memorial/AuthOverlay";
import { useRouter } from "next/navigation";
import { useUser } from "./contexts/UserContext";
import AboutSweep from "./components/AboutSweep";
import { view } from "framer-motion";
import Page from "./card/page";
import AboutInfo from "./components/AboutInfo";
import AboutDetail from "./components/AboutDetail";
import AboutLines from "./components/AboutLines";

// SceneWrapper는 R3F 기반 3D 컴포넌트
const Main3FGraphic = dynamic(() => import("./components/Main3FGraphic"), {
  ssr: false,
});
const SelectModal = dynamic(() => import("./components/SelectModal"), {
  ssr: false,
});
const SelectModalForAlreadyCreated = dynamic(
  () => import("./components/SelectModalForAlreadyCreated"),
  {
    ssr: false,
  }
);
const MemorialPage = dynamic(() => import("./memorial/MemorialPage"), {
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
  console.log(user, initialData);

  const [type, setType] = useState("card");
  const [trigger, setTrigger] = useState(false);
  const router = useRouter();

  const handleScrollToPreview = (viewType) => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setType(viewType ?? "card");
    setSelectedPreview(viewType ?? "card");
  };
  const handleSelected = (newPreview) => {
    console.log(newPreview);
    setSelectedPreview(newPreview);
    setType(newPreview);
  };
  const handleStart = (selected) => {
    setType(selected);
    setAuthlayerVisible(true);
    setIsSelectModalOpen(false);
  };
  const handleEdit = (type) => {
    console.log(user);
    router.push(`/${type === "card" ? "card" : initialData.username}`);
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

  // console.log(user, initialData, dataLoading);
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>불러오는 중...</div>
    );
  }

  return (
    <div
      style={{
        overflow: "visible",
        background: "#121212",
        color: "white",
        fontFamily: "pretendard",
      }}
    >
      {/* 3D 영역 */}
      <div style={{ height: "100vh", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: "50vh",
            transform: "translateY(-50%)",
            zIndex: 5000,
          }}
        >
          <AboutLines />
        </div>

        <Main3FGraphic
          onPreviewRequest={(v) => handleScrollToPreview(v)}
          initialData={initialData}
          setTrigger={(b) => setTrigger(b)}
        />
      </div>

      <div
        style={{
          height: "100vh",
          backgroundColor: "black",
          position: "relative",
        }}
      >
        <AboutInfo />
      </div>

      <div>
        <AboutDetail />
      </div>
    </div>
  );
}
