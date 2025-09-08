"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BLACK } from "../styles/colorConfig";
import { toE164 } from "../lib/phone";
import {
  confirmCode,
  sendVerificationCode,
  setupRecaptcha,
} from "../auth/phoneAuth";
import { auth, firestore } from "../firebase/firebaseConfig";
import { checkValidIdUnique, fetchUserData } from "../utils/firebaseDb";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserContext";
import { onAuthStateChanged } from "firebase/auth";

/**
 * /login page
 * Requirements covered:
 * 1) Phone → OTP (Firebase phone auth: BLACKBOXED below)
 * 2) After OTP: branch to Signup or Login
 * 3a) Signup: heading changes, progressive fields (이름 → 생년월일 → ID → 이메일(선택)),
 *     always label at top telling what we are asking now; previous inputs slide down.
 *     ID duplicate check (BLACKBOX). Email is optional with an explicit skip button.
 *     Save everything once at the end (BLACKBOX) then route.
 * 3b) Login: heading becomes “반가워요, (이름)님”; ask for birthdate, verify (BLACKBOX), route.
 * 4) Use Next.js router to navigate on success.
 * 5) App-like screen slide animation between main stages; smooth field animations;
 *    a persistent top-left back button to step back and edit.
 *
 * NOTE: All Firebase/Firestore operations are intentionally stubbed as
 *       async BLACKBOX functions at the bottom. Replace with real implementations.
 */

