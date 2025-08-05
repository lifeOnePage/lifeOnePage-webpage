"use client";

import { useState, useEffect, useRef } from "react";

import RingPictogram from "./RingPictogram";
import TabPlanePictogram from "./TabPlanePictogram";
import formatDate from "../utils/formatDate"

//유저 문서가 있을 경우 번호 인증 후 모달을 띄움
//유저 문서가 아예 없으면 선택한 형식 에딧화면으로 바로 라우팅
export default function SelectModalForAlreadyCreated({
  type,
  user,
  initialData,
  isOpen,
  onClose,
  onStart,
}) {
  const [selected, setSelected] = useState(type);
  const [isClosing, setIsClosing] = useState(false);

  const modalRef = useRef(null);

  // 모달 바깥 클릭 감지
  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // 닫기 애니메이션
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // 애니메이션 시간
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
        transition: "opacity 0.3s",
        opacity: isClosing ? 0 : 1,
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: "#000000cc",
          padding: "40px 20px",
          width: "60vw",
          maxWidth: "600px",
          minWidth: "300px",
          minHeight: "300px",
          transform: isClosing ? "translateY(100px)" : "translateY(0)",
          transition: "transform 0.3s ease",
          borderRadius: 16,
          position: "relative",
        }}
      >
        <p style={{ margin: "20px 0px", color: "#ffffffbb" }}>
          <strong>{initialData.profile.name} 님</strong>, 다시 만나서 반가워요!
          <br />
          이전에 작성하신 기록을 확인했어요. <br />
          아래 두 가지 형식 중 어떤 걸 선택하셔도 괜찮아요.
          <br />
          선택 후에도 언제든지 자유롭게 수정하거나 다른 형식으로 바꾸실 수
          있어요.
        </p>

        {/* 닫기 버튼 */}
        <div
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 10,
            right: 16,
            cursor: "pointer",
            color: "#fff",
            fontSize: 20,
          }}
        >
          ✕
        </div>

        {/* 선택 항목 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {["card", "page"].map((type) => (
            <div
              key={type}
              onClick={() => setSelected(type)}
              style={{
                flex: 1,
                minWidth: 240,
                padding: "20px",
                backgroundColor:
                  selected === type ? "#ffffff22" : "transparent",
                border:
                  selected === type ? "2px solid white" : "1px solid #ffffff44",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.3s ease",
                color: "#fff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#ffffff11")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  selected === type ? "#ffffff22" : "transparent")
              }
            >
              {selected === type && type === "card" && (
                <div>
                  
                  <TabPlanePictogram />
                </div>
              )}
              {selected === type && type === "page" && (
                <div>
                  
                  <RingPictogram />
                </div>
              )}
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                {type === "card" ? "LifeOneCard" : "LifeOnePage"}
              </h2>
              <p>
                {type === "card"
                  ? initialData.cardUpdatedAt
                    ? `최근 수정일 ${formatDate(
                        initialData.cardUpdatedAt?.toDate()
                      )} `
                    : "아직 비어있어요"
                  : initialData.pageUpdatedAt
                  ? `최근 수정일 ${formatDate(
                      initialData.pageUpdatedAt?.toDate()
                    )}`
                  : "아직 비어있어요"}
              </p>

              {selected === type && (
                <div style={{ marginTop: 10, textAlign: "right" }}>
                  <button
                    style={{
                      backgroundColor: "#ffffff33",
                      borderRadius: 20,
                      padding: "8px 20px",
                      fontSize: "1rem",
                      border: "none",
                      cursor: "pointer",
                      color: "white",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => {
                      onStart(selected);
                    }}
                  >
                    시작하기 &gt;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

