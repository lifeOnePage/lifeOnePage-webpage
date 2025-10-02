// firebaseDb.js
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
  query,
  orderBy,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { app } from "../firebase/firebaseConfig";

const db = getFirestore(app);
const storage = getStorage(app);

/* =================================
   컬렉션/문서 레퍼런스
   ================================= */
const itemsCol = (uid) => collection(db, "users", uid, "timeline");

/* =================================
   조회
   ================================= */
export async function fetchTimeline(uid) {
  const q = query(itemsCol(uid), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchUserName(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.profile.name || data.displayName || null;
}

/* =================================
   저장
   ================================= */
export async function upsertTimelineBulk(uid, items) {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  items.forEach((item, idx) => {
    if (!item?.id) throw new Error("item.id가 필요합니다.");

    const refDoc = doc(db, "users", uid, "timeline", String(item.id));
    const payload = {
      id: String(item.id),
      kind: item.kind, // "main" | "year"
      label: item.label ?? "",
      title: item.title ?? "",
      event: item.event ?? "",
      date: item.date ?? "",
      location: item.location ?? "",
      desc: item.desc ?? "",
      cover: item.cover ?? "",
      video: item.video ?? "",
      isHighlight: !!item.isHighlight,
      order: typeof item.order === "number" ? item.order : idx, // 배열 순서 = order
      createdAt: item.createdAt ?? now,
      updatedAt: now,
    };

    batch.set(refDoc, payload, { merge: true });
  });

  await batch.commit();
}

export async function upsertTimelineItem(uid, item) {
  if (!item?.id) throw new Error("item.id가 필요합니다.");
  const refDoc = doc(db, "users", uid, "timeline", String(item.id));
  const payload = {
    id: String(item.id),
    kind: item.kind,
    label: item.label ?? "",
    title: item.title ?? "",
    event: item.event ?? "",
    date: item.date ?? "",
    location: item.location ?? "",
    desc: item.desc ?? "",
    cover: item.cover ?? "",
    video: item.video ?? "",
    isHighlight: !!item.isHighlight,
    order: typeof item.order === "number" ? item.order : 9999,
    createdAt: item.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(refDoc, payload, { merge: true });
  return payload;
}

export async function deleteTimelineItem(uid, itemId) {
  await deleteDoc(doc(db, "users", uid, "timeline", String(itemId)));
}

/* =================================
   파일 업로드 (Storage)
   ================================= */
/** cover/video 파일 업로드 후 다운로드 URL 반환 */
export async function uploadTimelineFile(uid, itemId, file, type = "cover") {
  if (!file) return null;
  const path = `users/${uid}/timeline/${String(itemId)}/${type}`;
  const sref = ref(storage, path);
  await uploadBytes(sref, file);
  return await getDownloadURL(sref);
}
