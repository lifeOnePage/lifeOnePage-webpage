"use client";

import { useState, useEffect } from "react";
import { auth, firestore } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import AuthOverlay from "./AuthOverlay";
import MemorialPage from "./MemorialPage";
import { fetchUserData } from "../utils/firestoreUtils";

export default function MemorialPageWrapper() {
  const [user, setUser] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [showAuth, setShowAuth] = useState(false); // 로그인 요구 여부
  const [loading, setLoading] = useState(true);
  const [authlayerVisible, setAuthlayerVisible] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        console.log(u);
        setUser(u);
        const userRef = doc(firestore, "users", u.uid);
        const userSnap = await getDoc(userRef);

        // Firestore에 사용자 문서가 없으면 생성
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            phoneNumber: u.phoneNumber,
            createdAt: serverTimestamp(),
          });
        }

        const data = await fetchUserData(u.uid);
        setInitialData(data);
        setShowAuth(false); // 로그인 완료
      } else {
        setShowAuth(true); // 로그인 필요
      }

      setLoading(false); // auth 확인 끝
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>불러오는 중...</div>
    );
  }
  function handleToggleAuth() {
    setAuthlayerVisible(!authlayerVisible);
  }
  console.log(authlayerVisible)

  return (
    <div style={{ position: "relative", fontFamily: "Pretendard" }}>
      {/* 실제 페이지는 유저가 로그인한 경우에만 렌더링 */}
      {/* <button onClick={() => signOut(auth)}>로그아웃</button> */}

      {showAuth && (
        <button
          onClick={() => handleToggleAuth()}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "20px",
            zIndex: 1000,
            backgroundColor: "#7f1d1d",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          직접 만들어볼래요
        </button>
      )}

      <MemorialPage user={user} initialData={initialData} />
      {authlayerVisible && showAuth && (
        <AuthOverlay
          auth={auth}
          firestore={firestore}
          onAuthComplete={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
