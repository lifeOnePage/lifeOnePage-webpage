// AboutLines.jsx
import React, { useState, useEffect, useMemo, useRef } from "react"; // 외부 패키지
import { motion, AnimatePresence } from "framer-motion"; // 외부 패키지
import useWindowSize from "../hooks/useWindowSize"; // 로컬 훅
// import { n } from "framer-motion/dist/types.d-B50aGbjN";

/* ① 교체할 단어 배열 */
const ARCHIVE_WORDS = ["ARCHIVE", "CHRONICLE", "RECORD", "WRITE"];
const LIFE_WORDS = ["LIFE", "STORY", "PHOTOS", "MEMORY", "PEOPLE"];

/* 단어 폭을 기준으로 폰트 크기를 자동 맞추는 훅 */

function useFitFontToViewport({
  candidates, // [{ text: string, weight?: number }]
  fontFamily = "Pretendard",
  defaultWeight = 800,
  letterSpacing = "-1rem", // "-0.04em"로 바꾸면 더 자연스럽게 스케일됩니다.
  min = 40,
  max = 720,
  horizontalPadding = 0, // 좌우 여백을 빼고 맞추고 싶을 때
  viewportWidth, // useWindowSize().width 등
}) {
  const [size, setSize] = useState(min);

  useEffect(() => {
    if (!viewportWidth) return;

    const rootPx =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    const letterSpacingToPx = (sz) => {
      const v = String(letterSpacing).trim();
      if (v.endsWith("rem")) return parseFloat(v) * rootPx; // 고정 px
      if (v.endsWith("em")) return parseFloat(v) * sz; // 폰트 비례
      if (v.endsWith("px")) return parseFloat(v);
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const measureAt = (sz) => {
      const lsPx = letterSpacingToPx(sz);
      let widest = 0;
      for (const item of candidates) {
        const w = item.weight ?? defaultWeight;
        ctx.font = `${w} ${sz}px ${fontFamily}`;
        const text = item.text;
        // letter-spacing은 (글자수-1)회 적용
        const width = ctx.measureText(text).width + (text.length - 1) * lsPx;
        if (width > widest) widest = width;
      }
      return widest;
    };

    const target = Math.max(0, viewportWidth - 2 * horizontalPadding);

    const solve = () => {
      let lo = min,
        hi = max;
      for (let i = 0; i < 22; i++) {
        // 2^22 ≈ 충분 정밀도
        const mid = (lo + hi) / 2;
        const w = measureAt(mid);
        if (w < target) lo = mid;
        else hi = mid;
      }
      setSize((lo + hi) / 2);
    };

    if (document.fonts?.ready) document.fonts.ready.then(solve);
    else solve();
  }, [
    viewportWidth,
    candidates.map((c) => `${c.text}:${c.weight ?? ""}`).join("|"),
    fontFamily,
    defaultWeight,
    letterSpacing,
    min,
    max,
    horizontalPadding,
  ]);

  return size;
}

/* ② 단일 단어를 3D-Flip으로 바꿔 주는 작은 컴포넌트 */
function WordFlipper({ words }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % words.length), 2000);
    return () => clearInterval(id);
  }, [words.length]);

  const flip = {
    enter: {
      rotateX: 90,
      opacity: 0,
      transformOrigin: "top",
      color: "#1a1a1a",
      textShadow:
        "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
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
        "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
      transition: { duration: 0.6, ease: [0.45, 0, 0.55, 1] },
    },
  };

  return (
    <div style={{ perspective: 800, display: "inline-block" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={words[idx]}
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
  const { width } = useWindowSize();
  const isSmall = width > 768 ? false : true;

  const candidates = useMemo(
    () => [
      { text: "YOUR", weight: 300 },
      // 가장 넓은 줄을 찾기 위해 두 라인의 모든 후보를 넣습니다.
      // (가장 긴 단어가 기준이 됨)
      ...["ARCHIVE", "CHRONICLE", "RECORD", "WRITE"].map((t) => ({
        text: t,
        weight: 800,
      })),
      ...["LIFE", "STORY", "PHOTOS", "MEMORY", "PEOPLE"].map((t) => ({
        text: t,
        weight: 800,
      })),
    ],
    []
  );

  const fittedFontSize = useFitFontToViewport({
    candidates,
    fontFamily: "Pretendard",
    defaultWeight: 800,
    letterSpacing: isSmall ? "-0.3rem" : "-1rem", // 가능하면 "-0.04em" 추천
    min: 40,
    max: 720,
    horizontalPadding: 0,
    viewportWidth: width * 0.9, // ★ 화면 전체 너비 기준
  });

  return (
    <motion.div
      variants={{
        rest: { opacity: 1, x: 10 },
        about: { opacity: 1, x: 10, transition: { duration: 0.25 } },
      }}
      initial="rest"
      animate="about"
      style={{ overflow: "visible" }} // 삐져나가도 OK
    >
      <div
        style={{
          fontFamily: "Pretendard",
          display: "flex",
          flexDirection: "column",
          textAlign: isSmall ? "justify" : "left",
          width: "100vw", // ★ 뷰포트 폭 기준
          overflow: "visible", // ★ 삐져나가도 상관 없다고 하셨으니
          fontSize: `${Math.round(fittedFontSize)}px`,
          lineHeight: 0.8,
          fontWeight: 800,
          letterSpacing: isSmall ? "-0.3rem" : "-1rem",
        }}
      >
        <WordFlipper words={["ARCHIVE", "CHRONICLE", "RECORD", "WRITE"]} />
        <span style={{ display: "inline-block", fontWeight: 300 }}>YOUR</span>
        <WordFlipper words={["LIFE", "STORY", "PHOTOS", "MEMORY", "PEOPLE"]} />
      </div>
    </motion.div>
  );
}
