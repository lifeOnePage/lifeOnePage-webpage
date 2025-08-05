import { auth, firestore } from "../firebase/firebaseConfig";
import AuthOverlay from "../memorial/AuthOverlay";
import RingPictogram from "./RingPictogram";
import TabPlanePictogram from "./TabPlanePictogram";
import formatDate from "../utils/formatDate";
import { useEffect } from "react";

export default function Mypage({ id, setId, initialData }) {
  console.log(initialData);
  useEffect(() => {
    if (initialData && initialData.username) {
      setId(initialData.username);
    }
  }, [initialData]);
  return initialData ? (
    <div>
      <div>
        <div style={{ fontSize: 30 }}>
          반가워요, <strong>{initialData.profile.name}님</strong>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 40 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignContent: "center",
              paddingRight:20,
              borderRight: "1px solid #fff",
            }}
          >
            <TabPlanePictogram size={120} />
            {initialData.cardUpdatedAt
              ? `최근 수정일 ${formatDate(
                  initialData.cardUpdatedAt?.toDate()
                )} `
              : "아직 비어있어요"}
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignContent: "center",
            }}
          >
            <RingPictogram size={120} />
            {initialData.pageUpdatedAt
              ? `최근 수정일 ${formatDate(
                  initialData.pageUpdatedAt?.toDate()
                )} `
              : "아직 비어있어요"}
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 400,
            padding: "0px 10px",
            color: "#fff",
            marginTop: 50,
          }}
        >
          ID
        </div>
        <input
          placeholder="ID 입력"
          type="text"
          value={id}
          onChange={(e) => setId(e.value)}
          style={{
            margin: "10px 0px",
            padding: "12px 16px",
            border: "1px solid #fff",
            backgroundColor: "#ffffff22",
            borderRadius: "20px",
            width: "100%",
          }}
        />
        <div
          style={{ color: "#ffffff55" }}
        >{`https://theLifeGallery/page/${id}`}</div>
        <div> </div>
      </div>
      <div style={{ marginTop: 50 }}>
        <div
          style={{
            display: "inline-flex",
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 400,
            padding: "0px 10px",
            color: "#fff",
          }}
        >
          PAYMENT METHOD
        </div>
      </div>
    </div>
  ) : (
    <div>
      시작해볼까요?
      <AuthOverlay
        auth={auth}
        firestore={firestore}
        onAuthComplete={() => {
          console.log(initialData);
        }}
      />
    </div>
  );
}
