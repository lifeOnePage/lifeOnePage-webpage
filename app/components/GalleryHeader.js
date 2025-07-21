import { useSearchParams, useRouter } from "next/navigation";
import { useUnsavedChanges } from "../contexts/UnsavedChangesContext";
import { FiSmile, FiStar, FiUsers } from "react-icons/fi";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function GalleryHeader() {
  const { hasUnsavedChanges } = useUnsavedChanges();
  const router = useRouter();
  const params = useSearchParams();
  const currentCategory = params.get("category") || "childhood";

  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const containerRef = useRef(null);
  const tabRefs = useRef({});

  const categories = [
    { key: "childhood", label: "유년시절", icon: <FiSmile size={20} /> },
    { key: "experience", label: "소중한 기억", icon: <FiStar size={20} /> },
    { key: "relationship", label: "소중한 인연", icon: <FiUsers size={20} /> },
  ];

  const handleClick = (category) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "저장되지 않은 변경사항이 있습니다. 이동하시겠습니까?"
      );
      if (!confirmLeave) return;
    }

    const search = new URLSearchParams();
    search.set("category", category);
    router.push(`/gallery?${search.toString()}`);
  };

  useLayoutEffect(() => {
    const updateIndicator = () => {
      if (tabRefs.current[currentCategory] && containerRef.current) {
        const rect = tabRefs.current[currentCategory].getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setIndicatorStyle({
          width: rect.width,
          left: rect.left - containerRect.left,
        });
      }
    };

    // 처음 실행
    updateIndicator();

    // ⭐ resize 이벤트 등록
    window.addEventListener("resize", updateIndicator);

    // cleanup
    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [currentCategory]);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 425;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #fafafa33",
        padding: "0 16px",
        backgroundColor: "#fafafa33",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "60px",
        zIndex: 1000,
        backdropFilter: "brightness(5) blur(40px)",
      }}
    >
      <button
        onClick={() => router.push("/memorial")}
        style={{
          background: "none",
          border: "none",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#333",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        ← 돌아가기
      </button>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          padding: "0px 20px",
          justifyContent: "center",
          height: "100%",
          maxWidth: "768px",
        }}
      >
        {categories.map(({ key, label, icon }) => {
          const isActive = currentCategory === key;
          const isMobile =
            typeof window !== "undefined" && window.innerWidth <= 425;

          return (
            <div
              key={key}
              ref={(el) => (tabRefs.current[key] = el)}
              onClick={() => handleClick(key)}
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                color: isActive ? "#1a1a1a" : "#1a1a1a55",
                fontWeight: isActive ? "bold" : "normal",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                position: "relative",

                // 🔥 여기가 핵심!
                flex: isMobile ? (isActive ? 1 : "0 0 auto") : 1,
                minWidth: isMobile ? (isActive ? "auto" : "40px") : "auto",
              }}
            >
              <div
                style={{
                  transition: "transform 0.3s ease, opacity 0.3s ease",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {icon}
              </div>

              <span
                style={{
                  marginTop: "4px",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.3s ease, max-height 0.3s ease",
                  opacity: isMobile ? (isActive ? 1 : 0) : 1,
                  maxHeight: isMobile ? (isActive ? "20px" : "0") : "20px",
                  overflow: "hidden",
                  fontSize: "12px",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}

        {/* 선택 인디케이터 (검은 줄) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            height: "3px",
            backgroundColor: "#1a1a1a",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      <div style={{ width: "60px" }} />
    </div>
  );
}
