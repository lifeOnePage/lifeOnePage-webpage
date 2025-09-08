"use client";

import ShellChat from "./lifestory-shell/ShellChat";
import { FaMagic } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { BLACK, MAIN_THEME, SUB_THEME } from "../styles/colorConfig";
import { FiCheckCircle } from "react-icons/fi";
import { saveLifestorySection } from "../utils/firebaseDb";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { debugErrorMap } from "firebase/auth";

export default function Lifestory({
  person,
  onPersonChange,
  onSave,
  userId,
  isPreview,
  LifeStoryHasUnsavedChanges,
  setLifeStoryHasUnsavedChanges,
}) {
  const [showModal, setShowModal] = useState(false);
  const [prev, setPrev] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
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

  useEffect(() => {
    const fetchComplete = async () => {
      const ref = doc(firestore, "users", userId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        console.log(data);
        if (data.lifestory && typeof data.lifestory.complete === "boolean") {
          setIsComplete(data.lifestory.complete);
        }
      }
    };

    fetchComplete();
  }, []);
  const handleStoryUpdate = async (newStory, newThreadId) => {
    console.log(newStory);
    onPersonChange({ ...person, lifeStory: newStory, threadId: newThreadId });
    const uref = doc(firestore, "users", userId);
    await updateDoc(uref, {
      lifestory: {
        story: newStory,
        threadId: newThreadId,
        complete: true,
      },
    });
    console.log(person.lifeStory);
    setIsComplete(true);
    setShowModal(false);
    setLifeStoryHasUnsavedChanges(true);
  };

  const handleClose = async (messages, threadId) => {
    onPersonChange({ ...person, threadId });
    console.log(prev, userId, threadId);
    const uref = doc(firestore, "users", userId);
    await updateDoc(uref, {
      "lifestory.threadId": threadId,
    });
    const ref = doc(firestore, "users", userId, "conversations", threadId);
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      messages,
    });

    setShowModal(false);
  };

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
                color: BLACK,
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
            <ShellChat
              person={person}
              userId={userId}
              onComplete={handleStoryUpdate}
              existingThreadId={person.threadId}
              setLifeStoryHasUnsavedChanges={setLifeStoryHasUnsavedChanges}
            />
          )}
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
                {isComplete ? "대화 이어가기" : "생애문 생성하기"}
              </button>
              {!isComplete && (
                <p
                  style={{
                    color: "#7f1d1d77",
                    textAlign: "center",
                    maxWidth: "80%",
                  }}
                >
                  {person.threadId
                    ? "이전 대화내역이 있어요. 버튼을 클릭하여 대화를 이어갈 수 있어요."
                    : "챗봇과 함께 인생 이야기를 나누고 생애문을 완성해보세요."}
                </p>
              )}
              {isComplete && (
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
