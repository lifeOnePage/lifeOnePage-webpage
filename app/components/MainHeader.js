"use client";
import { BLACK } from "../styles/colorConfig";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function MainHeader({ setMode, setTrigger }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("auth state changed:", firebaseUser);
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        margin: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #ffffff",
        padding: "0 16px",
        backgroundColor: "#00000099",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 1000,
        color: BLACK,
        // backdropFilter: "brightness(5) blur(40px)",
      }}
    >
      <div
        style={{
          flex: 1,
          // borderRight: "2px solid #1a1a1a",
          fontWeight: 500,
          color:"#fff"
        }}
      >
        The Life Museum
      </div>
      <div
        style={{
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          display: "flex",
          fontWeight: 500,
          color:"#fff"
        }}
      >
        <div
          style={{
            justifyContent: "end",
            alignItems: "end",
            // padding: 30,
            flex: 1,
            display: "flex",
            fontWeight: 500,
          }}
        />
        <div
          style={{
            justifyContent: "end",
            alignItems: "end",
            paddingLeft: 30,
            display: "flex",
            fontWeight: 500,
          }}
          onClick={() => {
            setMode("about");
            setTrigger(true);
          }}
        >
          About
        </div>
        {user ? (
          <div
            style={{ paddingLeft: 30, cursor: "pointer" }}
            onClick={() => router.push("/login")}
          >
            MyPage
          </div>
        ) : (
          <div
            style={{ paddingLeft: 30, cursor: "pointer" }}
            onClick={() => router.push("/login")}
          >
            Login
          </div>
        )}
      </div>
    </div>
  );
}
