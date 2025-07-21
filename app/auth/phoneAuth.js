// app/auth/phoneAuth.js
import { browserSessionPersistence, RecaptchaVerifier, setPersistence, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined" || !auth) return null;
  console.log(auth);
  if (!window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });

      window.recaptchaVerifier.render().then((widgetId) => {
        console.log("reCAPTCHA widget rendered:", widgetId);
      });
    } catch (error) {
      console.error("reCAPTCHA 초기화 중 오류 발생:", error);
      return null;
    }
  }

  return window.recaptchaVerifier;
}

export async function sendVerificationCode(phoneNumber) {
  const verifier = setupRecaptcha();
  if (!verifier) throw new Error("reCAPTCHA가 초기화되지 않았습니다.");


  await setPersistence(auth, browserSessionPersistence); // 또는 inMemoryPersistence

  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function confirmCode(confirmation, code) {
  return await confirmation.confirm(code);
}
