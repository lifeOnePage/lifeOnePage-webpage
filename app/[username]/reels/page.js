"use client";
import { useParams } from "next/navigation";
import MemorialPage from "../../memorial/MemorialPage";
import { checkIsMe } from "../../utils/checkIsMe";
import { useUser } from "../../contexts/UserContext";
import { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { fetchUserData } from "../../utils/firebaseDb";
import { firestore } from "../../firebase/firebaseConfig";

export default function ViewOrEditPage() {
  const { username } = useParams();
  const { user, initialData, dataLoading, setDataLoading } = useUser();
  const [isMe, setIsMe] = useState(false);
  const [viewUid, setViewUid] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && username) {
      checkIsMe(user, username).then(setIsMe);
    }
    if (!isMe) {
      async function fetchData() {
        // 타인이라면 username을 통해 uid 찾고, 해당 uid로 데이터 조회
        const q = query(
          collection(firestore, "users"),
          where("username", "==", username)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const uid = docSnap.id;
          setViewUid(uid);
          const otherData = await fetchUserData(uid);
          setViewData(otherData);
        } else {
          console.warn("해당 username을 가진 사용자가 존재하지 않음");
        }
        setLoading(false);
      }
      console.log(viewUid, viewData, isMe);
      fetchData();
    } else {
      setDataLoading(true);
    }
  }, [user, username]);

  console.log(loading);
  console.log(dataLoading);
  if (loading || dataLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>불러오는 중...</div>
    );
  }
  console.log(isMe);
  return <MemorialPage uid={viewUid} initialData={viewData} isMe={isMe} />;
}
