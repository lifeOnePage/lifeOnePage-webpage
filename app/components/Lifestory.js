"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BLACK } from "../styles/colorConfig";
import {
  loadLifestorySection,
  saveLifestorySection,
} from "../utils/firebaseDb";

export default function LifestorySection({
  userId,
  onSaved,
  userName = "00",
  assistantName = "ㅁㅁ",
  isPreview, // ✅ 미리보기 전용 분기
}) {
  // --- Steps: 'intro' | 'style' | 'count' | 'qa' | 'result'
  const [step, setStep] = useState("intro");

  // --- Step 1: 스타일 선택
  const STYLE_OPTIONS = ["진중한", "낭만적인", "재치있는", "신비로운"];
  const [selectedStyle, setSelectedStyle] = useState(null);

  // --- Step 2: 질문 개수
  const COUNT_OPTIONS = [5, 10];
  const [questionCount, setQuestionCount] = useState(null);

  // --- Step 3: Q&A
  const [questions, setQuestions] = useState([]); // string[]
  const [answers, setAnswers] = useState([]); // string[]
  const [currentIdx, setCurrentIdx] = useState(0);

  /**
   * ✅ 중복 질문 답변 보존 맵 (질문 텍스트 → 답변)
   */
  const [answerMap, setAnswerMap] = useState({});

  // --- Final(결과/저장)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [shouldFetchOnQA, setShouldFetchOnQA] = useState(true);

  /**
   * ✅ 결과 화면 상태
   */
  const [hasSaved, setHasSaved] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(true);

  const currentQuestion = questions[currentIdx] ?? "";
  const currentAnswer = answers[currentIdx] ?? "";

  // ---------------------------------------------------------------------------
  // 🔹 Firebase 하이드레이션 (처음 접속 시)
  //    - 저장된 lifestory가 있으면 스토리/질문/답변/스타일을 상태로 주입
  //    - 프리뷰 모드에서도 동일하게 로드하되, 렌더는 아래의 프리뷰 전용 분기에서 수행
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!userId) {
        setIsBootLoading(false);
        return;
      }
      try {
        const saved = await loadLifestorySection(userId);
        if (cancelled) return;

        // 저장 구조를 안전하게 접근 (saved?.lifestory가 없을 수도 있으므로)
        const lifestory = saved?.lifestory || saved || null;

        if (!lifestory) {
          // 저장된 게 없다면 초기 상태
          setStep("intro");
          setIsBootLoading(false);
          return;
        }

        const {
          style = null,
          questions: savedQuestions = [],
          answers: savedAnswers = [],
          story = "",
        } = lifestory;

        // 스타일/개수 프리셀렉트
        setSelectedStyle(style);
        setQuestionCount(savedQuestions?.length || null);

        // 질문/답변/맵 하이드레이션
        setQuestions(savedQuestions);
        setAnswers(savedAnswers);
        const hydMap = {};
        savedQuestions.forEach((q, i) => (hydMap[q] = savedAnswers[i] ?? ""));
        setAnswerMap(hydMap);

        // 스토리 상태
        if (story && story.trim()) {
          setGeneratedStory(story);
          setHasSaved(true);
          setIsEditingResult(false);
          setStep("result");
          setShouldFetchOnQA(false);
        } else if (savedQuestions.length > 0) {
          // 스토리는 없고 Q/A만 있는 경우
          const nextIdx = Math.max(
            0,
            savedAnswers.findIndex((a) => !a || !String(a).trim())
          );
          setCurrentIdx(nextIdx === -1 ? savedQuestions.length - 1 : nextIdx);
          setStep("qa");
          setShouldFetchOnQA(false);
        } else if (style) {
          setStep("count");
        } else {
          setStep("intro");
        }
      } catch (e) {
        console.warn("[hydrate] load error:", e);
        setStep("intro");
      } finally {
        if (!cancelled) setIsBootLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---------------------------------------------------------------------------
  // 🔹 QA 진입 시 질문 fetch
  //    - 프리뷰 모드에선 동작 불필요 → 즉시 스킵
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isPreview) return; // ✅ 프리뷰에서는 건너뛰기
    if (step === "qa" && selectedStyle && questionCount) {
      if (!shouldFetchOnQA) {
        setShouldFetchOnQA(true);
        return;
      }
      (async () => {
        const qs = await BLACKBOX_fetchQuestions(selectedStyle, questionCount);
        setQuestions(qs);
        const restored = qs.map((q) => answerMap[q] ?? "");
        setAnswers(restored);
        setCurrentIdx(0);
      })();
    }
  }, [step, selectedStyle, questionCount, shouldFetchOnQA, isPreview]); // eslint-disable-line

  // ---------------------------- Navigation Handlers ----------------------------
  const goNextFromIntro = () => setStep("style");
  const goNextFromStyle = () => selectedStyle && setStep("count");
  const goNextFromCount = () => {
    if (!questionCount) return;
    setShouldFetchOnQA(true);
    setStep("qa");
  };

  const handlePrevQA = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    } else {
      setStep("count");
    }
  };

  const handleNextQA = async () => {
    if (currentIdx === questions.length - 1) {
      setIsGenerating(true);
      try {
        const story = await BLACKBOX_generateStory({
          style: selectedStyle,
          questions,
          answers,
          userName,
        });
        setGeneratedStory(story);
        setHasSaved(false);
        setIsEditingResult(true);
        setStep("result");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
  };

  const handleDotClick = (idx) => {
    if (idx <= currentIdx) setCurrentIdx(idx);
  };

  // ---------------------------- 결과 재생성 / 저장 ----------------------------
  const handleRegenerate = () => {
    setGeneratedStory("");
    setHasSaved(false);
    setIsEditingResult(true);
    setStep("style");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await BLACKBOX_saveStory({
        userId: userId ?? "mock-user",
        style: selectedStyle,
        questions,
        answers,
        story: generatedStory,
      });

      onSaved?.({
        style: selectedStyle,
        count: questionCount,
        questions,
        answers,
        story: generatedStory,
      });

      setHasSaved(true);
      setIsEditingResult(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------- Animations ----------------------------
  const slide = {
    initial: { x: 24, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.25 } },
    exit: { x: -24, opacity: 0, transition: { duration: 0.2 } },
  };
  const fadeUp = {
    initial: { y: 18, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: { y: -12, opacity: 0, transition: { duration: 0.2 } },
  };

  // ===========================================================================
  // ✅ 프리뷰 전용 렌더링 (isPreview === true)
  //    - 저장된 스토리가 있으면: 아래→위 슬라이드 업 애니메이션으로 표시
  //    - 없으면: 안내 문구 표시
  //    - 어떤 에디팅/버튼/스텝 UI도 노출 X
  // ===========================================================================
  if (isPreview) {
    return (
      <div style={{ position: "relative", width: "100%", minHeight: "100vh" }}>
        {/* 로딩 */}
        <AnimatePresence>
          {isBootLoading && (
            <motion.div
              key="bootloading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={overlay}
            >
              <Spinner />
              <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                불러오는 중이에요...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 콘텐츠 */}
        {!isBootLoading && (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              minHeight: "100vh",
              padding: 24,
              background: BLACK,
            }}
          >
            <AnimatePresence mode="wait">
              {generatedStory?.trim() ? (
                <motion.section
                  key="story"
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    width: "min(768px, 92vw)",
                    background: BLACK,
                    // border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    boxShadow: "0 28px 28px rgba(0,0,0,1)",
                    background: "#1a1a1a",
                    padding: "28px 28px 30px",
                  }}
                >
                  {/* 상단 메타(이름/스타일 태그) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection:"column",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    
                    <p
                      style={{
                        fontSize: "3rem",
                        fontFamily: "Cormorant Garamond",
                        fontStyle: "oblique 40deg",
                      }}
                    >
                      <style>
                        @import
                        url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&display=swap');
                      </style>
                      Life story
                    </p>
                    <p style={{ color: "#aaa" }}>
                      {userName}님의 생애문
                    </p>
                    {/* <div
                      style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}
                    >
                      {userName}님의 생애문
                    </div> */}
                    {/* {selectedStyle && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: "#111",
                          color: "#fff",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {selectedStyle}
                      </span>
                    )} */}
                  </div>

                  {/* 본문 */}
                  <article
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.85,
                      fontSize: 16,
                      color: "#fafafa",
                      fontStyle: "italic",
                    }}
                  >
                    {generatedStory}
                  </article>
                </motion.section>
              ) : (
                <motion.section
                  key="empty"
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    width: "min(780px, 92vw)",
                    textAlign: "center",
                    color: "#888",
                    background: BLACK,
                    border: "1px dashed #d1d5db",
                    borderRadius: 14,
                    padding: "40px 24px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    아직 생애문이 작성되지 않았어요
                  </h2>
                  <p style={{ marginTop: 10, fontSize: 16, opacity: 0.9 }}>
                    편집 화면에서 질문에 답하고 <strong>생애문 생성</strong>을
                    완성해 보세요.
                  </p>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // ⬇︎ 아래부터는 편집 모드 (기존 플로우 유지)
  // ===========================================================================
  return (
    <div style={wrap}>
      <div style={sheet}>
        <AnimatePresence mode="wait">
          {/* ---------------------------- Intro ---------------------------- */}
          {step === "intro" && (
            <motion.section
              key="intro"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                ...section,
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ margin: 0, fontSize: 22, fontWeight: 700 }}
              >
                당신의 이야기를 알려주세요
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, fontSize: 16, opacity: 0.85 }}
              >
                <strong>{userName}</strong>님의 생애문을 함께 정성스럽게 작성해
                드릴게요.
                <br />
                시작해볼까요?
              </motion.p>
              <div style={{ marginTop: 20 }}>
                <Primary onClick={goNextFromIntro}>시작하기</Primary>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#999", marginTop: 20 }}>
                약 5분~10분 정도 소요돼요.
              </p>
            </motion.section>
          )}

          {/* ---------------------------- Style 선택 ---------------------------- */}
          {step === "style" && (
            <motion.section
              key="style"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              style={section}
            >
              <Header
                title="어떤 분위기의 생애문을 원하시나요?"
                subtitle="원하는 스타일을 선택해 주세요."
              />
              <div style={grid4}>
                {STYLE_OPTIONS.map((label) => (
                  <StyleCard
                    key={label}
                    label={label}
                    active={selectedStyle === label}
                    onClick={() => setSelectedStyle(label)}
                  />
                ))}
              </div>
              <Footer>
                <Primary disabled={!selectedStyle} onClick={goNextFromStyle}>
                  다음
                </Primary>
              </Footer>
            </motion.section>
          )}

          {/* ---------------------------- 질문 개수 선택 ---------------------------- */}
          {step === "count" && (
            <motion.section
              key="count"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              style={section}
            >
              <Header
                title={`질문 개수를 고를게요`}
                subtitle={`몇 개의 질문에 답하시겠어요? 더 많은 질문에 대답하면 ${userName}님의 이야기를 보다 잘 담을 수 있어요.`}
              />
              <PrevButton onClick={() => setStep("style")} />
              <div style={grid2}>
                {COUNT_OPTIONS.map((cnt) => (
                  <CountCard
                    key={cnt}
                    label={`${cnt}개`}
                    active={questionCount === cnt}
                    onClick={() => setQuestionCount(cnt)}
                  />
                ))}
              </div>
              <Footer>
                <Primary disabled={!questionCount} onClick={goNextFromCount}>
                  다음
                </Primary>
              </Footer>
            </motion.section>
          )}

          {/* ---------------------------- Q&A ---------------------------- */}
          {step === "qa" && (
            <motion.section
              key="qa"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              style={section}
            >
              <ProgressDots
                total={questions.length}
                current={currentIdx}
                onDotClick={handleDotClick}
              />

              {/* 질문 카드 + 좌상단 이전 버튼 */}
              <div style={{ position: "relative", marginTop: 16 }}>
                <PrevButton onClick={handlePrevQA} />
                <motion.div
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  style={qaCard}
                >
                  <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 6 }}>
                    {`질문 ${currentIdx + 1} / ${questions.length}`}
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}
                  >
                    {currentQuestion}
                  </div>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => {
                      const v = e.target.value;
                      const q = currentQuestion;
                      setAnswers((arr) => {
                        const copy = [...arr];
                        copy[currentIdx] = v;
                        return copy;
                      });
                      setAnswerMap((prev) => ({ ...prev, [q]: v }));
                    }}
                    placeholder="여기에 답변을 적어주세요"
                    style={textarea}
                  />
                </motion.div>
              </div>

              <Footer>
                <Secondary onClick={handlePrevQA}>이전</Secondary>
                <Primary
                  onClick={handleNextQA}
                  disabled={!currentAnswer.trim() || isGenerating}
                >
                  {currentIdx === questions.length - 1
                    ? "생애문 생성하기!"
                    : "다음"}
                </Primary>
              </Footer>

              {/* 생성 오버레이 */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={overlay}
                  >
                    <Spinner />
                    <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                      생성 중이에요...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* ---------------------------- 결과 ---------------------------- */}
          {step === "result" && (
            <motion.section
              key="result"
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              style={section}
            >
              <ProgressDots
                total={questions.length}
                current={questions.length - 1}
                onDotClick={(i) => {
                  setStep("qa");
                  setCurrentIdx(i);
                }}
              />

              <div style={{ position: "relative", marginTop: 16 }}>
                <PrevButton
                  onClick={() => {
                    setStep("qa");
                    setCurrentIdx(questions.length - 1);
                  }}
                />
                <motion.div
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  style={qaCard}
                >
                  <div
                    style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}
                  >
                    생성된 생애문
                  </div>

                  {/* 안내문구(인풋 바깥) */}
                  <p style={{ margin: "0 0 8px", fontSize: 16, opacity: 0.7 }}>
                    생애문 생성 초안입니다. 내용을 직접 원하시는대로 다듬은 뒤
                    저장할 수 있어요.
                  </p>

                  {/* 저장 전: 편집 / 저장 후: 읽기 */}
                  {isEditingResult ? (
                    <textarea
                      value={generatedStory}
                      onChange={(e) => setGeneratedStory(e.target.value)}
                      style={{ ...textarea, minHeight: 220 }}
                    />
                  ) : (
                    <div
                      onClick={() => {
                        setIsEditingResult(true);
                        setHasSaved(false);
                      }}
                      style={{
                        border: "1px dashed #9ca3af",
                        borderRadius: 12,
                        padding: 14,
                        background: BLACK,
                        cursor: "text",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                      }}
                      title="클릭하여 직접 수정할 수 있어요"
                    >
                      {generatedStory}
                    </div>
                  )}

                  {!isEditingResult && (
                    <p
                      style={{ margin: "8px 0 0", fontSize: 16, opacity: 0.7 }}
                    >
                      클릭하면 직접 수정할 수 있어요
                    </p>
                  )}
                </motion.div>
              </div>

              <Footer>
                <Secondary onClick={handleRegenerate}>다시 생성하기</Secondary>
                {!hasSaved && (
                  <Primary
                    onClick={handleSave}
                    disabled={!generatedStory.trim() || isSaving}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </Primary>
                )}
              </Footer>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** -------------------- UI atoms -------------------- */
function Header({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 22, margin: 0, fontWeight: 600 }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ opacity: 0.8, margin: "6px 0 0" }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

function StyleCard({ label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        ...card,
        borderColor: active ? "fafafa" : "#fafafa11",
        boxShadow: active ? "0 0 0 3px rgba(255, 255, 255, 0.5)" : "none",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
        {styleDesc[label] || ""}
      </div>
    </motion.button>
  );
}

const styleDesc = {
  진중한: "차분하고 깊이 있게.",
  낭만적인: "따뜻하고 서정적으로.",
  재치있는: "위트 있고 가볍게.",
  신비로운: "몽환적이고 은유적으로.",
};

function CountCard({ label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        ...card,
        borderColor: active ? "fafafa" : "#fafafa11",
        boxShadow: active ? "0 0 0 3px rgba(255, 255, 255, 0.5)" : "none",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{label}</div>
    </motion.button>
  );
}

function Primary({ children, onClick, disabled }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 48,
        minWidth: 120,
        padding: "0 18px",
        borderRadius: 12,
        border: "1px solid #444",
        background: disabled ? "#fafafa22" : "#00000099",
        color: disabled ? "#888" : "#fff",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}

function Secondary({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        height: 48,
        minWidth: 100,
        padding: "0 16px",
        borderRadius: 12,
        border: "1px solid #444",
        background: BLACK,
        color: "#e5e7eb",
        fontWeight: 700,
      }}
    >
      {children}
    </motion.button>
  );
}

