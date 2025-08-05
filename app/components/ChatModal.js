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
  person,
  prevMessages,
  onPrevMessagesChange,
  onClose,
  onComplete,
  existingThreadId,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalTop, setModalTop] = useState(0);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
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
    setMessages(prevMessages);
  }, [prevMessages]);
  useEffect(() => {
    if (existingThreadId) setThreadId(existingThreadId);
  }, [existingThreadId]);

  useEffect(() => {
    if (endRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const fetchInitial = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(firestore, "users", user.uid, "conversations", threadId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setMessages(snap.data().messages);
      } else {
        const arg = {
          name: person.name,
          birthPlace: person.birthPlace,
          birthDate: person.birthDate,
        };
        const res = await fetch("/api/gpt-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], arg }),
        });
        const data = await res.json();
        const botMsg = { sender: "bot", text: await data.message };
        console.log(botMsg);
        setMessages([botMsg]);
        console.log(messages);
        await setDoc(ref, {
          createdAt: serverTimestamp(),
          messages: [botMsg],
        });
      }
    };
    fetchInitial();
  }, [threadId]);

  const saveMessage = async (msg) => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(firestore, "users", user.uid, "conversations", threadId);
    await updateDoc(ref, { messages: arrayUnion(msg) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    await saveMessage(userMsg);

    setLoading(true);
    const arg = {
          name: person.name,
          birthPlace: person.birthPlace,
          birthDate: person.birthDate,
        };
    const res = await fetch("/api/gpt-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages, arg }),
    });
    const data = await res.json();
    const botReply = { sender: "bot", text: data.message };
    setMessages((prev) => [...prev, botReply]);
    await saveMessage(botReply);
    setLoading(false);

    if (data.message.includes("[READY_FOR_STORY]")) {
      setShowGenerateButton(true);
    }
  };

  const generateStory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gpt-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.story) {
        onComplete(data.story, threadId);
      }
    } catch (err) {
      console.error("생애문 생성 실패:", err);
    } finally {
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
              onClick={async () => {
                // console.log(messages)
                // onPrevMessagesChange(messages);
                await onClose(messages, threadId);
              }}
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

          {showGenerateButton && (
            <button
              onClick={generateStory}
              disabled={loading}
              style={{
                backgroundColor: "#7f1d1d",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "14px",
                marginBottom: "10px",
                cursor: "pointer",
              }}
            >
              생애문 생성하기
            </button>
          )}

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
