"use client";
import { useRef, useState } from "react";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, firestore } from "../firebase/firebaseConfig";
import { FiUpload, FiTrash2, FiCheck, FiCheckCircle } from "react-icons/fi";
import { MAIN_THEME } from "../styles/colorConfig";
import { uploadGalleryImagesWithProgress } from "../utils/firebaseStorage";
import { useUnsavedChanges } from "../contexts/UnsavedChangesContext";
import { LargeFileDialog } from "../components/LargeFileDialog";

export default function ExperienceGallery({
  userId,
  initialData = [],
  handleSave,
}) {
  const [items, setItems] = useState(() =>
    initialData.map((it) => ({
      ...it,
      photos: it.photos || [],
    }))
  );
  console.log(items);
  const [selectedUploadIndex, setSelectedUploadIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const [uploadProgress, setUploadProgress] = useState(0); // 0~100
  const [largeFiles, setLargeFiles] = useState([]);
  const [showLargeFileDialog, setShowLargeFileDialog] = useState(false);

  const maxFileSize = 4 * 1024 * 1024;
  const fileInputRef = useRef(null);

  const addNewItem = () => {
    if (items.length >= 3) return;
    setItems([...items, { title: "", description: "", photos: [] }]);
    setHasUnsavedChanges(true);
  };

  const deleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateItem = (idx, key, val) => {
    const updated = [...items];
    updated[idx][key] = val;
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const handleFiUploadClick = (index) => {
    setSelectedUploadIndex(index);
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (selectedUploadIndex === null) return;

    const overSized = files.filter((f) => f.size > maxFileSize);
    const normalSized = files.filter((f) => f.size <= maxFileSize);
    console.log(overSized, normalSized);
    // 팝업용 상태 저장
    if (overSized.length > 0) {
      setLargeFiles(overSized);
      setShowLargeFileDialog(true);
    }

    const newPhotos = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      caption: "",
    }));

    const updated = [...items];
    updated[selectedUploadIndex].photos.push(...newPhotos);
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const handleCloseLargeFileDialog = () => {
    setShowLargeFileDialog(false);
    setLargeFiles([]);
  };

  const handleDeletePhoto = (itemIdx, photoIdx) => {
    const updated = [...items];
    updated[itemIdx].photos.splice(photoIdx, 1);
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const handleCaptionChange = (itemIdx, photoIdx, caption) => {
    const updated = [...items];
    updated[itemIdx].photos[photoIdx].caption = caption;
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const validate = () => {
    for (const it of items) {
      if (!it.title.trim() || !it.description.trim()) {
        alert("경험의 제목과 설명을 모두 입력해주세요.");
        return false;
      }
      if (it.photos.length === 0) {
        alert("각 경험에 최소 1개의 사진이나 동영상을 업로드해주세요.");
        return false;
      }
    }
    return true;
  };

  const onSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setSaveComplete(false);
    setUploadProgress(0);

    const newItems = [];
    const totalUploads = items.reduce(
      (sum, item) => sum + item.photos.filter((p) => p.file).length,
      0
    );

    let uploadedCount = 0;

    for (const [idx, item] of items.entries()) {
      const newPhotos = [];
      const newFiles = item.photos.filter((p) => p.file);
      const existingPhotos = item.photos.filter((p) => !p.file);

      let uploadedUrls = [];
      if (newFiles.length > 0) {
        const filesToUpload = newFiles.map((p) => p.file);

        uploadedUrls = await uploadGalleryImagesWithProgress(
          filesToUpload,
          userId,
          "experience",
          `item_${idx}`,
          (percent) => {
            uploadedCount += 1;
            setUploadProgress(Math.round((uploadedCount / totalUploads) * 100));
          }
        );
      }

      let uploadIdx = 0;
      for (const p of item.photos) {
        if (p.file) {
          console.log(uploadedUrls[uploadIdx]);
          newPhotos.push({
            url: uploadedUrls[uploadIdx],
            caption: p.caption,
          });
          uploadIdx++;
        } else {
          newPhotos.push({
            url: p.url,
            caption: p.caption,
          });
        }
      }

      newItems.push({
        title: item.title,
        description: item.description,
        photos: newPhotos,
      });
    }

    setItems(newItems);
    await handleSave(newItems);
    setIsSaving(false);
    setSaveComplete(true);
    setHasUnsavedChanges(false);
    setUploadProgress(0);
  };
  Object.entries(items)
            .reverse()
            .map(([it,i])=> {
              console.log(it, i)
            })

  return (
    <div style={{ padding: 20, color: "#fff" }}>
      {showLargeFileDialog && (
        <LargeFileDialog
          files={largeFiles}
          onClose={handleCloseLargeFileDialog}
        />
      )}

      <h3>
        살아오면서 겪었던 일중 <strong>기억에 남는 경험</strong>이 있나요?
      </h3>
      <h3>
        {" "}
        즐겁고 행복했던 일부터 힘들고 괴로웠던 일까지 무엇이든 괜찮아요. 당신의
        기억을 알려주세요.
      </h3>
      <div
        style={{
          margin: "20px 0px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {" "}
        <div
          style={{
            flex: 1,
          }}
        >
          {items.length < 3 && (
            <button
              onClick={addNewItem}
              disabled={items.length >= 3}
              style={{
                border: "1px solid #333",
                padding: "8px 16px",
                borderRadius: "10px",
                background: "#101010",
                cursor: items.length >= 3 ? "not-allowed" : "pointer",
                color: "#fff",
              }}
            >
              + 새로운 경험 추가
            </button>
          )}
        </div>
        {hasUnsavedChanges ? (
          <button
            onClick={onSave}
            style={{
              padding: "8px 16px",
              background: MAIN_THEME,
              borderRadius: "10px",
              color: "white",
            }}
          >
            저장
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#ccc",
            }}
          >
            <FiCheckCircle color={MAIN_THEME} />
            <span style={{ fontSize: "0.9rem", color: "#ccc" }}>
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
              height: "8px",
              background: "#ddd",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                background: MAIN_THEME,
                transition: "width 0.2s ease",
              }}
            />
          </div>
          <div style={{ fontSize: "0.75rem", color: "#555", marginTop: 4 }}>
            저장 중... {uploadProgress}%
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(max(30%, 200px), 1fr))",
            gap: 20,
          }}
        >
          {Object.entries(items)
            .reverse()
            .map(([i, it]) => (
              <div
                key={i}
                style={{
                  flex: "1 1 calc(30% - 20px)",
                  backgroundColor: "#56565611",
                  border: "1px solid #aaa",
                  borderRadius: "10px",
                  padding: "16px",
                  position: "relative",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    onClick={() => deleteItem(i)}
                    style={{
                      marginBottom: "10px",
                      display: "inline-flex",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                    }}
                  >
                    <FiTrash2 color="#fff" />
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    maxLength={20}
                    placeholder="경험 제목"
                    value={it.title}
                    onChange={(e) => updateItem(i, "title", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "10px",
                      outline: "0.1rem dashed #888",
                    }}
                  />
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "0.75rem",
                      color: "#999",
                    }}
                  >
                    {it.title.length}/20
                  </span>
                </div>

                <div style={{ position: "relative", marginTop: 8 }}>
                  <textarea
                    maxLength={60}
                    placeholder="설명"
                    rows={3}
                    value={it.description}
                    onChange={(e) =>
                      updateItem(i, "description", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "10px",
                      outline: "0.1rem dashed #888",
                    }}
                  />
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "0.75rem",
                      color: "#999",
                    }}
                  >
                    {it.description.length}/60
                  </span>
                </div>

                <div
                  onClick={() => handleFiUploadClick(i)}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.9rem",
                    color: "#fff",
                    cursor: "pointer",
                    marginTop: 10,
                    border: "1px solid #555",
                  }}
                >
                  <FiUpload /> 이미지/동영상 업로드
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {it.photos.map((photo, pi) => (
                    <div
                      key={pi}
                      style={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <img
                        src={photo.url}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        onClick={() => handleDeletePhoto(i, pi)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.5)",
                          borderRadius: "50%",
                          padding: 4,
                          cursor: "pointer",
                        }}
                      >
                        <FiTrash2 color="#fff" />
                      </div>
                      <input
                        value={photo.caption}
                        onChange={(e) =>
                          handleCaptionChange(i, pi, e.target.value)
                        }
                        placeholder="캡션"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          width: "100%",
                          border: "none",
                          borderTop: "1px solid #888",
                          padding: "4px 6px",
                          fontSize: "0.75rem",
                          color: "white",
                          backgroundColor: "rgba(0,0,0,0.5)",
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
