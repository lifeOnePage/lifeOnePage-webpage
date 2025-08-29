import { BLACK } from "../styles/colorConfig";

export default function MainHeader({ setMode, setTrigger }) {
  return (
    <div
      style={{
        position: "relative",
        margin: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // borderBottom: "1px solid #ffffff",
        padding: "0 16px",
        backgroundColor: "#ffffff",
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
          borderRight: "2px solid #1a1a1a",
          fontWeight: 500,
        }}
      >
        The Life Gallery
      </div>
      <div
        style={{
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          display: "flex",
          fontWeight: 500,
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
            setTrigger(true)
          }}
        >
          About
        </div>
        <div
          style={{
            justifyContent: "end",
            alignItems: "end",
            paddingLeft: 30,
            display: "flex",
            fontWeight: 500,
          }}
          onClick={() => setMode("mypage")}
        >
          Mypage
        </div>
      </div>
    </div>
  );
}
