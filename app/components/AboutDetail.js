// LifeCardHero.js
import React from "react";

export default function LifeCardHero() {
  return (
    <div className="page">
      {/* Top tabs */}
      <div className="tabs">
        <button className="tab active">The Life Card</button>
        <button className="tab">The Life Wheel</button>
      </div>

      {/* Headline */}
      <h1 className="headline">All your time, on one card</h1>
      <p className="subhead">당신의 시간을, 한 장의 카드에.</p>

      {/* Card */}
      <div className="card-wrap"></div>

      {/* Footer copy */}
      <p className="footer-copy">
        <strong>The Life Card</strong>는 당신의 삶에서 소중한 순간들을 한 장의
        카드로 기록하는 디지털 아카이브입니다. 이름과 출생 정보, 내용, 연도별
        타임라인, 사진을 기록하고, 링크와 QR로 쉽게 공유합니다.
      </p>

      {/* CSS (scoped) */}
      <style jsx>{`
        :root {
          --bg: #0a0a0a;
          --fg: #eaeaea;
          --muted: #bcbcbc;
          --card: #111111;
          --strip: #f4f4f4;
          --ink: #121212;
          --ring: rgba(255, 255, 255, 0.08);
        }

        .page {
          min-height: 100svh;
          background: var(--bg);
          color: var(--fg);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 20px 80px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
            "Helvetica Neue", Arial;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
        }
        .tab {
          appearance: none;
          border: 1px solid #2a2a2a;
          background: #141414;
          color: #dcdcdc;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
          letter-spacing: 0.1px;
          cursor: default;
        }
        .tab.active {
          background: #1f1f1f;
          box-shadow: inset 0 0 0 1px #3a3a3a, 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .headline {
          margin: 8px 0 6px;
          font-size: clamp(22px, 2.3vw, 34px);
          font-weight: 500;
          font-family: ui-serif, Georgia, "Times New Roman", Times, serif;
          font-style: italic;
          color: #f3f3f3;
          text-align: center;
        }

        .subhead {
          margin: 0 0 28px;
          color: var(--muted);
          font-size: clamp(13px, 1.25vw, 16px);
          text-align: center;
        }

        .card-wrap {
          width: min(920px, 92vw);
          display: flex;
          justify-content: center;
          margin: 10px 0 26px;
        }

        .card {
          position: relative;
          width: 100%;
          background: linear-gradient(#fefefe, #f9f9f9);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6),
            0 2px 0 1px rgba(255, 255, 255, 0.04) inset;
        }

        .left-strip {
          position: absolute;
          inset: 0 auto 0 0;
          width: clamp(58px, 8vw, 82px);
          background: var(--strip);
          border-right: 1px solid #dddddd;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 6px;
        }

        .qr {
          width: 40px;
          height: 40px;
          background: conic-gradient(#000 0 25%, #fff 0 50%, #000 0 75%, #fff 0)
              0 0 / 8px 8px,
            radial-gradient(#000 45%, transparent 46%) 3px 3px / 8px 8px;
          filter: contrast(200%);
          border: 3px solid #000;
        }

        .vertical-brand {
          position: absolute;
          left: 8px;
          bottom: 72px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 11px;
          color: #8a8a8a;
          letter-spacing: 0.2px;
        }

        .content {
          margin-left: clamp(58px, 8vw, 82px);
          display: grid;
          grid-template-columns: 1fr clamp(260px, 33%, 320px);
          gap: 22px;
          padding: clamp(18px, 2.2vw, 24px);
          padding-bottom: 0;
        }

        .photo {
          aspect-ratio: 4 / 3;
          border-radius: 8px;
          background-image: url("https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop");
          background-size: cover;
          background-position: center;
          box-shadow: 0 1px 0 #e9e9e9 inset, 0 0 0 1px #e6e6e6 inset;
        }

        .meta {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-top: 4px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
        }
        .label {
          color: #6f6f6f;
          letter-spacing: 0.6px;
        }
        .value {
          color: #2b2b2b;
          font-weight: 500;
        }

        .divider {
          height: 1px;
          background: #e8e8e8;
          margin: 10px 0 12px;
        }

        .desc {
          margin: 0;
          color: #4a4a4a;
          font-size: 12px;
          line-height: 1.6;
        }

        .bottom {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 12px;
          margin-left: clamp(58px, 8vw, 82px);
          padding: 12px clamp(18px, 2.2vw, 24px) 18px;
          border-top: 1px solid #e9e9e9;
        }

        .name {
          font-size: clamp(32px, 5vw, 50px);
          color: #1b1b1b;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .month {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          padding-right: 4px;
        }
        .mrange {
          font-size: clamp(16px, 2.2vw, 22px);
          color: #202020;
          font-weight: 600;
          letter-spacing: 1.5px;
        }
        .enmonth {
          font-size: clamp(14px, 1.8vw, 20px);
          color: #2a2a2a;
          letter-spacing: 1.2px;
        }

        .vignette {
          position: absolute;
          inset: 58% 0 0 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.06) 35%,
            rgba(0, 0, 0, 0.18) 100%
          );
          pointer-events: none;
        }

        .footer-copy {
          width: min(820px, 90vw);
          text-align: center;
          color: #cfcfcf;
          font-size: 14px;
          line-height: 1.7;
        }

        /* Responsiveness */
        @media (max-width: 860px) {
          .content {
            grid-template-columns: 1fr;
          }
          .meta {
            padding-right: 8px;
          }
        }

        /* Subtle focus ring for tabs if needed */
        .tab:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--ring);
        }
      `}</style>
    </div>
  );
}
