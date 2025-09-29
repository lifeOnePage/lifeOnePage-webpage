"use client";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { auth, firestore } from "../firebase/firebaseConfig";
import { BLACK } from "../styles/colorConfig";
import { FiEdit2, FiSave, FiChevronRight, FiCreditCard } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { checkValidIdUnique } from "../utils/firebaseDb";
import { doc, updateDoc } from "firebase/firestore";
import TabPlanePictogram from "../components/TabPlanePictogram";
import RingPictogram from "../components/RingPictogram";
import formatDate from "../utils/formatDate";
import { useRouter } from "next/navigation";

export default function Mypage() {
  const { user, initialData, setInitialData } = useUser();
  const u = auth.currentUser;
  console.log(user, initialData);
  // --- responsive breakpoint
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("card");
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const router = useRouter();

  // --- data & editing state
  const profile = useMemo(
    () => ({
      name: initialData?.profile?.name,
      phone: initialData?.phoneNumber,
      userId: initialData?.username,
      email: initialData?.email,
    }),
    [initialData, user, u]
  );

  const [selectedTab, setSelectedTab] = useState("profile"); // 'profile' | 'billing'
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    phone: profile.phone,
    userId: profile.userId,
    email: profile.email,
  });

  // keep form in sync when source changes (e.g., after reload)
  useEffect(() => {
    setForm({
      phone: profile.phone,
      userId: profile.userId,
      email: profile.email,
    });
  }, [profile.phone, profile.userId, profile.email]);

  const saveProfile = async () => {
    if (!form.phone) {
      setError("전화번호를 입력해주세요.");
      return;
    } else if (!form.userId) {
      setError("ID를 입력해주세요.");
      return;
    } else if (
      form.userId !== initialData.username &&
      !(await checkValidIdUnique(form.userId))
    ) {
      setError("이미 사용중인 ID에요.");
      return;
    } else if (!form.email) setError("");
    // TODO: replace with real Firestore write
    // e.g., await updateDoc(doc(firestore, `users/${user.uid}`), { profile: { ...existing, ...form } })
    console.log("[SAVE] profile:", form);
    const ref = doc(firestore, "users", user.uid);
    const data = {
      phoneNumber: form.phone,
      username: form.userId,
    };

    await updateDoc(ref, {
      ...data,
      email: form.email ?? "",
    });
    setInitialData({ ...initialData, ...data, email: form.email ?? "" });
    setEditing(false);
  };

  const handleToggleEdit = async () => {
    setError("");
    if (selectedTab !== "profile") return; // safety
    if (editing) {
      await saveProfile();
    } else {
      setEditing(true);
    }
  };

  // --- animations
  const contentVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
  };
  const listItemVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  // --- styles
  const page = {
    fontFamily:
      "pretendard, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, Helvetica, Arial, sans-serif",
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    background:
      "linear-gradient(135deg, #37393bff 0%, #1e1f21ff 50%, #000 100%)",
  };
  const shell = {
    width: "100vw",
    maxWidth: 768,
    // height: "100vh",
    padding: isMobile ? "80px 16px 16px" : "100px 20px",

    color: "#fff",
    boxSizing: "border-box",
  };

  return (
    <div style={page}>
      <div style={shell}>
        {/* Error toast area */}
        {/* greeting */}
        <motion.p
          style={{
            color: "#fff",
            fontSize: isMobile ? "1.5rem" : "2rem",
            margin: 0,
            paddingBottom: 20,
            borderBottom: "2px solid #555",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          반가워요, <strong>{profile.name}</strong>님
        </motion.p>

        {/* desktop layout */}
        {!isMobile ? (
          <div
            style={{
              display: "flex",
              gap: 16,
              height: "calc(100% - 60px)",
              marginTop: 20,
              color: "#fff",
            }}
          >
            {/* sidebar */}
            <nav
              style={{
                flex: 0.3,
                display: "flex",
                flexDirection: "column",
                border: "1px solid #2e2e2e",
                backgroundColor: "#1a1a1a55",
                borderRadius: 10,
                overflow: "hidden",
                height: "100%",
                color: "#fff",
              }}
            >
              <SideItem
                active={selectedTab === "profile"}
                onClick={() => setSelectedTab("profile")}
              >
                내 정보 관리
              </SideItem>
              <SideItem
                active={selectedTab === "billing"}
                onClick={() => setSelectedTab("billing")}
              >
                결제 관리
              </SideItem>
            </nav>

            {/* content */}
            <section
              style={{
                flex: 0.7,
                height: "100%",
                position: "relative",
                color: "#fff",
              }}
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: "absolute",
                      width: "100%",
                      bottom: 60,
                      background: "#ff7d7d11",
                      color: "#ff7d7dff",
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #ff7d7d",
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* edit/save button (top-right) only for profile tab */}
              {selectedTab === "profile" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleToggleEdit}
                  style={{
                    // position: "absolute",
                    // top: 0,
                    // right: 0,
                    display: "flex",
                    justifySelf: "flex-end",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid #2e2e2e",
                    background: editing ? "#11111122" : "#10101066",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  aria-label={editing ? "저장" : "편집"}
                >
                  {editing ? <FiSave /> : <FiEdit2 />}{" "}
                  {editing ? "저장" : "편집"}
                </motion.button>
              )}

              <AnimatePresence mode="wait">
                {selectedTab === "profile" ? (
                  <motion.div
                    key="tab-profile"
                    variants={contentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <ProfileSection
                      form={form}
                      setForm={setForm}
                      editing={editing}
                      listItemVariants={listItemVariants}
                    />
                    <SelectItem
                      router={router}
                      initialData={initialData}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-billing"
                    variants={contentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <BillingPlaceholder />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        ) : (
          // mobile layout
          <div style={{ marginTop: 16 }}>
            {/* mobile tabs */}
            <div
              style={{
                display: "flex",
                position: "relative",
                borderBottom: "1px solid #2e2e2e",
              }}
            >
              <MobileTab
                active={selectedTab === "profile"}
                onClick={() => setSelectedTab("profile")}
              >
                내 정보 관리
              </MobileTab>
              <MobileTab
                active={selectedTab === "billing"}
                onClick={() => setSelectedTab("billing")}
              >
                결제 관리
              </MobileTab>
            </div>

            {/* edit/save top-right */}
            {selectedTab === "profile" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleToggleEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #2e2e2e",
                    background: editing ? "#11111122" : "#10101066",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  aria-label={editing ? "저장" : "편집"}
                >
                  {editing ? <FiSave /> : <FiEdit2 />}{" "}
                  {editing ? "저장" : "편집"}
                </motion.button>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: "absolute",
                      width: "90%",
                      bottom: 60,
                      background: "#ff7d7d11",
                      color: "#ff7d7dff",
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #ff7d7d",
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {selectedTab === "profile" ? (
                  <motion.div
                    key="m-profile"
                    variants={contentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <ProfileSection
                      form={form}
                      setForm={setForm}
                      editing={editing}
                      listItemVariants={listItemVariants}
                    />
                    <SelectItem
                    router={router}
                      initialData={initialData}
                      selected={selected}
                      setSelected={setSelected}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="m-billing"
                    variants={contentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <BillingPlaceholder />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------------- subcomponents ---------------- */
function SideItem({ children, active, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        appearance: "none",
        textAlign: "left",
        padding: 16,
        background: active ? "#2a2a2a55" : "transparent",
        color: "#fff",
        border: "none",
        borderBottom: "1px solid #2e2e2e",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <span>{children}</span>
      <FiChevronRight opacity={0.6} />
      {/* left active bar */}
      <motion.span
        layout
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "#fff",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.18 }}
      />
    </motion.button>
  );
}

function MobileTab({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 8px",
        background: "transparent",
        color: "#fff",
        border: "none",
        borderBottom: "2px solid transparent",
        fontWeight: active ? 800 : 500,
        cursor: "pointer",
        position: "relative",
      }}
    >
      {children}
      {active && (
        <motion.div
          layoutId="tabIndicator"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -2,
            height: 2,
            background: "#fff",
          }}
        />
      )}
    </button>
  );
}

function ProfileSection({ form, setForm, editing, listItemVariants }) {
  return (
    <div
      style={{
        border: "1px solid #2e2e2e",
        background: "#10101066",
        borderRadius: 10,
        padding: 16,
        height: "100%",
        marginTop: 10,
        boxSizing: "border-box",
      }}
    >
      <motion.div
        variants={listItemVariants}
        initial="initial"
        animate="animate"
      >
        <Field label="전화번호">
          {editing ? (
            <Input
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="01012345678"
              type="text"
            />
          ) : (
            <ValueText>{form.phone || "-"}</ValueText>
          )}
        </Field>
      </motion.div>

      <motion.div
        variants={listItemVariants}
        initial="initial"
        animate="animate"
      >
        <Field label="ID">
          {editing ? (
            <Input
              value={form.userId}
              onChange={(v) => setForm({ ...form, userId: v })}
              placeholder="원하는 아이디"
              type="text"
            />
          ) : (
            <ValueText>{form.userId || "-"}</ValueText>
          )}
        </Field>
      </motion.div>

      <motion.div
        variants={listItemVariants}
        initial="initial"
        animate="animate"
      >
        <Field label="이메일">
          {editing ? (
            <Input
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="name@example.com"
            />
          ) : (
            <ValueText>{form.email || "-"}</ValueText>
          )}
        </Field>
      </motion.div>
    </div>
  );
}
function SelectItem({ router, initialData, selected, setSelected }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      {["card", "page"].map((type) => (
        <div
          key={type}
          onClick={() => setSelected(type)}
          style={{
            flex: 1,
            minWidth: 240,
            padding: "20px",
            backgroundColor: selected === type ? "#ffffff22" : "transparent",
            border:
              selected === type ? "2px solid white" : "1px solid #ffffff44",
            borderRadius: 12,
            cursor: "pointer",
            transition: "all 0.3s ease",
            color: "#fff",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffffff11")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              selected === type ? "#ffffff22" : "transparent")
          }
        >
          {selected === type && type === "card" && (
            <div>
              <TabPlanePictogram />
            </div>
          )}
          {selected === type && type === "page" && (
            <div>
              <RingPictogram />
            </div>
          )}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            {type === "card" ? "LifeCard" : "LifeWheel"}
          </h2>
          <p>
            {type === "card"
              ? initialData?.cardUpdatedAt
                ? `최근 수정일 ${formatDate(
                    initialData.cardUpdatedAt?.toDate()
                  )} `
                : "아직 비어있어요"
              : initialData?.pageUpdatedAt
              ? `최근 수정일 ${formatDate(initialData.pageUpdatedAt?.toDate())}`
              : "아직 비어있어요"}
          </p>

          {selected === type && (
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button
                style={{
                  backgroundColor: "#ffffff33",
                  borderRadius: 20,
                  padding: "8px 20px",
                  fontSize: "1rem",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                  transition: "all 0.3s ease",
                }}
                onClick={() => {
                  // onStart(selected);
                  router.push(
                    `/${type === "card" ? "card" : initialData.username}`
                  );
                }}
              >
                시작하기 &gt;
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 12,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px dashed #c4c6cb22",
      }}
    >
      <div style={{ color: "#aaa", fontSize: 14 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, type }) {
  return (
    <motion.input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.16 }}
      style={{
        width: "100%",
        height: 44,
        borderRadius: 10,
        border: "1px solid #3a3a3a",
        background: "#0f0f0f",
        color: "#fff",
        padding: "10px 12px",
        outline: "1px dashed #dedede44",
        fontSize: 16,
        transition: "box-shadow .15s ease, border-color .15s ease",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,172,255,0.25)")
      }
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
    />
  );
}

function ValueText({ children }) {
  return <div style={{ fontSize: 16 }}>{children}</div>;
}

function BillingPlaceholder() {
  return (
    <div
      style={{
        border: "1px solid #2e2e2e",
        background: "#10101066",
        borderRadius: 10,
        padding: 16,
        color: "#ddd",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FiCreditCard />
        <strong style={{ color: "#fff" }}>결제 관리</strong>
        <span
          style={{
            marginLeft: 8,
            fontSize: 12,
            color: "#bbb",
            border: "1px solid #333",
            padding: "2px 6px",
            borderRadius: 999,
          }}
        >
          준비 중
        </span>
      </div>
      <p style={{ margin: 0, color: "#bbb" }}>
        결제 수단 등록, 이용권/구독 관리 기능이 곧 제공됩니다.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        <Skel height={52} />
        <Skel height={52} />
        <Skel height={90} />
      </div>
    </div>
  );
}

function Skel({ height = 44 }) {
  return (
    <div
      style={{
        height,
        borderRadius: 10,
        background:
          "linear-gradient(90deg,#101010 0%,#202020 50%,#101010 100%)",
        backgroundSize: "200% 100%",
        animation: "skel 1.2s ease-in-out infinite",
      }}
    />
  );
}

// Add keyframes for skeleton shimmer
if (typeof document !== "undefined") {
  const id = "skel-anim-style";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `@keyframes skel { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`;
    document.head.appendChild(style);
  }
}
