export default function TabPlanePictogram({ size }) {
  return (
    <div
      style={{
        margin: "20px 0px",
        position: "relative",
        width: size ? size : 160,
        height: size ? size / 1.6 : 100,
      }}
    >
      <div
        style={{
          border: "1px solid white",
          backgroundColor: "#ffffff55",
          borderRadius: "0px 6px 6px 6px",
          width: "100%",
          height: size ? size / 1.6 : 100,
          position: "absolute",
        }}
      />

      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: -9,
            left: i * 25,
            width: 20,
            height: 10,
            border: "1px solid white",
            backgroundColor: "#ffffff55",
            borderRadius: 1,
            animation: `popUp 0.4s ${i * 0.2}s ease-out forwards`,
            opacity: 0,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes popUp {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
