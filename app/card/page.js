"use client";
import React, { useState, useRef, useEffect } from "react";
import "./cardPage.css";
import "./cardPage-mobile.css";
import FloatingToolbar from "../components/FloatingToolBar-Card";
import AddTimelineModal from "./AddTimelineModal";

/* =========================
   초기 데이터 / 상수
   ========================= */
const INITIAL_TIMELINE = [
  {
    id: "PLAY",
    kind: "main",
    label: "PLAY",
    title: "최아텍의 이야기",
    date: "2001.11.12",
    location: "서울 마포구",
    desc: "도시의 작은 변화를 관찰하며 기록하는 아티스트이다. 일상의 경험을 이야기로 엮어 사람들이 스스로의 시간을 아카이브하도록 돕는다.",
    cover: "/images/timeline/1.jpeg",
    isHighlight: false,
  },
  {
    id: 2001,
    kind: "year",
    label: "2001",
    event: "출생",
    date: "2001.11.12",
    location: "서울 마포구",
    cover: "/images/timeline/2.jpeg",
    desc: "세상에 첫 발을 디딘 날. 가족들의 축복 속에서 태어났다. 작은 울음소리가 집안을 가득 채우자, 부모님과 가족들은 새로운 생명의 도착을 기뻐하며 서로의 손을 꼭 잡았다.",
    isHighlight: false,
  },
  {
    id: 2008,
    kind: "year",
    label: "2008",
    event: "소풍",
    date: "2008.05.12",
    location: "어린이대공원",
    cover: "/images/timeline/3.jpeg",
    desc: "초등학교 입학 후 처음으로 떠난 소풍이었다. 친구들과 함께 김밥을 나누어 먹고, 놀이기구를 타며 웃음소리가 끊이지 않았다.",
    isHighlight: false,
  },
  {
    id: 2011,
    kind: "year",
    label: "2011",
    event: "새로운 시작",
    date: "2011.03.02",
    location: "서울",
    cover: "/images/timeline/4.jpeg",
    desc: "새로운 교실, 새로운 친구들. 기대와 설렘 속에서 중학교 생활을 시작했다.",
    isHighlight: false,
  },
];
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const BG_THEME_PALETTE = [
  { name: "Coal", bg: "#121212", text: "#F2F2F2" },
  { name: "Rose", bg: "#aa747dff", text: "#ffffffff" },
  { name: "Olive", bg: "#7B7341", text: "#f2f2f2ff" },
  { name: "Warm Gray", bg: "#746F6F", text: "#F2F2F2" },
  { name: "Blue", bg: "#6C8E98", text: "#F2F2F2" },
  { name: "BlackPink", bg: "#12121268", text: "#aa747dff" },
  { name: "Parchment", bg: "#F5F1E6", text: "#111111" },
  { name: "Cloud", bg: "#ECECEC", text: "#111111" },
];

/* =========================
   날짜 포맷 유틸
   ========================= */
const toMonthDay = (str) => {
  if (!str) return "";
  const [y, m, d] = str.split(".").map((s) => parseInt(s, 10));
  return `${MONTHS[m - 1]} ${String(d).padStart(2, "0")}`;
};
const yyyymmddToISO = (str) => {
  if (!str) return "";
  const [y, m, d] = str.split(".").map((s) => s.padStart(2, "0"));
  return `${y}-${m}-${d}`;
};
const isoToYyyymmdd = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
};
const getYear = (str) => {
  if (!str) return "";
  const [y] = str.split(".");
  return y + " " || "";
};

/* =========================
   Geometry 유틸
   ========================= */
const norm360 = (a) => ((a % 360) + 360) % 360; // 0~360
const wrapTo180 = (d) => ((d + 540) % 360) - 180; // -180~+180
const angDist = (a, b) => {
  const d = Math.abs(norm360(a) - norm360(b));
  return Math.min(d, 360 - d);
};

/* =========================
   모바일 감지 훅
   ========================= */
