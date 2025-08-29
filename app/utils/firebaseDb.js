import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where,
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
 * Saves a new username for a user if it's not already taken.
 * @param {string} uid - The user's unique ID.
 * @param {string} name - The new username to save.
 * @returns {Promise<{success: boolean, message: string}>} - An object indicating success or failure.
 */
export async function saveUsername(uid, name) {
  // 1. **입력값 유효성 검사 (Validate Inputs)**
  if (!uid || !name) {
    return { success: false, message: "사용자 ID와 이름은 필수입니다." };
  }

  const usersCol = collection(db, "users");
  const q = query(usersCol, where("username", "==", name));

  try {
    // 2. **사용자 이름 중복 확인 (Check for Duplicate Username)**
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // 동일한 사용자 이름을 가진 문서가 이미 존재하는 경우
      return { success: false, message: "이미 사용중인 이름입니다." };
    }

    // 3. **사용자 이름 업데이트 (Update Username)**
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      username: name,
    });

    return {
      success: true,
      message: "사용자 이름이 성공적으로 저장되었습니다.",
    };

  } catch (error) {
    console.error("사용자 이름 저장 중 오류 발생:", error);
    return { success: false, message: "이름 저장에 실패했습니다." };
  }
}

/**
 * 프로필 섹션 저장 (이름, 생년월일, 프로필 이미지 URL)
 */
export async function saveProfileSection(uid, data) {
  console.log(uid, data);
  const ref = doc(db, "users", uid);
  const updateData = {};

  // profile 하위 필드 각각 dot notation으로 설정
  if (data.name) updateData["profile.name"] = data.name;
  if (data.birthDate) updateData["profile.birthDate"] = data.birthDate;
  if (data.birthPlace) updateData["profile.birthPlace"] = data.birthPlace;
  if (data.motto) updateData["profile.motto"] = data.motto;
  if (data.profileImageUrl)
    updateData["profile.profileImageUrl"] = data.profileImageUrl;

  // 페이지 수정 시간은 항상 추가
  updateData.pageUpdatedAt = serverTimestamp();

  // 업데이트 실행
  await updateDoc(ref, updateData);
}

/**
 * 생애문 섹션 저장 (좌우명, 생애문, threadId)
 */
export async function saveLifestorySection(uid, data) {
  console.log(data);
  const ref = doc(db, "users", uid);
  const updateData = {};

  if (data.motto) updateData["lifestory.motto"] = data.motto;
  if (data.story) updateData["lifestory.story"] = data.story;
  if (data.threadId) updateData["lifestory.threadId"] = data.threadId;

  // 페이지 수정 시간 갱신
  updateData.pageUpdatedAt = serverTimestamp();

  await updateDoc(ref, updateData);
}

export async function fetchPhotoGallery(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return (
    data.photoGallery || {
      childhood: { images: [] },
      experience: [],
      relationship: [],
    }
  );
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
  console.log(data);
  await updateDoc(ref, {
    [`photoGallery.${categoryKey}`]: data,
    updatedAt: serverTimestamp(),
  });
}
// type TimelineItem = {
//   year: string;
//   title: string;
//   image?: string;
//   date?: string;
//   location?: string;
//   description?: string;
// };

// type TimelineGroup = {
//   year: string;
//   events: TimelineItem[];
// };

/* 구조

Timeline: TimelineGroup[]
TimelineGroup : {year:string, TimelineItem[]}
TimelineItem: {

  id: string; //추가, 저장 필요
  isUpdated: boolean; // 추가 필요, 저장할 필요는 없음(내부 관리용)
  isImageUpdated: boolean; // 추가 필요, 저장할 필요는 없음(내부 관리용)

  year: string;
  title: string;

  image?: string;
  file: file; //추가, 저장 필요

  date?: string;
  location?: string;
  description?: string;
}

// store(db) 구조
users (컬렉션)
└── uid123 (문서)
    ├── name: "현서"
    ├── email: "..."
    └── timeline (컬렉션)
        ├── 2020 (문서)
        |     └── items (컬렉션)
        |         |── item1 (문서)
        │         │     ├── title: "졸업식"
        │         │     ├── year: "2020"
        │         │     └── image: "https://..."
        |         └── item2 (문서)
        │               ├── title: "졸업식"
        │               ├── year: "2020"
        │               └── image: "https://..."
        └── 2021 (문서)
              └── items (컬렉션)
                  └── item1 (문서)
                        ├── title: "졸업식"
                        ├── year: "2021"
                        └── image: "https://..."

// storage 구조
  users/{uid}/timeline/{year}/{item.id}/

// 로직
  1. app에서 Timeline 데이터를 fetch
  2. Timeline 내에 TimelineGroup이 수정될 경우(그룹 내 아이템이 하나라도 수정될 경우) updateFlag 변경
  3. TimelineGroup 내에 개별 수정되는 TimelineItem에 대해 updateFlag 변경
  4. saveCardTimeline에 변경된 데이터 하나로 전달
  5. data 내에 TimelineGroup 순회 -> 감지된 updateFlag에 대해 TimelineItem 순회 -> 감지된 updateFlage에 대해 파이어베이스 업데이트 요청

// 예상 데이터 구조

  years: ["2020", "2021", ...] // 데이터 변경이 이루어진 연도들의 배열
  groups: {
  "2020": TimelineItem[], "2021": TimelineItem[], ...
  } // 데이터 변경이 이루어진 연도를 key, TimelineItem[](TimelineGroup.events)를 value로 가지는 object

  TimelineItem: {
    id: string; //추가, 저장 필요
    isUpdated: boolean; // 추가 필요, 저장할 필요는 없음(내부 관리용)
    year: string;
    title: string;
    image?: string;
    date?: string;
    location?: string;
    description?: string;
  }
*/

export async function saveCardTimeline(uid, years, groups) {
  years.forEach((year) => {
    // groups[year]: TimelineItem[]
    groups[year].forEach(async (item) => {
      //    /users/{uid}/timeline/{year}/items/{item.id}
      //ex. /users/UFhaf5vv1bMdVnyVKr50nzXA5x62/timeline/2020/items/item1
      if (item.isUpdated) {
        const ref = doc(db, "users", uid, "timeline", year, "items", item.id);

        // item내 모든 필드가 반드시 유효해야함
        // db에 값이 있어도 app에서 관리하던 데이터의 필드가 유실될 경우 undefined로 덮어쓰여짐
        // 더 안전하게 쓸 방법이 있는지 찾아봐야함..
        const processedItem = {
          id: item.id,
          // isUpdated: item.isUpdated, // 제외
          // isImageUpdated: item.isImageUpdated, // 제외
          year: item.year,
          title: item.title,
          image: item.image,
          // file: item.file, // 제외
          date: item.date,
          location: item.location,
          description: item.description,
        };
        await setDoc(ref, processedItem);
        if (item.isImageUpdated) {
          await saveTimelineImage(uid, year, item.id, item.file);
        }
      }
    });
  });
}

export async function saveTimelineImage(uid, year, itemId, file) {
  const storageRef = ref(storage, `images/timeline/${uid}/${year}/${itemId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

export async function fetchTimeline(uid) {
  const timeline = collection(db, "users", uid, "timeline");
  const snapshot = await getDocs(timeline);

  const timelineData = snapshot.docs.map(async (doc) => {
    const year = doc.id;
    const group = await fetchTimelineItem(uid, year);
    return {
      id: doc.id,
      ...group,
    };
  });
  return timelineData;
}
export async function fetchTimelineItem(uid, year) {
  const items = collection(db, "users", uid, "timeline", year, "items");
  const snapshot = await getDocs(items);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
