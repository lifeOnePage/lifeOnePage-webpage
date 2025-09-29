"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BLACK } from "../styles/colorConfig";
import { loadLifestorySection, saveLifestorySection } from "../utils/firebaseDb";

export default function LifestorySection({
  userId,
  onSaved,
  userName = "00",
  assistantName = "ㅁㅁ",
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
   * ✅ 중복 질문 답변 보존을 위한 맵
   * key: 질문 텍스트(string), value: 사용자의 답변(string)
   * - 5 ↔ 10개 전환, "다시 생성하기" 시 fetch된 질문 배열을 기준으로
   *   기존 답변을 자동 주입합니다.
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
   * - hasSaved: 저장 완료 여부 (저장 버튼 숨김/노출 제어)
   * - isEditingResult: 결과를 textarea로 편집 중인지 여부
   *   (저장 후 기본적으로 읽기 전용 텍스트로 보여주고, 클릭 시 편집 모드로 전환)
   */
  const [hasSaved, setHasSaved] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(true);

  const currentQuestion = questions[currentIdx] ?? "";
  const currentAnswer = answers[currentIdx] ?? "";

  // ---------------------------- Lifecycle: QA 진입 시 질문 셋업 ----------------------------
  /**
   * ✅ 'qa' 단계 진입 시:
   *  1) 선택된 스타일/개수 기반 질문 fetch
   *  2) answerMap을 이용해 겹치는 질문의 기존 답변 주입
   *  3) 새로운 질문(기존에 없던 텍스트)은 공란으로 초기화
   */

  // 🔹 최초 마운트/또는 userId 변경 시, Firebase에서 저장된 값 로드
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!userId) {
        setIsBootLoading(false);
        return;
      }
      try {
        console.log(userId)
        const saved = await loadLifestorySection(userId);
        console.log(saved)
        if (cancelled) return;

        if (!saved) {
          // 저장된 게 없다면 처음부터
          setStep("intro");
          setIsBootLoading(false);
          return;
        }

        // 저장값 반영
        const {
          style,
          questions: savedQuestions = [],
          answers: savedAnswers = [],
          story = "",
        } = saved.lifestory;

        // 스타일/개수 프리셀렉트
        setSelectedStyle(style ?? null);
        setQuestionCount(savedQuestions?.length || null);

        // 질문/답변/맵 하이드레이션
        setQuestions(savedQuestions);
        setAnswers(savedAnswers);
        const hydMap = {};
        savedQuestions.forEach((q, i) => (hydMap[q] = savedAnswers[i] ?? ""));
        setAnswerMap(hydMap);

        if (story && story.trim()) {
          // 🔹 저장된 스토리가 있으면 바로 Result 읽기모드로
          setGeneratedStory(story);
          setHasSaved(true);
          setIsEditingResult(false);
          setStep("result");
          setShouldFetchOnQA(false); // QA 진입시 fetch 스킵
        } else if (savedQuestions.length > 0) {
          // 🔹 스토리는 없고 Q/A만 있으면 QA로 이어서
          //   - 첫 미답변(또는 마지막 답변) 위치로 커서 이동
          const nextIdx = Math.max(
            0,
            savedAnswers.findIndex((a) => !a || !String(a).trim())
          );
          setCurrentIdx(nextIdx === -1 ? savedQuestions.length - 1 : nextIdx);
          setStep("qa");
          setShouldFetchOnQA(false); // 하이드레이션한 Q/A를 유지(덮어쓰기 방지)
        } else if (style) {
          // 🔹 스타일만 있으면 개수 선택으로
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

  useEffect(() => {
    if (step === "qa" && selectedStyle && questionCount) {
      if (!shouldFetchOnQA) {
        // 하이드레이션으로 이미 채워둔 경우 1회 스킵
        // 다음부터는 다시 fetch 가능하도록 true로 복구
        setShouldFetchOnQA(true);
        return;
      }
      (async () => {
        const qs = await BLACKBOX_fetchQuestions(selectedStyle, questionCount);
        setQuestions(qs);

        // 맵 기반으로 답변 복원 (겹치지 않는 질문은 빈 문자열)
        const restored = qs.map((q) => answerMap[q] ?? "");
        setAnswers(restored);
        setCurrentIdx(0);
      })();
    }
  }, [step, selectedStyle, questionCount]); // eslint-disable-line

  // ---------------------------- Navigation Handlers ----------------------------
  const goNextFromIntro = () => setStep("style");
  const goNextFromStyle = () => selectedStyle && setStep("count");
  const goNextFromCount = () => {
    if (!questionCount) return;
    setStep("qa");
  };

  const handlePrevQA = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    } else {
      // 첫 질문에서 이전 → 개수 선택으로
      setStep("count");
    }
  };

  const handleNextQA = async () => {
    // 마지막 질문에서 다음 → 생성
    if (currentIdx === questions.length - 1) {
      setIsGenerating(true);
      try {
        const story = await BLACKBOX_generateStory({
          style: selectedStyle,
          questions,
          answers,
        });
        setGeneratedStory(story);
        setHasSaved(false); // 새로 생성되었으니 아직 미저장
        setIsEditingResult(true); // 기본은 편집 모드
        setStep("result");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
  };

  const handleDotClick = (idx) => {
    // 진행된 범위 내로만 점프 허용
    if (idx <= currentIdx) setCurrentIdx(idx);
  };

  // ---------------------------- 결과 재생성 / 저장 ----------------------------
  /**
   * ✅ 다시 생성하기:
   * - 의미상 '처음부터' → 스타일 단계로 이동(step='style')
   * - 기존 선택값(스타일/개수)은 유지하여 프리셀렉트
   * - answerMap은 그대로 유지(겹치는 질문 자동 복원 위해)
   * - 결과 관련 상태 리셋
   */
  const handleRegenerate = () => {
    setGeneratedStory("");
    setHasSaved(false);
    setIsEditingResult(true);
    setStep("style"); // 인트로는 스킵, 첫 유의미 단계로 복귀
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log(userId, selectedStyle, questions, answers, generatedStory);
      await BLACKBOX_saveStory({
        userId: userId ?? "mock-user",
        style: selectedStyle,
        questions,
        answers,
        story: generatedStory,
      });

      // 콜백 알림
      onSaved?.({
        style: selectedStyle,
        count: questionCount,
        questions,
        answers,
        story: generatedStory,
      });

      // ✅ 저장 후 뷰 전환: 읽기 전용 + 저장 버튼 숨김
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
    initial: { y: 8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
  };

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
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {/* 웨이브 이모지 등 인삿말 자리는 필요 시 추가 */}
              </motion.div>
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
                  <div
                    style={{ fontSize: 14, opacity: 0.7, marginBottom: 6 }}
                  >{`질문 ${currentIdx + 1} / ${questions.length}`}</div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}
                  >
                    {currentQuestion}
                  </div>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => {
                      const v = e.target.value;
                      const q = currentQuestion; // 안전하게 캡처
                      setAnswers((arr) => {
                        const copy = [...arr];
                        copy[currentIdx] = v;
                        return copy;
                      });
                      // ✅ 질문 텍스트 기준으로 답변 보존
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
              {/* 결과에서도 점프 가능(검토/수정 용도) */}
              <ProgressDots
                total={questions.length}
                current={questions.length - 1}
                onDotClick={(i) => {
                  setStep("qa");
                  setCurrentIdx(i);
                }}
              />

              <div style={{ position: "relative", marginTop: 16 }}>
                {/* Q&A로 돌아가 재검토 */}
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

                  {/* ✅ 안내문구: textarea 바깥의 작은 텍스트 */}
                  <p style={{ margin: "0 0 8px", fontSize: 16, opacity: 0.7 }}>
                    생애문 생성 초안입니다. 내용을 직접 원하시는대로 다듬은 뒤
                    저장할 수 있어요.
                  </p>

                  {/* ✅ 저장 전: 편집 모드 / 저장 후: 읽기 전용(클릭 시 편집 전환) */}
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
                        setHasSaved(false); // 편집 재시작 → 다시 저장 필요
                      }}
                      style={{
                        border: "1px dashed #9ca3af",
                        borderRadius: 12,
                        padding: 14,
                        background: "#f8fafc",
                        cursor: "text",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                      }}
                      title="클릭하여 직접 수정할 수 있어요"
                    >
                      {generatedStory}
                    </div>
                  )}

                  {/* ✅ 읽기 전용 상태 안내 */}
                  {!isEditingResult && (
                    <p
                      style={{ margin: "8px 0 0", fontSize: 16, opacity: 0.7 }}
                    >
                      클릭하면 직접 수정할 수 있어요
                    </p>
                  )}
                </motion.div>
              </div>

              {/* ✅ 결과 푸터: [다시 생성하기 / 저장], 저장 후엔 저장 버튼 숨김 */}
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
        borderColor: BLACK,
        boxShadow: active ? "0 0 0 3px rgba(255, 109, 109, 0.5)" : "none",
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
        borderColor: active ? BLACK : "#1a1a1a55",
        boxShadow: active ? "0 0 0 3px rgba(255, 109, 109, 0.5)" : "none",
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
        border: "1px solid #1a1a1a",
        background: disabled ? "#1a1a1a55" : "#1a1a1a",
        color: "#fff",
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
        border: "1px solid #374151",
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
          state === "done" ? BLACK : state === "current" ? "#1a1a1a33" : "none";
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
              border: "1px solid #1a1a1a55",
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
        color: BLACK,
        display: "flex",
        placeItems: "center",
        cursor: "pointer",
      }}
      // aria-label="이전"
      // title="이전"
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#1a1a1a"
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
  background: "#fafafa",
  color: BLACK,
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
  border: "1px solid #262626",
  background: "#fafafa",
  padding: 16,
  color: BLACK,
  textAlign: "left",
  cursor: "pointer",
};
const qaCard = {
  borderRadius: 14,
  background: "#fafafa",
  padding: 16,
};
const textarea = {
  width: "100%",
  minHeight: 160,
  borderRadius: 12,
  border: "1px solid #374151",
  background: "#fafafa",
  color: BLACK,
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

/** -------------------- BLACKBOX APIs (Mocks) -------------------- */
async function BLACKBOX_fetchQuestions(style, count) {
  // Replace with your real question generator. Here is a simple mock.
  // ⚠️ 5/10개 옵션의 "겹침"을 위해 0~4번 문항은 언제나 동일하게 유지
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

// 기존 mock을 이 함수로 완전히 교체하세요.
async function BLACKBOX_generateStory({ style, questions, answers }) {
  // Q/A를 OpenAI에 보낼 메시지 배열로 직렬화
  // 형식: bot(assistant): "질문: ...", user: "답변: ..."
  console.log(questions, answers, style);
  const qaMessages = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers[i];
    if (!q) continue;
    qaMessages.push({ sender: "bot", text: `질문: ${q}` });
    // 답변이 비어있으면 유추 금지를 안내에 이미 포함되어 있으므로, 빈 답변도 그대로 전달 가능
    qaMessages.push({ sender: "user", text: `답변: ${a ?? ""}` });
  }

  const res = await fetch("/api/gpt-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      style,
      messages: qaMessages,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`[gpt-story] ${res.status} ${txt}`);
  }

  const data = await res.json();
  return (
    data.story ??
    "죄송합니다. 생애문 생성에 도중 문제가 생겼어요. 다시 생성하기를 눌러 재시도해보세요."
  );
}

async function BLACKBOX_saveStory({
  userId,
  style,
  questions,
  answers,
  story,
}) {
  // Replace with Firestore write.
  // console.log("[SAVE]", { userId, style, answers, story });
  try {
    const updateData = {
      story,
      style,
      questions,
      answers,
    };

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