function useIsMobile(bp = 768) {
  const [m, setM] = React.useState(
    typeof window !== "undefined" ? window.innerWidth <= bp : false
  );
  useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    on();
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

export default function LifeRecord() {
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [rotation, setRotation] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // 테마
  const DEFAULT_THEME = BG_THEME_PALETTE[0];
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // 사운드/입력
  const wheelTimer = useRef(null);
  const scrollSound = useRef(null);
  const touchStartX = useRef(0);
  const touchMoveX = useRef(0);

  /* =========================
     Desktop/Mobile 배치 설정
     ========================= */
  const isMobile = useIsMobile();
  const DESKTOP = { START: 0, SWEEP: 120, RADIUS: 280, ANCHOR: 0 };
  const MOBILE = { START: 110, SWEEP: 180, RADIUS: 140, ANCHOR: 110 };
  const CFG = isMobile ? MOBILE : DESKTOP;
  const RADIUS = CFG.RADIUS;
  const getAnchor = () => CFG.ANCHOR;

  const angleForIndex = (i) => {
    const n = timeline.length;
    if (n <= 0) return CFG.START;
    const step = CFG.SWEEP / n;
    return CFG.START + step * (i + 0.5);
  };

  const didInitRef = useRef(false);
  useEffect(() => {
    const base = angleForIndex(activeIdx);
    const cur = norm360(base + rotation);
    const anchor = getAnchor();
    const delta = ((anchor - cur + 540) % 360) - 180;
    if (Math.abs(delta) > 0.5) {
      setRotation((r) => r + delta);
    }
    didInitRef.current = true;
  }, [isMobile, timeline.length]);

  const snapToIndex = (i, anchor = getAnchor()) => {
    const base = angleForIndex(i);
    const cur = norm360(base + rotation);
    const delta = wrapTo180(anchor - cur);
    setRotation(rotation + delta);
    setActiveIdx(i);
  };

  const snapToClosest = (rot, anchor = getAnchor()) => {
    let best = 0,
      bestDiff = Infinity,
      snapped = rot;
    timeline.forEach((_, i) => {
      const cur = norm360(angleForIndex(i) + rot);
      const diff = angDist(cur, anchor);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
        snapped = rot + wrapTo180(anchor - cur);
      }
    });
    setRotation(snapped);
    setActiveIdx(best);
  };

  /* =========================
     입력(휠/터치)
     ========================= */
  const STEP = 3;
  const handleWheel = (e) => {
    const dir = e.deltaY > 0 ? -1 : 1;
    const next = rotation + dir * STEP;
    setRotation(next);
    if (scrollSound.current) {
      scrollSound.current.currentTime = 0;
      scrollSound.current.play();
    }
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => snapToClosest(next), 140);
  };

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = (e) => (touchMoveX.current = e.touches[0].clientX);
  const handleTouchEnd = () => {
    const dx = touchMoveX.current - touchStartX.current;
    if (Math.abs(dx) < 20) return;

    const left = dx < -20;
    const right = dx > 20;

    let target = activeIdx;

    if (isMobile) {
      if (left) target = Math.max(0, activeIdx - 1);
      if (right) target = Math.min(timeline.length - 1, activeIdx + 1);
    } else {
      if (left) target = Math.max(0, activeIdx - 1);
      if (right) target = Math.min(timeline.length - 1, activeIdx + 1);
    }

    if (target !== activeIdx) {
      snapToIndex(target);
      if (scrollSound.current) {
        scrollSound.current.currentTime = 0;
        scrollSound.current.play();
      }
    }
  };

  useEffect(() => {
    scrollSound.current = new Audio("/sounds/scroll.m4a");
  }, []);

  const activeItem = timeline[activeIdx];

  /* =========================
     편집/저장/필드 업데이트
     ========================= */
  const setField = (field, value) => {
    setTimeline((prev) => {
      const next = [...prev];
      const item = { ...next[activeIdx] };

      if (field === "title") {
        if (item.kind === "year") item.event = value;
        else item.title = value;
      } else if (field === "image") {
        item.cover = value;
        item.isImageUpdated = true;
      } else if (field === "date") {
        item.date = value;
      } else {
        item[field] = value;
      }
      next[activeIdx] = item;
      return next;
    });
    setIsUpdated(true);
  };

  const handleImageChange = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type?.startsWith("video/")) {
      setField("video", url);
    } else {
      setField("image", url);
    }
    setIsUpdated(true);
  };

  const handleSave = () => {};
  const handleCancel = () => {
    setTimeline(INITIAL_TIMELINE);
    setIsEditing(false);
    setIsUpdated(true);
  };
  const handleTogglePreview = () => setIsPreview((p) => !p);
  const showEditUI = isEditing && !isPreview;

  /* =========================
     하이라이트/삭제
     ========================= */
  const toggleHighlight = (id) => {
    setTimeline((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isHighlight: !item.isHighlight } : item
      )
    );
    setIsUpdated(true);
  };
  const handleDeleteActive = () => {
    if (activeItem?.kind === "main" || timeline.length <= 1) return;
    setTimeline((prev) => {
      const next = prev.filter((_, i) => i !== activeIdx);
      const newIdx = Math.max(0, Math.min(activeIdx, next.length - 1));
      setActiveIdx(newIdx);
      return next;
    });
    setIsUpdated(true);
  };

  /* =========================
     새 타임라인 생성 후 즉시 이동
     ========================= */
  const handleCreateTimeline = (newItem) => {
    setTimeline((prev) => {
      const next = [...prev, newItem];
      const idx = next.length - 1;
      requestAnimationFrame(() => snapToIndex(idx));
      return next;
    });
  };

  return (
    <main
      className="lr-page"
      data-editing={isEditing ? "true" : "false"}
      style={{ ["--bg"]: theme.bg, ["--text"]: theme.text }}
    >
      <div className="lr-grid">
        {/* ========== 좌측: 타이틀/설정 ========== */}
        <section className="lr-left">
          <h1 className="lr-title">Life- Record</h1>
          <p className="lr-sub">
            <b>최아텍</b>님의 라이프 레코드입니다.
            <br />
            “작은 장면을 모아 긴 기억을 만듭니다”
          </p>

          {isEditing && (
            <div className="bg-panel">
              <div className="bg-panel-head">
                <span className="bg-panel-title">배경 테마</span>
                <span className="bg-panel-hint">클릭 즉시 적용</span>
              </div>

              <div className="bg-swatches">
                {BG_THEME_PALETTE.map((t) => {
                  const active = theme.bg === t.bg && theme.text === t.text;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      className={`swatch ${active ? "is-active" : ""}`}
                      style={{ background: t.bg, color: t.text }}
                      title={`${t.name} (${t.bg})`}
                      onClick={() => setTheme(t)}
                    >
                      A
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========== 중앙: 카드 영역 ========== */}
        <section className="lr-center">
          <article
            className={`lr-card ${isEditing ? "lr-card--editing" : ""} ${
              activeItem.kind === "main" ? "lr-card--main" : ""
            }`}
          >
            <div key={activeIdx} className="card-fade">
              <div className="lr-card-media">
                {activeItem.video ? (
                  <video
                    className="lr-cover"
                    src={activeItem.video}
                    controls
                    playsInline
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={activeItem.cover ?? "/images/timeline/1.jpeg"}
                    alt="cover"
                    className="lr-cover"
                  />
                )}

                {isEditing && (
                  <label className="edit-image-btn">
                    이미지 변경
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleImageChange(e.target.files?.[0])}
                      hidden
                    />
                  </label>
                )}

                {isEditing && activeItem && (
                  <div className="media-actions" aria-label="미디어 액션">
                    {activeItem.kind !== "main" && (
                      <button
                        type="button"
                        className={`icon-btn ${
                          activeItem.isHighlight ? "is-on" : ""
                        }`}
                        title={
                          activeItem.isHighlight
                            ? "하이라이트 해제"
                            : "하이라이트로 지정"
                        }
                        aria-pressed={!!activeItem.isHighlight}
                        onClick={() => toggleHighlight(activeItem.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="22"
                          height="22"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 3.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.9 6.6 20.3l1-6.1-4.4-4.3 6.1-.9L12 3.5z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                        </svg>
                      </button>
                    )}
                    {activeItem.kind !== "main" && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="삭제"
                        onClick={handleDeleteActive}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="22"
                          height="22"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 7h16M9 7V4h6v3m-7 4v8m4-8v8m4-8v8M6 7l1 14h10l1-14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 설명/메타 */}
              <div className="lr-card-desc">
                {!isEditing ? (
                  <>
                    {activeItem.kind === "main" ? (
                      <>
                        <div className="lr-meta lr-meta--mainTop">
                          <div className="lr-name">최아텍</div>
                          <div className="lr-date">
                            {getYear(activeItem.date)}
                            {toMonthDay(activeItem.date)}
                          </div>
                        </div>
                        <p>{activeItem.desc}</p>
                      </>
                    ) : (
                      <>
                        <p>{activeItem.desc}</p>
                        <div className="lr-meta">
                          <div className="lr-name">
                            {activeItem.kind === "year"
                              ? activeItem.event
                              : "최아텍"}
                          </div>
                          <div className="lr-date">
                            {getYear(activeItem.date)}
                            {toMonthDay(activeItem.date)}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <form
                    className="edit-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                  >
                    <div className="edit-row">
                      <label>Title</label>
                      <input
                        type="text"
                        value={
                          activeItem.kind === "year"
                            ? activeItem.event ?? ""
                            : activeItem.title ?? ""
                        }
                        onChange={(e) => setField("title", e.target.value)}
                        placeholder="이 기록의 대표 제목을 입력하세요 (예: 나의 첫 전시회)"
                      />
                    </div>
                    <div className="edit-date-location">
                      <div className="edit-row">
                        <label>Date</label>
                        <input
                          type="date"
                          value={yyyymmddToISO(activeItem.date || "")}
                          onChange={(e) =>
                            setField("date", isoToYyyymmdd(e.target.value))
                          }
                        />
                      </div>
                      <div className="edit-row">
                        <label>Location</label>
                        <input
                          type="text"
                          value={activeItem.location ?? ""}
                          onChange={(e) => setField("location", e.target.value)}
                          placeholder="장소"
                        />
                      </div>
                    </div>

                    <div className="edit-row">
                      <label>Description</label>
                      <textarea
                        rows={6}
                        maxLength={150}
                        value={activeItem.desc ?? ""}
                        onChange={(e) => setField("desc", e.target.value)}
                        placeholder="사진에 담긴 순간의 의미나 기억을 기록해 보세요 (최대 150자)"
                      />
                      <span
                        className={`char-count ${
                          (activeItem.desc?.length ?? 0) >= 140 ? "warn" : ""
                        }`}
                        aria-live="polite"
                      >
                        {activeItem.desc?.length ?? 0}/150
                      </span>
                    </div>
                  </form>
                )}
              </div>

              {/* 메인카드 하이라이트 */}
              {activeItem.kind === "main" && (
                <div className="lr-highlight-grid" role="list">
                  {timeline
                    .filter((it) => it.isHighlight)
                    .slice(0, 6)
                    .map((it) => (
                      <div
                        key={it.id}
                        className="lr-highlight-item"
                        role="listitem"
                        title={
                          (it.kind === "year" ? it.event : it.title) ||
                          "하이라이트"
                        }
                        onClick={() => {
                          const i = timeline.findIndex((x) => x.id === it.id);
                          if (i >= 0) snapToIndex(i);
                        }}
                      >
                        <img
                          src={it.cover || "/images/timeline/1.jpeg"}
                          alt={
                            (it.kind === "year" ? it.event : it.title) ||
                            "highlight"
                          }
                        />
                        <span className="lr-highlight-title">
                          {it.kind === "year" ? it.event : it.title}
                        </span>
                      </div>
                    ))}
                  {isEditing &&
                    timeline.filter((it) => it.isHighlight).length === 0 && (
                      <div className="lr-highlight-empty">
                        별(⭐)을 눌러 하이라이트를 추가하세요. (최대 6개)
                      </div>
                    )}
                </div>
              )}
            </div>
          </article>
        </section>

        {/* ========== 우측: LP + 연도 원 ========== */}
        <aside
          className="lr-right"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="lp-wrap">
            <img
              className="lp-disc"
              src="/images/LP-image.png"
              alt="LP"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div className="year-circle">
              {timeline.map((item, i) => {
                const phi = angleForIndex(i) + rotation;
                return (
                  <span
                    key={item.id}
                    className={`year-item ${i === activeIdx ? "active" : ""}`}
                    style={{
                      transform: `rotate(${phi}deg) translate(${RADIUS}px) rotate(${-phi}deg)`,
                    }}
                    onClick={() => snapToIndex(i)}
                  >
                    {item.label}
                    {item.kind === "main" ? (
                      <span className="year-event">{item.title}</span>
                    ) : (
                      <span className="year-event">{item.event}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* ========== Footer / Floating Bar ========== */}
      <footer className="footer">
        {!isEditing && (
          <>
            <div className="footer-logo">The Life Gallery</div>
            <div className="footer-copyright">
              Copyright 2025. Creative Computing Group. All rights reserved.
            </div>
          </>
        )}

        {!isEditing ? (
          <button
            className="login-btn-fixed"
            onClick={() => setIsEditing(true)}
            aria-pressed="false"
            title="로그인하고 편집 모드로 전환"
          >
            로그인
          </button>
        ) : (
          <div className="toolbar-anchor" role="region" aria-label="편집 도구">
            <FloatingToolbar
              onSave={handleSave}
              onLogout={() => setIsEditing(false)}
              isPreview={isPreview}
              setIsPreview={setIsPreview}
              isUpdated={isUpdated}
              onAddTimeline={() => setAddOpen(true)}
            />
          </div>
        )}
      </footer>

      {/* ========== 새 타임라인 모달 ========== */}
      <AddTimelineModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreateTimeline}
      />
    </main>
  );
}
