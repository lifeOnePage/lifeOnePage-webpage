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
  profileHasUnsavedChanges,
  setProfileHasUnsavedChanges
}) {
  const [bgImage, setBgImage] = useState("/images/portrait.jpg");
  const [hovered, setHovered] = useState(false);
  const [file, setFile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    console.log(person);
    if (!person.profileImageUrl) return;

    setBgImage(person.profileImageUrl);
  }, [person]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleImageSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setBgImage(url);
    }
    setProfileHasUnsavedChanges(true);
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
      {/* 흐릿한 배경 이미지 레이어 */}
      {/* {bgImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#fefefe",
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover", // object-fit: cover
            backgroundPosition: "center", // 원하는 포지션 (ex. 위쪽 기준 크롭)
            filter: "blur(20px)",
            opacity: "50%",
            mixBlendMode: "luminosity",
            transform: "scale(1.05)", // 블러 테두리 방지
            zIndex: 1,
          }}
        />
      )} */}
      <div style={{ zIndex: 2 }}>
        {/* 왼쪽: 이름 (데스크탑 전용) */}
        {/* <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isMobile && (
          <div style={{ width: "25vw", padding: "0rem 3rem" }}>
            {!isPreview && (
              <p
                style={{
                  fontSize: "1.25rem",
                  color: "#7f1d1d77",
                  width: "25vw",
                  textAlign: "left",
                  padding: "0rem 3rem",
                }}
              >
                이름
              </p>
            )}
            <input
              type="text"
              value={person.name}
              readOnly={isPreview}
              onChange={(e) =>
                onPersonChange({ ...person, name: e.target.value })
              }
              style={{
                fontSize: "2rem",
                fontWeight: 600,
                border: "none",
                background: "transparent",
                color: "#101010",
                padding: "20px",
                borderRadius: "10px",
                outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                width: "100%",
              }}
            />
          </div>
        )}
      </div> */}
        {/* {isMobile && (
        <div
          style={{
            width: "25vw",
            padding: "0rem 3rem",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            flexDirection: "column",
            textAlign: "right",
          }}
        >
          {!isPreview && (
            <p
              style={{
                fontSize: "1.25rem",
                color: "#7f1d1d77",
                width: "25vw",
                textAlign: "right",
              }}
            >
              출생일
            </p>
          )}
          <input
            type="text"
            value={person.birthDate}
            readOnly={isPreview}
            onChange={(e) =>
              onPersonChange({ ...person, birthDate: e.target.value })
            }
            style={{
              textAlign: "right",
              fontSize: "1.25rem",
              fontWeight: 500,
              border: "none",
              background: "transparent",
              color: "#101010",
              padding: "20px",
              borderRadius: "10px",
              outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
              display: "block",
              width: "100%",
              marginBottom: "0.5rem",
            }}
          />
          {!isPreview && (
            <p
              style={{
                fontSize: "1.25rem",
                color: "#7f1d1d77",
                width: "25vw",
                textAlign: "right",
              }}
            >
              출생지
            </p>
          )}
          <input
            type="text"
            value={person.birthPlace}
            readOnly={isPreview}
            onChange={(e) =>
              onPersonChange({ ...person, birthPlace: e.target.value })
            }
            style={{
              textAlign: "right",
              fontSize: "1.25rem",
              fontWeight: 500,
              border: "none",
              background: "transparent",
              color: "#101010",
              padding: "20px",
              borderRadius: "10px",
              outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
              display: "block",
              width: "100%",
            }}
          />
        </div>
      )} */}

        {/* 중앙 이미지 */}
        <div
          onMouseEnter={!isPreview ? () => setHovered(true) : undefined}
          onMouseLeave={!isPreview ? () => setHovered(false) : undefined}
          onClick={!isPreview ? () => fileInputRef.current.click() : undefined}
          style={{
            // width: isMobile ? "100vw" : "calc((1080 / 1920) * 100vh)",
            width: "100vw",
            maxWidth: "768px",
            height: "100vh",
            position: "relative",
            border: hovered ? "4px solid #7f1d1d" : "none",
            transition: "border 0.3s ease",
            overflow: "hidden",
            cursor: isPreview ? "default" : "pointer",
            backgroundColor: "#555555", // blending 기준 배경
          }}
        >
          {/* 저장 버튼 (미리보기 모드에서는 숨김) */}
        {!isPreview &&
          (profileHasUnsavedChanges ? (
            <button
              onClick={handleSaveClick}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                zIndex: 10,
                backgroundColor: "#7f1d1d",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              저장
            </button>
          ) : (
                        <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor:"#00000022",
                borderRadius:"20px",
                padding:"4px 10px"
              }}
            >
              <FiCheckCircle color={MAIN_THEME} />
              <span style={{ fontSize: "0.9rem", color: "#ffffff" }}>
                모든 변경사항이 저장되었습니다
              </span>
            </div>
          ))}
          <Image
            src={bgImage}
            alt="Portrait"
            fill
            objectFit="cover"
            quality={100}
            priority
            style={{
              objectPosition: "50% 0%",
              mixBlendMode: "luminosity",
            }}
          />

          {hovered && !isPreview && (
            <div
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
              }}
            >
              <FiUpload color={"#fff"} />
              이미지 변경
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />

          {/* 모바일용 텍스트 입력 ( 왼쪽 이름, 오른쪽 출생 버전 ) */}
          {/* {isMobile && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              boxSizing: "border-box",
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
              width: "100vw",
              display: "flex",
              flexDirection: "row",
              padding: "30px",
              color: BLACK,
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {!isPreview && (
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#7f1d1d77",
                    textAlign: "left",
                    height: "auto",
                  }}
                >
                  이름
                </p>
              )}
              <div style={{ flex: 1, paddingRight: "10px" }}>
                <input
                  type="text"
                  value={person.name}
                  readOnly={isPreview}
                  onChange={(e) =>
                    onPersonChange({ ...person, name: e.target.value })
                  }
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    border: "none",
                    background: "transparent",
                    color: BLACK,
                    padding: "20px",
                    borderRadius: "10px",
                    outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                    width: "100%", // 추가
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  flex: 1,
                  paddingLeft: "10px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {!isPreview && (
                  <p
                    style={{
                      fontSize: "1.1rem",
                      color: "#7f1d1d77",
                      flex: 1,
                      textAlign: "right",
                    }}
                  >
                    출생일
                  </p>
                )}
                <input
                  type="text"
                  value={person.birthDate}
                  readOnly={isPreview}
                  onChange={(e) =>
                    onPersonChange({ ...person, birthDate: e.target.value })
                  }
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    border: "none",
                    background: "transparent",
                    color: BLACK,
                    padding: "20px",
                    borderRadius: "10px",
                    outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                    marginBottom: "0.5rem",
                    textAlign: "right",
                    width: "100%", // 추가
                  }}
                />
                {!isPreview && (
                  <p
                    style={{
                      fontSize: "1.1rem",
                      color: "#7f1d1d77",
                      flex: 1,
                      textAlign: "right",
                    }}
                  >
                    출생지
                  </p>
                )}
                <input
                  type="text"
                  value={person.birthPlace}
                  readOnly={isPreview}
                  onChange={(e) =>
                    onPersonChange({ ...person, birthPlace: e.target.value })
                  }
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    border: "none",
                    background: "transparent",
                    color: BLACK,
                    padding: "20px",
                    borderRadius: "10px",
                    outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                    textAlign: "right",
                    width: "100%", // 추가
                  }}
                />
              </div>
            </div>
          </div>
        )} */}
          {/* 모바일용 텍스트 입력 ( 우측 하단 정렬 버전 ) */}
          {
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
              }}
            >
              {/* Gradient 오버레이 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "100%",
                  height: "50vh",
                  background:
                    "linear-gradient(to top, rgba(255,255,255,0.85), rgba(255,255,255,0))",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />

              {/* 텍스트 내용 */}
              <div style={{ zIndex: 10, width: "100%", maxWidth: "100vw" }}>
                <div style={{ marginBottom: "8px" }}>
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
                  <input
                    type="text"
                    value={person.name}
                    readOnly={isPreview}
                    onChange={(e) =>{
                      setProfileHasUnsavedChanges(true);
                      onPersonChange({ ...person, name: e.target.value })}
                    }
                    style={{
                      fontSize: "1.8rem",
                      lineHeight: "2.5rem",
                      fontWeight: 600,
                      border: "none",
                      background: "transparent",
                      color: BLACK,
                      padding: isPreview ? "0px" : "6px 10px",
                      borderRadius: "10px",
                      outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                      textAlign: "right",
                      width: "100%",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "8px", lineHeight: "1rem" }}>
                  {!isPreview && (
                    <p
                      style={{
                        fontSize: "1rem",
                        color: "#7f1d1d77",
                        textAlign: "right",
                        margin: "10px",
                      }}
                    >
                      출생일-사망일
                    </p>
                  )}
                  <input
                    type="text"
                    value={person.birthDate}
                    readOnly={isPreview}
                    onChange={(e) =>{
                      setProfileHasUnsavedChanges(true);
                      onPersonChange({ ...person, birthDate: e.target.value })}
                    }
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 500,
                      border: "none",
                      background: "transparent",
                      color: BLACK,
                      padding: isPreview ? "0px" : "6px 10px",
                      borderRadius: "10px",
                      outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                      textAlign: "right",
                      width: "100%",
                    }}
                  />
                </div>

                <div>
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
                  <input
                    type="text"
                    value={person.birthPlace}
                    readOnly={isPreview}
                    onChange={(e) =>{
                      setProfileHasUnsavedChanges(true);
                      onPersonChange({ ...person, birthPlace: e.target.value })}
                    }
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 500,
                      border: "none",
                      background: "transparent",
                      color: BLACK,
                      padding: isPreview ? "0px" : "6px 10px",
                      borderRadius: "10px",
                      outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                      textAlign: "right",
                      width: "100%",
                    }}
                  />
                </div>
                <div>
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
                  <input
                    type="text"
                    value={person.motto}
                    readOnly={isPreview}
                    onChange={(e) =>{
                      setProfileHasUnsavedChanges(true);
                      onPersonChange({ ...person, motto: e.target.value })}
                    }
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 500,
                      fontStyle: "italic",
                      border: "none",
                      background: "transparent",
                      color: BLACK,
                      padding: isPreview ? "0px" : "6px 10px",
                      borderRadius: "10px",
                      outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
                      textAlign: "right",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
