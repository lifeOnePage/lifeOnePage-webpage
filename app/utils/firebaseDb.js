import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

const db = getFirestore(app);

/**
 * 사용자 기본 정보 불러오기
 * @param {string} uid
 * @returns {object | null}
 */
export async function fetchUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * 프로필 섹션 저장 (이름, 생년월일, 프로필 이미지 URL)
 */
export async function saveProfileSection(uid, data) {
  console.log(uid, data)
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    profile: {
      name: data.name,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      motto: data.motto,
       ...(data.profileImageUrl && { profileImageUrl: data.profileImageUrl }),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * 생애문 섹션 저장 (좌우명, 생애문, threadId)
 */
export async function saveLifestorySection(uid, data) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    lifestory: {
      motto: data.motto,
      story: data.story,
      threadId: data.threadId,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function fetchPhotoGallery(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return data.photoGallery || {
    childhood: { images: [] },
    experience: [],
    relationship: [],
  };
}


export async function saveEntirePhotoGallery(uid, galleryData) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      photoGallery: galleryData,
      updatedAt: serverTimestamp(),
    },
    { merge: true } // 기존 필드 유지
  );
}

export async function savePhotoGalleryCategory(uid, categoryKey, data) {
  const ref = doc(db, "users", uid);
  console.log(data)
  await updateDoc(ref, {
    [`photoGallery.${categoryKey}`]: data,
    updatedAt: serverTimestamp(),
  });
}

