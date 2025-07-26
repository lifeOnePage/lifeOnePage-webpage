// components/PreviewHeader.js
"use client";

export default function PreviewHeader({ selected, setSelected }) {
  const tabStyle = (key) => ({
    flex: 1,
    textAlign: "center",
    padding: "12px 0",
    cursor: "pointer",
    fontWeight: selected === key ? "bold" : "normal",
    borderBottom: selected === key ? "2px solid white" : "none",
  });

  return (
    <div style={{ display: "flex", height: "50px", background: "black" }}>
      <div style={tabStyle("card")} onClick={() => setSelected("card")}>
        Life Card
      </div>
      <div style={tabStyle("page")} onClick={() => setSelected("page")}>
        Life Page
      </div>
    </div>
  );
}
