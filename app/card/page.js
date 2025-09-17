"use client";
import React, { useState, useRef } from "react";
import "./cardPage.css";

const YEARS = [2001, 2008, 2016, 2024];

export default function LifeRecord() {
  const [rotation, setRotation] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const lpRef = useRef(null);

  const handleWheel = (e) => {
    const delta = e.deltaY > 0 ? 30 : -30;
    const newRot = rotation + delta;
    setRotation(newRot);

    const step = 360 / YEARS.length;
    let idx = Math.round((((newRot % 360) + 360) % 360) / step);
    if (idx >= YEARS.length) idx = 0;
    setActiveIdx(idx);
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
                src="/images/timeline/7.jpeg"
                alt="cover"
                className="lr-cover"
              />
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
            </div>

            <div className="lr-card-desc">
              <p>
                도시의 작은 변화를 관찰하며 기록하는 인터랙티브 미디어
                아티스트이다. 일상의 경험을 데이터와 이야기로 엮어 사람들이
                스스로의 시간을 아카이브하도록 돕는다. 걷기와 사진을 좋아하며,
                따뜻한 연결을 만드는 작품을 목표로 한다.
              </p>

              <div className="lr-meta">
                <div className="lr-name">최아텍</div>
                <div className="lr-date">
                  <div>NOVEMBER 12</div>
                  <div>2001</div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside className="lr-right" onWheel={handleWheel}>
          <div className="lr-right-header">
            <span className="lr-play">PLAY</span>
            <span className="lr-right-desc">최야텍의 이야기</span>
          </div>

          <div className="lp-wrap">
            <img
              ref={lpRef}
              className="lp-disc"
              src="/images/LP-image.png"
              alt="LP"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div className="year-circle">
              {YEARS.map((year, i) => {
                const angle = (360 / YEARS.length) * i;
                const R = 280;
                return (
                  <span
                    key={year}
                    className={`year-item ${i === activeIdx ? "active" : ""}`}
                    style={{
                      transform: `rotate(${angle}deg) translate(${R}px) rotate(-${angle}deg)`,
                    }}
                  >
                    {year}
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
