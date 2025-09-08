"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  saveCardTimeline,
  saveProfileSection,
  saveLifestorySection,
  fetchUserData,
  fetchTimeline,
} from "../utils/firebaseDb.js";
import { app, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import "./cardPage.css";
import { doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";

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

const DEFAULT_ITEMS: TimelineItem[] = [
  {
    year: "2001",
    title: "출생",
    date: "2001.08.23",
    location: "부산광역시 수영구",
    image: "/images/timeline/beach_image.jpg",
    description:
      "2001년 조용한 여름에 태어났다. 작은 화면 속 세계에 마음을 빼앗긴 그녀는 어린 시절부터 게임을 좋아했다.",
    color: "#f28e8e",
  },
  {
    year: "2006",
    title: "첫 자전거",
    date: "2006.06.10",
    location: "부산 수영강",
    image: "/images/timeline/born_image.jpeg",
    description: "넘어지고 또 일어나던 그날, 바람 냄새까지 생생하다.",
    color: "#f6b26b",
  },
  {
    year: "2010",
    title: "해운대 여행",
    date: "2010.08.20",
    location: "부산 해운대",
    image: "/images/timeline/beach_image.jpg",
    description: "첫 바닷바람. 오래 남는 파도 소리.",
    color: "#93c47d",
  },
];

const COLOR_OPTIONS = [
  "#111",
  "#e06666",
  "#f6b26b",
  "#f1c232",
  "#93c47d",
  "#6fa8dc",
  "#8e7cc3",
];

export default function Page() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [showQR] = useState(true);
  const [name, setName] = useState("최보현");
  const [birth, setBirth] = useState("2001.08.23");
  const [birthplace, setBirthplace] = useState("부산광역시 수영구");
  const [bio, setBio] = useState(
    "2001년 조용한 여름에 태어났다.\n작은 화면 속 세계에 마음을 빼앗긴 그녀는 어린 시절부터 게임을 좋아했다. 즐기는 데서 그치지 않고, 언젠가 자신만의 이야기를 만들겠다는 꿈을 키워왔다. 경험과 호기심을 무기로, 그녀는 천천히 그러나 확실하게 앞으로 나아간다. 누군가의 삶에 잔잔한 여운을 남길 수 있는 이야기를 만들고 싶다는 것이 그녀의 바람이다."
  );
  const [image, setImage] = useState<string>(
    "/images/timeline/beach_image.jpg"
  );

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [yearColors, setYearColors] = useState<{ [y: string]: string }>({});
  const [selectedEvent, setSelectedEvent] = useState<TimelineItem | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [dbSaving, setDbSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const LS_KEY = "card_autosave_v2";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const markDirty = () => {
    setIsDirty(true);
    setHasDraft(true);
    if (saveStatus === "saved") setSaveStatus("idle");
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const getDateMeta = (s?: string) => {
    const m = s?.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    if (!m) return { line1: "", line2: "" };
    const [, y, mm, dd] = m;
    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];
    return { line1: `${mm} - ${dd}`, line2: `${months[+mm - 1]} ${y}` };
  };

  /* 변수 : 생애문 글자제한*/
  const BIO_LIMIT = 350;
  const INTRO_PILL_COLOR = "#f28e8e";
  const introLabel = useMemo(
    () => (name?.trim() ? `${name.trim()}의 이야기` : "내 이야기"),
    [name]
  );

  const grouped: TimelineGroup[] = useMemo(() => {
    const map = new Map<string, TimelineGroup>();
    for (const it of items) {
      const y = it.year || "0000";
      if (!map.has(y)) map.set(y, { year: y, events: [] });
      map.get(y)!.events.push(it);
    }
    return Array.from(map.values()).sort(
      (a, b) => Number(a.year) - Number(b.year)
    );
  }, [items]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      setName(s.profile?.name ?? name);
      setBirth(s.profile?.birth ?? birth);
      setBirthplace(s.profile?.birthplace ?? birthplace);
      setImage(s.profile?.image ?? image);
      setBio(s.profile?.bio ?? bio);
      if (typeof s.lastSavedAt === "number") {
        setLastSavedAt(s.lastSavedAt);
        setSaveStatus("saved");
      }
    } catch {}
    // 초기 타임라인 기본값
    setItems(DEFAULT_ITEMS);
    setYearColors(
      DEFAULT_ITEMS.reduce((acc, it) => {
        if (it.color) acc[it.year] = it.color;
        return acc;
      }, {} as Record<string, string>)
    );
  }, []);

  // 인증 후 사용자 데이터 로드
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
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
        setImage(data.profile.profileImageUrl || image);
      }
      if (data?.lifestory) setBio(data.lifestory.story || "");

      // 필요 시 서버 타임라인 로드
      try {
        const tl = await fetchTimeline(uid);
        if (tl && Array.isArray(tl)) {
          // [{year, events:[...]}] 형태라면 평탄화
          const flat: TimelineItem[] = tl.flatMap((g: any) =>
            (g.events ?? []).map((ev: any) => ({ ...ev, year: g.year }))
          );
          if (flat.length) {
            setItems(flat);
            setYearColors(
              flat.reduce((acc, it) => {
                if (it.color && !acc[it.year]) acc[it.year] = it.color;
                return acc;
              }, {} as Record<string, string>)
            );
          }
        }
      } catch {
        // 실패 시 기본값 유지
      }

      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // 목록 준비 시 기본 선택
  useEffect(() => {
    if (!grouped.length) return;
    const g = grouped.find((x) => x.year === selectedYear) ?? grouped[0];
    if (selectedYear !== g.year) setSelectedYear(g.year);
    if (!selectedEvent || selectedEvent.year !== g.year) {
      setSelectedEvent(g.events[0] ?? null);
    }
  }, [grouped]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveDraft = async () => {
    try {
      setSaveStatus("saving");
      const payload = {
        profile: { name, birth, birthplace, image, bio },
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
    if (isDirty) await saveDraft();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      markDirty();
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSaveDB = async () => {
    setDbSaving(true);
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
      const db = getFirestore(app);
      const ref = doc(db, "users", uid);
      await updateDoc(ref, {
        isCardCreated:true,
        cardUpdatedAt:serverTimestamp()
      })
      await saveLifestorySection(uid, { motto: "", story: bio });
      await saveCardTimeline(uid, [], {} as any);
      alert("저장되었습니다.");
      setHasDraft(false);
    } finally {
      setDbSaving(false);
    }
  };

  const toggleEditPreview = async () => {
    if (isEditing) await autoSaveIfDirty();
    setIsEditing((v) => !v);
  };

  const cur = selectedEvent || null;
  const titleText = cur ? cur.title || name : name;
  const dateStr = cur ? cur.date : birth;
  const { line1, line2 } = getDateMeta(dateStr || "");

  return (
    <div className="body">
      <div className="header">
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
      </div>

      <div className="container">
        <section className="board board--quad">
          <aside className="board-spine">
            {showQR && (
              <img className="spine-qr" src="/images/QRcode.svg" alt="QR" />
            )}
            <div className="spine-text">The Life Gallery</div>
          </aside>

          <div className="board-main board-main--with-timeline">
            {/* 왼쪽: 포스터 본문 */}
            <div className="poster-col">
              <div className="rule-left" aria-hidden="true" />
              <div className="upper-grid">
                <figure className="photo">
                  <img src={cur?.image || image} alt="visual" />
                  {isEditing && (
                    <label className="btn-image-change photo-change">
                      변경
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </figure>

                <div className="rule-mid" aria-hidden="true" />

                <section className="meta">
                  {/* DATE */}
                  <div className="meta-field">
                    <div className="meta-label">DATE</div>
                    {isEditing ? (
                      <input
                        className="meta-input"
                        value={dateStr || ""}
                        onChange={(e) => {
                          if (cur) {
                            const v = e.target.value;
                            setSelectedEvent({
                              ...cur,
                              date: v,
                              year: v.match(/^\d{4}\./)
                                ? v.slice(0, 4)
                                : cur.year,
                            });
                            setItems((prev) =>
                              prev.map((it) =>
                                it === cur
                                  ? {
                                      ...it,
                                      date: v,
                                      year: v.match(/^\d{4}\./)
                                        ? v.slice(0, 4)
                                        : it.year,
                                    }
                                  : it
                              )
                            );
                          } else {
                            setBirth(e.target.value);
                          }
                          markDirty();
                        }}
                        placeholder="날짜(ex.2025.01.01)"
                      />
                    ) : (
                      <div className="meta-line">{dateStr}</div>
                    )}
                  </div>

                  {/* LOCATION */}
                  <div className="meta-field">
                    <div className="meta-label">LOCATION</div>
                    {isEditing ? (
                      <input
                        className="meta-input"
                        value={cur ? cur.location || "" : birthplace}
                        onChange={(e) => {
                          if (cur) {
                            setSelectedEvent({
                              ...cur,
                              location: e.target.value,
                            });
                            setItems((prev) =>
                              prev.map((it) =>
                                it === cur
                                  ? { ...it, location: e.target.value }
                                  : it
                              )
                            );
                          } else {
                            setBirthplace(e.target.value);
                          }
                          markDirty();
                        }}
                        placeholder="장소(ex.서울특별시 마포구)"
                      />
                    ) : (
                      <div className="meta-line">
                        {cur ? cur.location : birthplace}
                      </div>
                    )}
                  </div>

                  {/* BIO */}
                  {isEditing ? (
                    <>
                      <textarea
                        className="bio-input"
                        value={cur ? cur.description || "" : bio}
                        onChange={(e) => {
                          if (cur) {
                            setSelectedEvent({
                              ...cur,
                              description: e.target.value,
                            });
                            setItems((prev) =>
                              prev.map((it) =>
                                it === cur
                                  ? { ...it, description: e.target.value }
                                  : it
                              )
                            );
                          } else {
                            setBio(e.target.value);
                          }
                          markDirty();
                        }}
                        placeholder="이벤트와 관련된 내용을 상세히 입력해 주세요. (최대 350자)"
                        maxLength={BIO_LIMIT}
                      />
                      {/* 글자수 카운터 */}
                      <div
                        className={`char-counter ${
                          (cur ? (cur.description || "").length : bio.length) >=
                          BIO_LIMIT
                            ? "limit"
                            : (cur
                                ? (cur.description || "").length
                                : bio.length) >=
                              BIO_LIMIT - 30
                            ? "warn"
                            : ""
                        }`}
                      >
                        {cur ? (cur.description || "").length : bio.length} /{" "}
                        {BIO_LIMIT}
                      </div>
                    </>
                  ) : (
                    <div className="bio-text">
                      {cur ? cur.description : bio}
                    </div>
                  )}

                  {isEditing && selectedYear && (
                    <div className="inline-color-editor">
                      <div className="meta-label">YEAR TAB COLOR</div>
                      <div className="inline-color-swatches">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c}
                            className={`inline-color-swatch ${
                              yearColors[selectedYear] === c ? "active" : ""
                            }`}
                            style={{ backgroundColor: c }}
                            onClick={() => {
                              setYearColors((prev) => ({
                                ...prev,
                                [selectedYear]: c,
                              }));
                              markDirty();
                            }}
                            aria-label={`색상 ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="rule-bottom" aria-hidden="true" />
              <footer className="lower-row">
                <h1 className="poster-title">{titleText}</h1>
                <div className="poster-date">
                  <div className="d1">{line1}</div>
                  <div className="d2">{line2}</div>
                </div>
              </footer>
            </div>
          </div>
        </section>
        <aside className="timeline-rail" aria-label="timeline tabs">
          <div className="timeline-rail__scroll">
            <button
              className={`tl-pill ${selectedEvent === null ? "active" : ""}`}
              style={{ background: INTRO_PILL_COLOR }}
              onClick={async () => {
                await autoSaveIfDirty();
                setSelectedYear(null);
                setSelectedEvent(null); // ⇒ 프로필(자기소개) 화면
              }}
              title={introLabel}
            >
              <span className="tl-pill__label">
                <span className="tl-pill__year">{introLabel}</span>
              </span>
            </button>

            {grouped.map((g) => {
              const active = selectedYear === g.year;
              const bg = yearColors[g.year] || "#6fa8dc";
              const firstTitle = g.events?.[0]?.title || "";
              return (
                <button
                  key={g.year}
                  className={`tl-pill ${active ? "active" : ""}`}
                  style={{ backgroundColor: bg }}
                  onClick={async () => {
                    await autoSaveIfDirty();
                    setSelectedYear(g.year);
                    setSelectedEvent(g.events?.[0] ?? null);
                  }}
                  title={`${g.year} ${firstTitle}`}
                >
                  <span className="tl-pill__label">
                    <span className="tl-pill__year">{g.year}</span>
                    {firstTitle && (
                      <span className="tl-pill__title">{firstTitle}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <div className="buttons buttons-row">
        <button onClick={toggleEditPreview} className="btn-preview btn-large">
          {isEditing ? "미리보기" : "편집하기"}
        </button>

        {isEditing && (
          <div className="btn-stack">
            <button
              onClick={handleSaveDB}
              className="btn-edit btn-large"
              disabled={!hasDraft || dbSaving}
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
    </div>
  );
}
