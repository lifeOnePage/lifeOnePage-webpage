"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import "./cardPage.css";

type TimelineItem = {
  year: string;
  title: string;
  image?: string;
  date?: string;
  location?: string;
  description?: string;
  color?: string;
};

type TimelineGroup = {
  year: string;
  events: TimelineItem[];
};

import FloatingToolbar from "../components/FloatingToolBar";

export default function Page() {
  const router = useRouter();

  // 임시로 로그인/아웃을 관리하기 위한 상태
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const [isEditing, setIsEditing] = useState(true);
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

  // 추가 로직
  const handleAdd = () => {
    if (!input.year || !input.title) return;
    if (input.title.length > 10) {
      alert("제목은 10자 이하로 입력해주세요.");
      return;
    }
    setItems((prev) => [...prev, input]);
    setInput({ year: "", title: "" });
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") setIsAdding(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEventImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    event: TimelineItem
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
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
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (selectedEvent) {
      setItems((prev) =>
        prev.map((item) =>
          item.year === selectedEvent.year && item.title === selectedEvent.title
            ? selectedEvent
            : item
        )
      );
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    const confirmDelete = window.confirm("이 이벤트를 삭제하시겠습니까?");
    if (confirmDelete) {
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
      setIsEditing(false);
    }
  };

  const updateEventField = (field: keyof TimelineItem, value: string) => {
    if (!selectedEvent) return;
    if (field === "title" && value.length > 10) {
      alert("제목은 10자 이하로 입력해주세요.");
      return;
    }

    const updated = { ...selectedEvent, [field]: value };
    setSelectedEvent(updated);
    setItems((prev) =>
      prev.map((item) =>
        item.year === selectedEvent.year && item.title === selectedEvent.title
          ? updated
          : item
      )
    );
  };

  const grouped = (() => {
    const map = new Map<string, TimelineGroup>();
    for (const item of items) {
      if (!map.has(item.year))
        map.set(item.year, { year: item.year, events: [] });
      map.get(item.year)?.events.push(item);
    }
    return Array.from(map.values()).sort(
      (a, b) => Number(a.year) - Number(b.year)
    );
  })();

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

  const handleScrollUp = () => {
    const vh = window.innerHeight;
    const current = window.scrollY;
    const target = Math.max(0, Math.floor(current / vh - 1) * vh);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  const handleScrollDown = () => {
    const vh = window.innerHeight;
    const current = window.scrollY;
    const maxHeight = document.body.scrollHeight;
    const target = Math.min(maxHeight, Math.ceil(current / vh + 1) * vh);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <div className="body">
      {/* <FloatingToolbar
        onScrollUp={handleScrollUp}
        onScrollDown={handleScrollDown}
        isTop={atTop}
        isBottom={atBottom}
        onSaveAll={() => console.log("저장")}
        onLogout={() => console.log("로그아웃")}
        isPreview={false}
        setIsPreview={() => {}}
      /> */}
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
        {/* Timeline */}
        <div className="timeline-header">
          <button
            className={`main-btn ${!selectedEvent ? "active" : ""}`}
            onClick={() => {
              setSelectedEvent(null);
              setSelectedYear(null);
              setIsEditing(false);
            }}
          >
            {name}의 이야기
          </button>
          {grouped.map((group) => {
            const selectedInGroup = group.events.find(
              (e) =>
                selectedEvent?.title === e.title &&
                selectedEvent?.year === group.year
            );
            const yearColor = selectedInGroup?.color || "black";

            return (
              <div key={group.year} className="year-group">
                <div className="year-wrapper">
                  <div
                    className={`year-label ${
                      selectedYear === group.year ? "active" : ""
                    }`}
                    style={{
                      backgroundColor:
                        selectedYear === group.year ? yearColor : "white",
                      color: selectedYear === group.year ? "white" : "black",
                      borderColor: yearColor,
                    }}
                  >
                    {group.year}
                  </div>
                  {group.events.map((event, i) => (
                    <button
                      key={i}
                      className={`event-btn ${
                        selectedEvent?.title === event.title ? "active" : ""
                      }`}
                      style={{
                        backgroundColor:
                          selectedEvent?.title === event.title
                            ? event.color || "black"
                            : "white",
                        color:
                          selectedEvent?.title === event.title
                            ? "white"
                            : "black",
                        borderColor: event.color || "black",
                      }}
                      onClick={() => {
                        if (isEditing && selectedEvent?.title === event.title) {
                          const currentIndex = colorOptions.indexOf(
                            event.color || "black"
                          );
                          const nextColor =
                            colorOptions[
                              (currentIndex + 1) % colorOptions.length
                            ];
                          const updated = { ...event, color: nextColor };
                          setSelectedEvent(updated);
                          setItems((prev) =>
                            prev.map((item) =>
                              item.year === event.year &&
                              item.title === event.title
                                ? updated
                                : item
                            )
                          );
                        } else {
                          setSelectedEvent(event);
                          setSelectedYear(group.year);
                          setIsEditing(false);
                        }
                      }}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {isAdding ? (
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
                onChange={(e) => setInput({ ...input, title: e.target.value })}
                onKeyDown={handleKeyDown}
              />
              <button className="btn-add" onClick={handleAdd}>
                추가
              </button>
              <button className="btn-cancel" onClick={() => setIsAdding(false)}>
                ×
              </button>
            </div>
          ) : (
            <button className="btn-plus" onClick={() => setIsAdding(true)}>
              ＋
            </button>
          )}
        </div>

        <div className="card-container">
          {/* Profile / Event */}
          <div
            className={`profile-section ${selectedEvent ? "with-event" : ""}`}
          >
            <div className="image-box">
              <img
                src={selectedEvent ? selectedEvent.image || image! : image!}
                alt="Profile"
              />
              {isEditing && (
                <label className="btn-image-change">
                  변경
                  <input
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

            <div className="details-box">
              {isEditing ? (
                <>
                  <input
                    placeholder="제목"
                    className="input-field"
                    value={selectedEvent ? selectedEvent.title : name}
                    onChange={(e) =>
                      selectedEvent
                        ? updateEventField("title", e.target.value)
                        : setName(e.target.value)
                    }
                  />
                  <input
                    placeholder="날짜"
                    className="input-field"
                    value={selectedEvent ? selectedEvent.date || "" : birth}
                    onChange={(e) =>
                      selectedEvent
                        ? updateEventField("date", e.target.value)
                        : setBirth(e.target.value)
                    }
                  />
                  <input
                    placeholder="장소"
                    className="input-field"
                    value={
                      selectedEvent ? selectedEvent.location || "" : birthplace
                    }
                    onChange={(e) =>
                      selectedEvent
                        ? updateEventField("location", e.target.value)
                        : setBirthplace(e.target.value)
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
                      }
                    }}
                  />
                  <p className="char-count">
                    {(selectedEvent
                      ? selectedEvent.description?.length || 0
                      : bio.length) + " / 350"}
                  </p>
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

          {/* Watermark */}
          {isEditing ? (
            <input
              className="watermark-editing"
              value={ename}
              onChange={(e) => setEname(e.target.value)}
            />
          ) : (
            <div className="watermark">{ename}</div>
          )}

          <div className="qr-section">
            {isEditing && selectedEvent === null && (
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
                {/* <span>▴more info</span> */}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="buttons">
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="btn-edit"
        >
          {isEditing ? "저장" : "수정하기"}
        </button>
        {selectedEvent && !isEditing && (
          <button className="btn-delete" onClick={handleDelete}>
            삭제하기
          </button>
        )}
      </div>
    </div>
  );
}
