"use client";
import React, { useState, useRef, useEffect } from "react";
import "./cardPage.css";
import FloatingToolbar from "../components/FloatingToolBar-Card";

const INITIAL_TIMELINE = [
  {
    id: "PLAY",
    kind: "main",
    label: "PLAY",
    title: "최아텍의 이야기",
    date: "2001.11.12",
    location: "서울 마포구",
    desc: "도시의 작은 변화를 관찰하며 기록하는 인터랙티브 미디어 아티스트이다. 일상의 경험을 데이터와 이야기로 엮어 사람들이 스스로의 시간을 아카이브하도록 돕는다. 걷기와 사진을 좋아하며, 따뜻한 연결을 만드는 작품을 목표로 한다.",
    cover: "/images/timeline/1.jpeg",
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
  },
];

// LP 휠 회전
const START_ANGLE = 0;
const SWEEP_ANGLE = 100;
const RADIUS = 280;
const STEP = 3;

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

export default function LifeRecord() {
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [rotation, setRotation] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const wheelTimer = useRef(null);
  const scrollSound = useRef(null);

  useEffect(() => {
    scrollSound.current = new Audio("/sounds/scroll.m4a");
  }, []);

  const angleForIndex = (i) => {
    const t = timeline.length === 1 ? 0 : i / (timeline.length - 1);
    return START_ANGLE + SWEEP_ANGLE * t;
  };

  const snapToClosest = (rot) => {
    let best = 0,
      bestDiff = Infinity,
      snapped = rot;
    timeline.forEach((_, i) => {
      const base = angleForIndex(i);
      const cur = (base + rot) % 360;
      const curNorm = (cur + 360) % 360;
      const diff = Math.min(curNorm, 360 - curNorm);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
        snapped = rot - cur;
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
        item.date = value; // "YYYY.MM.DD"
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
    setField("image", url);
    setIsUpdated(true);
  };

  const handleSave = () => {
    // TODO: 서버/파이어베이스 저장 로직 연결
  };
  const handleCancel = () => {
    setTimeline(INITIAL_TIMELINE);
    setIsEditing(false);
    setIsUpdated(true);
  };
  const handleTogglePreview = () => setIsPreview((p) => !p);
  const showEditUI = isEditing && !isPreview;

  return (
    <main className="lr-page" data-editing={isEditing ? "true" : "false"}>
      <div className="lr-grid">
        <section className="lr-left">
          <h1 className="lr-title">Life- Record</h1>
          <p className="lr-sub">
            <b>최아텍</b>님의 포스트 카드입니다.
            <br />
            “작은 장면을 모아 긴 기억을 만듭니다”
          </p>
        </section>

        <section className="lr-center">
          <article className={`lr-card ${isEditing ? "lr-card--editing" : ""}`}>
            <div key={activeIdx} className="card-fade">
              <div className="lr-card-media">
                <img
                  src={
                    activeItem.kind === "year"
                      ? activeItem.cover ?? "/images/timeline/1.jpeg"
                      : activeItem.cover ?? "/images/timeline/1.jpeg"
                  }
                  alt="cover"
                  className="lr-cover"
                />

                {activeItem.kind === "main" && (
                  <div className="lr-playlist">
                    <h4>PLAYLIST</h4>
                    <div className="lr-playlist-contents">
                      <ol>
                        <li>01 햇살 가득한 첫 소풍의 기억</li>
                        <li>02 설렘으로 시작한 새로운 여정</li>
                        <li>03 봄비 아래의 첫 해외 모험</li>
                      </ol>
                      <ol>
                        <li>04 다시 만난 작은 소풍의 기억</li>
                        <li>05 생활로 스며든 새로운 여정</li>
                        <li>06 별빛 아래의 첫 해외 모험</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* ===== 이미지 업로드 (편집 모드에서만 보임) ===== */}
                {isEditing && (
                  <label className="edit-image-btn">
                    이미지 변경
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files?.[0])}
                      hidden
                    />
                  </label>
                )}
              </div>

              {/* ===== 설명/메타 + 편집 폼 ===== */}
              <div className="lr-card-desc">
                {!isEditing ? (
                  <>
                    <p>{activeItem.desc}</p>
                    <div className="lr-meta">
                      <div className="lr-name">
                        {activeItem.kind === "year"
                          ? activeItem.event
                          : "최아텍"}
                      </div>
                      <div className="lr-date">
                        <div>{toMonthDay(activeItem.date)}</div>
                        <div>{activeItem.location}</div>
                      </div>
                    </div>
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
            </div>
          </article>
        </section>

        <aside className="lr-right" onWheel={handleWheel}>
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
                  const cur = (base + rotation) % 360;
                  const snapped = rotation - cur;
                  setRotation(snapped);
                  setActiveIdx(i);
                  scrollSound.current.currentTime = 0;
                  scrollSound.current.play();
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
    </main>
  );
}
