"use client";
import { useRef, useState } from "react";
import { uploadGalleryImagesWithProgress } from "../utils/firebaseStorage";
import { FiCheckCircle, FiTrash2, FiUpload } from "react-icons/fi";
import { MAIN_THEME } from "../styles/colorConfig";
import { useUnsavedChanges } from "../contexts/UnsavedChangesContext";
import { LargeFileDialog } from "../components/LargeFileDialog";

const MAX_IMAGES = 30;

export default function ChildhoodGallery({
  userId,
  initialData = [],
  handleSave,
}) {
  const [images, setImages] = useState(initialData ? initialData : []);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();

  const [largeFiles, setLargeFiles] = useState([]);
  const [showLargeFileDialog, setShowLargeFileDialog] = useState(false);

  const fileInputRef = useRef();
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const remainingSlots = MAX_IMAGES - images.length;

    let filesToAdd = selectedFiles;

    if (selectedFiles.length > remainingSlots) {
      alert("최대 30장까지 선택할 수 있어요.");
      filesToAdd = selectedFiles.slice(0, remainingSlots);
    }

    const overSized = filesToAdd.filter((f) => f.size > 4 * 1024 * 1024);

    if (overSized.length > 0) {
      setLargeFiles(overSized);
      setShowLargeFileDialog(true);
    }

    const newImages = filesToAdd.map((file) => ({
      file,
      caption: "",
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    setHasUnsavedChanges(true);
  };

  const handleCaptionChange = (index, caption) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    setImages(newImages);
    setHasUnsavedChanges(true);
  };

  const handleDelete = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    setHasUnsavedChanges(true);
  };

  const handleCloseLargeFileDialog = () => {
    setShowLargeFileDialog(false);
    setLargeFiles([]);
  };

  const onSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);

    const localFiles = images.filter((img) => img.file);
    const existing = images.filter((img) => !img.file);

    const urls = await uploadGalleryImagesWithProgress(
      localFiles.map((img) => img.file),
      userId,
      "childhood",
      "default",
      (percent) => {
        setUploadProgress(percent);
      }
    );

    const savedImages = [
      ...existing,
      ...urls.map((url, idx) => ({
        url,
        caption: localFiles[idx].caption,
      })),
    ];

    await handleSave(savedImages);
    setIsSaving(false);
    setUploadProgress(100);
    setHasUnsavedChanges(false);
  };

  const isUploadDisabled = images.length >= MAX_IMAGES;

  return (
    <div style={{ padding: "16px", color: "#fff" }}>
      {showLargeFileDialog && (
        <LargeFileDialog
          files={largeFiles}
          onClose={handleCloseLargeFileDialog}
        />
      )}

      <h3 style={{}}>
        함께 공유하고 싶은 유년시절 사진을 올려주세요. 최대 {MAX_IMAGES}장까지
        올릴 수 있어요.
      </h3>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "20px 0px",
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
          }}
        >
          <div
            onClick={() => !isUploadDisabled && fileInputRef.current?.click()}
            style={{
              background: isUploadDisabled ? "#999" : "rgba(0,0,0,0.5)",
              padding: "10px 20px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9rem",
              color: "#fff",
              cursor: isUploadDisabled ? "not-allowed" : "pointer",
              border: "1px solid #555",
              opacity: isUploadDisabled ? 0.6 : 1,
            }}
          >
            <FiUpload /> 이미지/동영상 업로드
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "end",
              gap: 10,
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                color: "#555",
                alignSelf: "flex-end",
              }}
            >
              ({images.length}/{MAX_IMAGES})
            </span>

            {hasUnsavedChanges ? (
              <button
                onClick={onSave}
                style={{
                  padding: "8px 16px",
                  background: MAIN_THEME,
                  color: "white",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  opacity: isSaving ? 0.5 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  alignSelf: "flex-end",
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
                  gap: 8,
                  color: "#555",
                  alignSelf: "flex-end",
                }}
              >
                <FiCheckCircle color={MAIN_THEME} />
                <span style={{ fontSize: "0.9rem", color: "#888" }}>
                  모든 변경사항이 저장되었습니다
                </span>
              </div>
            )}
          </div>
        </div>
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
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              backgroundImage: `url(${img.preview || img.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                color: "white",
                backgroundColor: "#0006",
                borderRadius: "50%",
                padding: "4px",
                cursor: "pointer",
              }}
            >
              <FiTrash2 onClick={() => handleDelete(idx)} />
            </div>
            <input
              value={img.caption}
              onChange={(e) => handleCaptionChange(idx, e.target.value)}
              placeholder="캡션 입력"
              style={{
                width: "100%",
                border: "none",
                borderTop: "1px solid #888",
                padding: "4px 6px",
                fontSize: "0.75rem",
                color: "white",
                borderRadius: "0 0 5px 5px",
                backgroundColor: "rgba(0,0,0,0.5)",
                outline: "none",
                textAlign: "left",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
