"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MAIN_THEME } from "../styles/colorConfig";

export default function SuccessOverlay({ hideOverlay }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      hideOverlay(); // 5초 후 자동 닫기
    }, 3000);
    return () => clearTimeout(timer);
  }, [hideOverlay]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 20, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 25 }}
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "16px 32px",
          borderRadius: "12px",
          fontSize: "1rem",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        저장이 완료되었습니다!
      </motion.div>
    </AnimatePresence>
  );
}
