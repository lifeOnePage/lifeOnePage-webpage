"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingToolbar({
  onScrollUp,
  onScrollDown,
  isTop,
  isBottom,
  onSaveAll,
  onLogout,
  isPreview,
  setIsPreview,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      style={{
        position: "fixed",
        bottom: 30,
        left: 0,
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        zIndex: 1000,
        pointerEvents: "none", // 툴바가 아닌 공간은 클릭 안되도록
      }}
    >
      <div
        style={{
          pointerEvents: "auto", // 버튼 클릭 가능하게
          background: "#1a1a1a",
          padding: collapsed ? "8px 12px" : "16px 24px",
          borderRadius: "30px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0px 4px 16px rgba(0,0,0,0.4)",
          transition: "all 0.3s ease",
        }}
      >
        {/* 접기/펼치기 */}
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "펼치기" : "접기"}
        </button>

        <AnimatePresence>
          {!collapsed && (
            <>
              {!isPreview && (
                <button
                  onClick={onScrollUp}
                  disabled={isTop}
                  style={{ opacity: isTop ? 0.3 : 1 }}
                >
                  위로
                </button>
              )}
              {!isPreview && (
                <button
                  onClick={onScrollDown}
                  disabled={isBottom}
                  style={{ opacity: isBottom ? 0.3 : 1 }}
                >
                  아래로
                </button>
              )}
              <button onClick={() => setIsPreview(!isPreview)}>
                {isPreview ? "미리보기 해제" : "미리보기"}
              </button>
              {!isPreview && <button onClick={onSaveAll}>전체 저장</button>}
              {!isPreview && <button onClick={onLogout}>로그아웃</button>}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