function ProgressDots({ total, current, onDotClick }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {new Array(Math.max(total, 0)).fill(0).map((_, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const bg =
          state === "done" ? "none" : state === "current" ? "#fafafa" : "none";
        const scale = state === "current" ? 1.2 : 1;
        return (
          <motion.button
            key={i}
            onClick={() => onDotClick(i)}
            whileHover={{ scale: state === "todo" ? 1.05 : 1.1 }}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: bg,
              border: "1px solid #fafafa",
              cursor: i <= current ? "pointer" : "default",
            }}
            animate={{ scale }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            aria-label={`질문 ${i + 1}`}
            title={`질문 ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

function PrevButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      style={{
        position: "absolute",
        top: -100,
        left: -8,
        height: 40,
        borderRadius: 999,
        color: "#fafafa",
        display: "flex",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#fafafa"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      이전으로
    </motion.button>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        border: "3px solid rgba(255,255,255,.2)",
        borderTopColor: "#fff",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

// Inject keyframes once
if (typeof document !== "undefined") {
  const id = "lifestory-keyframes";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg) } }`;
    document.head.appendChild(style);
  }
}

/** -------------------- Styles -------------------- */
const wrap = {
  width: "100%",
  maxWidth: 768,
  height: "100%",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: BLACK,
  color: "#fafafa",
};
const sheet = {
  width: "100%",
  maxWidth: 920,
  height: "100%",
  padding: 20,
  boxSizing: "border-box",
};
const section = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  position: "relative",
};
const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};
const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};
const card = {
  height: 120,
  borderRadius: 14,
  border: "1px solid #fafafa55",
  background: BLACK,
  padding: 16,
  color: "#fafafa",
  textAlign: "left",
  cursor: "pointer",
};
const qaCard = {
  borderRadius: 14,
  background: BLACK,
  color: "#fafafa",
  border: "1px solid #fafafa22",
  padding: 16,
};
const textarea = {
  width: "100%",
  minHeight: 160,
  borderRadius: 12,
  border: "1px solid #374151",
  background: BLACK,
  color: "#fafafa",
  padding: 12,
  outline: "0.15rem dashed #6dacff44",
  fontSize: 16,
  lineHeight: 1.5,
  resize: "vertical",
};
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};
const Footer = ({ children }) => (
  <div
    style={{
      marginTop: 50,
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
    }}
  >
    {children}
  </div>
);

