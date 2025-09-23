"use client";
import React, { useState, useRef, useEffect } from "react";
import "./cardPage.css";

//LP 휠 회전
const YEARS = ["PLAY", 2001, 2008, 2016, 2024];
const START_ANGLE = -80;
const SWEEP_ANGLE = 140;
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
const toYear = (str) => (str ? str.split(".")[0] : "");

const TIMELINE = [
  {
    id: "PLAY",
    kind: "main",
    label: "PLAY",
    title: "최아텍의 이야기",
    date: "2001.11.12",
    location: "서울 마포구",
    desc: "도시의 작은 변화를 관찰하며 기록하는 인터랙티브 미디어 아티스트이다. 일상의 경험을 데이터와 이야기로 엮어 사람들이 스스로의 시간을 아카이브하도록 돕는다. 걷기와 사진을 좋아하며, 따뜻한 연결을 만드는 작품을 목표로 한다.",
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

let wheelTimeout = null;

export default function LifeRecord() {
  const [rotation, setRotation] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const lpRef = useRef(null);
  const wheelTimer = useRef(null);
  const scrollSound = useRef(null);
  useEffect(() => {
    scrollSound.current = new Audio("/sounds/scroll.m4a");
  }, []);

  const angleForIndex = (i) => {
    const t = TIMELINE.length === 1 ? 0 : i / (TIMELINE.length - 1);
    return START_ANGLE + SWEEP_ANGLE * t;
  };

  const snapToClosest = (rot) => {
    let best = 0,
      bestDiff = Infinity,
      snapped = rot;
    TIMELINE.forEach((_, i) => {
      const base = angleForIndex(i);
      const cur = (base + rot) % 360;
      const curNorm = (cur + 360) % 360;
      const diff = Math.min(curNorm, 360 - curNorm); // 0°와의 차
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

  return (
    <main className="lr-page">
      <div className="lr-grid">
        <section className="lr-left">
          <h1 className="lr-title">
            Life-
            <br />
            Record
          </h1>
          <p className="lr-sub">
            <b>최아텍</b>님의 포스트 카드입니다.
            <br />
            “작은 장면을 모아 긴 기억을 만듭니다”
          </p>
        </section>

        <section className="lr-center">
          <article className="lr-card">
            <div className="lr-card-media">
              <img
                src={
                  TIMELINE[activeIdx].kind === "year"
                    ? TIMELINE[activeIdx].cover ?? "/images/timeline/1.jpeg"
                    : "/images/timeline/1.jpeg"
                }
                alt="cover"
                className="lr-cover"
              />
              {TIMELINE[activeIdx].kind === "main" && (
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
            </div>
            <div className="lr-card-desc">
              <p>{TIMELINE[activeIdx].desc}</p>

              <div className="lr-meta">
                <div className="lr-name">
                  {TIMELINE[activeIdx].kind === "year"
                    ? TIMELINE[activeIdx].event
                    : "최아텍"}
                </div>
                <div className="lr-date">
                  <div>{toMonthDay(TIMELINE[activeIdx].date)}</div>
                  <div>{TIMELINE[activeIdx].location}</div>
                </div>
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
              {TIMELINE.map((item, i) => {
                const current = angleForIndex(i) + rotation;
                const handleClick = () => {
                  let snapped = rotation;
                  const base = angleForIndex(i);
                  const cur = (base + rotation) % 360;
                  const curNorm = (cur + 360) % 360;
                  snapped = rotation - cur;

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
                      <span className="year-event"> {item.title}</span>
                    ) : (
                      <span className="year-event"> {item.event}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
