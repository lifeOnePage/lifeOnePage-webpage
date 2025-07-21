import { MAIN_THEME } from "../styles/colorConfig";

export const LargeFileDialog = ({ files, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          width: "90%",
          maxWidth: "400px",
        }}
      >
        <h4 style={{ marginBottom: "10px" }}>파일이 너무 커요</h4>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          고용량의 미디어를 저장할 수 없어요.
          <br />
          선택된 {files.length}개의 파일이 자동으로 품질이 저하됩니다.
        </p>
        <ul style={{ fontSize: "0.85rem", margin: "10px 0" }}>
          {files.map((file, idx) => (
            <li key={idx}>{file.name}</li>
          ))}
        </ul>
        <button
          onClick={onClose}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: MAIN_THEME,
            color: "white",
            width: "100%",
            border: "none",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
};
