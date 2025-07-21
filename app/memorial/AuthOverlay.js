"use client";

import { useState, useEffect } from "react";
import { setupRecaptcha, sendVerificationCode, confirmCode } from "../auth/phoneAuth";
import { formatPhoneWithHyphen, toE164 } from "../lib/phone";
import { serverTimestamp, doc, setDoc } from "firebase/firestore";

export default function AuthOverlay({ auth, firestore, onAuthComplete }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => setupRecaptcha("recaptcha-container"), 0);
    }
  }, []);

  const handleSend = async () => {
    try {
      setError("");
      setLoading(true);
      const e164 = toE164(phone);
      const res = await sendVerificationCode(e164);
      setConfirmation(res);
      setStep("code");
    } catch (e) {
      console.error("인증 요청 실패:", e);
      setError("📛 인증 요청 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setError("");
      setLoading(true);
      await confirmCode(confirmation, code);

      const u = auth.currentUser;
      if (!u) throw new Error("인증된 사용자 없음");

      if (mode === "signup") {
        await setDoc(doc(firestore, "users", u.uid), {
          phoneNumber: u.phoneNumber,
          name,
          createdAt: serverTimestamp(),
        });
      }

      onAuthComplete();
    } catch (e) {
      console.error("코드 인증 실패:", e);
      setError("❌ 인증 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        padding: "30px", borderRadius: "10px",
        width: "90%", maxWidth: "360px", textAlign: "center"
      }}>
        <h2 style={{color:"white", fontWeight:"600"}}>LifeOnePage</h2>

        {step === "phone" && (
          <>
            <input
              style={inputStyle}
              placeholder="전화번호"
              value={phone}
              onChange={(e) => setPhone(formatPhoneWithHyphen(e.target.value))}
            />
            {mode === "signup" && (
              <input
                style={inputStyle}
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <button onClick={handleSend} style={btnStyle} disabled={loading}>
              인증 요청
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <input
              style={inputStyle}
              placeholder="인증 코드"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button onClick={handleVerify} style={btnStyle} disabled={loading}>
              인증 확인
            </button>
          </>
        )}

        <p style={{ color: "red" }}>{error}</p>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{ background: "none", color: "#ffffff", marginTop: "1rem" }}
        >
          {mode === "login" ? "회원가입하기" : "로그인하기"}
        </button>

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px", margin: "8px 0",
  border: "1px solid #ccc", borderRadius: "6px", color:"white",backgroundColor: "#ffffff44"
};
const btnStyle = {
  width: "100%", padding: "10px", margin: "8px 0",
  backgroundColor: "#7f1d1d", color: "#fff", border: "none",
  borderRadius: "6px", cursor: "pointer"
};
