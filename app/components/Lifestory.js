"use client";

import ChatModal from "./ChatModal";
import { FaMagic } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { BLACK, MAIN_THEME, SUB_THEME } from "../styles/colorConfig";
import { FiCheckCircle } from "react-icons/fi";

export default function Lifestory({
  person,
  onPersonChange,
  onSave,
  userId,
  isPreview,
  LifeStoryHasUnsavedChanges,
  setLifeStoryHasUnsavedChanges
}) {
  const [showModal, setShowModal] = useState(false);
  const textareaRef = useRef();
  useEffect(() => {
    const updateHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    window.addEventListener("resize", updateHeight);
    updateHeight(); // 초기 실행

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    console.log(person);
  }, [person.lifeStory]);

  const handleStoryUpdate = (newStory, newThreadId) => {
    onPersonChange({ ...person, lifeStory: newStory, threadId: newThreadId });
    setShowModal(false);
    setLifeStoryHasUnsavedChanges(true);
  };

  const handleClose = () => setShowModal(false);

  const handleSaveClick = () => {
    if (!userId) return;
    onSave({
      person,
      file: null,
      storagePath: `users/${userId}/lifestory`,
      type: "lifestory",
    });
    setLifeStoryHasUnsavedChanges(false);
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100vw",
          maxWidth: "768px",
          // height: "100vh",

          padding: "0px 0px 50px 0px",
          backgroundColor: SUB_THEME,
          overflowX: "hidden",
          zIndex: 3,
        }}
      >
        {!isPreview &&
          (LifeStoryHasUnsavedChanges ? (
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
        <div
          style={{
            textAlign: "center",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "5vh",
          }}
        >
          <div
            style={{
              width: "90%",
            }}
          >
            <div
              style={{
                gap: "20px",
                margin: "20px",
                fontSize: "1.5rem",
                textAlign: "center",
              }}
            >
              <strong>{person.name} </strong>
              <br />
              <span style={{ fontSize: "1rem" }}> {person.birthDate} </span>
              <span style={{ fontSize: "1rem" }}>
                {" "}
                | {person.birthPlace} 출생
              </span>
            </div>
          </div>
          {/* {!isPreview && (
            <p
              style={{
                fontSize: "1.25rem",
                color: "#7f1d1d77",
                width: "90%",
                textAlign: "left",
              }}
            >
              한줄 소개
            </p>
          )}
          <input
            type="text"
            value={person.motto}
            readOnly={isPreview}
            onChange={(e) =>
              onPersonChange({ ...person, motto: e.target.value })
            }
            style={{
              fontSize: "1.5rem",
              fontWeight: 500,
              border: "none",
              background: "transparent",
              textAlign: "center",
              width: "90%",
              marginBottom: "20px",
              padding: "10px",
              borderRadius: "10px",
              color: BLACK,
              outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
            }}
          /> */}
          {!isPreview && (
            <div
              style={{
                display: "flex",
                width: "90%",
              }}
            >
              <p
                style={{
                  flex: 1,
                  fontSize: "1.25rem",
                  color: "#7f1d1d77",
                  textAlign: "left",
                }}
              >
                생애문
              </p>
              <p
                style={{
                  flex: 1,
                  fontSize: "1.25rem",
                  color: "#7f1d1d77",
                  textAlign: "right",
                }}
              >
                {person.lifeStory.length}/300
              </p>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={person.lifeStory}
            readOnly={isPreview}
            onChange={(e) => {
              setLifeStoryHasUnsavedChanges(true);
              onPersonChange({ ...person, lifeStory: e.target.value });
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            style={{
              fontSize: "1rem",
              border: "none",
              background: "transparent",
              width: "90%",
              textAlign: "center",
              margin: "0px 30px",
              padding: "30px",
              padding: "20px",
              borderRadius: "10px",
              color: BLACK,
              outline: isPreview ? "none" : "0.15rem dashed #7f1d1d33",
            }}
          />
          {!isPreview && (
            <div
              style={{
                display: "flex",
                width: "100vw",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: "20px",
                  padding: "10px 20px",
                  borderRadius: "999px",
                  backgroundColor: "#fff",
                  color: "#7f1d1d",
                  border: "2px solid #7f1d1d",
                  cursor: "pointer",
                }}
              >
                <FaMagic color="#7f1d1d" size={18} />{" "}
                {person.threadId ? "대화 이어가기" : "생애문 생성하기"}
              </button>
              {!person.threadId && (
                <p
                  style={{
                    color: "#7f1d1d77",
                    textAlign: "center",
                    maxWidth: "80%",
                  }}
                >
                  챗봇과 함께 인생 이야기를 나누고 생애문을 완성해보세요.
                </p>
              )}
              {person.threadId && (
                <div
                  style={{
                    width: "min(90vw, 800px)",
                    backgroundColor: "#1a1a1a1a",
                    padding: "min(6vw, 24px) min(7vw, 30px)",
                    borderRadius: "12px",
                    color: MAIN_THEME,
                    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                    lineHeight: "1.6",
                    margin: "0 auto",
                  }}
                >
                  <p
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      marginBottom: "min(4vw, 8px)",
                    }}
                  >
                    생애문이 완성되었습니다!
                  </p>
                  <p
                    style={{
                      textAlign: "center",
                      marginBottom: "min(4vw, 16px)",
                    }}
                  >
                    혹시 <strong>고치고 싶은 부분</strong>이 있다면 직접
                    수정하거나,
                    <strong> 챗봇에게 수정/추가를 요청</strong>할 수 있어요.
                  </p>

                  {/* <div
                    style={{
                      border: `1px dashed ${MAIN_THEME}`,
                      padding: "min(4vw, 14px) min(6vw, 30px)",
                      borderRadius: "8px",
                      fontSize: "clamp(0.85rem, 2.3vw, 0.95rem)",
                      textAlign: "left",
                      margin: "0 auto",
                    }}
                  >
                    <p style={{ marginBottom: "6px" }}>예시:</p>
                    <ul style={{ paddingLeft: "16px", margin: 0 }}>
                      <li>
                        내 <strong>취미</strong>에 대해 더 자세히 쓰고 싶어.
                      </li>
                      <li>
                        지난주에 다녀온 <strong>여행 이야기</strong>를 추가하고
                        싶어.
                      </li>
                      <li>
                        <strong>학창시절의 추억</strong>도 넣어줄 수 있을까?
                      </li>
                    </ul>
                  </div> */}
                  {/* 
                  <p
                    style={{ textAlign: "center", marginTop: "min(5vw, 16px)" }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "min(2.5vw, 6px) min(5vw, 14px)",
                        borderRadius: "999px",
                        margin: "0px min(3vw, 10px)",
                        backgroundColor: "#ffffff88",
                        color: "#7f1d1d",
                        border: "2px solid #7f1d1d",
                        fontWeight: 500,
                        fontSize: "clamp(0.85rem, 2.3vw, 0.95rem)",
                      }}
                    >
                      <FaMagic color="#7f1d1d" size={12} />
                      대화 이어가기
                    </span>
                    를 눌러 자유롭게 요청해보세요.
                  </p> */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ChatModal
          mode={person.threadId ? "edit" : "create"}
          onClose={handleClose}
          onComplete={handleStoryUpdate}
          existingThreadId={person.threadId} // 👈 기존 threadId 전달
        />
      )}
    </>
  );
}
