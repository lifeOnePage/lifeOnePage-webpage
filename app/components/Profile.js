"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { FiCheckCircle, FiUpload } from "react-icons/fi";
import { BLACK, MAIN_THEME, SUB_THEME } from "../styles/colorConfig";

export default function Profile({
  person,
  onPersonChange,
  onSave,
  userId,
  isPreview,
  setIsUpdated,
  profileHasUnsavedChanges,
  setProfileHasUnsavedChanges,
  onUrlChange,
  onFileChange,
  file,
  url,
}) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [focusedKey, setFocusedKey] = useState(null); // 'name' | 'dates' | 'birthPlace' | 'motto' | null
  const fileInputRef = useRef();

  useEffect(() => {
    if (!person.profileImageUrl) return;
    onUrlChange(person.profileImageUrl);
  }, [person]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleImageSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      onFileChange(selected);
      const url = URL.createObjectURL(selected);
      onUrlChange(url);
    }
    setProfileHasUnsavedChanges(true);
    setIsUpdated(true);
  };

  const handleSaveClick = () => {
    if (!userId) {
      console.log("no id");
      return;
    }
    onSave({
      person,
      file,
      storagePath: `users/${userId}/profile.jpg`,
      type: "profile",
    });
    setProfileHasUnsavedChanges(false);
  };

  // --- Helper to render contextual help text ---
  const helpTextFor = (key) => {
    switch (key) {
      case "name":
        return "이름을 입력해 주세요.\n예) 홍길동";
      case "dates":
        return "생년월일을 입력해 주세요.\n예) 2003.10.27\n* 고인의 기록이라면 사망일까지 함께 입력해 주세요.\n  예) 1950.01.01-2025.01.01";
      case "birthPlace":
        return "태어난 곳을 입력해 주세요. 원하시면 조금 자세히 적어도 좋아요.\n다만 공개 페이지이므로 너무 상세한 주소는 피해주세요.\n예) 서울 마포구 / 전남 담양";
      case "motto":
        return "좋아하는 문구, 가사, 가치관 등 한 문장을 적어 주세요.\n스스로를 잘 드러낼수록 좋아요.\n예) '떡볶이가 좋아', '흘러가는 물처럼 살자'";
      default:
        return "";
    }
  };

  // Tooltip component shown only for the currently focused field
  const HelpBubble = ({ activeKey, myKey }) => {
    const show = !isPreview && activeKey === myKey;
    return (
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: "calc(100% + 8px)",
          maxWidth: "min(92vw, 600px)",
          background: "rgba(0,0,0,0.78)",
          color: "#fff",
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: "0.9rem",
          lineHeight: 1.5,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          backdropFilter: "blur(2px)",
          pointerEvents: "none", // don't block typing/clicks
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(6px)",
          transition: "opacity .18s ease, transform .18s ease",
          whiteSpace: "pre-wrap",
          zIndex: 20,
        }}
      >
        {helpTextFor(myKey)}
      </div>
    );
  };

  // Common input style factory (keeps existing style)
  const baseInputStyle = (preview) => ({
    fontSize: "1.1rem",
    fontWeight: 500,
    border: "none",
    background: "transparent",
    color: BLACK,
    padding: preview ? "0px" : "6px 10px",
    borderRadius: "10px",
    outline: preview ? "none" : "0.15rem dashed #7f1d1d33",
    textAlign: "right",
    width: "100%",
  });

  return (
    <div
      className="profile-wrapper"
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        width: "100vw",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div style={{ zIndex: 2 }}>
        {/* 중앙 이미지 */}
        <div
          // onMouseEnter={!isPreview ? () => setHovered(true) : undefined}
          // onMouseLeave={!isPreview ? () => setHovered(false) : undefined}
          // onClick={!isPreview ? () => fileInputRef.current.click() : undefined}
          style={{
            width: "100vw",
            maxWidth: "768px",
            height: "100vh",
            position: "relative",
            transition: "border 0.3s ease",
            overflow: "hidden",
            // cursor: isPreview ? "default" : "pointer",
            backgroundColor: "#555555",
          }}
        >
          <Image
            onMouseEnter={!isPreview ? () => setHovered(true) : undefined}
            onMouseLeave={!isPreview ? () => setHovered(false) : undefined}
            src={url}
            alt="Portrait"
            fill
            objectFit="cover"
            quality={100}
            priority
            style={{ objectPosition: "50% 0%", mixBlendMode: "luminosity" }}
          />

          {hovered && !isPreview && (
            <div
              onMouseEnter={!isPreview ? () => setHovered(true) : undefined}
              onMouseLeave={!isPreview ? () => setHovered(false) : undefined}
              style={{
                position: "absolute",
                bottom: "50%",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.5)",
                padding: "10px 20px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.9rem",
                zIndex: 10,
                color: "#fff",
                cursor: isPreview ? "default" : "pointer",
              }}
              onClick={
                !isPreview ? () => fileInputRef.current.click() : undefined
              }
            >
              <FiUpload color={"#fff"} /> 이미지 변경
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />

          {/* 우측 하단 텍스트 입력 영역 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              boxSizing: "border-box",
              position: "absolute",
              bottom: 0,
              right: 0,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              color: BLACK,
              width: "100%",
              maxWidth: "100vw",
              zIndex: 3,
              // background:
              //   "linear-gradient(to top, rgba(255,255,255,1.0), rgba(255,255,255,0.5))",
            }}
          >
            {/* Gradient 오버레이 */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "100%",
                height: "auto",

                
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {/* 텍스트 내용 */}
            <div
              style={{
                zIndex: 10,
                width: "100%",
                maxWidth: "100vw",
                padding: 10,
                borderRadius: 10,
                backdropFilter: isPreview? "none" : "blur(100px)",
                background: isPreview
                  ? "none"
                  : "linear-gradient(to top, rgba(255,255,255,0.5), rgba(255,255,255,0.0))",
              }}
            >
              {/* 이름 */}
              <div style={{ marginBottom: "8px", position: "relative" }}>
                {!isPreview && (
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#7f1d1d77",
                      textAlign: "right",
                      margin: 0,
                    }}
                  >
                    이름
                  </p>
                )}
                <HelpBubble activeKey={focusedKey} myKey="name" />
                <input
                  type="text"
                  value={person.name}
                  readOnly={isPreview}
                  onFocus={() => setFocusedKey("name")}
                  onBlur={(e) =>
                    setFocusedKey((k) => (k === "name" ? null : k))
                  }
                  onChange={(e) => {
                    setProfileHasUnsavedChanges(true);
                    onPersonChange({ ...person, name: e.target.value });
                  }}
                  style={{
                    fontWeight: 600,
                    ...baseInputStyle(isPreview),
                    fontSize: "1.8rem",
                    lineHeight: "2.5rem",
                  }}
                />
              </div>

              {/* 출생일-사망일 */}
              <div
                style={{
                  marginBottom: "8px",
                  position: "relative",
                  lineHeight: "1rem",
                }}
              >
                {!isPreview && (
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#7f1d1d77",
                      textAlign: "right",
                      margin: "10px",
                    }}
                  >
                    출생일
                  </p>
                )}
                <HelpBubble activeKey={focusedKey} myKey="dates" />
                <input
                  type="text"
                  value={person.birthDate}
                  readOnly={isPreview}
                  onFocus={() => setFocusedKey("dates")}
                  onBlur={(e) =>
                    setFocusedKey((k) => (k === "dates" ? null : k))
                  }
                  onChange={(e) => {
                    setProfileHasUnsavedChanges(true);
                    onPersonChange({ ...person, birthDate: e.target.value });
                  }}
                  style={baseInputStyle(isPreview)}
                />
              </div>

              {/* 출생지 */}
              <div style={{ position: "relative", marginBottom: "8px" }}>
                {!isPreview && (
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#7f1d1d77",
                      textAlign: "right",
                      margin: "10px",
                    }}
                  >
                    출생지
                  </p>
                )}
                <HelpBubble activeKey={focusedKey} myKey="birthPlace" />
                <input
                  type="text"
                  value={person.birthPlace}
                  readOnly={isPreview}
                  onFocus={() => setFocusedKey("birthPlace")}
                  onBlur={(e) =>
                    setFocusedKey((k) => (k === "birthPlace" ? null : k))
                  }
                  onChange={(e) => {
                    setProfileHasUnsavedChanges(true);
                    onPersonChange({ ...person, birthPlace: e.target.value });
                  }}
                  style={baseInputStyle(isPreview)}
                />
              </div>

              {/* 한줄소개 */}
              <div style={{ position: "relative" }}>
                {!isPreview && (
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#7f1d1d77",
                      textAlign: "right",
                      margin: "10px",
                    }}
                  >
                    한줄소개
                  </p>
                )}
                <HelpBubble activeKey={focusedKey} myKey="motto" />
                <input
                  type="text"
                  value={person.motto}
                  readOnly={isPreview}
                  onFocus={() => setFocusedKey("motto")}
                  onBlur={(e) =>
                    setFocusedKey((k) => (k === "motto" ? null : k))
                  }
                  onChange={(e) => {
                    setProfileHasUnsavedChanges(true);
                    onPersonChange({ ...person, motto: e.target.value });
                  }}
                  style={{ ...baseInputStyle(isPreview), fontStyle: "italic" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
