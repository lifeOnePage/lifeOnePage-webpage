// utils/checkIsMe.js
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig"; // Firestore 인스턴스

export async function checkIsMe(loggedInUser, username) {
  if (!loggedInUser || !username) return false;

  try {
    // 현재 로그인한 유저의 정보 가져오기
    const userDocRef = doc(firestore, "users", loggedInUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    return userData.username === username;
  } catch (error) {
    console.error("checkIsMe 에러:", error);
    return false;
  }
}
