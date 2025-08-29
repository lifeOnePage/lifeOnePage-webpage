// ✅ useShellChat.js
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  loadMessages,
  loadLifeStoryMeta,
  saveMessage,
  initThread,
  saveLifeStory,
} from "./firebaseService";

export function useShellChat({ userId, person, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inputIndex, setInputIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [storyDone, setStoryDone] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [threadId, setThreadId] = useState(null);

  // 🔹 최초 로딩: 유저 유형 구분
  useEffect(() => {
    const loadInitial = async () => {
      const meta = await loadLifeStoryMeta(userId);
    const existingThread = meta?.threadId;
    const newThreadId = existingThread || uuidv4();
    setThreadId(newThreadId);

      if (meta?.story) {
        setStoryDone(true);
        setStoryText(meta.story);
      }

      if (existingThread) {
        const msgs = await loadMessages(userId, existingThread);
        setMessages(msgs);
        setInputIndex(msgs.length);
      } else {
        // 🔹 처음 사용자: GPT 첫 질문 요청
        const arg = {
          name: person.name,
          birthDate: person.birthDate,
          birthPlace: person.birthPlace,
        };
        const res = await fetch("/api/gpt-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], arg }),
        });
        const data = await res.json();
        const botMsg = { sender: "system", text: data.message };
        setMessages([botMsg]);
        setInputIndex(1);
        await initThread(userId, newThreadId, botMsg);
      }
    };
    loadInitial();
  }, [userId]);

  // 🔹 사용자 입력 → 질문 응답 흐름
  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setInputIndex((i) => i + 2);
    await saveMessage(userId, threadId, userMsg);

    setLoading(true);
    const arg = {
      name: person.name,
      birthDate: person.birthDate,
      birthPlace: person.birthPlace,
    };
    const res = await fetch("/api/gpt-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages, arg }),
    });
    const data = await res.json();
    const botMsg = { sender: "system", text: data.message };
    const updated = [...nextMessages, botMsg];
    setMessages(updated);
    setLoading(false);
    await saveMessage(userId, threadId, botMsg);
  };

  // 🔹 생애문 생성 요청
  const triggerStory = async () => {
    setLoading(true);
    const res = await fetch("/api/gpt-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    const story = data.story;
    setStoryDone(true);
    setStoryText(story);
    await saveLifeStory(userId, threadId, story);
    onComplete(story, threadId);
    setLoading(false);
  };
  // console.log("inputIndex", inputIndex, "messages.length", messages.length);


  return {
    messages,
    input,
    setInput,
    inputIndex,
    loading,
    send,
    triggerStory,
    storyDone,
    storyText,
  };
}