export default function LoginPage() {
  const router = useRouter();

  // High-level stages
  // phone → otp → branch(signup|login)
  const [stage, setStage] = useState("phone"); // "phone" | "otp" | "signup" | "login"
  const [confirmation, setConfirmation] = useState(null);
  // Common auth/session data
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Branching data
  const [isNewUser, setIsNewUser] = useState(null);
  const [userUid, setUserUid] = useState(null);
  const [knownName, setKnownName] = useState("");

  const { setUser, setInitialData, setDataLoading } = useUser();

  useEffect(() => {
    setupRecaptcha("recaptcha-container");
  }, []);

  // useEffect(() => {
  //   setDataLoading(true);
  //   const unsub = onAuthStateChanged(auth, async (u) => {
  //     if (u) {
  //       console.log(u);
  //       setUser(u);
  //       const userRef = doc(firestore, "users", u.uid);
  //       const userSnap = await getDoc(userRef);

  //       // Firestore에 사용자 문서가 없으면 생성
  //       if (!userSnap.exists()) {
  //         await setDoc(userRef, {
  //           phoneNumber: u.phoneNumber,
  //           createdAt: serverTimestamp(),
  //         });
  //       }

  //       const data = await fetchUserData(u.uid);
  //       setInitialData(data);
  //       // setShowAuth(false); // 로그인 완료
  //     } else {
  //       // setShowAuth(true); // 로그인 필요
  //     }

  //     setDataLoading(false); // auth 확인 끝
  //   });

  //   return () => unsub();
  // }, []);

  // Signup flow state (progressive fields)
  const signupFields = useMemo(
    () => [
      {
        key: "name",
        label: "이름을 입력해주세요.",
        placeholder: "홍길동",
        required: true,
        type: "text",
      },
      {
        key: "birth",
        label: "생년월일을 입력해주세요.",
        placeholder: "YYYY-MM-DD",
        required: true,
        type: "date",
      },
      {
        key: "userId",
        label: "아이디(ID)를 입력해주세요.",
        placeholder: "영문 소문자/숫자 조합",
        required: true,
        type: "text",
        checkUnique: true,
      },
      {
        key: "email",
        label: "이메일을 입력해주세요 (선택)",
        placeholder: "name@example.com",
        required: false,
        type: "email",
        optional: true,
        skippable: true,
      },
    ],
    []
  );

  const [signupIndex, setSignupIndex] = useState(0); // which field we are on
  const [signupData, setSignupData] = useState({
    name: "",
    birth: "",
    userId: "",
    email: "",
  });
  const currentSignupField = signupFields[signupIndex];

  // Login flow state
  const [loginBirth, setLoginBirth] = useState("");

  // Helpers
  const resetToPhone = useCallback(() => {
    setStage("phone");
    setPhone("");
    setOtp("");
    setVerificationId(null);
    setIsNewUser(null);
    setUserUid(null);
    setKnownName("");
    setSignupIndex(0);
    setSignupData({ name: "", birth: "", userId: "", email: "" });
    setLoginBirth("");
    setError("");
  }, []);

  const canGoBack = useMemo(() => {
    if (stage === "phone") return false;
    if (stage === "otp") return true; // back to phone
    if (stage === "signup") return true; // back step or otp
    if (stage === "login") return true; // back to otp
    return false;
  }, [stage]);

  const handleBack = async () => {
    setError("");
    if (stage === "otp") {
      setStage("phone");
      return;
    }
    if (stage === "signup") {
      if (signupIndex > 0) {
        setSignupIndex((i) => i - 1);
      } else {
        setStage("otp");
      }
      return;
    }
    if (stage === "login") {
      setStage("otp");
      return;
    }
  };

  // Stage 1: send OTP
  const onSendOtp = async () => {
    setError("");
    const normalized = phone.replace(/\D/g, "");
    if (!normalized) {
      setError("전화번호를 입력해주세요");
      return;
    }
    try {
      setLoading(true);
      const { res, verificationId } = await BLACKBOX_sendOtp(normalized);
      setConfirmation(res);
      setVerificationId(verificationId);
      setStage("otp");
    } catch (e) {
      console.error(e);
      setError("인증번호 전송에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: verify OTP → branch
  const onVerifyOtp = async () => {
    setError("");
    if (!verificationId || !otp) {
      setError("인증번호를 입력해주세요");
      return;
    }
    try {
      setLoading(true);
      const result = await BLACKBOX_verifyOtp(confirmation, otp);
      setUserUid(result.uid);
      setIsNewUser(result.isNewUser);
      setKnownName(result.name || "");
      if (result.isNewUser) {
        setStage("signup");
        setSignupIndex(0);
      } else {
        setStage("login");
      }
    } catch (e) {
      console.error(e);
      setError("인증에 실패했어요. 인증번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // Signup flow handlers
  const onSubmitSignupField = async () => {
    setError("");
    const key = currentSignupField.key;
    const val = signupData[key]?.trim?.() ?? "";

    if (currentSignupField.required && !val) {
      setError("값을 입력해주세요");
      return;
    }

    if (currentSignupField.key === "userId" && val) {
      try {
        setLoading(true);
        const ok = await BLACKBOX_checkUserIdUnique(val);
        if (!ok) {
          setError("이미 사용 중인 ID예요. 다른 ID를 입력해주세요.");
          return;
        }
      } catch (e) {
        console.error(e);
        setError("ID 중복 확인 중 오류가 발생했어요.");
        return;
      } finally {
        setLoading(false);
      }
    }

    if (signupIndex < signupFields.length - 1) {
      setSignupIndex((i) => i + 1);
    } else {
      // Finalize signup: save then route
      try {
        setLoading(true);
        const u = auth.currentUser;
        console.log(auth);
        console.log(auth.currentUser);
        setUser(u);
        await BLACKBOX_saveSignupProfile({
          uid: userUid,
          phone,
          name: signupData.name.trim(),
          birth: signupData.birth.trim(),
          userId: signupData.userId.trim(),
          email: (signupData.email || "").trim() || null,
        });
        // TODO: decide destination; update as needed
        const data = await fetchUserData(u.uid);
        setInitialData(data);
        router.push("/mypage");
      } catch (e) {
        console.error(e);
        setError(
          "회원가입 저장 중 문제가 발생했어요. 잠시 후 다시 시도해주세요."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const onSkipEmail = () => {
    // Email is optional
    setSignupData((d) => ({ ...d, email: "" }));
    if (signupIndex < signupFields.length - 1) {
      setSignupIndex((i) => i + 1);
    }
  };

  // Login flow submit
  const onSubmitLogin = async () => {
    setError("");
    const birth = loginBirth.trim();
    if (!birth) {
      setError("생년월일을 입력해주세요");
      return;
    }
    try {
      setLoading(true);
      const { ok, id } = await BLACKBOX_verifyBirthdate({
        uid: userUid,
        birth,
      });
      if (!ok) {
        setError("본인 확인에 실패했어요. 생년월일을 확인해주세요.");
        return;
      }
      // TODO: decide destination; update as needed
      const u = auth.currentUser;
      setUser(u);
      const data = await fetchUserData(u.uid);
      setInitialData(data);
      console.log(id);
      router.push("/mypage");
      // router.push(`/${id}`);
    } catch (e) {
      console.error(e);
      setError("본인 확인 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const containerStyle = {
    fontFamily:
      "pretendard, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, Helvetica, Arial, sans-serif",
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #37393bff 0%, #1e1f21ff 50%, #000 100%)",
    color: "#fff",
  };
  const sheetStyle = {
    width: "100vw",
    maxWidth: 375,
    height: "100vh",
    padding: "50px 20px",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div style={containerStyle}>
      <div style={sheetStyle}>
        {/* Back button */}
        {canGoBack && (
          <button
            aria-label="뒤로가기"
            onClick={handleBack}
            style={{
              zIndex: 100,
              position: "absolute",
              top: 14,
              left: 14,
              width: 36,
              height: 36,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Stage slide container */}
        <div
          style={{ position: "absolute", inset: 0, padding: "64px 20px 24px" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {stage === "phone" && (
              <SlideScreen key="stage-phone">
                <Header>전화번호를 입력해주세요</Header>
                <div id="recaptcha-container"></div>
                <FieldBlock
                  label="전화번호"
                  value={phone}
                  onChange={setPhone}
                  placeholder="01012345678"
                  type="tel"
                  autoFocus
                />
                <PrimaryButton disabled={loading} onClick={onSendOtp}>
                  {loading ? "전송 중..." : "인증번호 받기"}
                </PrimaryButton>
              </SlideScreen>
            )}

            {stage === "otp" && (
              <SlideScreen key="stage-otp">
                <Header>인증번호를 입력해주세요</Header>
                <FieldBlock
                  label="인증번호"
                  value={otp}
                  onChange={setOtp}
                  placeholder="6자리"
                  type="number"
                  autoFocus
                />
                <PrimaryButton disabled={loading} onClick={onVerifyOtp}>
                  {loading ? "확인 중..." : "다음"}
                </PrimaryButton>
              </SlideScreen>
            )}

            {stage === "signup" && (
              <SlideScreen key="stage-signup">
                <Header>처음이시군요! 회원가입을 진행할게요.</Header>
                {/* Current prompt */}
                <p
                  style={{
                    fontSize: "1.05rem",
                    color: "#fafafa",
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {currentSignupField.label}
                </p>

                {/* Progressive list of filled items */}
                <div style={{ marginTop: 16 }}>
                  {signupFields.map((f, idx) => (
                    <AnimatePresence key={f.key}>
                      {idx <= signupIndex && (
                        <motion.div
                          key={`${f.key}-row`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22 }}
                          style={{ marginBottom: 12 }}
                        >
                          <FieldBlock
                            label={f.label}
                            value={signupData[f.key]}
                            onChange={(v) =>
                              setSignupData((d) => ({ ...d, [f.key]: v }))
                            }
                            placeholder={f.placeholder}
                            type={f.type}
                            autoFocus={idx === signupIndex}
                            disabled={idx < signupIndex} // lock previous fields while showing as history
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>

                {/* Controls */}
                <div style={{ marginTop: 8 }}>
                  {currentSignupField?.skippable && (
                    <SecondaryButton
                      onClick={async () => {
                        onSkipEmail();
                        await onSubmitSignupField();
                      }}
                      disabled={loading}
                    >
                      이메일이 없어요 / 입력하지 않고 넘어가기
                    </SecondaryButton>
                  )}
                  <PrimaryButton
                    onClick={onSubmitSignupField}
                    disabled={loading}
                  >
                    {signupIndex < signupFields.length - 1
                      ? "다음"
                      : loading
                      ? "저장 중..."
                      : "완료"}
                  </PrimaryButton>
                </div>
              </SlideScreen>
            )}

            {stage === "login" && (
              <SlideScreen key="stage-login">
                <Header>
                  {knownName ? <>반가워요, {knownName}님</> : <>반가워요!</>}
                </Header>
                <p style={{ fontSize: "0.95rem", color: "#555", marginTop: 8 }}>
                  생년월일을 입력해주세요
                </p>
                <FieldBlock
                  label="생년월일"
                  value={loginBirth}
                  onChange={setLoginBirth}
                  placeholder="YYYY-MM-DD"
                  type="date"
                  autoFocus
                  color="white"
                />
                <PrimaryButton onClick={onSubmitLogin} disabled={loading}>
                  {loading ? "확인 중..." : "확인"}
                </PrimaryButton>
              </SlideScreen>
            )}
          </AnimatePresence>
        </div>

        {/* Error toast area */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                left: 20,
                right: 20,
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
      </div>
    </div>
  );
}

/** UI bits */
function Header({ children }) {
  return (
    <h1
      style={{
        fontSize: "1.5rem",
        fontWeight: 700,
        lineHeight: 1.3,
        padding: "20px 0px",
      }}
    >
      {children}
    </h1>
  );
}

function FieldBlock({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
  disabled,
}) {
  return (
    <div>
      {/* <label
        style={{
          display: "block",
          fontSize: 12,
          color: "#666",
          marginBottom: 6,
        }}
      >
        {label}
      </label> */}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoFocus={autoFocus}
        disabled={disabled}
        style={{
          width: "100%",
          height: 50,
          border: "1px solid #aaa",
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: 16,
          outline: "none",
          opacity: disabled ? 0.8 : 1,
          background: disabled ? "#333" : "none",
          transition: "box-shadow 0.2s ease",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,172,255,0.25)")
        }
        onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      />
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 50,
        marginTop: 16,
        border: "1px solid #666",
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#111" : "#333",
        color: "#fff",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 44,
        marginTop: 10,
        border: "1px solid #cfd8e3",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        background: "#fff",
        color: "#374151",
      }}
    >
      {children}
    </button>
  );
}

function SlideScreen({ children }) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        padding: "50px 20px",
      }}
    >
      {children}
    </motion.div>
  );
}

/** ---------------------------------------------
 * BLACKBOX (replace with real Firebase/Firestore code)
 * ---------------------------------------------- */
async function BLACKBOX_sendOtp(phone) {
  // Implement with Firebase RecaptchaVerifier + signInWithPhoneNumber
  // return { verificationId }

  const e164 = toE164(phone);
  const res = await sendVerificationCode(e164);
  // setConfirmation(res);
  console.log(res);

  await wait(600);
  return { res, verificationId: res.verificationId };
}

async function BLACKBOX_verifyOtp(confirmation, code) {
  // Implement with Firebase confirm(otp)
  // Decide branch with Firebase additionalUserInfo.isNewUser, etc.

  try {
    await confirmCode(confirmation, code);

    const u = auth.currentUser;
    console.log(u);
    if (!u) throw new Error("인증된 사용자 없음");
    const userRef = doc(firestore, "users", u.uid);
    const userSnap = await getDoc(userRef);
    // if (!userSnap.exists()) {
    //   await setDoc(userRef, {
    //     phoneNumber: u.phoneNumber,
    //     createdAt: serverTimestamp(),
    //   });
    // }
    const isNewUser = !userSnap.exists(); // mock branching; REPLACE with real
    console.log(userSnap.data());
    return {
      uid: u.uid,
      isNewUser,
      name: isNewUser ? "" : await userSnap.data().profile?.name, // example when user exists
    };
  } catch (e) {
    console.error("코드 인증 실패:", e);
    // setError("❌ 인증 실패");
  }
}

async function BLACKBOX_checkUserIdUnique(userId) {
  // Implement by querying Firestore where("userId", "==", userId)

  // await wait(300);
  // return !/1$/.test(userId);
  return checkValidIdUnique(userId);
}

async function BLACKBOX_saveSignupProfile({
  uid,
  phone,
  name,
  birth,
  userId,
  email,
}) {
  // Firestore write: users/{uid} with fields { phone, name, birth, userId, email }
  console.log(uid, phone, name, normalizeToYMD(birth), userId, email);
  const userRef = doc(firestore, "users", uid);

  await setDoc(userRef, {
    phoneNumber: phone,
    createdAt: serverTimestamp(),
    profile: {
      birthDate: normalizeToYMD(birth),
      name,
    },
    email,
    username: userId,
  });
  await wait(700);
  return true;
}

async function BLACKBOX_verifyBirthdate({ uid, birth }) {
  // Compare input birth with stored profile.birth
  console.log(uid, birth);
  const data = await fetchUserData(uid);
  const correctBirth = data.profile.birthDate;
  console.log(birth, correctBirth);
  return {
    ok: normalizeToYMD(birth) === normalizeToYMD(correctBirth),
    id: data.username,
  };
  // await wait(500);
  // return birth.length >= 8; // mock rule
  // return false;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function normalizeToYMD(input) {
  if (!input) return null;
  const digits = String(input)
    .trim()
    .replace(/[^0-9]/g, ""); // 숫자만 추출
  if (digits.length !== 8) return null; // 형식 불일치

  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);

  // 유효성 체크(월/일 범위 검증)
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const valid =
    date.getFullYear() === Number(y) &&
    date.getMonth() + 1 === Number(m) &&
    date.getDate() === Number(d);
  if (!valid) return null;

  return `${y}.${m}.${d}`; // 표준화된 문자열 반환
}
