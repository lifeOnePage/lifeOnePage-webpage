// AboutSweep.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function AboutSweep({ trigger, setTrigger }) {
  const containerRef = useRef(null);
  const textMeasureRef = useRef(null);
  const controls = useAnimation();
  const strokeMaskRef = useRef(null); // ★ 스트로크에 적용할 마스크
  const [dims, setDims] = useState({ cw: 0, tw: 0 });

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !textMeasureRef.current) return;
      const cw = containerRef.current.clientWidth;
      const tb = textMeasureRef.current.getBoundingClientRect();
      setDims({ cw, tw: tb.width });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    if (textMeasureRef.current) ro.observe(textMeasureRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const run = async () => {
      const { cw, tw } = dims;
      if (!cw || !tw) return;

      const SAFE_MARGIN = 24;
      const ENTER_OFFSET = 60;
      const EXIT_OFFSET = 60;

      const startX = -tw - ENTER_OFFSET;
      const stopX = cw - tw - SAFE_MARGIN;
      const exitX = cw + EXIT_OFFSET;

      await controls.set({ x: startX });

      // 1) 왼쪽 → 오른쪽 끝 근처(감속)
      await controls.start({
        x: stopX,
        transition: { duration: 1.1, ease: [0.17, 0.84, 0.44, 1] },
      });

      // 2) '써지는' 대상: ★ 스트로크 레이어 마스크 width 0→tw
      if (strokeMaskRef.current) {
        strokeMaskRef.current.style.width = "0px";
        requestAnimationFrame(() => {
          strokeMaskRef.current.animate(
            [{ width: "0px" }, { width: `${tw}px` }],
            {
              duration: 700,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "forwards",
            }
          );
        });
      }

      // 3) 잠깐 머무른 뒤 오른쪽으로 가속 퇴장
      await new Promise((r) => setTimeout(r, 350));
      await controls.start({
        x: exitX,
        transition: { duration: 0.9, ease: [0.55, 0.06, 0.68, 0.19] },
      });
    };
    run();
  }, [dims, controls]);
  useEffect(() => {
    const run = async () => {
      const { cw, tw } = dims;
      if (!cw || !tw) return;

      const SAFE_MARGIN = 24;
      const ENTER_OFFSET = 60;
      const EXIT_OFFSET = 60;

      const startX = -tw - ENTER_OFFSET;
      const stopX = cw - tw - SAFE_MARGIN;
      const exitX = cw + EXIT_OFFSET;

      await controls.set({ x: startX });

      // 1) 왼쪽 → 오른쪽 끝 근처(감속)
      await controls.start({
        x: stopX,
        transition: { duration: 1.1, ease: [0.17, 0.84, 0.44, 1] },
      });

      // 2) '써지는' 대상: ★ 스트로크 레이어 마스크 width 0→tw
      if (strokeMaskRef.current) {
        strokeMaskRef.current.style.width = "0px";
        requestAnimationFrame(() => {
          strokeMaskRef.current.animate(
            [{ width: "0px" }, { width: `${tw}px` }],
            {
              duration: 700,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "forwards",
            }
          );
        });
      }

      // 3) 잠깐 머무른 뒤 오른쪽으로 가속 퇴장
      await new Promise((r) => setTimeout(r, 350));
      await controls.start({
        x: exitX,
        transition: { duration: 0.9, ease: [0.55, 0.06, 0.68, 0.19] },
      });
    };
    run();
    setTrigger(false);
  }, [trigger]);

  const textStyle = {
    whiteSpace: "nowrap",
    fontFamily:
      "Pretendard, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    fontWeight: 900,
    fontSize: "18vw",
    letterSpacing: "-0.02em",
    userSelect: "none",
    lineHeight: 1,
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        backgroundColor: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          transform: "translateY(-50%)",
        }}
      >
        <motion.div animate={controls} style={{ position: "absolute" }}>
          {/* 측정용(레이아웃 영향 없음) */}
          <span
            ref={textMeasureRef}
            aria-hidden
            style={{
              ...textStyle,
              position: "absolute",
              visibility: "hidden",
              WebkitTextStroke: "10px #000",
              color: "white",
            }}
          >
            ABOUT
          </span>

          <div style={{ position: "relative" }}>
            {/* 1) 베이스: 채움(흰색)만 먼저 보이게 */}
            <span style={{ ...textStyle, color: "#fff" }}>ABOUT</span>

            {/* 2) 스트로크 레이어(검정): 마스크로 '써지듯' 보이게 */}
            <div
              ref={strokeMaskRef}
              style={{
                position: "absolute",
                inset: 0,
                width: 0, // ★ 여기서 0→tw로 애니메이션
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  ...textStyle,
                  color: "transparent",
                  WebkitTextStroke: "2px #000", // ★ 스트로크만 표시
                }}
              >
                ABOUT
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