/** -------------------- BLACKBOX APIs -------------------- */
async function BLACKBOX_fetchQuestions(style, count) {
  // 5/10개 옵션의 "겹침"을 위해 0~4번 문항 동일
  const base = [
    "어릴 적 가장 소중한 기억은 무엇인가요?",
    "당신을 지금의 당신으로 만든 전환점은 언제였나요?",
    "가장 사랑하는 사람과의 추억 한 장면을 들려주세요.",
    "일과 삶 사이에서 지켜온 원칙이 있다면 무엇인가요?",
    "힘들던 시기를 건너게 한 한 문장(혹은 노래)은 무엇이었나요?",
    "인생에서 가장 용감했던 순간을 떠올려 본다면?",
    "당신의 하루를 특별하게 만드는 사소한 습관은?",
    "감사함을 느끼게 하는 장소나 풍경이 있나요?",
    "지난 시간 속 당신이 꼭 전하고 싶은 한 마디는?",
    "앞으로의 당신에게 바라는 점은 무엇인가요?",
  ];
  await delay(200);
  return base.slice(0, count);
}

// GPT API 호출
async function BLACKBOX_generateStory({ style, questions, answers, userName }) {
  const qaMessages = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers[i];
    if (!q) continue;
    qaMessages.push({ sender: "bot", text: `질문: ${q}` });
    qaMessages.push({ sender: "user", text: `답변: ${a ?? ""}` });
  }

  const res = await fetch("/api/gpt-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ style, messages: qaMessages, userName }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`[gpt-story] ${res.status} ${txt}`);
  }

  const data = await res.json();
  return (
    data.story ??
    "죄송합니다. 생애문 생성에 문제가 생겼어요. 다시 시도해 주세요."
  );
}

async function BLACKBOX_saveStory({
  userId,
  style,
  questions,
  answers,
  story,
}) {
  try {
    const updateData = { story, style, questions, answers };
    await saveLifestorySection(userId, updateData);
  } catch (e) {
    console.warn(e);
    return false;
  }
  return true;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
