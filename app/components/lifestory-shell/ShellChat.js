// ✅ ShellChat.js
"use client";

import { useEffect, useRef } from "react";
import { useShellChat } from "./useShellChat";
import { renderShellMessages } from "./shellRenderer";

// 🔹 쉘 UI 메인 컴포넌트
export default function ShellChat({ person, userId, onComplete,setLifeStoryHasUnsavedChanges}) {
  const {
    messages,
    input,
    setInput,
    inputIndex,
    loading,
    send,
    triggerStory,
    storyDone,
    storyText,
  } = useShellChat({ userId, person, onComplete });

  const scrollRef = useRef(null);

  // 🔁 메시지 바뀔 때마다 자동 스크롤
  useEffect(() => {
    setLifeStoryHasUnsavedChanges(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 🔍 마지막 메시지가 [READY_FOR_STORY] 포함 여부 확인
  const last = messages[messages.length - 1]?.text || "";
  const readyForStory = last.includes("[READY_FOR_STORY]");

  return (
    <div
      ref={scrollRef}
      style={{
        height: "400px",
        overflowY: "auto",
        padding: "20px",
        fontFamily: "Pretendard",
        fontSize: "0.95rem",
        textAlign: "left",
        // backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        margin: "0 auto",
        width: "90%",
        lineHeight: 1.6,
      }}
    >
      {renderShellMessages(
        messages,
        inputIndex,
        input,
        setInput,
        send,
        loading
      )}

      {/* 🔹 생애문 생성 안내 */}
      {readyForStory && !storyDone && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = input.trim().toLowerCase();
            if (val === "" || val === "예") triggerStory();
          }}
          style={{ marginTop: 12 }}
        >
          <strong>시스템 &gt;</strong> 생애문을 작성하려면 예 또는 Enter를 눌러주세요.
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="예"
            style={{
              marginTop: 4,
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "0.95rem",
            }}
          />
        </form>
      )}

      {/* 🔹 이미 생성된 생애문 표시 */}
      {storyDone && storyText && (
        <div
          style={{
            marginTop:"24px 0px",
            padding: "16px",
            backgroundColor: "#eeeeee",
            borderRadius: "8px",
            fontStyle: "italic",
          }}
        >
          <strong>{person.name}님의 생애문</strong>
          <p style={{ marginTop: 8 }}>{storyText}</p>
        </div>
      )}
    </div>
  );
}
