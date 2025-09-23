"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AddTimelineModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleSubmit = () => {
    if (!year || !title) return alert("연도와 제목을 입력해주세요.");
    onSubmit({ year, title, location, desc, file, preview });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="tlm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="tlm-modal"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="tlm-title">새 타임라인 만들기</h2>

            <div
              className="tlm-image-area"
              style={{ backgroundImage: preview ? `url(${preview})` : "none" }}
            >
              <label className="tlm-image-button">
                이미지변경
                <input type="file" accept="image/*" onChange={onPick} hidden />
              </label>
            </div>

            <label className="tlm-label">제목</label>
            <input
              className="tlm-input"
              placeholder="타임라인의 제목을 입력해주세요. (ex. 새로운 경험!)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="tlm-label">연도</label>
            <input
              className="tlm-input"
              placeholder="예: 2016"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
            />

            <label className="tlm-label">장소</label>
            <input
              className="tlm-input"
              placeholder="예: 어린이대공원"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <label className="tlm-label">설명</label>
            <textarea
              className="tlm-textarea"
              rows={4}
              placeholder="내용을 입력해주세요."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            <div className="tlm-actions">
              <button className="tlm-btn ghost" onClick={onClose}>
                취소
              </button>
              <button className="tlm-btn primary" onClick={handleSubmit}>
                추가
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
