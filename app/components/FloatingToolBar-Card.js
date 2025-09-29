"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiMaximize2,
  FiMinimize,
  FiMinimize2,
  FiSave,
  FiPlus,
} from "react-icons/fi";
import {
  FaAngleDown,
  FaAngleUp,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  IoIosArrowBack,
  IoIosArrowDown,
  IoIosArrowForward,
  IoIosArrowUp,
  IoIosLogOut,
  IoMdCheckmarkCircleOutline,
} from "react-icons/io";
import { MdOutlineManageAccounts } from "react-icons/md";
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
  onAddTimeline,
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
        bottom: 24,
        right: 24,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{ height: collapsed ? 68 : "auto" }}
        transition={{ duration: 0.3 }}
        style={{
          pointerEvents: "auto",
          background: "#1a1a1a",
          padding: collapsed ? "8px" : "12px",
          borderRadius: "28px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          width: 100,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          overflow: "hidden",
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
            {collapsed ? (
              <IoIosArrowUp size={20} />
            ) : (
              <IoIosArrowDown size={20} />
            )}
          </button>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <>
              {[
                // {
                //   key: "up",
                //   onClick: onScrollUp,
                //   icon: <IoIosArrowUp size={20} />,
                //   disabled: isTop,
                // },
                // {
                //   key: "down",
                //   onClick: onScrollDown,
                //   icon: <IoIosArrowDown size={20} />,
                //   disabled: isBottom,
                // },
                {
                  key: "add",
                  onClick: onAddTimeline,
                  icon: <FiPlus size={20} />,
                  disabled: isPreview,
                },
                {
                  key: "mypage",
                  onClick: onClickMypage,
                  icon: <MdOutlineManageAccounts size={20} />,
                  disabled: isUpdated,
                },
                {
                  key: "preview",
                  onClick: () => setIsPreview(!isPreview),
                  icon: isPreview ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  ),
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
                    <IoMdCheckmarkCircleOutline size={20} />
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
                            : item.key === "add"
                            ? "타임라인 추가"
                            : item.key === "up"
                            ? "위로"
                            : item.key === "down"
                            ? "아래로"
                            : item.key === "mypage"
                            ? "계정 설정"
                            : item.key === "save" && isUpdated
                            ? "저장하려면 클릭하세요"
                            : item.key === "save" && !isUpdated
                            ? "변경사항이 저장됨"
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
