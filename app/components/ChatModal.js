"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { auth, firestore } from "../firebase/firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

const Spinner = () => (
  <svg
    style={{
      animation: "spin 1s linear infinite",
      height: "20px",
      width: "20px",
      color: "#666",
    }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      style={{ opacity: 0.25 }}
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      style={{ opacity: 0.75 }}
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }`}</style>
  </svg>
);

export default function ChatModal({
  mode,
  onClose,
  onComplete,
  existingThreadId,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalTop, setModalTop] = useState(0);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [threadId, setThreadId] = useState(existingThreadId || uuidv4());

  const endRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    setModalTop(scrollTop + viewportHeight / 2);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    if (endRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  // 최초 로딩 (이전 대화 불러오기)
  useEffect(() => {
    const fetchInitial = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(firestore, "users", user.uid, "conversations", threadId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setMessages(snap.data().messages);
      } else {
        console.log(mode)
        const res = await fetch("/api/gpt-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], mode: mode }),
        });
        const data = await res.json();
        console.log(data);
        const botMsg = { sender: "bot", text: data.message };
        setMessages([botMsg]);
        await setDoc(ref, {
          createdAt: serverTimestamp(),
          messages: [botMsg],
        });
      }
    };
    fetchInitial();
  }, [threadId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    await saveMessage(userMsg);

    if (waitingForApproval) {
      if (
        ["네", "예", "좋아요", "응"].some((word) =>
          input.toLowerCase().includes(word)
        )
      ) {
        const confirmMsg = {
          sender: "bot",
          text: "생애문을 생성 중입니다. 잠시만 기다려주세요.",
        };
        addMessage(confirmMsg);
        await saveMessage(confirmMsg);
        await generateStory(updatedMessages);
        setWaitingForApproval(false);
        return;
      } else {
        const cancelMsg = {
          sender: "bot",
          text: "언제든 준비되면 알려주세요. 😊",
        };
        addMessage(cancelMsg);
        await saveMessage(cancelMsg);
        return;
      }
    }

    setLoading(true);
    const res = await fetch("/api/gpt-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages }),
    });
    const data = await res.json();
    const botReply = { sender: "bot", text: data.message };
    addMessage(botReply);
    await saveMessage(botReply);
    setLoading(false);

    if (data.message.includes("[READY_FOR_STORY]")) {
      setWaitingForApproval(true);
    }
  };

  const saveMessage = async (msg) => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(firestore, "users", user.uid, "conversations", threadId);
    await updateDoc(ref, { messages: arrayUnion(msg) });
  };

  const generateStory = async (messagesForStory) => {
    setLoading(true);
    try {
      const res = await fetch("/api/gpt-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesForStory }),
      });
      const data = await res.json();
      if (data.story) {
        // 🔑 기존처럼 메시지로 넣지 않고, 부모에게 완전히 넘김
        onComplete(data.story, threadId);
        setLoading(false);
      }
    } catch (err) {
      console.error("생애문 생성 실패:", err);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, x: "-50%", y: "-50%" }}
          animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
          exit={{ scale: 0.95, opacity: 0, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            top: `${modalTop}px`,
            left: "50%",
            backgroundColor: "white",
            width: "90%",
            maxWidth: "500px",
            height: "80vh",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!loading && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                color: "#666",
              }}
            >
              <FaTimes />
            </button>
          )}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === "bot" ? "flex-start" : "flex-end",
                  backgroundColor: m.sender === "bot" ? "#e0e0e0" : "#7f1d1d99",
                  color: m.sender === "bot" ? "#000" : "#fff",
                  padding: "8px 12px",
                  borderRadius: "16px",
                  maxWidth: "75%",
                  fontSize: "14px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#e0e0e0",
                  color: "#000",
                  padding: "8px 12px",
                  borderRadius: "16px",
                  fontSize: "14px",
                }}
              >
                <Spinner />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                border: "none",
                backgroundColor: "#ccc",
                borderRadius: "8px",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              전송
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
