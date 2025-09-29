import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SlArrowDown, SlArrowRight } from "react-icons/sl";

export default function GalleryNav({
  person,
  activeCategory,
  activeSubCategory,
  onCategoryClick,
  forcedCategory,
  onLockCategory,
  forcedSubcategory,
  onSubcategoryClick,
  onLockSubcategory,
}) {
  const shouldReduce = useReducedMotion();

  const [openCat, setOpenCat] = useState("유년시절");
  const [subCat, setSubCat] = useState(null);

  const experienceList = person?.photoGallery?.experience || [];
  const relationshipObj = person?.photoGallery?.relationship || {};
  const relationshipList = Object.values(relationshipObj);
  const UI = {
    THUMB: 64, // 썸네일 지름(px)
    GAP: 10, // 아이템 간 간격
    PADDING: 8, // 칩 내부 패딩
    RADIUS: 12, // 칩 둥근모서리
    BORDER_ON: "1px solid rgba(255,255,255,0.65)",
    BORDER_OFF: "1px solid rgba(255,255,255,0.15)",
    BG_ON: "rgba(255,255,255,0.08)",
    BG_OFF: "transparent",
  };

  useEffect(() => {
    if (openCat === "소중한 기억" && experienceList.length > 0) {
      setSubCat((prev) => prev ?? experienceList[0].title);
    } else if (openCat === "소중한 인연" && relationshipList.length > 0) {
      setSubCat((prev) => prev ?? relationshipList[0].name);
    } else {
      setSubCat(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCat, experienceList.length, relationshipList.length]);

  const handleCatClick = (e, cat) => {
    setOpenCat(cat);
    e.stopPropagation();
    onCategoryClick(cat);
    onLockCategory(cat);
  };

  const handleSubCatClick = (e, item) => {
    e.stopPropagation();
    if (openCat === "소중한 기억") {
      setSubCat(item.title);
      onLockSubcategory?.(item.title);
      onSubcategoryClick?.(item.title);
    } else if (openCat === "소중한 인연") {
      setSubCat(item.name);
      onLockSubcategory?.(item.name);
      onSubcategoryClick?.(item.name);
    }
  };

  /** ───────────── Motion variants (staggered-menu 느낌) ───────────── */
  const panelVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduce ? 0 : 0.35,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: shouldReduce ? 0 : 0.06,
      },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 420, damping: 28, mass: 0.6 },
    },
  };

  const subRowVariants = {
    hidden: { opacity: 0, clipPath: "inset(0 0 100% 0 round 12px)" },
    show: {
      opacity: 1,
      clipPath: "inset(0 0 0% 0 round 12px)",
      transition: {
        duration: shouldReduce ? 0 : 0.35,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: shouldReduce ? 0 : 0.04,
      },
    },
    exit: {
      opacity: 0,
      clipPath: "inset(0 0 100% 0 round 12px)",
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  const chipVariants = {
    hidden: { opacity: 0, y: 6, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 360, damping: 26, mass: 0.7 },
    },
  };

  const sectionTitleStyle = (active) => ({
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontSize: active ? "1rem" : "0.8rem",
    color: active ? "#fff" : "#9ca3af",
    fontWeight: active ? 700 : 300,
    display: "flex",
    width: "auto",
    // alignItems: "center",
    gap: 8,
    userSelect: "none",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.4, ease: "easeOut" }}
      style={{
        // position: "absolute",
        // top:600,
        display: "flex",
        flexDirection: "column",
        // gap: 16,
        zIndex: 999,
        padding: "10px 16px",
        color: "white",
        // pointerEvents: "auto",
      }}
    >
      {/* 토글 핸들 (닫힘 상태) */}
      {!openCat && (
        <motion.button
          type="button"
          whileHover={shouldReduce ? {} : { scale: 1.05 }}
          whileTap={shouldReduce ? {} : { scale: 0.98 }}
          style={{
            cursor: "pointer",
            color: "white",
            margin: "6px 0",
            background: "transparent",
            border: "none",
          }}
          onClick={(e) => handleCatClick(e, "유년시절")}
          aria-label="메뉴 열기"
        >
          <SlArrowRight size={20} />
        </motion.button>
      )}

      {/* 상단 닫기 버튼 */}
      {openCat && (
        <motion.button
          type="button"
          variants={itemVariants}
          whileHover={shouldReduce ? {} : { scale: 1.04 }}
          whileTap={shouldReduce ? {} : { scale: 0.98 }}
          style={{
            cursor: "pointer",
            margin: "10px 0 20px",
            color: "white",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          onClick={(e) => handleCatClick(e, null)}
          aria-label="메뉴 닫기"
          aria-expanded={!!openCat}
        >
          <SlArrowDown size={18} />
          <span style={{ fontSize: 14, opacity: 0.9 }}>접기</span>
        </motion.button>
      )}

      {/* 패널 (열림 상태) */}
      <AnimatePresence initial={false} mode="popLayout">
        {openCat && (
          <motion.div
            key="panel"
            layout
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              overflow: "hidden",
              // background: "rgba(0,0,0,0.35)",
              // border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              backdropFilter: "blur(6px)",
              padding: "0px 20px",
              // minWidth: 220,
              // maxWidth: 420,
            }}
          >
            {/* 상위 카테고리 리스트 */}
            <motion.div
              layout
              style={{ display: "flex", flexDirection: "column" }}
            >
              {/* 유년시절 */}
              <div style={{ padding: "20px 0px" }}>
                <motion.div
                  layout
                  variants={itemVariants}
                  whileHover={shouldReduce ? {} : { x: 2 }}
                  style={sectionTitleStyle(openCat === "유년시절")}
                  onClick={(e) => handleCatClick(e, "유년시절")}
                  role="button"
                  aria-pressed={openCat === "유년시절"}
                >
                  유년시절
                </motion.div>
              </div>

              {/* 소중한 기억 */}
              <motion.div
                layout
                variants={itemVariants}
                style={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  borderTop: "1px solid #555",
                  padding: "20px 0px",
                  // background: openCat === "소중한 기억" ? "#00000055" : "none",
                  // padding:openCat === "소중한 기억" ? "15px 20px": 0,
                  // borderRadius:20
                }}
              >
                <motion.div
                  layout
                  whileHover={shouldReduce ? {} : { x: 2 }}
                  style={sectionTitleStyle(openCat === "소중한 기억")}
                  onClick={(e) => handleCatClick(e, "소중한 기억")}
                  role="button"
                  aria-pressed={openCat === "소중한 기억"}
                >
                  소중한 기억
                </motion.div>

                <AnimatePresence initial={false} mode="wait">
                  {openCat === "소중한 기억" && (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        // flex:1,
                        overflowX: "scroll",
                        flexDirection: "column",
                      }}
                    >
                      {/* 썸네일 칩 행 (1열) */}
                      <motion.div
                        key="exp-row"
                        layout
                        variants={subRowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        style={{
                          display: "flex",
                          width: "auto",
                          // flex: 1,
                          // flexDirection: "column",
                          gap: UI.GAP,
                          // padding: "10px 0 4px",
                          // overflowX: "scroll",
                        }}
                      >
                        {experienceList.map((exp, idx) => {
                          const selected = subCat === exp.title;
                          const thumb =
                            exp.photos?.[0]?.url || "/placeholder.jpg";
                          return (
                            <motion.button
                              type="button"
                              key={idx}
                              layout
                              variants={chipVariants}
                              whileHover={
                                shouldReduce ? {} : { y: -2, scale: 1.01 }
                              }
                              whileTap={shouldReduce ? {} : { scale: 0.99 }}
                              onClick={(e) => handleSubCatClick(e, exp)}
                              style={{
                                width: 100,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 12,
                                cursor: "pointer",
                                borderRadius: UI.RADIUS,
                                textAlign: "left",
                                color: "white",
                                background: selected ? UI.BG_ON : UI.BG_OFF,
                                // border: selected ? UI.BORDER_ON : UI.BORDER_OFF,
                                padding: UI.PADDING,
                              }}
                              aria-pressed={selected}
                            >
                              <img
                                src={thumb}
                                alt=""
                                style={{
                                  width: UI.THUMB,
                                  height: UI.THUMB,
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  border: selected
                                    ? "2px solid white"
                                    : "2px solid transparent",
                                  flex: "0 0 auto",
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    // whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={exp.title}
                                >
                                  {exp.title}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>

                      {/* 설명 */}
                      <motion.div
                        key="exp-desc"
                        layout
                        variants={subRowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        style={{
                          fontSize: "0.9rem",
                          color: "#ddd",
                          whiteSpace: "pre-wrap",
                          textAlign: "left",
                          lineHeight: 1.35,
                          margin: "10px 0px",
                        }}
                      >
                        {
                          experienceList.find((exp) => exp.title === subCat)
                            ?.description
                        }
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 소중한 인연 */}
              <motion.div
                layout
                variants={itemVariants}
                style={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  borderTop: "1px solid #555",
                  padding: "20px 0px",
                }}
              >
                <motion.div
                  layout
                  whileHover={shouldReduce ? {} : { x: 2 }}
                  style={sectionTitleStyle(openCat === "소중한 인연")}
                  onClick={(e) => handleCatClick(e, "소중한 인연")}
                  role="button"
                  aria-pressed={openCat === "소중한 인연"}
                >
                  소중한 인연
                </motion.div>

                <AnimatePresence initial={false} mode="wait">
                  {openCat === "소중한 인연" && (
                    <motion.div
                      key="rel-grid"
                      layout
                      variants={subRowVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      style={{
                        display: "flex",
                        // flexDirection: "column",
                        gap: UI.GAP,
                        padding: "10px 0 0",
                        // maxWidth: 420,
                        // maxHeight: 200,
                        overflowX: "scroll",
                      }}
                    >
                      {relationshipList.map((rel, idx) => {
                        const selected = subCat === rel.name;
                        const thumb =
                          rel.photos?.[rel.representative ?? 0] ||
                          "/placeholder.jpg";
                        return (
                          <motion.button
                            type="button"
                            key={idx}
                            layout
                            variants={chipVariants}
                            whileHover={
                              shouldReduce ? {} : { y: -2, scale: 1.01 }
                            }
                            whileTap={shouldReduce ? {} : { scale: 0.99 }}
                            onClick={(e) => handleSubCatClick(e, rel)}
                            style={{
                              width: 100,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 12,
                              cursor: "pointer",
                              borderRadius: UI.RADIUS,
                              textAlign: "left",
                              color: "white",
                              background: selected ? UI.BG_ON : UI.BG_OFF,
                              // border: selected ? UI.BORDER_ON : UI.BORDER_OFF,
                              padding: UI.PADDING,
                            }}
                            aria-pressed={selected}
                            title={`${rel.name} · ${rel.relation || ""}`}
                          >
                            <img
                              src={thumb}
                              alt=""
                              style={{
                                width: UI.THUMB,
                                height: UI.THUMB,
                                objectFit: "cover",
                                borderRadius: "50%",
                                border: selected
                                  ? "2px solid white"
                                  : "2px solid transparent",
                                flex: "0 0 auto",
                              }}
                            />
                            <div
                              style={{
                                width: 100,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  // whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  // textOverflow: "ellipsis",
                                }}
                              >
                                {rel.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#ccc",
                                  // whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  // textOverflow: "ellipsis",
                                }}
                              >
                                {rel.relation}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
