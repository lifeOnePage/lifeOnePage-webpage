"use client";
import { useEffect, useRef, useState } from "react";

export default function AddTimelineModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [dateISO, setDateISO] = useState(""); // YYYY-MM-DD
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const disabled = !title.trim() || !dateISO;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;

    // YYYY.MM.DD 로 변환
    const [y, m, d] = dateISO.split("-");
    const ymd = `${y}.${m}.${d}`;

    // 새 타임라인 아이템
    const newItem = {
      id: `${y}-${Date.now()}`, // 고유 id
      kind: "year",
      label: y, // 원형 휠에 표시될 값
      event: title.trim(), // 이벤트명
      date: ymd,
      location: "",
      cover: preview || "", // 이미지 미선택이면 빈 값
      desc: desc.trim(),
      isHighlight: false,
    };

    onCreate?.(newItem);
    onClose?.();
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="atl-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="atl-modal" ref={dialogRef}>
        <h2 className="atl-title">새 타임라인 만들기</h2>

        <form onSubmit={handleSubmit} className="atl-form">
          {/* 이미지 업로드 */}
          <div className="atl-media">
            {preview ? (
              <img src={preview} alt="preview" />
            ) : (
              <div className="atl-media-placeholder" />
            )}
            <label className="atl-upload-btn">
              이미지 변경
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* 제목 */}
          <div className="atl-field">
            <label>제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이 순간의 이름을 입력하세요. (예: 새로운 경험!)"
            />
          </div>

          {/* 연도(날짜) */}
          <div className="atl-field">
            <label>연도</label>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="atl-field">
            <label>설명</label>
            <textarea
              rows={4}
              maxLength={150}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="언제·어디서·누구와 있었는지, 그때의 감정까지 간단히 메모해 보세요. (최대 150자)"
            />
            <div className="atl-count">{desc.length}/150</div>
          </div>

          <div className="atl-actions">
            <button
              type="button"
              className="atl-btn secondary"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="atl-btn primary"
              disabled={disabled}
            >
              만들기
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .atl-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: grid;
          place-items: center;
          z-index: 2000;
        }
        .atl-modal {
          width: min(520px, 92vw);
          background: #fff;
          border-radius: 16px;
          padding: 20px 20px 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        }
        .atl-title {
          margin: 8px 0 16px;
          font-size: 24px;
          font-weight: 700;
          text-align: center;

          color: #000;
          font-family: "Pretendard Variable";
          font-size: 1.25rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }
        .atl-form {
          display: grid;
          gap: 18px;
        }
        .atl-media {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }
        .atl-media img,
        .atl-media-placeholder {
          width: 100%;
          height: 220px;
          object-fit: cover;
          background: #333;
        }
        .atl-upload-btn {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.7);
          width: 160px;
          height: 40px;
          margin: auto;
          border-radius: 999px;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(2px);
        }
        .atl-field label {
          display: block;
          font-weight: 600;
          margin: 6px 0;

          color: #000;
          font-family: "Pretendard Variable";
          font-size: 0.9375rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }
        .atl-field input,
        .atl-field textarea {
          width: 100%;
          border: none;
          border-bottom: 2px solid #222;
          padding: 10px 2px;
          outline: none;
          background: transparent;
          font-size: 20px;

          color: #777;
          font-family: "Pretendard Variable";
          font-size: 1rem;
          font-style: normal;
          font-weight: 300;
          line-height: normal;
        }
        .atl-count {
          text-align: right;
          font-size: 12px;
          color: #777;
          margin-top: 4px;
        }
        .atl-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 6px;
        }
        .atl-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          cursor: pointer;
        }
        .atl-btn.secondary {
          background: #b3b3b3ff;
        }
        .atl-btn.primary {
          background: #111;
          color: #fff;
        }
        .atl-btn.primary:disabled {
          opacity: 0.4;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
