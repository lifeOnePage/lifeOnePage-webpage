// AboutLines.jsx
import React, { useState, useEffect } from "react"; // 외부 패키지
import { motion, AnimatePresence } from "framer-motion"; // 외부 패키지
import useWindowSize from "../hooks/useWindowSize";

/* ① 교체할 단어 배열 */
const ARCHIVE_WORDS = ["ARCHIVE", "CHRONICLE", "RECORD", "WRITE"];
const LIFE_WORDS = ["LIFE", "STORY", "PHOTOS", "MEMORY", "PEOPLE"];

/* ② 단일 단어를 3D-Flip으로 바꿔 주는 작은 컴포넌트 */
function WordFlipper({ words }) {
  const [idx, setIdx] = useState(0);

  /* 2초마다 다음 단어로 교체 */
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % words.length), 2000);
    return () => clearInterval(id);
  }, [words.length]);

  /* Flip 애니메이션 variant */
  const flip = {
    enter: {
      rotateX: 90,
      opacity: 0,
      transformOrigin: "top",
      color: "#1a1a1a",
      textShadow:
        "-1px -1px 0 #fff 1px -1px 0 #fff -1px 1px 0 #fff 1px 1px 0 #fff",
    },
    center: {
      rotateX: 0,
      opacity: 1,
      color: "#fff",
      textShadow: "none",
      transition: { duration: 0.6, ease: [0.45, 0, 0.55, 1] },
    },
    exit: {
      rotateX: -90,
      opacity: 0,
      color: "#1a1a1a",
      textShadow:
        "-1px -1px 0 #fff 1px -1px 0 #fff -1px 1px 0 #fff 1px 1px 0 #fff",
      transition: { duration: 0.6, ease: [0.45, 0, 0.55, 1] },
    },
  };

  return (
    <div style={{ perspective: 800, display: "inline-block" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={words[idx]} // 단어 바뀔 때마다 새 key
          variants={flip}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ display: "inline-block" }}
        >
          {words[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ③ 전체 라인을 담는 AboutLines 컴포넌트 */
export default function AboutLines() {
  const { width, height } = useWindowSize();
  const isSmall = width > 768 ? false : true;
  return (
    <motion.div
      /* 바깥 컨테이너 애니메이션 예시 (원본 코드 유지) */

      variants={{
        rest: { opacity: 0, x: -100 },
        about: { opacity: 1, x: 10, transition: { duration: 0.25 } },
      }}
      initial="rest"
      animate="about"
    >
      <div
        style={{
          fontFamily: "Pretendard",
          display: "flex",
          flexDirection: "column",
          textAlign: "left",
          minWidth:"300px",
          fontSize: isSmall? "auto" : 250 /* 큰 글씨 */,
          lineHeight: 0.8,
          fontWeight: 800,
          letterSpacing: isSmall ? "-0.3rem": "-1rem",
        }}
      >
        <WordFlipper words={ARCHIVE_WORDS} />
        <span style={{ display: "inline-block", fontWeight: 300 }}>YOUR</span>
        <WordFlipper words={LIFE_WORDS} />
      </div>
    </motion.div>
  );
}
