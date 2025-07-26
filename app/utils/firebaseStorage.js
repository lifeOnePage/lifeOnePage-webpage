import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase/firebaseConfig";
import { compressImage } from "../utils/compressImage";

const storage = getStorage(app);

/**
 * 프로필 이미지 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @param {string} uid - 사용자 UID
 * @returns {string} - 업로드된 이미지의 다운로드 URL
 */
export async function uploadProfileImage(file, uid) {
  console.log(file, uid);
  const imageRef = ref(storage, `users/${uid}/profile.jpg`);
  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
}

/**
 * 세부 항목 기반 이미지 배열 업로드 및 URL 반환
 * @param {File[]} files
 * @param {string} uid
 * @param {string} category - 예: childhood, experience, relationship
 * @param {string} subId - 세부 항목 고유 ID or index (경험1, 관계2 등)
 * @returns {Promise<string[]>} 업로드된 URL 배열
 */
// export async function uploadGalleryImages(
//   files,
//   uid,
//   category,
//   subId = "default"
// ) {
//   const urls = [];
//   for (let i = 0; i < files.length; i++) {
//     const file = files[i];
//     const imageRef = ref(
//       storage,
//       `users/${uid}/${category}/${subId}/image_${Date.now()}_${i}.jpg`
//     );
//     await uploadBytes(imageRef, file);
//     const url = await getDownloadURL(imageRef);
//     urls.push(url);
//   }
//   console.log(urls, files);
//   return urls;
// }

export async function uploadGalleryImagesWithProgress(
  files,
  uid,
  category,
  subId = "default",
  onProgress
) {
  const urls = [];
  const compressed = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // 용량이 4MB 이상이면 리사이즈 및 압축
    if (file.size > 4 * 1024 * 1024) {
      file = await compressImage(file, { maxWidth: 1024, quality: 0.7 });
      compressed.push(file);
    }

    const imageRef = ref(
      storage,
      `users/${uid}/${category}/${subId}/image_${Date.now()}_${i}.jpg`
    );

    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);
    urls.push(url);

    if (onProgress) {
      const percent = Math.round(((i + 1) / files.length) * 100);
      onProgress(percent);
    }
  }
  console.log();
  return urls;
}
