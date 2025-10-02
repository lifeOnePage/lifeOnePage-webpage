"use client";
import { useCallback } from "react";

/**
 * 한 번 클릭할 때 화면(100vh) 높이만큼 위로 스크롤하는 버튼
 * - step: 몇 화면 단위로 스크롤할지 (기본 1)
 * - bottom/right: 버튼 위치(px)
 * - label: 버튼 안 표시 텍스트
 */
export default function ScrollUpOneViewportButton({
  step = 1,
  bottom = 60,
  right = 24,
  label = "▲",
}) {
  const scrollUp = useCallback(() => {
    if (typeof window === "undefined") return;

    // 모바일 브라우저 주소창 이슈를 고려한 vh 계산
    const vv = typeof window.visualViewport?.height === "number"
      ? window.visualViewport.height
      : 0;
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0,
      vv
    );

    const delta = -1 * step * vh;

    // 최상단 근처면 그냥 0까지 올림
    const target = Math.max(0, window.scrollY + delta);

    window.scrollTo({
      top: target,
      behavior: "smooth",
    });
  }, [step]);

  return (
    <button
      onClick={scrollUp}
      aria-label={`위로 ${step} 화면 스크롤`}
      title={`위로 ${step} 화면 스크롤`}
      style={{
        position: "fixed",
        right,
        bottom,
        zIndex: 10000,
        width: 48,
        height: 48,
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.15)",
        background: "#fff",
        boxShadow: "0 6px 18px rgba(0,0,0,.12)",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 18,
        lineHeight: "48px",
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {label}
    </button>
  );
}
