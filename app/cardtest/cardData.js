// cardData.js
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
import {
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import "./cardPage.css";

const DEFAULT_ITEMS = [
  {
    year: "2001",
    title: "출생",
    date: "2001.11.12",
    location: "경기도 성남시 분당구",
    description:
      "조용한 초겨울에 태어났다. 창밖의 빛과 그림자를 오래 바라보던 아이였고, 손에 닿는 것들의 질감을 유난히 또렷하게 기억했다.",
  },
  {
    year: "2006",
    title: "골목 관찰 노트",
    date: "2006.05.10",
    location: "분당 정자동",
    description:
      "창틀에 떨어진 그림자와 화분 잎맥을 따라 그리며 작은 공책을 채웠다. 사소한 변화를 적어 두면 마음이 차분해진다는 사실을 처음 배웠다.",
  },
  {
    year: "2009",
    title: "작은 도서관의 오후",
    date: "2009.09.03",
    location: "분당 중앙도서관",
    description:
      "창가에 앉아 사람들의 발자국 소리와 바람결을 문장으로 옮겼다. 이 날 이후의 기록은 일기를 넘어 작은 관찰 보고서가 되었다.",
  },
  {
    year: "2010",
    title: "해운대 여행",
    date: "2010.08.20",
    location: "부산 해운대",
    description:
      "처음 맞은 바닷바람에 눈이 시렸지만 파도 소리는 오래 남았다. 젖은 필름처럼 하루의 색이 마음에 천천히 새겨졌다.",
  },
];

export default function CardData() {
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
  const [image, setImage] = useState("/images/timeline/beach_image.jpg");

  const [items, setItems] = useState([]);
  const [yearColors, setYearColors] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const [isEditing, setIsEditing] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const [dbSaving, setDbSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const LS_KEY = "card_autosave_v2";
  const fileInputRef = useRef(null);

  const markDirty = () => {
    setIsDirty(true);
    setHasDraft(true);
    if (saveStatus === "saved") setSaveStatus("idle");
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const getDateMeta = (s) => {
    const m = s?.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    if (!m) return { line1: "", line2: "" };
    const [, y, mm] = m;
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
    return { line1: `${mm} - ${m[3]}`, line2: `${months[+mm - 1]} ${y}` };
  };

  const BIO_LIMIT = 350;
  const INTRO_PILL_COLOR = "#f28e8e";
  const introLabel = useMemo(
    () => (name?.trim() ? `${name.trim()}의 이야기` : "내 이야기"),
    [name]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const y = it.year || "0000";
      if (!map.has(y)) map.set(y, { year: y, events: [] });
      map.get(y).events.push(it);
    }
    return Array.from(map.values()).sort(
      (a, b) => Number(a.year) - Number(b.year)
    );
  }, [items]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
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
      }
    } catch {}
    setItems(DEFAULT_ITEMS);
    setYearColors(
      DEFAULT_ITEMS.reduce((acc, it) => {
        if (it.color) acc[it.year] = it.color;
        return acc;
      }, {})
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      try {
        const tl = await fetchTimeline(uid);
        if (tl && Array.isArray(tl)) {
          const flat = tl.flatMap((g) =>
            (g.events ?? []).map((ev) => ({ ...ev, year: g.year }))
          );
          if (flat.length) {
            setItems(flat);
            setYearColors(
              flat.reduce((acc, it) => {
                if (it.color && !acc[it.year]) acc[it.year] = it.color;
                return acc;
              }, {})
            );
          }
        }
      } catch {}
      setIsLoading(false);
    });
    return () => unsub();
  }, [image]);

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

  const handleImageChange = (e) => {
    if (!e.target.files?.length) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
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
        isCardCreated: true,
        cardUpdatedAt: serverTimestamp(),
      });
      await saveLifestorySection(uid, { motto: "", story: bio });
      await saveCardTimeline(uid, [], {}); // 타임라인 저장 로직 필요 시 교체
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
      <div className="container">
        <section className="board board--quad">
          <aside className="board-spine">
            {showQR && (
              <img className="spine-qr" src="/images/QRcode.svg" alt="QR" />
            )}
            <div className="spine-text">The Life Gallery</div>
          </aside>

          <div className="board-main board-main--with-timeline">
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
      </div>
    </div>
  );
}
