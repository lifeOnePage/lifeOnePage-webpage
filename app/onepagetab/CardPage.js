"use client";
import { useState } from "react";
import "./CardPage.css"; // ✅ CSS 불러오기

export default function CardPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const name = "강해린";
  const ename = "Kang Haerin";
  const birth = "2006.05.15";
  const birthplace = "서울특별시 동작구";
  const bio = `강해린은 2006년 어느 조용한 계절에 태어났다.
말수는 적지만, 무대 위에 서면 누구보다 진심이 깊은 사람이다.
뉴진스로 데뷔한 후, 투명한 눈빛과 섬세한 감정으로 많은 이들의 마음에 잔잔한 물결을 일으켰다.
물결을 넘어서, 오래도록 마음에 남는 사람이 되는 것이 그녀의 바람이다.`;

  const image = "/images/profile.jpg";

  const items = [
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
        "가족과 함께한 첫 바닷가 여행. 파도 소리와 함께한 첫 여행. 작은 손으로 모래성을 쌓았다.",
    },
    {
      year: "2014",
      title: "초등학교 입학",
      date: "2014.03.02",
      location: "서울보라매초등학교",
      image: "/images/timeline/school_image.jpg",
      description:
        "서울보라매초등학교에 입학하며 새로운 생활을 시작했다.\n커다란 교실, 새로운 책가방, 그리고 처음 만난 친구들이 낯설었지만 금세 익숙해졌다. 첫날 받은 이름표와 알록달록한 공책들은 아직도 소중한 추억으로 남아 있다.\n이 시기에 그림 그리기와 독서를 좋아하게 되었다.",
    },
    {
      year: "2018",
      title: "뉴진스 데뷔 준비",
      date: "2018.07.01",
      location: "서울",
      image: "/images/timeline/newjeans_image.jpg",
      description:
        "연습생 생활을 본격적으로 시작했다. 하루 대부분을 연습실에서 보내며 춤과 노래를 반복적으로 연습했다.\n체력 훈련과 보컬 트레이닝은 힘들었지만, 무대에 설 미래를 상상하며 버텼다.\n연습생 동료들과의 우정과 함께 성장한 시간이었다.",
    },
  ];

  // 년도별 그룹화
  const grouped = Object.values(
    items.reduce((acc, item) => {
      if (!acc[item.year]) acc[item.year] = { year: item.year, events: [] };
      acc[item.year].events.push(item);
      return acc;
    }, {})
  ).sort((a, b) => Number(a.year) - Number(b.year));

  return (
    <div className="card-page">
      {/* ✅ 탭 */}
      <div className="tabs">
        <button
          className={`tab-main ${!selectedEvent ? "active" : ""}`}
          onClick={() => {
            setSelectedEvent(null);
            setSelectedYear(null);
          }}
        >
          {name}의 이야기
        </button>
        {grouped.map((group) => (
          <div key={group.year} className="tab-year-group">
            <div
              className={`tab-year ${
                selectedYear === group.year ? "active" : ""
              }`}
            >
              {group.year}
            </div>
            {group.events.map((event, idx) => (
              <button
                key={idx}
                className={`tab-event ${
                  selectedEvent?.title === event.title ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedEvent(event);
                  setSelectedYear(group.year);
                }}
              >
                <span>{event.title}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Contents */}
      <div className="content">
        {/* 이미지 */}
        <div className="profile-image">
          <img src={selectedEvent?.image || image} alt="profile" />
        </div>

        {/* 텍스트 */}
        <div className="profile-text">
          {selectedEvent ? (
            <>
              <h1>{selectedEvent.title}</h1>
              <p className="date">{selectedEvent.date}</p>
              <p className="place">{selectedEvent.location}</p>
              <p className="description">{selectedEvent.description}</p>
            </>
          ) : (
            <>
              <h1>{name}</h1>
              <p className="date">{birth}</p>
              <p className="place">{birthplace}</p>
              <p className="description">{bio}</p>
            </>
          )}
        </div>
      </div>

      {/* NameWaterMark */}
      <div className="watermark">{ename}</div>

      {/* QR */}
      <div className="qr">
        <img src="images/QRcode.svg" alt="QR Code" />
        <span>more info ▴</span>
      </div>
    </div>
  );
}
