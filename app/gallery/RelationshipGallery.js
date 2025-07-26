"use client";

import { useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebaseConfig";
import {
  FiUpload,
  FiTrash2,
  FiStar,
  FiPlus,
  FiImage,
  FiVideo,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { MAIN_THEME } from "../styles/colorConfig";
import { uploadGalleryImagesWithProgress } from "../utils/firebaseStorage";
import { useUnsavedChanges } from "../contexts/UnsavedChangesContext";

const nameExamples = [
  "홍길동",
  "00중 1학년 3반 친구들",
  "천체관측모임",
  "길동이",
];
const relationExamples = ["아버지", "친구", "동아리", "단짝친구"];

export default function RelationshipGallery({
  userId,
  initialData = {},
  handleSave,
}) {
  const [relationshipData, setRelationshipData] = useState(() => {
    const init = {};
    Object.entries(initialData).forEach(([key, entry]) => {
      init[key] = {
        ...entry,
        expanded: false,
        media: (entry.photos || []).map((url, idx) => ({
          url,
          isVideo:
            url.endsWith(".mp4") ||
            url.endsWith(".mov") ||
            url.endsWith(".webm"),
          caption: entry.captions?.[idx] || "",
        })),
      };
    });
    return init;
  });
  const [uploadProgress, setUploadProgress] = useState(0); // 0~100
  const [isSaving, setIsSaving] = useState(false);
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const [saveComplete, setSaveComplete] = useState(false);

  const maxCards = 12;
  const fileInputRef = useRef();

  const addNewCard = () => {
    if (Object.keys(relationshipData).length >= maxCards) return;

    const nameEx =
      nameExamples[Math.floor(Math.random() * nameExamples.length)];
    const relationEx =
      relationExamples[Math.floor(Math.random() * relationExamples.length)];

    const newKey = `new_${Date.now()}`;
    setRelationshipData((prev) => ({
      ...prev,
      [newKey]: {
        name: "",
        relation: "",
        namePlaceholder: `이름(예: ${nameEx})`,
        relationPlaceholder: `관계(예: ${relationEx})`,
        media: [],
        representative: null,
        expanded: false,
      },
    }));
  };

  const handleFileChange = (e) => {
    const personName = e.target.dataset.name;
    const files = Array.from(e.target.files);

    setRelationshipData((prev) => {
      const updated = { ...prev };
      files.forEach((file) => {
        const isVideo = file.type.startsWith("video");
        const previewUrl = URL.createObjectURL(file);

        updated[personName].media.push({
          file,
          previewUrl,
          isVideo,
          caption: "",
        });
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleFiUploadClick = (name) => {
    fileInputRef.current.dataset.name = name;
    fileInputRef.current.click();
  };

  const updateField = (name, key, value) => {
    setRelationshipData((prev) => {
      const updated = { ...prev };
      updated[name][key] = value;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const updateCaption = (name, idx, value) => {
    setRelationshipData((prev) => {
      const updated = { ...prev };
      updated[name].media[idx].caption = value;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const deletePhoto = (name, idx) => {
    setRelationshipData((prev) => {
      const updated = { ...prev };
      updated[name].media.splice(idx, 1);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const selectRepresentative = (name, idx) => {
    setRelationshipData((prev) => {
      const updated = { ...prev };
      updated[name].representative = idx;
      return updated;
    });
  };

  const deleteCategory = (name) => {
    setRelationshipData((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const toggleExpand = (name) => {
    setRelationshipData((prev) => {
      const updated = { ...prev };
      updated[name].expanded = !updated[name].expanded;
      return updated;
    });
  };

  const onSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    setSaveComplete(false);

    const finalData = {};
    const totalFiles = Object.values(relationshipData)
      .flatMap((entry) => entry.media)
      .filter((m) => m.file).length;

    let uploadedCount = 0;

    for (const [key, entry] of Object.entries(relationshipData)) {
      const newMedia = [];
      const filesToUpload = entry.media.filter((m) => m.file);

      let uploadedUrls = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadGalleryImagesWithProgress(
          filesToUpload.map((m) => m.file),
          userId,
          "relationship",
          key,
          (percent) => {
            uploadedCount += 1;
            setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
          }
        );
      }

      let uploadIdx = 0;
      for (let i = 0; i < entry.media.length; i++) {
        const m = entry.media[i];
        if (m.file) {
          newMedia.push({
            url: uploadedUrls[uploadIdx],
            isVideo: m.isVideo,
            caption: m.caption,
          });
          uploadIdx++;
        } else {
          newMedia.push({
            url: m.url,
            isVideo: m.isVideo,
            caption: m.caption,
          });
        }
      }

      finalData[key] = {
        name: entry.name,
        relation: entry.relation,
        photos: newMedia.map((m) => m.url),
        captions: newMedia.map((m) => m.caption),
        representative: entry.representative ?? 0,
      };
    }

    await handleSave(finalData);

    setIsSaving(false);
    setUploadProgress(100);
    setHasUnsavedChanges(false);
    setSaveComplete(true);
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <h3 style={{ flex: 1 }}>
          소중한 사람, 기억하고픈 인연을 자유롭게 기록해보세요.
        </h3>
        {hasUnsavedChanges ? (
          <button
            onClick={onSave}
            style={{
              flex:1,
              alignSelf: "flex-end",
              padding: "8px 16px",
              background: MAIN_THEME,
              color: "white",
              borderRadius: 8,
              whiteSpace: "nowrap",
              opacity: isSaving ? 0.5 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
            disabled={isSaving}
          >
            저장
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-end",
              gap: 8,
              color: "#555",
            }}
          >
            <FiCheckCircle color={MAIN_THEME} />
            <span style={{ fontSize: "0.9rem", color: "#888" }}>
              모든 변경사항이 저장되었습니다
            </span>
          </div>
        )}
      </div>
      {isSaving && (
        <div style={{ width: "100%", margin: "10px 0" }}>
          <div
            style={{
              width: "100%",
              background: "#ddd",
              height: "8px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                background: MAIN_THEME,
                height: "100%",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "5px" }}>
            업로드 중... {uploadProgress}%
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(max(30%, 200px), 1fr))",
          gap: 20,
        }}
      >
        {Object.entries(relationshipData).map(([key, entry]) => {
          const mediaCount = entry.media.length;
          const videoCount = entry.media.filter((m) => m.isVideo).length;
          const photoCount = mediaCount - videoCount;
          const thumbnails = entry.media.slice(0, 4);
          const isExpanded = entry.expanded;
          const isOverflowMedia = mediaCount > 4;

          return (
            <motion.div
              key={key}
              layout
              transition={{ duration: 0.3 }}
              style={{
                gridColumn: isExpanded ? "span 3" : "auto",
                padding: 16,
                backgroundColor: "#f5f5f5",
                border: "1px solid #ccc",
                borderRadius: 16,
                position: "relative",
                paddingTop: 40,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: "50%",
                  backgroundColor: "#00000055",
                }}
                onClick={() => deleteCategory(key)}
              >
                <FiTrash2 color={"white"} />
              </div>

              {isExpanded ? (
                <div
                  style={{
                    display: "flex",
                    gap: "5%",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ width: "30%" }}>
                    <input
                      placeholder={entry.namePlaceholder || "이름"}
                      value={entry.name}
                      onChange={(e) => updateField(key, "name", e.target.value)}
                      style={{
                        width: "100%",
                        marginBottom: 8,
                        padding: 8,
                        border: "1px dashed #aaa",
                        borderRadius: 8,
                      }}
                    />
                    <input
                      placeholder={entry.relationPlaceholder || "관계"}
                      value={entry.relation}
                      onChange={(e) =>
                        updateField(key, "relation", e.target.value)
                      }
                      style={{
                        width: "100%",
                        marginBottom: 8,
                        padding: 8,
                        border: "1px dashed #aaa",
                        borderRadius: 8,
                      }}
                    />
                    <button
                      onClick={() => toggleExpand(key)}
                      style={{
                        fontSize: "0.8rem",
                        textDecoration: "underline",
                      }}
                    >
                      접기
                    </button>
                  </div>

                  <div
                    style={{
                      width: "70%",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(max(30%, 50px), 1fr))",
                      gap: 6,
                    }}
                  >
                    {entry.media.map((m, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        {m.isVideo ? (
                          <video
                            src={m.previewUrl || m.url}
                            muted
                            loop
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <img
                            src={m.previewUrl || m.url}
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <input
                          value={m.caption}
                          onChange={(e) =>
                            updateCaption(key, idx, e.target.value)
                          }
                          placeholder="캡션"
                          style={{
                            width: "100%",
                            position: "absolute",
                            bottom: 0,
                            background: "#00000088",
                            color: "white",
                            fontSize: "0.6rem",
                            border: "none",
                            padding: "2px 4px",
                          }}
                        />
                        {/* 🗑️ 개별 삭제 버튼 추가 */}
                        <div
                          style={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: "50%",
                            backgroundColor: "#00000055",
                          }}
                          onClick={() => deletePhoto(key, idx)}
                        >
                          <FiTrash2 color="white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <input
                    placeholder={entry.namePlaceholder || "이름"}
                    value={entry.name}
                    onChange={(e) => updateField(key, "name", e.target.value)}
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      padding: 8,
                      border: "1px dashed #aaa",
                      borderRadius: 8,
                    }}
                  />
                  <input
                    placeholder={entry.relationPlaceholder || "관계"}
                    value={entry.relation}
                    onChange={(e) =>
                      updateField(key, "relation", e.target.value)
                    }
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      padding: 8,
                      border: "1px dashed #aaa",
                      borderRadius: 8,
                    }}
                  />

                  {isOverflowMedia ? (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          marginBottom: 10,
                          color: "#777",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <FiImage /> {photoCount}{" "}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flex: 1,
                              gap: 5,
                            }}
                          >
                            <FiVideo /> {videoCount}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {/* 비디오 예외처리 필요 */}
                          {thumbnails.map((m, i) => (
                            <img
                              key={i}
                              src={m.previewUrl || m.url}
                              alt=""
                              style={{
                                width: 20,
                                height: 20,
                                aspectRatio: "1 / 1",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpand(key)}
                        style={{
                          fontSize: "0.8rem",
                          marginLeft: "auto",
                          textDecoration: "underline",
                        }}
                      >
                        자세히 보기
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      {entry.media.map((m, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          {m.isVideo ? (
                            <video
                              src={m.previewUrl || m.url}
                              muted
                              loop
                              style={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                borderRadius: 8,
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <img
                              src={m.previewUrl || m.url}
                              style={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                borderRadius: 8,
                                objectFit: "cover",
                              }}
                            />
                          )}
                          {/* 🗑️ 개별 삭제 버튼 추가 */}
                          <div
                            style={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              cursor: "pointer",
                              padding: 4,
                              borderRadius: "50%",
                              backgroundColor: "#00000055",
                            }}
                            onClick={() => deletePhoto(key, idx)}
                          >
                            <FiTrash2 color="white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div
                onClick={() => handleFiUploadClick(key)}
                style={{
                  background: "#00000055",
                  color: "white",
                  padding: 8,
                  borderRadius: 8,
                  textAlign: "center",
                  marginTop: 10,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <FiUpload /> 사진/영상 추가
              </div>
            </motion.div>
          );
        })}

        {Object.keys(relationshipData).length < maxCards && (
          <div
            onClick={addNewCard}
            style={{
              border: "2px dashed #aaa",
              borderRadius: "16px",
              minHeight: "150px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              cursor: "pointer",
              color: "#aaa",
              padding: "10px",
              textAlign: "center",
              gap: 14,
            }}
          >
            <FiPlus size={24} />
            새로운 인연 추가하기
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
