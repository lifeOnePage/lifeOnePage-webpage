"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiSave,
} from "react-icons/fi";
import { IoIosArrowBack, IoIosArrowForward, IoIosLogOut } from "react-icons/io";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { MdPerson } from "react-icons/md";
import { useRouter } from "next/navigation";

export default function FloatingToolbar({
  person,
  userId,
  onScrollUp,
  onScrollDown,
  isTop,
  isBottom,
  onSave,
  onLogout,
  isPreview,
  setIsPreview,
  isUpdated,
  file,
  url,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(null);

  const contStyle = {
    position: "relative",
    display: "inline-block",
    margin: "auto",
  };
  const style = {
    position: "absolute",
    bottom: "150%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "6px 10px",
    fontSize: "12px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    zIndex: 10,
  };
  const router = useRouter();
  const onClickMypage = () => {
    if (isUpdated) alert("저장되지 않은 변경사항이 있습니다.");
    else {
      router.push(`/mypage`);
    }
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      style={{
        position: "fixed",
        bottom: 60,
        left: 0,
        width: "100vw",
        display: "flex",
        justifyContent: "flex-start", // ✅ 중앙 정렬 → 왼쪽 정렬
        paddingLeft: 24,               // ✅ 좌측 여백
        zIndex: 1000,
        pointerEvents: "none", // 툴바가 아닌 공간은 클릭 통과
      }}
    >
      <motion.div
        animate={{ width: collapsed ? 68 : "auto" }}
        transition={{ duration: 0.3 }}
        style={{
          pointerEvents: "auto",
          background: "#1a1a1a",
          padding: "10px 24px",
          borderRadius: "30px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "30px",
          boxShadow: "0px 4px 16px rgba(0,0,0,0.4)",
          transformOrigin: "left center", // ✅ 왼쪽 기준으로 펼쳐짐
          // overflow: "hidden",
        }}
      >
        {/* 접기/펼치기 */}
        <div
          style={contStyle}
          onMouseEnter={() => setHovered(collapsed ? "minimize" : "maximize")}
          onMouseLeave={() => setHovered(false)}
        >
          {/* 안내 문구 (호버 시 표시) */}
          {hovered === "minimize" ||
            (hovered === "maximize" && (
              <div style={style}>{collapsed ? "툴바 펼치기" : "툴바 접기"}</div>
            ))}
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <IoIosArrowForward size={20} /> : <IoIosArrowBack size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <>
              {[
                {
                  key: "mypage",
                  onClick: onClickMypage,
                  icon: <MdPerson size={20} />,
                  disabled: isUpdated,
                },
                {
                  key: "preview",
                  onClick: () => setIsPreview(!isPreview),
                  icon: isPreview ? <FiEyeOff size={20} /> : <FiEye size={20} />,
                },
                {
                  key: "save",
                  onClick: () =>
                    onSave({
                      person,
                      file,
                      storagePath: `users/${userId}/profile.jpg`,
                      type: "all",
                    }),
                  icon: isUpdated ? (
                    <FiSave size={20} />
                  ) : (
                    <FiSave size={20} />
                  ),
                  disabled: !isUpdated,
                },
                {
                  key: "logout",
                  onClick: onLogout,
                  icon: <IoIosLogOut size={20} />,
                },
              ].map(
                (item, i) =>
                  (!item.condition ?? true) && (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      style={contStyle}
                      onMouseEnter={() => setHovered(item.key)}
                      onMouseLeave={() => setHovered(false)}
                    >
                      {hovered === item.key && (
                        <div style={style}>
                          {item.key === "preview"
                            ? isPreview
                              ? "클릭하여 편집"
                              : "클릭하여 미리보기"
                            : item.key === "up"
                            ? "위로"
                            : item.key === "down"
                            ? "아래로"
                            : item.key === "mypage"
                            ? "계정 설정"
                            : item.key === "save" && isUpdated
                            ? "저장하려면 클릭하세요"
                            : item.key === "save" && !isUpdated
                            ? "모든 변경사항이 저장되었어요"
                            : item.key === "logout"
                            ? "로그아웃"
                            : ""}
                        </div>
                      )}
                      <button
                        onClick={item.onClick}
                        disabled={item.disabled}
                        style={{
                          opacity: item.disabled ? 0.3 : 1,
                          cursor: item.disabled ? "default" : "pointer",
                          background: "none",
                          border: "none",
                          padding: 0,
                        }}
                      >
                        {item.icon}
                      </button>
                    </motion.div>
                  )
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
