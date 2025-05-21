// import { Lock, Unlock } from "lucide-react";
import useWindowSize from "../hooks/useWindowSize";
import styles from "./RingCategoryNav.module.css";

const catNames = ["유년시절", "특별한 경험", "소중한 사람"];

export default function RingCategoryNav({
  activeCategory,
  activeSubCategory,
  onCategoryClick,
  forcedCategory,
  onLockCategory,
  forcedSubcategory,
  onSubcategoryClick,
  onLockSubcategory,
}) {
  const { width, height } = useWindowSize();

  const isSmallScreen = width <= 640; // 가로폭 500px 이하 여부
  function LockIcon({ size = isSmallScreen ? 30 : 60, color = "#fff" }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        // fill="white"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }
  function UnlockIcon({ size = isSmallScreen ? 30 : 60, color = "#fff" }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    );
  }
  return (
    <div className={styles.navContainer}>
      {catNames.map((cat) => {
        const isForced = cat === forcedCategory;
        const isActive = cat === activeCategory;

        return (
          <div
            key={cat}
            className={`${styles.navItem} ${
              isForced ? styles.forcedHighlight : ""
            } ${!forcedCategory && isActive ? styles.active : ""}`}
            onClick={() => onCategoryClick(cat)}
          >
            <span>{cat}</span>
            {isActive && (
              <span
                className={styles.lockIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  onLockCategory(cat);
                }}
              >
                {isForced ? <LockIcon size={20} /> : <UnlockIcon size={20} />}
              </span>
            )}
          </div>
        );
      })}

      {activeCategory === "소중한 사람" && (
        <div className={styles.subNavContainer}>
          {["사랑하는 가족", "즐거운 친구들", "귀여운 초코"].map((sub) => {
            const isSubActive = sub === activeSubCategory;
            const isForced = sub === forcedSubcategory;
            return (
              <div>
                <div
                  key={sub}
                  className={`${styles.subNavItem} ${
                    isSubActive ? styles.active : ""
                  }`}
                  onClick={() => {
                    console.log("subcategory click:", sub);
                    onSubcategoryClick(sub);
                  }}
                >
                  <span>{sub}</span>
                  <span
                    className={styles.lockIcon}
                    onClick={(e) => {
                      console.log("subcategory lock:", sub);
                      e.stopPropagation();
                      onLockSubcategory(sub);
                    }}
                  >
                    {isSubActive && (
                      <div>
                        {isForced ? (
                          <LockIcon size={20} />
                        ) : (
                          <UnlockIcon size={20} />
                        )}
                      </div>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
