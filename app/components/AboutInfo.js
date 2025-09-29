export default function AboutInfo() {
  return (
    <section className="about-info">
      <div className="logo-and-info">
        <h1 className="logo">
          The Life <br /> Gallery
        </h1>

        <div className="about-text">
          <span className="info-title">더라이프갤러리</span>
          <span className="info-desc">
            는 인생의 순간을 하나의 사진첩과 포스터 카드로 정리하며,
            <br />
            갤러리처럼 아름답게 전시하고 공유할 수 있는 서비스입니다.
            <br />
            <br />
          </span>

          <span className="info-title">더라이프갤러리</span>
          <span className="info-desc">
            는 기술을 통해 모든 사람의 이야기가 기록되고 기억될 수 있도록
            합니다.
            <br />
            유명하지 않아도, 특별하지 않아도 좋습니다.
            <br />
            <br />
            당신의 이야기는 하나의 기록이 됩니다. 질문에 답하면서 자연스럽게
            삶이 정리되고, 그 과정에서 우리는 일상의 소중함을 다시 발견합니다.
          </span>
        </div>
      </div>

      <div className="design-image" aria-hidden="true">
        <img src="/images/design-line.svg" alt="" />
      </div>

      <style jsx>{`
        .about-info {
          position: relative;
          height: 100vh;
          width: 100%;
          //   background: url("/images/bg-life-gallery.png") no-repeat center center /
          //     cover;
          background: black;
          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 2rem;
          box-sizing: border-box;
          overflow: hidden;
        }

        .logo-and-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6rem;
          max-width: 1200px;
          width: 100%;
        }

        .logo {
          margin: 0;
          color: #f2f2f2;
          font-family: "Cormorant Garamond", serif;
          font-size: clamp(56px, 10vw, 150px);
          font-style: italic;
          font-weight: 700;
          line-height: 0.9;
          text-align: right;
          white-space: nowrap;
        }

        .about-text {
          max-width: 640px;
          line-height: 1.6;
        }

        .info-title {
          display: inline-block;
          margin-right: 6px;
          color: #f2f2f2;
          font-family: "Pretendard Variable", system-ui, -apple-system, Segoe UI,
            Roboto, Helvetica, Arial, sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: -0.0625rem;
        }

        .info-desc {
          display: inline;
          color: #f2f2f2;
          font-family: "Pretendard Variable", system-ui, -apple-system, Segoe UI,
            Roboto, Helvetica, Arial, sans-serif;
          font-size: 1.1rem;
          font-weight: 300;
          line-height: 1.3;
          letter-spacing: -0.0625rem;
        }

        .design-image {
          position: absolute;
          left: 50%;
          bottom: 15vh;
          transform: translateX(-50%);
          width: min(70%, 900px);
          pointer-events: none;
          opacity: 0.9;
        }
        .design-image img {
          display: block;
          width: 100%;
          height: auto;
        }

        @media (max-width: 900px) {
          .logo-and-info {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }
          .logo {
            text-align: center;
            white-space: normal;
          }
          .about-text {
            max-width: 90vw;
          }
          .design-image {
            bottom: 4vh;
            width: min(84%, 720px);
          }
        }
      `}</style>
    </section>
  );
}
