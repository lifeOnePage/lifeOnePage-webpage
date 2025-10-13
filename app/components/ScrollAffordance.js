"use client";
import { useEffect, useRef, useState } from "react"; // react (external)
import { AnimatePresence, motion } from "framer-motion"; // framer-motion (external)

export default function ScrollAffordance({
  containerRef = null,          // 스크롤 컨테이너 ref (없으면 window 사용)
  message = "아래로 스크롤해 보세요",
  showDuration = 3000,          // 버블 표시 시간(ms)
  nudgeDistance = 60,           // 자동 스크롤 넛지 거리(px)
  nudgeDelay = 400,             // 마운트 후 넛지까지 지연(ms)
  oncePerSession = true,        // 세션당 1회만 표시
  onceKey = "scroll-affordance-shown", // 세션 키
  position = "bottom",          // "bottom" | "top"
}) {
  const [visible, setVisible] = useState(false);
  const timers = useRef({});

  // SSR 안전한 document/scrollElement 얻기
  const getScrollEl = () => {
    if (typeof window === "undefined") return null;
    if (containerRef?.current) return containerRef.current;
    // 기본: 문서 스크롤
    return document.scrollingElement || document.documentElement;
  };

  const isScrollable = (el) => {
    if (!el) return false;
    const canScrollY =
      (el.scrollHeight || 0) - (el.clientHeight || 0) > 4; // 약간의 여유
    return canScrollY;
  };

  const doNudge = (el) => {
    if (!el) return;
    // 접근성: reduce motion 설정이면 넛지 건너뛰기
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const startTop = el.scrollTop;
    // 아래로 부드럽게
    el.scrollTo({ top: startTop + nudgeDistance, behavior: "smooth" });
    timers.current.nudgeBack = setTimeout(() => {
      // 원위치
      el.scrollTo({ top: startTop, behavior: "smooth" });
    }, 500);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 세션당 1회 옵션 처리
    if (oncePerSession && sessionStorage.getItem(onceKey)) return;

    const el = getScrollEl();
    if (!isScrollable(el)) return; // 스크롤 불가면 아무것도 안 함

    // 넛지 + 버블 표시
    timers.current.nudgeStart = setTimeout(() => doNudge(el), nudgeDelay);

    setVisible(true);
    if (oncePerSession) sessionStorage.setItem(onceKey, "1");

    // showDuration 뒤 자동 닫기
    timers.current.hide = setTimeout(() => setVisible(false), showDuration);

    // 사용자가 스크롤하면 즉시 닫기
    const onUserScroll = () => setVisible(false);
    const target = containerRef?.current || window;
    target.addEventListener("scroll", onUserScroll, { passive: true });

    return () => {
      Object.values(timers.current).forEach((t) => clearTimeout(t));
      target.removeEventListener("scroll", onUserScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bubble = (
    <motion.div
      initial={{ opacity: 0, y: position === "bottom" ? 12 : -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position === "bottom" ? 8 : -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: position === "bottom" ? 28 : "auto",
        top: position === "top" ? 28 : "auto",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.84)",
          color: "white",
          padding: "10px 14px",
          borderRadius: 14,
          fontSize: 14,
          lineHeight: 1.2,
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
          backdropFilter: "saturate(160%) blur(2px)",
          maxWidth: 260,
          textAlign: "center",
          fontFamily: "Pretendard, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, sans-serif",
        }}
      >
        {message}
      </div>
      {/* 꼬리 */}
      <div
        style={{
          margin: position === "bottom" ? "6px auto 0" : "0 auto 6px",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          ...(position === "bottom"
            ? { borderTop: "8px solid rgba(0,0,0,0.84)" }
            : { borderBottom: "8px solid rgba(0,0,0,0.84)" }),
        }}
      />
    </motion.div>
  );

  return <AnimatePresence>{visible && bubble}</AnimatePresence>;
}
