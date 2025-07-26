// app/auth/phoneAuth.js
import {
  browserSessionPersistence,
  RecaptchaVerifier,
  setPersistence,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined" || !auth) return null;

  // 기존 verifier가 있다면 제거
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    delete window.recaptchaVerifier;
  }

  // 기존 container DOM 안의 위젯도 제거
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = ""; // 기존 렌더링된 reCAPTCHA DOM 제거
  }

  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA solved", response);
      },
    });

    return window.recaptchaVerifier.render().then((widgetId) => {
      console.log("reCAPTCHA widget rendered:", widgetId);
      return window.recaptchaVerifier;
    });
  } catch (error) {
    console.error("reCAPTCHA 초기화 중 오류 발생:", error);
    return null;
  }
}

export async function sendVerificationCode(phoneNumber) {
  // 이미 생성된 verifier가 있으면 그걸 사용
  const verifier = window.recaptchaVerifier;

  if (!verifier) throw new Error("reCAPTCHA가 초기화되지 않았습니다.");

  await setPersistence(auth, browserSessionPersistence);
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
}


export async function confirmCode(confirmation, code) {
  return await confirmation.confirm(code);
}
