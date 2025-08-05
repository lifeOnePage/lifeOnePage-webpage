import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoFold, GoUnfold } from "react-icons/go";

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
  const [openCat, setOpenCat] = useState("유년시절");
  const [subCat, setSubCat] = useState(null);

  const experienceList = person?.photoGallery?.experience || [];
  const relationshipObj = person?.photoGallery?.relationship || {};
  const relationshipList = Object.values(relationshipObj);

  useEffect(() => {
    if (openCat === "소중한 기억" && experienceList.length > 0) {
      setSubCat(experienceList[0].title);
    } else if (openCat === "소중한 인연" && relationshipList.length > 0) {
      setSubCat(relationshipList[0].name);
    } else {
      setSubCat(null);
    }
  }, [openCat]);

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
      onLockSubcategory(item.title);
    } else if (openCat === "소중한 인연") {
      setSubCat(item.name);
      onLockSubcategory(item.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "absolute",
        left: "20px",
        top: "80vh",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        zIndex: "999",
        padding: "10px 20px",
        alignItems: "flex-start",
        backgroundColor: "#00000088",
        maxWidth: "90vw",
      }}
    >
      {!openCat && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{ cursor: "pointer", color: "white",margin:"10px 0px 20px 20px" }}
          onClick={(e) => handleCatClick(e, "유년시절")}
        >
          <GoFold size={20} />
        </motion.div>
      )}

      <AnimatePresence>
        {openCat && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            style={{ overflow: "hidden" }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{ cursor: "pointer", margin:"10px 0px 0px 20px", color: "white" }}
              onClick={(e) => handleCatClick(e, null)}
            >
              <GoUnfold size={20} />
            </motion.div>

            <motion.div
              layout
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                color: "white",
              }}
            >
              {/* 유년시절 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: openCat === "유년시절" ? "#fff" : "#888",
                }}
                onClick={(e) => handleCatClick(e, "유년시절")}
              >
                유년시절
              </motion.div>

              {/* 소중한 기억 */}
              <motion.div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  style={{
                    cursor: "pointer",
                    fontSize: "1rem",
                    color: openCat === "소중한 기억" ? "#fff" : "#888",
                  }}
                  onClick={(e) => handleCatClick(e, "소중한 기억")}
                >
                  소중한 기억
                </motion.div>
                <AnimatePresence>
                  {openCat === "소중한 기억" && (
                    <>
                      <motion.div
                        key="exp"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "10px 0px",
                          overflowX: "auto",
                        }}
                      >
                        {experienceList.map((exp, idx) => {
                          const selected = subCat === exp.title;
                          return (
                            <div
                              key={idx}
                              onClick={(e) => handleSubCatClick(e, exp)}
                              style={{
                                minWidth: 64,
                                cursor: "pointer",
                                padding: 4,

                                borderRadius: 12,
                                textAlign: "center",
                                color: "white",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <img
                                src={exp.photos?.[0]?.url || "/placeholder.jpg"}
                                alt=""
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  border: selected
                                    ? "2px solid white"
                                    : "2px solid transparent",
                                  marginBottom: 4,
                                }}
                              />
                              <div
                                style={{ fontSize: "12px", fontWeight: 600 }}
                              >
                                {exp.title}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>

                      {/* 상세 설명 영역 */}
                      <motion.div
                        key="exp-desc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          fontSize: "0.9rem",
                          color: "#ddd",
                          whiteSpace: "pre-wrap",
                          textAlign: "left",
                          maxWidth: "250px",
                        }}
                      >
                        {
                          experienceList.find((exp) => exp.title === subCat)
                            ?.description
                        }
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 소중한 인연 */}
              <motion.div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  style={{
                    cursor: "pointer",
                    fontSize: "1rem",
                    color: openCat === "소중한 인연" ? "#fff" : "#888",
                  }}
                  onClick={(e) => handleCatClick(e, "소중한 인연")}
                >
                  소중한 인연
                </motion.div>
                <AnimatePresence>
                  {openCat === "소중한 인연" && (
                    <motion.div
                      key="rel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(64px, 1fr))",
                        gap: "12px",
                        padding: "10px 0px",
                        maxWidth: "400px",
                      }}
                    >
                      {relationshipList.map((rel, idx) => {
                        const selected = subCat === rel.name;
                        return (
                          <div
                            key={idx}
                            onClick={(e) => handleSubCatClick(e, rel)}
                            style={{
                              width: "64px",
                              cursor: "pointer",
                              // padding: 4,
                              borderRadius: 12,
                              textAlign: "center",
                              color: "white",
                            }}
                          >
                            <img
                              src={
                                rel.photos?.[rel.representative ?? 0] ||
                                "/placeholder.jpg"
                              }
                              alt=""
                              style={{
                                width: 64,
                                height: 64,
                                objectFit: "cover",
                                borderRadius: "50%",
                                marginBottom: 4,
                                border: selected
                                  ? "2px solid white"
                                  : "2px solid transparent",
                              }}
                            />
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}
                            >
                              {rel.name}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#ccc",
                                wordBreak: "break-word",
                              }}
                            >
                              {rel.relation}
                            </div>
                          </div>
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
