"use client";

import { useState, useEffect } from "react";
import { auth, firestore } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import AuthOverlay from "./AuthOverlay";
// import MemorialPage from "./MemorialPage";
import { useUser } from "../contexts/UserContext";
import dynamic from "next/dynamic";
const MemorialPage = dynamic(() => import("./MemorialPage"), { ssr: false });


export default function MemorialPageWrapper() {
  const [showAuth, setShowAuth] = useState(false); // 로그인 요구 여부
  const [authlayerVisible, setAuthlayerVisible] = useState(false);
    const { user, initialData, dataLoading } = useUser();

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, async (u) => {
  //     if (u) {
  //       console.log(u);
  //       setUser(u);
  //       const userRef = doc(firestore, "users", u.uid);
  //       const userSnap = await getDoc(userRef);

  //       // Firestore에 사용자 문서가 없으면 생성
  //       if (!userSnap.exists()) {
  //         await setDoc(userRef, {
  //           phoneNumber: u.phoneNumber,
  //           createdAt: serverTimestamp(),
  //         });
  //       }

  //       const data = await fetchUserData(u.uid);
  //       setInitialData(data);
  //       setShowAuth(false); // 로그인 완료
  //     } else {
  //       setShowAuth(true); // 로그인 필요
  //     }

  //     setLoading(false); // auth 확인 끝
  //   });

  //   return () => unsub();
  // }, []);
  console.log(user, initialData,dataLoading)

  if (dataLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>불러오는 중...</div>
    );
  }
  function handleToggleAuth() {
    setAuthlayerVisible(!authlayerVisible);
  }
  

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

      <MemorialPage uid={user?.uid} initialData={initialData} />
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
