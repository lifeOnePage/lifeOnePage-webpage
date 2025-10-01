"use client";
import React, { useState, useRef, useEffect } from "react";
import "./cardPage.css";
import FloatingToolbar from "../components/FloatingToolBar-Card";

//초기 지정 변수 모음 (타임라인, 달, 팔레트색상)
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
    event: "햇살 가득한 \n첫 소풍의 기억",
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
//테마 팔레트
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

//년도 분리 알고리즘
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

export default function LifeRecord() {
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [rotation, setRotation] = useState(0); //LP판 회전 정도 지정
  const [activeIdx, setActiveIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false); //편집 중인지(로그인 상태인지) 확인용
  const [isPreview, setIsPreview] = useState(false); //미리보기 중인지(로그인상태이면서, floating bar의 미리보기 버튼을 클릭한 상태)
  const [isUpdated, setIsUpdated] = useState(false); //저장중인지(업데이트 중인지)

  //테마 설정
  const DEFAULT_THEME = BG_THEME_PALETTE[0];
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // LP 휠 회전
  const START_ANGLE = 0;
  const SWEEP_ANGLE = 100; //mobile:160
  const RADIUS = 280; //mobile:120
  const STEP = 3;
  const wheelTimer = useRef(null);
  const scrollSound = useRef(null);
  const touchStartX = useRef(0);
  const touchMoveX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchMoveX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diffX = touchMoveX.current - touchStartX.current;
    if (Math.abs(diffX) < 20) return;

    const dir = diffX > 0 ? -1 : 1;
    const next = rotation + dir * STEP * 10;
    setRotation(next);

    if (scrollSound.current) {
      scrollSound.current.currentTime = 0;
      scrollSound.current.play();
    }

    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => snapToClosest(next), 150);
  };

  useEffect(() => {
    scrollSound.current = new Audio("/sounds/scroll.m4a");
  }, []);

  const angleForIndex = (i) => {
    const t = timeline.length === 1 ? 0 : i / (timeline.length - 1);
    return START_ANGLE + SWEEP_ANGLE * t;
  };

  const snapToClosest = (rot, anchor = getAnchor()) => {
    let best = 0,
      bestDiff = Infinity,
      snapped = rot;
    timeline.forEach((_, i) => {
      const base = angleForIndex(i); // i번째 기준각
      const cur = norm360(base + rot); // 현재 화면상의 각
      const diff = angDist(cur, anchor); // 앵커와의 거리
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
        // cur을 anchor로 정렬되게 rotation 보정
        snapped = rot + (anchor - cur);
      }
    });
    setRotation(snapped);
    setActiveIdx(best);
  };

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

  const activeItem = timeline[activeIdx];

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

  //LP 모바일 버전
  const norm360 = (a) => ((a % 360) + 360) % 360;
  const angDist = (a, b) => {
    const d = Math.abs(norm360(a) - norm360(b));
    return Math.min(d, 360 - d);
  };
  const useIsMobile = () => {
    const [m, setM] = React.useState(false);
    useEffect(() => {
      const mq = window.matchMedia("(max-width: 768px)");
      const onChange = () => setM(mq.matches);
      onChange();
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return m;
  };
  const isMobile = useIsMobile();
  const getAnchor = () => (isMobile ? 90 : 0); //모바일이면-> 남쪽(90)기준, 데탑이면-> 오른쪽(0) 기준

  //================================= timeline 관리 =================================
  // 하이라이트/삭제 함수
  const toggleHighlight = (id) => {
    setTimeline((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isHighlight: !item.isHighlight } : item
      )
    );
    setIsUpdated(true);
  };
  const handleDeleteActive = () => {
    // 메인 카드 또는 아이템이 1개뿐이면 삭제 금지
    if (activeItem?.kind === "main" || timeline.length <= 1) return;

    setTimeline((prev) => {
      const next = prev.filter((_, i) => i !== activeIdx);
      const newIdx = Math.max(0, Math.min(activeIdx, next.length - 1));
      setActiveIdx(newIdx);
      return next;
    });
    setIsUpdated(true);
  };

  return (
    <main
      className="lr-page"
      data-editing={isEditing ? "true" : "false"}
      style={{ ["--bg"]: theme.bg, ["--text"]: theme.text }}
    >
      <div className="lr-grid">
        <section className="lr-left">
          <h1 className="lr-title">Life- Record</h1>
          <p className="lr-sub">
            <b>최아텍</b>님의 라이프 레코드입니다.
            <br />
            “작은 장면을 모아 긴 기억을 만듭니다”
          </p>
          {/* ===== 편집 모드에서만 노출: 배경 색상 패널 ===== */}
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
                    src={
                      activeItem.kind === "year"
                        ? activeItem.cover ?? "/images/timeline/1.jpeg"
                        : activeItem.cover ?? "/images/timeline/1.jpeg"
                    }
                    alt="cover"
                    className="lr-cover"
                  />
                )}

                {/* ===== 이미지 업로드 (편집 모드에서만 보임) ===== */}
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
                {/* ===== 편집 아이콘(별/삭제) : 편집 모드에서만 ===== */}
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
                        {/* Star Icon (SVG) */}
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

                    {/* 삭제: 메인은 삭제 금지 */}
                    {activeItem.kind !== "main" && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="삭제"
                        onClick={handleDeleteActive}
                      >
                        {/* Trash Icon (SVG) */}
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

              {/* ===== 설명/메타 + 편집 폼 ===== */}
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
                      // === 일반 이벤트 ===
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
                        placeholder={
                          activeItem.kind === "year" ? "이벤트명" : "제목"
                        }
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
                        placeholder="설명(최대 150자)"
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
                    {/* 
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                      >
                        취소
                      </button>
                      <button type="submit" className="btn-primary">
                        저장
                      </button>
                    </div> */}
                  </form>
                )}
              </div>
              {/* ===== 메인 카드: 하이라이트 그리드(최대 6개) ===== */}
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
                          // 썸네일 클릭 시 해당 아이템으로 점프
                          const i = timeline.findIndex((x) => x.id === it.id);
                          if (i >= 0) {
                            const base = angleForIndex(i);
                            const cur = norm360(base + rotation);
                            const anchor = getAnchor();
                            const snapped = rotation + (anchor - cur);
                            setRotation(snapped);
                            setActiveIdx(i);
                          }
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
                  {/* 비어 있으면 가이드 텍스트 */}
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
                const current = angleForIndex(i) + rotation;
                const handleClick = () => {
                  const base = angleForIndex(i);
                  const cur = norm360(base + rotation);
                  const anchor = getAnchor();
                  const snapped = rotation + (anchor - cur);
                  setRotation(snapped);
                  setActiveIdx(i);
                  if (scrollSound.current) {
                    scrollSound.current.currentTime = 0;
                    scrollSound.current.play();
                  }
                };
                return (
                  <span
                    key={item.id}
                    className={`year-item ${i === activeIdx ? "active" : ""}`}
                    style={{
                      transform: `rotate(${current}deg) translate(${RADIUS}px) rotate(${-current}deg)`,
                    }}
                    onClick={handleClick}
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
    </main>
  );
}
