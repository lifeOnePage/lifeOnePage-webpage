"use client";

import { useState, useEffect } from "react";
import { auth, firestore } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import AuthOverlay from "./AuthOverlay";
import CardPage from "./CardPage.jsx";
import { useUser } from "../contexts/UserContext";

export default function CardPageWrapper() {
  const [showAuth, setShowAuth] = useState(false); // 로그인 요구 여부
  const [authlayerVisible, setAuthlayerVisible] = useState(false);
  const { user, initialData, dataLoading } = useUser();

  console.log(user, initialData, dataLoading);

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

      <CardPage user={user} initialData={initialData} />
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
