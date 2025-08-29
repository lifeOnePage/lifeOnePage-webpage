"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  saveCardTimeline,
  saveProfileSection,
  saveLifestorySection,
  fetchUserData,
  fetchTimeline,
} from "../utils/firebaseDb.js";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import "./cardPage.css";

type TimelineItem = {
  year: string;
  title: string;
  image?: string;
  date?: string;
  location?: string;
  description?: string;
  color?: string;
  isUpdated?: boolean;
  isImageUpdated?: boolean;
  file?: File;
};

type TimelineGroup = {
  year: string;
  events: TimelineItem[];
};

export default function Page() {
  const router = useRouter();

  // ---------- states ----------
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false); // 모바일 전용 편집 모달

  const [yearColors, setYearColors] = useState<{ [year: string]: string }>({});

  const [isEditing, setIsEditing] = useState(true); // 데스크톱 인라인 편집용
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineItem | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(true);

  const [name, setName] = useState("강해린");
  const [ename, setEname] = useState("Kang Haerin");
  const [birth, setBirth] = useState("2006.05.15");
  const [birthplace, setBirthplace] = useState("서울특별시 동작구");
  const [bio, setBio] = useState(
    "강해린은 2006년 어느 조용한 계절에 태어났다.\n말수는 적지만, 무대 위에 서면 누구보다 진심이 깊은 사람이다.\n뉴진스로 데뷔한 후, 투명한 눈빛과 섬세한 감정으로 많은 이들의 마음에 잔잔한 물결을 일으켰다.\n물결을 넘어서, 오래도록 마음에 남는 사람이 되는 것이 그녀의 바람이다."
  );
  const [image, setImage] = useState<string | null>("/images/profile.jpg");

  const colorOptions = [
    "black",
    "#e06666",
    "#f6b26b",
    "#f1c232",
    "#93c47d",
    "#6fa8dc",
    "#8e7cc3",
  ];

  const [items, setItems] = useState<TimelineItem[]>([
    {
      year: "2006",
      title: "출생",
      date: "2006.05.15",
      location: "서울특별시 동작구",
      image: "/images/timeline/born_image.jpeg",
      description:
        "2006년 5월 15일, 서울특별시 동작구에서 태어났다.\n이후 가족과 함께 경기도 안양시 동안구 평촌동으로 이사하며 유년 시절을 보냈다.\n집 근처 작은 놀이터에서 친구들과 뛰어놀던 시간이 가장 큰 즐거움이었다. 활발하고 호기심 많은 성격으로 성장했다.",
    },
    {
      year: "2010",
      title: "처음 본 바다",
      date: "2010.08.20",
      location: "부산 해운대",
      image: "/images/timeline/beach_image.jpg",
      description:
        "가족과 함께한 첫 바닷가 여행은 어린 마음에 깊은 파장을 남겼다.",
    },
  ]);
  const [input, setInput] = useState<TimelineItem>({ year: "", title: "" });

  // === 자동저장 ===
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [dbSaving, setDbSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const LS_KEY = "card_autosave_v1";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------- helpers ----------
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };
  const markDirty = () => {
    setIsDirty(true);
    setHasDraft(true);
    if (saveStatus === "saved") setSaveStatus("idle");
  };

  // ---------- 모바일 판별 ----------
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ---------- 로컬 복구 ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      setName(snap.profile?.name ?? name);
      setBirth(snap.profile?.birth ?? birth);
      setBirthplace(snap.profile?.birthplace ?? birthplace);
      setImage(snap.profile?.image ?? image);
      setEname(snap.profile?.ename ?? ename);
      setBio(snap.profile?.bio ?? bio);
      if (Array.isArray(snap.items)) setItems(snap.items);
      if (snap.yearColors && typeof snap.yearColors === "object")
        setYearColors(snap.yearColors);
      if (typeof snap.lastSavedAt === "number") {
        setLastSavedAt(snap.lastSavedAt);
        setSaveStatus("saved");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 로컬 저장 ----------
  const saveDraft = async () => {
    try {
      setSaveStatus("saving");
      const payload = {
        profile: { name, birth, birthplace, image, ename, bio },
        items,
        yearColors,
        lastSavedAt: Date.now(),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
      setLastSavedAt(payload.lastSavedAt);
      setSaveStatus("saved");
      setIsDirty(false);
    } catch {
      setSaveStatus("error");
    }
  };
  const autoSaveIfDirty = async () => {
    if (!isDirty) return;
    await saveDraft();
  };

  // ---------- 보기/편집 진입 ----------
  const enterPreview = async () => {
    await autoSaveIfDirty();
    if (isMobile) {
      setEditModalOpen(false); // 모바일은 모달만 닫기
    } else {
      setIsEditing(false);
    }
  };
  const enterEdit = () => {
    if (isMobile) {
      setEditModalOpen(true); // 모바일은 모달 오픈
    } else {
      setIsEditing(true);
    }
  };

  // ---------- 새 이벤트 ----------
  const handleAdd = () => {
    if (isMobile ? !editModalOpen : !isEditing) return; // 편집 중에만 추가
    if (!input.year || !input.title) return;
    if (input.title.length > 10)
      return alert("제목은 10자 이하로 입력해주세요.");
    setItems((prev) => [...prev, input]);
    setInput({ year: "", title: "" });
    setIsAdding(false);
    markDirty();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") setIsAdding(false);
  };

  // ---------- 이미지 ----------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      markDirty();
    };
    reader.readAsDataURL(file);
  };
  const handleEventImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    event: TimelineItem
  ) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedEvent = { ...event, image: reader.result as string };
      setSelectedEvent(updatedEvent);
      setItems((prev) =>
        prev.map((item) =>
          item.year === event.year && item.title === event.title
            ? updatedEvent
            : item
        )
      );
      markDirty();
    };
    reader.readAsDataURL(file);
  };

  // ---------- 저장(DB) ----------
  const handleSave = async () => {
    setDbSaving(true);

    if (selectedEvent) {
      setItems((prev) =>
        prev.map((item) =>
          item.year === selectedEvent.year && item.title === selectedEvent.title
            ? selectedEvent
            : item
        )
      );
    }

    const updatedItems = items.map((item) => ({ ...item, isUpdated: true }));
    const groupsMap = new Map<string, TimelineItem[]>();
    for (const item of updatedItems) {
      if (!groupsMap.has(item.year)) groupsMap.set(item.year, []);
      groupsMap.get(item.year)!.push(item);
    }
    const years = Array.from(groupsMap.keys());
    const groups = Object.fromEntries(groupsMap);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("로그인이 필요합니다.");
      setDbSaving(false);
      return;
    }

    try {
      await saveProfileSection(uid, {
        name,
        birthDate: birth,
        birthPlace: birthplace,
        profileImageUrl: image,
      });
      await saveLifestorySection(uid, { motto: ename, story: bio });
      await saveCardTimeline(uid, years, groups);
      alert("저장되었습니다.");
      setHasDraft(false);
    } finally {
      setDbSaving(false);
    }
  };

  // ---------- 삭제 ----------
  const handleDelete = () => {
    if (!selectedEvent) return;
    if (!window.confirm("이 이벤트를 삭제하시겠습니까?")) return;
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.year === selectedEvent.year &&
            item.title === selectedEvent.title
          )
      )
    );
    setSelectedEvent(null);
    markDirty();
  };

  // ---------- 필드 업데이트 ----------
  const updateEventField = (field: keyof TimelineItem, value: string) => {
    if (!selectedEvent) return;
    if (field === "title" && value.length > 10) {
      alert("제목은 10자 이하로 입력해주세요.");
      return;
    }
    let updated = { ...selectedEvent, [field]: value };
    if (field === "date" && /^\d{4}\.\d{2}\.\d{2}$/.test(value)) {
      const extractedYear = value.slice(0, 4);
      updated.year = extractedYear;
      setSelectedYear(extractedYear);
    }
    setSelectedEvent(updated);
    setItems((prev) =>
      prev.map((item) =>
        item.year === selectedEvent.year && item.title === selectedEvent.title
          ? updated
          : item
      )
    );
    markDirty();
  };

  // ---------- 그룹 ----------
  const grouped = (() => {
    const map = new Map<string, TimelineGroup>();
    for (const item of items) {
      if (!map.has(item.year))
        map.set(item.year, { year: item.year, events: [] });
      map.get(item.year)!.events.push(item);
    }
    return Array.from(map.values()).sort(
      (a, b) => Number(a.year) - Number(b.year)
    );
  })();

  // ---------- 스크롤(그대로) ----------
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setAtTop(window.scrollY <= 10);
      const vh = window.innerHeight;
      setAtBottom(window.scrollY >= document.body.scrollHeight - vh - 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---------- Auth + 타임라인 ----------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      const uid = user.uid;
      const data = await fetchUserData(uid);

      if (data?.profile) {
        setName(data.profile.name || "");
        setBirth(data.profile.birthDate || "");
        setBirthplace(data.profile.birthPlace || "");
        setImage(data.profile.profileImageUrl || null);
      }
      if (data?.lifestory) {
        setBio(data.lifestory.story || "");
        setEname(data.lifestory.motto || "");
      }

      const rawGroups = await fetchTimeline(uid);
      const resolved = await Promise.all(rawGroups);
      const timelineGroups: { year: string; events: TimelineItem[] }[] =
        resolved.map((g: any) => {
          const year = g?.id ?? "";
          const events = Object.values(g).filter(
            (v: any) => v && typeof v === "object" && "title" in v
          ) as TimelineItem[];
          const fixedEvents = events.map((it) => ({
            year: it.year || year,
            ...it,
          }));
          return { year, events: fixedEvents };
        });

      const allItems = timelineGroups.flatMap((group) => group.events);
      if (allItems.length) setItems(allItems);

      const colors: { [y: string]: string } = {};
      for (const g of timelineGroups) {
        const found = g.events.find((e) => (e as any).color);
        if (found?.color) colors[g.year] = (found as any).color as string;
      }
      setYearColors(colors);

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 데스크톱 인라인 편집 여부
  const isInlineEditing = !isMobile && isEditing;

  // 모바일 미리보기/편집 버튼 라벨
  const previewBtnLabel = isMobile
    ? editModalOpen
      ? "닫기"
      : "편집하기"
    : isEditing
    ? "미리보기"
    : "편집하기";

  return (
    <div className="body">
      {/* Header */}
      {/* <div className="header">
        {isLoggedIn ? (
          <>
            <button
              className="mypage-btn"
              onClick={() => router.push("/mypage")}
            >
              마이페이지
            </button>
            <button className="logout-btn" onClick={() => setIsLoggedIn(false)}>
              로그아웃
            </button>
          </>
        ) : (
          <button className="login-btn" onClick={() => setIsLoggedIn(true)}>
            로그인
          </button>
        )}
      </div> */}

      <div className="container">
        {/* Tabs */}
        <div className="timeline-header">
          <button
            className={`main-btn ${!selectedEvent ? "active" : ""}`}
            onClick={async () => {
              await autoSaveIfDirty();
              setSelectedEvent(null);
              setSelectedYear(null);
            }}
          >
            {name}의 이야기
          </button>

          {grouped.map((group) => {
            const isActiveGroup = selectedYear === group.year;
            const groupColor = yearColors[group.year] ?? "white";
            const isColored = groupColor !== "white";
            return (
              <div
                key={group.year}
                className={`year-group ${isActiveGroup ? "active" : ""}`}
              >
                <div
                  className="year-wrapper"
                  style={{
                    backgroundColor: groupColor,
                    borderColor: isColored ? groupColor : "var(--line)",
                  }}
                >
                  <div
                    className={`year-label ${isActiveGroup ? "active" : ""}`}
                    style={{
                      backgroundColor: "transparent",
                      color: isColored ? "white" : "black",
                    }}
                  >
                    {group.year}
                  </div>

                  {group.events.map((event, i) => {
                    const isActiveEvent =
                      selectedEvent?.title === event.title &&
                      selectedEvent?.year === group.year;
                    return (
                      <button
                        key={i}
                        className={`event-btn ${isActiveEvent ? "active" : ""}`}
                        style={
                          isColored
                            ? {
                                backgroundColor: "transparent",
                                color: "white",
                                borderLeftColor: "transparent",
                              }
                            : {
                                backgroundColor: isActiveEvent
                                  ? event.color || "black"
                                  : "white",
                                color: isActiveEvent ? "white" : "black",
                                borderColor: event.color || "var(--line)",
                              }
                        }
                        onClick={async () => {
                          await autoSaveIfDirty();
                          setSelectedEvent(event);
                          setSelectedYear(group.year);
                        }}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(isInlineEditing || editModalOpen) &&
            (isAdding ? (
              <div className="add-section">
                <input
                  placeholder="연도"
                  value={input.year}
                  onChange={(e) => setInput({ ...input, year: e.target.value })}
                  onKeyDown={handleKeyDown}
                />
                <input
                  maxLength={10}
                  placeholder="내용"
                  value={input.title}
                  onChange={(e) =>
                    setInput({ ...input, title: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                />
                <button className="btn-add" onClick={handleAdd}>
                  추가
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setIsAdding(false)}
                >
                  ×
                </button>
              </div>
            ) : (
              <button className="btn-plus" onClick={() => setIsAdding(true)}>
                ＋
              </button>
            ))}
        </div>

        {/* Card */}
        <div className="card-container">
          <div className="window-card square-tl">
            {/* ← 왼쪽상단 네모가 필요 없으면 square-tl 지워도 OK */}
            {/* 윈도우 상단 바 */}
            {/* 본문 */}
            <div className="window-body">
              <div
                className={`profile-section ${
                  selectedEvent ? "with-event" : ""
                }`}
              >
                {/* 이미지 */}
                <div className="image-box">
                  <img
                    src={selectedEvent ? selectedEvent.image || image! : image!}
                    alt="Profile"
                  />
                  {(isInlineEditing || (isMobile && editModalOpen)) && (
                    <label className="btn-image-change">
                      변경
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          selectedEvent
                            ? handleEventImageChange(e, selectedEvent)
                            : handleImageChange(e)
                        }
                      />
                    </label>
                  )}
                </div>

                {/* 디테일 */}
                <div className="details-box">
                  {isInlineEditing && selectedEvent && (
                    <button
                      className="trash-floating"
                      onClick={handleDelete}
                      aria-label="삭제"
                      title="이 이벤트 삭제"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18" />
                        <path d="M9 6V4h6v2" />
                        <rect
                          x="5"
                          y="6"
                          width="14"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  )}

                  {isInlineEditing ? (
                    <>
                      <div className="field-with-icon">
                        <input
                          placeholder="제목"
                          className="input-field-name"
                          value={selectedEvent ? selectedEvent.title : name}
                          onChange={(e) =>
                            selectedEvent
                              ? updateEventField("title", e.target.value)
                              : (setName(e.target.value), markDirty())
                          }
                        />
                      </div>
                      <input
                        placeholder="날짜 (예: 2010.08.20)"
                        className="input-field"
                        value={selectedEvent ? selectedEvent.date || "" : birth}
                        onChange={(e) =>
                          selectedEvent
                            ? updateEventField("date", e.target.value)
                            : (setBirth(e.target.value), markDirty())
                        }
                      />
                      <input
                        placeholder="장소"
                        className="input-field"
                        value={
                          selectedEvent
                            ? selectedEvent.location || ""
                            : birthplace
                        }
                        onChange={(e) =>
                          selectedEvent
                            ? updateEventField("location", e.target.value)
                            : (setBirthplace(e.target.value), markDirty())
                        }
                      />
                      <textarea
                        placeholder="해당 이벤트에 대한 자세한 설명을 적어보세요.(최대 350자)"
                        className="textarea-field"
                        value={
                          selectedEvent ? selectedEvent.description || "" : bio
                        }
                        onChange={(e) => {
                          if (selectedEvent) {
                            if (e.target.value.length <= 350) {
                              updateEventField("description", e.target.value);
                            }
                          } else {
                            setBio(e.target.value);
                            markDirty();
                          }
                        }}
                      />
                      <p className="char-count">
                        {(selectedEvent
                          ? selectedEvent.description?.length || 0
                          : bio.length) + " / 350"}
                      </p>

                      {selectedYear && (
                        <div className="inline-color-editor">
                          <div className="inline-color-header">
                            연도 색상 ({selectedYear})
                          </div>
                          <div className="inline-color-swatches">
                            {[
                              "black",
                              "#e06666",
                              "#f6b26b",
                              "#f1c232",
                              "#93c47d",
                              "#6fa8dc",
                              "#8e7cc3",
                            ].map((c) => {
                              const active =
                                (yearColors[selectedYear] || "black") === c;
                              return (
                                <button
                                  key={c}
                                  className={`inline-color-swatch${
                                    active ? " active" : ""
                                  }`}
                                  style={{ backgroundColor: c }}
                                  aria-label={`색상 ${c}`}
                                  title={c}
                                  onClick={() => {
                                    setYearColors((prev) => ({
                                      ...prev,
                                      [selectedYear]: c,
                                    }));
                                    if (selectedEvent) {
                                      const updated = {
                                        ...selectedEvent,
                                        color: c,
                                      };
                                      setSelectedEvent(updated);
                                      setItems((prev) =>
                                        prev.map((it) =>
                                          it.year === selectedEvent.year &&
                                          it.title === selectedEvent.title
                                            ? updated
                                            : it
                                        )
                                      );
                                    }
                                    markDirty();
                                  }}
                                />
                              );
                            })}
                          </div>
                          <p className="inline-color-hint">
                            연도 탭 배경/강조 색이 함께 변경됩니다.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h1 className="title">
                        {selectedEvent ? selectedEvent.title : name}
                      </h1>
                      <p className="subtitle">
                        {selectedEvent ? selectedEvent.date : birth}
                      </p>
                      <p className="subtitle">
                        {selectedEvent ? selectedEvent.location : birthplace}
                      </p>
                      <p className="description">
                        {selectedEvent ? selectedEvent.description : bio}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* 워터마크 & QR */}
              {isInlineEditing ? (
                <input
                  className="watermark-editing"
                  value={ename}
                  onChange={(e) => {
                    setEname(e.target.value);
                    markDirty();
                  }}
                />
              ) : (
                <div className="watermark">{ename}</div>
              )}

              <div className="qr-section">
                {(isInlineEditing || (isMobile && editModalOpen === false)) &&
                  selectedEvent === null && (
                    <button
                      className="btn-qr"
                      onClick={() => setShowQR((prev) => !prev)}
                    >
                      {showQR ? "QR 숨기기" : "QR 보이기"}
                    </button>
                  )}
                {showQR && (
                  <div className="qr-box">
                    <img src="/images/QRcode.svg" alt="QR Code" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="buttons buttons-row">
        <button
          onClick={() =>
            isMobile
              ? editModalOpen
                ? enterPreview()
                : enterEdit()
              : isEditing
              ? enterPreview()
              : enterEdit()
          }
          className="btn-preview btn-large"
        >
          {previewBtnLabel}
        </button>

        {(isInlineEditing || isMobile) && (
          <div className="btn-stack">
            <button
              onClick={handleSave}
              className="btn-edit btn-large"
              disabled={!hasDraft || dbSaving}
              title={!hasDraft ? "변경 사항이 없습니다" : "저장되었습니다."}
            >
              저장
            </button>
            <div
              className={`save-hint ${
                saveStatus === "saving"
                  ? "saving"
                  : saveStatus === "saved"
                  ? "saved"
                  : saveStatus === "error"
                  ? "error"
                  : ""
              }`}
            >
              {saveStatus === "saving" && "자동저장 중…"}
              {saveStatus === "saved" &&
                `자동저장됨 · ${lastSavedAt ? formatTime(lastSavedAt) : ""}`}
              {saveStatus === "error" && "자동저장 실패"}
              {saveStatus === "idle" && (isDirty ? "수정 중" : "대기")}
            </div>
          </div>
        )}
      </div>

      {/* ================= 모바일 편집 모달 ================= */}
      {isMobile && editModalOpen && (
        <div className="modal-backdrop" onClick={enterPreview}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {selectedEvent ? "이벤트 편집" : "프로필 편집"}
              </div>
              <button
                className="modal-close"
                onClick={enterPreview}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* 휴지통 (모바일은 모달 상단에) */}
              {selectedEvent && (
                <button
                  className="trash-floating"
                  onClick={handleDelete}
                  aria-label="삭제"
                  title="이 이벤트 삭제"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18" />
                    <path d="M9 6V4h6v2" />
                    <rect x="5" y="6" width="14" height="14" rx="2" ry="2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              )}

              <div className="modal-fields">
                <label className="modal-label">제목</label>
                <input
                  placeholder="제목"
                  className="input-field-name"
                  value={selectedEvent ? selectedEvent.title : name}
                  onChange={(e) =>
                    selectedEvent
                      ? updateEventField("title", e.target.value)
                      : (setName(e.target.value), markDirty())
                  }
                />

                <label className="modal-label">날짜</label>
                <input
                  placeholder="예: 2010.08.20"
                  className="input-field"
                  value={selectedEvent ? selectedEvent.date || "" : birth}
                  onChange={(e) =>
                    selectedEvent
                      ? updateEventField("date", e.target.value)
                      : (setBirth(e.target.value), markDirty())
                  }
                />

                <label className="modal-label">장소</label>
                <input
                  placeholder="장소"
                  className="input-field"
                  value={
                    selectedEvent ? selectedEvent.location || "" : birthplace
                  }
                  onChange={(e) =>
                    selectedEvent
                      ? updateEventField("location", e.target.value)
                      : (setBirthplace(e.target.value), markDirty())
                  }
                />

                <label className="modal-label">설명</label>
                <textarea
                  placeholder="해당 이벤트에 대한 자세한 설명을 적어보세요.(최대 350자)"
                  className="textarea-field"
                  value={selectedEvent ? selectedEvent.description || "" : bio}
                  onChange={(e) => {
                    if (selectedEvent) {
                      if (e.target.value.length <= 350) {
                        updateEventField("description", e.target.value);
                      }
                    } else {
                      setBio(e.target.value);
                      markDirty();
                    }
                  }}
                />
                <p className="char-count">
                  {(selectedEvent
                    ? selectedEvent.description?.length || 0
                    : bio.length) + " / 350"}
                </p>

                {/* 연도 색상 팔레트 */}
                {selectedYear && (
                  <div className="inline-color-editor">
                    <div className="inline-color-header">
                      연도 색상 ({selectedYear})
                    </div>
                    <div className="inline-color-swatches">
                      {colorOptions.map((c) => {
                        const active =
                          (yearColors[selectedYear] || "black") === c;
                        return (
                          <button
                            key={c}
                            className={`inline-color-swatch${
                              active ? " active" : ""
                            }`}
                            style={{ backgroundColor: c }}
                            aria-label={`색상 ${c}`}
                            title={c}
                            onClick={() => {
                              setYearColors((prev) => ({
                                ...prev,
                                [selectedYear]: c,
                              }));
                              if (selectedEvent) {
                                const updated = { ...selectedEvent, color: c };
                                setSelectedEvent(updated);
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it.year === selectedEvent.year &&
                                    it.title === selectedEvent.title
                                      ? updated
                                      : it
                                  )
                                );
                              }
                              markDirty();
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="inline-color-hint">
                      연도 탭 배경/강조 색이 함께 변경됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-preview btn-large" onClick={enterPreview}>
                완료
              </button>
              <button
                className="btn-edit btn-large"
                onClick={handleSave}
                disabled={!hasDraft || dbSaving}
                title={!hasDraft ? "변경 사항이 없습니다" : "DB에 저장"}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
