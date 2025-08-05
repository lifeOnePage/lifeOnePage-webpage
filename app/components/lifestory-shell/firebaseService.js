// ✅ firebaseService.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../firebase/firebaseConfig";

// 🔹 대화 메시지를 Firestore에 추가
export async function saveMessage(userId, threadId, msg) {
  const ref = doc(firestore, `users/${userId}/conversations/${threadId}`);
  await updateDoc(ref, {
    messages: arrayUnion(msg),
  });
}

// 🔹 생애문을 /lifestory 문서에 안전하게 저장 (motto는 보존)
export async function saveLifeStory(userId, threadId, story) {
  const ref = doc(firestore, `users/${userId}/lifestory`);
  await updateDoc(ref, {
    story,                      // 새로 작성된 생애문
    threadId,                  // 대화 ID 추적
    complete: true,            // 생애문 생성 완료 상태
    updatedAt: serverTimestamp(),
  });
}

// 🔹 대화 메시지 초기 로딩
export async function loadMessages(userId, threadId) {
  const ref = doc(firestore, `users/${userId}/conversations/${threadId}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().messages : [];
}

// 🔹 생애문 상태 로딩 (story / motto / threadId 확인용)
export async function loadLifeStoryMeta(userId) {
  const ref = doc(firestore, `users/${userId}/`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().lifestory : null;
}

// 🔹 새로운 대화 쓰레드 초기화 (처음 사용자)
export async function initThread(userId, threadId, initialMsg) {
  const ref = doc(firestore, `users/${userId}/conversations/${threadId}`);
  await setDoc(ref, {
    createdAt: serverTimestamp(),
    messages: [initialMsg],
  });
}
