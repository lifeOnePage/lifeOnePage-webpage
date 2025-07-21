// utils/firestoreUtils.js
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

const db = getFirestore(app);
// 사용자 데이터 불러오기
export async function fetchUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// 사용자 데이터 저장
export async function saveUserData(uid, data) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true }); // merge로 기존 필드 보존
}
