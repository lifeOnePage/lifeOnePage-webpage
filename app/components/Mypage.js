// Mypage.jsx
import { auth, firestore } from "../firebase/firebaseConfig";
import AuthOverlay from "../memorial/AuthOverlay";
import RingPictogram from "./RingPictogram";
import TabPlanePictogram from "./TabPlanePictogram";
import formatDate from "../utils/formatDate";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { saveUsername, saveProfileSection } from "../utils/firebaseDb"; // ★ 프로필 저장 유틸 추가
import { useRouter } from "next/navigation";
import { MoveRightIcon } from "lucide-react";

/** 최초 가입 유저용: 간단한 프로필 입력 폼 */
function ProfileSetupForm({ onSubmit, saving }) {
  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    birthPlace: "",
    motto: "",
  });
  const [error, setError] = useState("");

  const handleChange = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("이름은 필수입니다.");
      return;
    }
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 80, maxWidth: 420 }}>
      <h3 style={{ color: "#fff", fontSize: 28, marginBottom: 16 }}>
        프로필을 먼저 설정해주세요
      </h3>
      <p style={{ color: "#ffffff88", marginBottom: 20, fontSize: 14 }}>
        이름만 필수이며, 나머지는 나중에 마이페이지에서 수정할 수 있어요.
      </p>

      {error && (
        <div style={{ color: "#ff6b6b", marginBottom: 8, fontSize: 14 }}>
          {error}
        </div>
      )}

      <label style={{ display: "block", color: "#fff", marginTop: 12 }}>
        이름 *
      </label>
      <input
        type="text"
        placeholder="예) 이현서"
        value={form.name}
        onChange={handleChange("name")}
        style={inputStyle()}
      />

      <label style={{ display: "block", color: "#fff", marginTop: 12 }}>
        생년월일
      </label>
      <input
        type="text"
        placeholder="예) 2003.10.27"
        value={form.birthDate}
        onChange={handleChange("birthDate")}
        style={inputStyle()}
      />

      <label style={{ display: "block", color: "#fff", marginTop: 12 }}>
        출생지
      </label>
      <input
        type="text"
        placeholder="예) 서울"
        value={form.birthPlace}
        onChange={handleChange("birthPlace")}
        style={inputStyle()}
      />

      <label style={{ display: "block", color: "#fff", marginTop: 12 }}>
        모토(좌우명)
      </label>
      <input
        type="text"
        placeholder="예) 하루하루 배우자"
        value={form.motto}
        onChange={handleChange("motto")}
        style={inputStyle()}
      />

      <button
        type="submit"
        disabled={saving}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          borderRadius: 12,
          border: "none",
          background: "#fff",
          color: "#000",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {saving ? "저장 중..." : "프로필 저장"}
      </button>
    </form>
  );
}

const inputStyle = () => ({
  marginTop: 6,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ffffff55",
  backgroundColor: "#ffffff22",
  color: "#fff",
  boxSizing: "border-box",
});

