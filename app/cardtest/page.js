"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CardData from "./cardData.js";

export default function LifeCardWithWheel() {
  const data = useMemo(
    () => [
      { year: 2001, events: [{ title: "출생", desc: "돌잔치" }] },
      { year: 2003, events: [{ title: "첫 등원", desc: "유치원 입학" }] },
      { year: 2007, events: [{ title: "첫 여행", desc: "부모님과 해외여행" }] },
      { year: 2015, events: [{ title: "중학교 입학" }] },
      { year: 2020, events: [{ title: "대학 입학" }] },
    ],
    []
  );
  const years = data.map((d) => d.year);

  const [rotation, setRotation] = useState(0); // deg (반원에서 -90~+90로 사용)
  const [activeYear, setActiveYear] = useState(years[0]);
  const [activeEventIdx, setActiveEventIdx] = useState(0);

  const R = 140; // 반지름
  const OUT = 20; // 바깥 라벨 오프셋
  const targetDeg = 0; // 반원의 중앙(오른쪽) — 활성 각도

  const dragging = useRef(false);
  const lastY = useRef(0);

  const onWheel = (e) => setRotation((p) => p + e.deltaY * 0.18);
  const onPointerDown = (e) => {
    dragging.current = true;
    lastY.current = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const dy = y - lastY.current;
    lastY.current = y;
    setRotation((p) => p + dy * 0.7);
  };
  const onPointerUp = () => (dragging.current = false);

  useEffect(() => {
    const step = 180 / years.length;
    let best = years[0];
    let bestDist = Infinity;
    for (let i = 0; i < years.length; i++) {
      const a = -90 + i * step + rotation;
      let d = Math.abs((((a - targetDeg) % 360) + 360) % 360);
      d = Math.min(d, 360 - d);
      if (d < bestDist) {
        bestDist = d;
        best = years[i];
      }
    }
    setActiveYear(best);
    setActiveEventIdx(0);
  }, [rotation, years]);

  useEffect(() => {
    const pills = Array.from(document.querySelectorAll(".tl-pill"));
    const btn = pills.find((el) =>
      (el.textContent || "").includes(String(activeYear))
    );
    if (btn && !btn.classList.contains("active")) btn.click();
  }, [activeYear]);

  const activeYearData = data.find((d) => d.year === activeYear) || data[0];

  return (
    <div className="wrap">
      <header className="hero">
        <h1 className="hero-title">Life-Card</h1>
        <p className="hero-desc">
          <strong>이서하</strong>님의 포스트 카드입니다.
          <br />
          “작은 장면을 모아 긴 기억을 만듭니다”
        </p>
      </header>

      <main className="stage">
        <section className="card-area">
          <CardData />
        </section>

        <aside
          className="right-pane"
          onWheel={onWheel}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          {/* 배경 반원(장식) — 카드 옆에서 시작해 뒤로 흐르는 느낌 */}
          <div className="bg-semi" aria-hidden="true" />

          {/* 반원 휠 */}
          <div className="semi-wheel" role="group" aria-label="Life wheel">
            {/* 반원 링(테두리) */}
            <div className="semi-ring" />
            {/* 바깥쪽에 붙는 연도 라벨들 */}
            {years.map((y, i) => {
              const step = 180 / years.length;
              const angle = -90 + i * step + rotation; // -90~+90
              const rad = (angle * Math.PI) / 180;
              const x = (R + OUT) * Math.cos(rad);
              const yPos = (R + OUT) * Math.sin(rad);
              const isActive = y === activeYear;
              return (
                <button
                  key={y}
                  className={`year-label ${isActive ? "active" : ""}`}
                  style={{ transform: `translate(${x}px, ${yPos}px)` }}
                  onClick={() => setActiveYear(y)}
                >
                  {y}
                </button>
              );
            })}
          </div>

          {/* 이벤트 패널 */}
          <div className="events">
            <div className="events-year">{activeYear}</div>
            <div className="events-rule" />
            <ul className="events-list">
              {activeYearData.events.map((ev, idx) => (
                <li key={idx}>
                  <button
                    className={`ev ${idx === activeEventIdx ? "on" : ""}`}
                    onClick={() => setActiveEventIdx(idx)}
                  >
                    <div className="ev-title">{ev.title}</div>
                    {ev.desc && <div className="ev-desc">{ev.desc}</div>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
      {/* <div className="buttons buttons-row">
        <button onClick={toggleEditPreview} className="btn-preview btn-large">
          {isEditing ? "미리보기" : "편집하기"}
        </button>

        {isEditing && (
          <div className="btn-stack">
            <button
              onClick={handleSaveDB}
              className="btn-edit btn-large"
              disabled={!hasDraft || dbSaving}
            >
              저장
            </button>
            <div
              className={`save-hint ${
                saveStatus === "saving"
                  ? "saving"
                  : saveStatus === "saved"
                  ? "saved"
                  : saveStatus === "error"
                  ? "error"
                  : ""
              }`}
            >
              {saveStatus === "saving" && "자동저장 중…"}
              {saveStatus === "saved" &&
                `자동저장됨 · ${lastSavedAt ? formatTime(lastSavedAt) : ""}`}
              {saveStatus === "error" && "자동저장 실패"}
              {saveStatus === "idle" && (isDirty ? "수정 중" : "대기")}
            </div>
          </div>
        )}
      </div> */}

      {/* 전역: 스크롤 방지 + CardData 내부 레일 숨기기 */}
      <style jsx global>{`
        html,
        body {
          margin: 0;
          height: 100%;
          background: #0f0f0f;
        }
        .timeline-rail {
          display: none !important;
        }
      `}</style>

      {/* 페이지 전용 스타일 */}
      <style jsx>{`
        .wrap {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #121212;
          color: #fff;
          padding: 3rem;
        }
        .hero {
          flex: 0 0 auto;
        }
        .hero-title {
          margin: 0;
          font-family: "Cormorant Garamond", ui-serif, Georgia, serif;
          font-size: clamp(48px, 8vw, 80px);
          font-style: italic;
          font-weight: 700;
          line-height: 1;
        }
        .hero-desc {
          margin: 20px 0 0;
          color: #e9e9e9;
          font-family: "Pretendard Variable", ui-sans-serif, system-ui;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.4;
          letter-spacing: -0.02em;
        }
        .hero-desc strong {
          font-weight: 700;
        }

        .stage {
          flex: 1 1 auto;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr minmax(420px, 520px);
          align-items: center;
          gap: 40px;
          background: #101010;

          padding-top: 2rem;
        }

        .card-area {
          display: flex;
          align-items: center;
        }

        .right-pane {
          position: relative;
          height: 100%;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 28px;
          user-select: none;
          touch-action: none;
        }

        /* 배경 반원(커다란 장식) */
        .bg-semi {
          position: absolute;
          left: -230px;
          top: 50%;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.12);
          /* 오른쪽 반원만 보이도록 마스크 */
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0 50%,
            #000 50% 100%
          );
          mask: linear-gradient(90deg, transparent 0 50%, #000 50% 100%);
          transform: translateY(-50%);
          pointer-events: none;
          filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
        }

        /* 실제 인터랙션 반원 */
        .semi-wheel {
          position: relative;
          width: ${R + OUT + 80}px; /* 오른쪽으로 라벨 공간 확보 */
          height: ${R * 2 + OUT * 2}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 반원 링: 원을 그리고 왼쪽 절반을 마스크로 가림 */
        .semi-ring {
          position: absolute;
          width: ${R * 2}px;
          height: ${R * 2}px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.36);
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0 50%,
            #000 50% 100%
          );
          mask: linear-gradient(90deg, transparent 0 50%, #000 50% 100%);
        }

        /* 바깥쪽에 붙는 연도 라벨 */
        .year-label {
          position: absolute;
          left: 50%;
          top: 50%;
          translate: -50% -50%;
          padding: 2px 8px;
          background: transparent;
          border: 0;
          color: #7f7f7f;
          font-family: "Pretendard Variable", ui-sans-serif, system-ui;
          font-size: 16px;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: color 120ms ease, transform 80ms linear;
        }
        .year-label.active {
          color: #fff;
          font-weight: 600;
        }

        /* 이벤트 패널 */
        .events {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: start;
          column-gap: 24px;
        }
        .events-year {
          font-size: 18px;
          color: #eaeaea;
          line-height: 1;
          margin-top: 2px;
        }
        .events-rule {
          grid-row: 1 / span 2;
          width: 1px;
          height: 160px;
          background: rgba(255, 255, 255, 0.22);
          margin: 0 18px;
        }
        .events-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ev {
          text-align: left;
          background: transparent;
          border: 0;
          color: #9f9f9f;
          padding: 0;
          cursor: pointer;
        }
        .ev.on .ev-title {
          color: #fff;
          font-weight: 700;
        }
        .ev-title {
          font-size: 18px;
          line-height: 1.2;
        }
        .ev-desc {
          font-size: 16px;
          opacity: 0.65;
        }

        @media (max-width: 1100px) {
          .stage {
            grid-template-columns: 1fr;
            row-gap: 28px;
          }
          .right-pane {
            grid-template-columns: 1fr;
            justify-items: center;
          }
          .events {
            grid-template-columns: auto;
            gap: 8px;
            text-align: center;
          }
          .events-rule {
            display: none;
          }
          .bg-semi {
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
