"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { timelineData } from "../memorial/timelineData";
import * as d3 from "d3";
import useWindowSize from "../hooks/useWindowSize";

export default function VerticalTimeline() {
  const { width, height: windowHeight } = useWindowSize();
  const isMobile = width < 640;
  const WIDTH = width;
  const FULL_HEIGHT = (timelineData.length + 3) * 150;
  const ex_height = FULL_HEIGHT + 200;
  const CENTER_X = isMobile ? WIDTH * 0.85 : WIDTH / 2;
  const NODE_WIDTH = isMobile ? WIDTH * 0.7 : 300;

  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const [itemHeights, setItemHeights] = useState({});
  const itemRefs = useRef({});
  const [imageRatios, setImageRatios] = useState({}); // idx -> ratio
  const [previewImg, setPreviewImg] = useState(null); // 현재 미리보기 중인 이미지 src
  const [previewRect, setPreviewRect] = useState(null); // 클릭된 이미지의 위치 정보
  const [previewCoords, setPreviewCoords] = useState(null);

  const handleImageClick = (e, imgSrc) => {
    const rect = e.target.getBoundingClientRect();
    const scrollTop = window.scrollY;
    console.log(scrollTop);
    console.log(imgSrc);
    const coords = {
      top: imgSrc.y,
      left: imgSrc.x,
      width: rect.width,
    };

    setPreviewImg(imgSrc.img);
    setPreviewCoords(coords);
  };

  const parsedData = useMemo(() => {
    const parseY = d3
      .scaleTime()
      .domain(d3.extent(timelineData, (d) => parseDate(d.date)))
      .range([100, FULL_HEIGHT - 100]);

    const left = [];
    const right = [];
    const minGap = 200;

    timelineData.forEach((item, i) => {
      const yRaw = parseY(parseDate(item.date));
      const side = isMobile ? "left" : i % 2 === 0 ? "left" : "right";
      const list = side === "left" ? left : right;
      const last = list.length > 0 ? list[list.length - 1].y : 0;
      const y = list.length === 0 ? yRaw : Math.max(yRaw, last + minGap);
      list.push({ ...item, y, side });
    });

    return [...left, ...right].sort((a, b) => a.y - b.y);
  }, [width]);

  useEffect(() => {
    console.log("effect");
    // 타이밍상 렌더 완료 후 실행 보장
    setTimeout(() => {
      const newHeights = {};
      Object.entries(itemRefs.current).forEach(([idx, el]) => {
        if (el) {
          newHeights[idx] = el.offsetHeight;
          console.log(`idx ${idx}:`, el.offsetHeight); // ✅ 이제 찍힐 것!
        }
      });
      setItemHeights(newHeights);
    }, 100); // 약간의 delay (50~100ms)
  }, [parsedData]);

  useEffect(() => {
    const loadRatios = async () => {
      const promises = timelineData.map((item, idx) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = item.img;
          img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            resolve({ idx, ratio });
          };
        });
      });

      const results = await Promise.all(promises);
      const ratioMap = {};
      results.forEach(({ idx, ratio }) => {
        ratioMap[idx] = ratio;
      });
      setImageRatios(ratioMap);
    };

    loadRatios();
  }, []);
  useEffect(() => {
    const onScroll = () => setPreviewImg(null);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (previewCoords) {
      console.log("업데이트된 previewCoords:", previewCoords);
    }
  }, [previewCoords]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: expanded ? ex_height : "100vh",
        overflow: "hidden",
        transition: "height 0.6s ease-in-out",
      }}
    >
      {/* Timeline SVG */}
      <svg width={WIDTH} height={ex_height}>
        <line
          x1={CENTER_X}
          y1={0}
          x2={CENTER_X}
          y2={FULL_HEIGHT}
          stroke="#88888888"
          strokeWidth={2}
        />

        {parsedData.map((item, idx) => {
          const isLeft = item.side === "left";
          const xText = isLeft
            ? CENTER_X - width * 0.1
            : CENTER_X + width * 0.1;
          const xTextStart = isLeft ? xText - NODE_WIDTH : xText;
          const xImg = isLeft ? xTextStart - 50 : xText + NODE_WIDTH + 10;

          const offsetY = 5;
          const curvePath = `M${CENTER_X},${item.y}
            ${xTextStart + (isLeft ? NODE_WIDTH : 0)},${item.y}`;

          const ref = useRef(null);

          return (
            <g key={idx}>
              <path
                d={curvePath}
                stroke="#88888888"
                fill="none"
                strokeWidth="2"
              />
              <circle
                cx={CENTER_X}
                cy={item.y}
                r={5}
                fill="#88888888"
                stroke="#88888888"
                strokeWidth="2"
              />

              {!isMobile && item.img && (
                <image
                  href={item.img}
                  x={
                    isLeft
                      ? xImg - (100 * (imageRatios[idx] || 1)) / 2 - 20
                      : xImg + 10
                  }
                  y={item.y}
                  width={100 * (imageRatios[idx] || 1)}
                  height={100}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ cursor: "pointer", borderRadius:"15px" }}
                  onClick={(e) => handleImageClick(e, item)}
                />
              )}
              {isMobile && item.img && (
                <image
                  href={item.img}
                  x={5}
                  y={item.y - 50}
                  width="80"
                  height={itemHeights[idx] || 100}
                  preserveAspectRatio="xMidYMid slice"
                />
              )}

              {isMobile && (
                <foreignObject
                  x={NODE_WIDTH * 0.3}
                  y={item.y - 50}
                  width={NODE_WIDTH * 0.8}
                  height="auto"
                  style={{ overflow: "visible" }}
                >
                  <motion.div
                    ref={(el) => {
                      if (el) itemRefs.current[idx] = el;
                    }}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                      // backgroundColor: "#dddddd88",
                      padding: "10px 20px",
                      fontFamily: "Pretendard, sans-serif",
                      fontSize: "10px",
                      color: "#333",
                      textAlign: isMobile ? "left" : isLeft ? "right" : "left",
                      overflow: "visible",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    xmlns="http://www.w3.org/1999/xhtml"
                  >
                    <div>
                      <strong style={{ fontSize: "1rem" }}>{item.date}</strong>
                    </div>
                    <div
                      style={{
                        width: "auto",
                        height: "auto",
                        backgroundColor: "#fefefe33",
                        boxShadow: "0px 10px 30px -10px #1a1a1a33",
                        borderRadius: "10px",
                        padding: "10px 10px 5px 10px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontStyle: "italic",
                          fontSize: "1rem",
                          padding: "5px 0px",
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.7rem", margin: "10px 0px" }}>
                        {item.event}
                      </div>
                    </div>
                  </motion.div>
                </foreignObject>
              )}
              {!isMobile && (
                <foreignObject
                  x={isLeft ? xTextStart - 10 : xTextStart + 10}
                  y={item.y - 50}
                  width={NODE_WIDTH}
                  height="auto"
                  style={{ overflow: "visible" }}
                >
                  <motion.div
                    ref={(el) => {
                      if (el) itemRefs.current[idx] = el;
                    }}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                      // backgroundColor: "#ddd",
                      padding: "10px 20px",
                      fontFamily: "Pretendard, sans-serif",
                      fontSize: "14px",
                      color: "#333",
                      textAlign: isMobile ? "left" : isLeft ? "right" : "left",
                      overflow: "visible",
                      display: "flex",
                      flexDirection: "column",
                      boxSizing: "border-box",
                    }}
                    xmlns="http://www.w3.org/1999/xhtml"
                  >
                    <div>
                      <strong style={{ fontSize: "1.5rem" }}>
                        {item.date}
                      </strong>
                    </div>
                    <div
                      style={{
                        width: "auto",
                        height: "auto",
                        backgroundColor: "#fefefe22",
                        boxShadow: `${
                          isLeft ? "30px" : "-30px"
                        } 10px 50px -10px #1a1a1a33`,

                        borderRadius: "10px",
                        padding: "20px 20px 10px 20px",
                      }}
                    >
                      <div style={{ fontStyle: "italic", fontSize: "1.3rem" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "1.125rem", margin: "10px 0px" }}>
                        {item.event}
                      </div>
                    </div>
                  </motion.div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ height: "100px" }}>
        {/* Gradient overlay when collapsed */}
        {!expanded && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "200px",
              background: "linear-gradient(to top, white, transparent)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}

        {/* Toggle button */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            width: "100px",

            transform: "translateX(-50%)",
            zIndex: 2,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "25px",
            padding: "8px 16px",
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            color: "#1a1a1a",
          }}
        >
          {expanded ? "접기" : "펼쳐보기"}
        </button>
        <AnimatePresence>
          {previewImg && previewCoords && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                top: previewCoords.top,
                left: previewCoords.left,
                transform: "translateX(-50%)",
                width: "50vw",
                maxHeight: "80vh",
                zIndex: 1000,
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                overflow: "hidden", // 둥근 모서리 깔끔하게
                backgroundColor: "#fff", // optional: 로딩 중 배경
              }}
              onClick={() => {
                setPreviewImg(null);
                setPreviewCoords(null);
              }}
            >
              <img
                src={previewImg}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function parseDate(dateStr) {
  const parts = dateStr.split(".").map((p) => parseInt(p));
  const year = parts[0];
  const month = parts[1] ? parts[1] - 1 : 6;
  const day = parts[2] || 15;
  return new Date(year, month, day);
}
