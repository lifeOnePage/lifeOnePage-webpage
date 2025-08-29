// ✅ shellRenderer.js

// 🔹 쉘 스타일 메시지와 입력 필드 렌더링
export function renderShellMessages(
  messages,
  inputIndex,
  input,
  setInput,
  onEnter,
  loading
) {
  // console.log(input, inputIndex)
  return messages.map((msg, i) => (
    <div
      key={i}
      style={{
        marginBottom: 12,
        textAlign: "left",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {msg.sender === "system" && (
        <div>
          <strong>질문{i / 2 + 1} &gt;</strong> {msg.text}
        </div>
      )}
      {msg.sender === "user" && <div>{msg.text}</div>}

      {/* 현재 입력 필드가 위치해야 할 질문 아래에만 표시 */}
      {i === inputIndex-1 && msg.sender === "system" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onEnter();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder=">>>"
            style={{
              marginTop: 4,
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "0.95rem",
            }}
          />
        </form>
      )}
    </div>
  ));
}
