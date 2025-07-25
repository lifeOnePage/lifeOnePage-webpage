import { useEffect, useState } from "react";

export default function RingPictogram() {
  const [start, setStart] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setStart(true), 100); // 약간의 지연 후 시작
    return () => clearTimeout(timeout);
  }, []);

  const totalItems = 20;
  const radiusX = 60;
  const radiusY = 20;

  return (
    <div
      className={start ? "ring-container start" : "ring-container"}
      style={{
        margin: "20px 0px",
        position: "relative",
        width: 160,
        height: 100,
        perspective: 400,
      }}
    >
      {Array.from({ length: totalItems }).map((_, i) => {
        const angle = 360 - (i * 360) / totalItems;
        const rad = (angle * Math.PI) / 180;
        const x = radiusX * Math.cos(rad);
        const y = radiusY * Math.sin(rad);
        const scale = 0.6 + (0.4 * (Math.sin(rad) + 1)) / 2;
        const w = 10 + 20 * Math.cos(rad) * Math.cos(rad);

        return (
          <div
            key={i}
            className="ring-item"
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px - ${w / 2}px)`,
              top: `calc(50% + ${y}px - 10px)`,
              width: `${w}px`,
              height: 20,
              border: "1px solid white",
              backgroundColor: "#ffffff55",
              borderRadius: 4,
              transform: `scale(${scale})`,
              animationDelay: `${0.05 * i}s`,
            }}
          />
        );
      })}

      <style jsx>{`
        .ring-container {
          transform-style: preserve-3d;
        }

        .ring-container.start {
          animation: ringEnter 0.6s ease-in-out forwards;
        }

        @keyframes ringEnter {
          0% {
            transform: rotateX(20deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(0deg) rotateZ(0deg);
          }
        }

        .ring-item {
          opacity: 0;
          transform: scale(0.2);
          animation: itemRise 0.3s ease-out forwards;
        }

        @keyframes itemRise {
          to {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