export default function Mypage({ id, setId, initialData, setMode }) {
  const router = useRouter();
  const { user, dataLoading } = useUser();

  // 로컬에서 프로필을 들고 있다가 최초 저장 후 즉시 화면 전환
  const [profile, setProfile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // username 편집 관련
  const [isIdChanged, setIsIdChanged] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isPageHovered, setIsPageHovered] = useState(false);

  // initialData 로딩되면 로컬 프로필/아이디 세팅
  useEffect(() => {
    if (initialData?.username) setId(initialData.username);
    if (initialData?.profile) setProfile(initialData.profile);
  }, [initialData, setId]);

  // 로그인/데이터 상태에 따른 화면 분기
  const view = useMemo(() => {
    if (dataLoading) return "loading";
    if (!user) return "auth"; // 로그인 필요
    // user는 있으나 프로필이 없으면 최초 입력 폼
    if (!profile || !profile.name) return "firstProfile";
    // 일반 마이페이지
    return "main";
  }, [user, dataLoading, profile]);

  // ID 입력 제어
  const handleIdChange = (e) => {
    setId(e.target.value);
    setIsIdChanged(true);
    setSaveStatus("idle");
  };

  const handleSaveClick = async () => {
    if (!user?.uid) return;
    const result = await saveUsername(user.uid, id);
    if (result.success) {
      setSaveStatus("success");
      setIsIdChanged(false);
    } else {
      setSaveStatus("error");
      setErrorMessage(result.message || "저장에 실패했습니다.");
    }
  };

  // 최초 프로필 저장
  const handleProfileSubmit = async (form) => {
    if (!user?.uid) return;
    try {
      setSavingProfile(true);
      await saveProfileSection(user.uid, {
        name: form.name.trim(),
        birthDate: form.birthDate.trim() || undefined,
        birthPlace: form.birthPlace.trim() || undefined,
        motto: form.motto.trim() || undefined,
        // profileImageUrl 제외 (현재 단계에선 받지 않음)
      });
      // 로컬 상태 즉시 반영 → 'main' 화면으로 전환됨
      setProfile({
        name: form.name.trim(),
        birthDate: form.birthDate.trim() || undefined,
        birthPlace: form.birthPlace.trim() || undefined,
        motto: form.motto.trim() || undefined,
      });
    } catch (e) {
      console.error(e);
      alert("프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ====== 분기 렌더링 ======

  if (view === "loading") {
    return <div style={{ padding: 20, color: "#fff" }}>불러오는 중...</div>;
  }

  if (view === "auth") {
    return (
      <div>
        시작해볼까요?
        <AuthOverlay
          auth={auth}
          firestore={firestore}
          onAuthComplete={() => {
            // 로그인 완료되면 상위에서 유저컨텍스트가 갱신됨
          }}
        />
      </div>
    );
  }

  if (view === "firstProfile") {
    return (
      <div style={{ width: "100%", height: "100%", padding: "0px 20px" }}>
        <div style={{ marginTop: "100px", color: "#fff" }}>
          <MoveRightIcon
            size={40}
            style={{ cursor: "pointer", float: "right" }}
            onClick={() => setMode("default")}
          />
          <ProfileSetupForm
            onSubmit={handleProfileSubmit}
            saving={savingProfile}
          />
        </div>
      </div>
    );
  }

  // view === 'main'
  return (
    <div style={{ width: "100%", height: "100%", padding: "0px 20px" }}>
      <div style={{ marginTop: "100px" }}>
        <div style={{ fontSize: 30, color: "#fff" }}>
          반가워요, <strong>{profile?.name}님</strong>
        </div>

        <div
          style={{
            margin: "20px 0px",
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <MoveRightIcon size={40} onClick={() => setMode("default")} />
          <button
            onClick={async () => {
              await auth.signOut();
              window.location.reload();
            }}
            style={{ cursor: "pointer" }}
          >
            {" "}
            로그아웃{" "}
          </button>
        </div>

        <div style={{ marginTop: 20, display: "flex" }}>
          <div
            onMouseEnter={() => setIsCardHovered(true)}
            onMouseLeave={() => setIsCardHovered(false)}
            onClick={() => router.push(`/card`)}
            style={{
              paddingRight: 20,
              borderRight: "1px solid #fff",
              backgroundColor: isCardHovered ? "#ffffff22" : "transparent",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignContent: "center",
                padding: 20,
                transition: "all 0.3s ease",
                color: "#fff",
              }}
            >
              <TabPlanePictogram size={100} />
              {initialData?.cardUpdatedAt
                ? `최근 수정일 ${formatDate(
                    initialData.cardUpdatedAt?.toDate()
                  )}`
                : "아직 비어있어요"}
            </div>
          </div>

          <div
            onMouseEnter={() => setIsPageHovered(true)}
            onMouseLeave={() => setIsPageHovered(false)}
            onClick={() => router.push(`/${id}`)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignContent: "center",
              padding: 20,
              backgroundColor: isPageHovered ? "#ffffff22" : "transparent",
              transition: "all 0.3s ease",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <RingPictogram size={100} />
            {initialData?.pageUpdatedAt
              ? `최근 수정일 ${formatDate(initialData.pageUpdatedAt?.toDate())}`
              : "아직 비어있어요"}
          </div>
        </div>

        {/* Username 설정 영역 */}
        <div
          style={{
            display: "inline-flex",
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 400,
            padding: "0px 10px",
            color: "#fff",
            marginTop: 50,
          }}
        >
          ID
        </div>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {saveStatus === "error" && (
            <p style={{ color: "#ff6b6b", marginBottom: 8, fontSize: 14 }}>
              {errorMessage}
            </p>
          )}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              placeholder="ID 입력"
              type="text"
              value={id}
              onChange={handleIdChange}
              style={{
                margin: 0,
                padding: "12px 60px 12px 16px",
                border: `1px solid ${
                  saveStatus === "error" ? "#ff6b6b" : "#fff"
                }`,
                backgroundColor: "#ffffff22",
                borderRadius: 20,
                width: "100%",
                boxSizing: "border-box",
                color: "#fff",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isIdChanged && saveStatus !== "success" && (
                <button
                  onClick={handleSaveClick}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 15,
                    backgroundColor: "#000",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  저장
                </button>
              )}
              {saveStatus === "success" && (
                <span style={{ fontSize: 24, color: "white" }}>✓</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ color: "#ffffff55" }}>
          {`https://theLifeGallery/page/${id}`}
        </div>

        <div style={{ marginTop: 50 }}>
          <div
            style={{
              display: "inline-flex",
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 400,
              padding: "0px 10px",
              color: "#fff",
            }}
          >
            PAYMENT METHOD
          </div>
        </div>
      </div>
    </div>
  );
}
