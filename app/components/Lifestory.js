"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BLACK } from "../styles/colorConfig";

/**
 * LifestorySection
 * - Fills its container (100% width/height)
 * - Intro: waving emoji greeter → "시작하기"
 * - Step 1: Pick style (진중한 / 낭만적인 / 재치있는 / 신비로운)
 * - Step 2: Pick number of questions (5 / 10)
 * - Step 3: Q&A wizard with progress dots and Previous button at top-left of question area
 * - Final: Generate story (BLACKBOX API) then show result in editable textarea and Save (BLACKBOX)
 * - All transitions and entrances are animated with framer-motion
 */
export default function LifestorySection({
  userId,
  onSaved,
  userName = "00",
  assistantName = "ㅁㅁ",
}) {
  // --- Steps: 'intro' | 'style' | 'count' | 'qa' | 'result'
  const [step, setStep] = useState("intro");

  // --- Step 1
  const STYLE_OPTIONS = ["진중한", "낭만적인", "재치있는", "신비로운"];
  const [selectedStyle, setSelectedStyle] = useState(null);

  // --- Step 2
  const COUNT_OPTIONS = [5, 10];
  const [questionCount, setQuestionCount] = useState(null);

  // --- Step 3
  const [questions, setQuestions] = useState([]); // string[]
  const [answers, setAnswers] = useState([]); // string[]
  const [currentIdx, setCurrentIdx] = useState(0);

  // --- Final
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentQuestion = questions[currentIdx] ?? "";
  const currentAnswer = answers[currentIdx] ?? "";

  // prep questions when moving to QA
  useEffect(() => {
    if (step === "qa" && selectedStyle && questionCount) {
      (async () => {
        const qs = await BLACKBOX_fetchQuestions(selectedStyle, questionCount);
        setQuestions(qs);
        setAnswers((prev) => {
          if (prev.length === qs.length) return prev;
          return Array(qs.length).fill("");
        });
        setCurrentIdx(0);
      })();
    }
  }, [step, selectedStyle, questionCount]);

  // --- Navigation handlers
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
      // first question → back to count step
      setStep("count");
    }
  };

  const handleNextQA = async () => {
    // last question → generate
    if (currentIdx === questions.length - 1) {
      setIsGenerating(true);
      try {
        const story = await BLACKBOX_generateStory({
          style: selectedStyle,
          answers,
        });
        setGeneratedStory(story);
        setStep("result");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
  };

  const handleDotClick = (idx) => {
    // allow jumping back to any previous/current index
    if (idx <= currentIdx) setCurrentIdx(idx);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await BLACKBOX_saveStory({
        userId: userId ?? "mock-user",
        style: selectedStyle,
        answers,
        story: generatedStory,
      });
      onSaved?.({
        style: selectedStyle,
        count: questionCount,
        answers,
        story: generatedStory,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Animations
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
                <FriendlyWaver size={220} color={BLACK} />
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
                subtitle="몇 개의 질문에 답하시겠어요? 더 많은 질문에 대답하면 00님의 이야기를 보다 잘 담을 수 있어요."
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
                {/* <Secondary onClick={() => setStep("style")}>이전</Secondary> */}
                <Primary disabled={!questionCount} onClick={goNextFromCount}>
                  다음
                </Primary>
              </Footer>
            </motion.section>
          )}

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

              {/* Q block with top-left back */}
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
                      setAnswers((arr) => {
                        const copy = [...arr];
                        copy[currentIdx] = v;
                        return copy;
                      });
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

              {/* Generating overlay */}
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
                onDotClick={(i) => setStep("qa") || setCurrentIdx(i)}
              />

              <div style={{ position: "relative", marginTop: 16 }}>
                {/* Go back to review Q&A */}
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
                  <textarea
                    value={generatedStory}
                    onChange={(e) => setGeneratedStory(e.target.value)}
                    style={{ ...textarea, minHeight: 220 }}
                  />
                </motion.div>
              </div>

              <Footer>
                <Secondary
                  onClick={() => {
                    setStep("qa");
                    setCurrentIdx(questions.length - 1);
                  }}
                >
                  이전
                </Secondary>
                <Primary
                  onClick={handleSave}
                  disabled={!generatedStory.trim() || isSaving}
                >
                  {isSaving ? "저장 중..." : "저장"}
                </Primary>
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

function FriendlyWaver({ size = 180, color = BLACK, speed = 1 }) {
  // Subtle face drift synced with ring morph: anchors move a tiny fraction of the ring deformation
  const t = 1 / Math.max(speed, 0.001);
  const VBX = 406,
    VBY = 286;

  // ----- Paths from your three SVGs (rings + right hand) -----
  const OUT_BASE = `M173.001 4C216.433 4 255.59 16.7688 283.79 37.2139C311.995 57.6623 329.001 85.5681 329.001 116C329.001 146.432 311.995 174.338 283.79 194.786C255.59 215.231 216.433 228 173.001 228C129.569 228 90.4121 215.231 62.2119 194.786C34.0072 174.338 17.001 146.432 17.001 116C17.001 85.5681 34.0072 57.6623 62.2119 37.2139C90.4121 16.7688 129.569 4 173.001 4Z`;
  const OUT_A = `M159.502 23.6086C202.605 18.2777 243.033 26.1437 273.53 42.9728C304.031 59.8047 324.334 85.412 328.069 115.614C331.805 145.816 318.352 175.598 292.871 199.354C267.393 223.105 230.1 240.584 186.996 245.915C143.893 251.246 103.465 243.38 72.9682 226.551C42.4668 209.719 22.164 184.111 18.4286 153.91C14.6933 123.708 28.1457 93.9257 53.6273 70.1699C79.1048 46.4181 116.398 28.9396 159.502 23.6086Z`;
  const OUT_B = `M159.281 23.6086C202.385 18.2777 242.813 26.1437 273.309 42.9728C303.81 59.8047 324.113 85.412 327.849 115.614C331.584 145.816 318.132 175.598 292.65 199.354C267.173 223.105 229.879 240.584 186.776 245.915C143.672 251.246 103.244 243.38 72.7477 226.551C42.2462 209.719 21.9434 184.111 18.2081 153.91C14.4727 123.708 27.9251 93.9257 53.4066 70.1699C78.8841 46.4181 116.178 28.9396 159.281 23.6086Z`;

  const IN_BASE = `M173.001 74C206.144 74 235.951 81.4416 257.331 93.2705C278.85 105.176 291.001 120.981 291.001 137.5C291.001 154.019 278.85 169.824 257.331 181.729C235.951 193.558 206.144 201 173.001 201C139.858 201 110.051 193.558 88.6709 181.729C67.1521 169.824 55.001 154.019 55.001 137.5C55.001 120.981 67.1521 105.176 88.6709 93.2705C110.051 81.4416 139.858 74 173.001 74Z`;
  const IN_A = `M166.698 85.4528C199.591 81.3847 230.086 85.1114 252.756 94.2267C275.574 103.401 289.573 117.595 291.6 133.989C293.628 150.383 283.509 167.56 263.614 182.017C243.848 196.381 215.179 207.424 182.287 211.492C149.394 215.561 118.899 211.834 96.229 202.719C73.4115 193.544 59.4124 179.35 57.3848 162.956C55.3572 146.562 65.4765 129.386 85.3713 114.929C105.138 100.565 133.806 89.5209 166.698 85.4528Z`;
  const IN_B = `M166.478 85.4528C199.37 81.3847 229.865 85.1114 252.535 94.2267C275.353 103.401 289.352 117.595 291.38 133.989C293.408 150.383 283.288 167.56 263.393 182.017C243.627 196.381 214.958 207.424 182.066 211.492C149.173 215.561 118.678 211.834 96.008 202.719C73.1905 193.544 59.1914 179.35 57.1638 162.956C55.1362 146.562 65.2555 129.386 85.1506 114.929C104.917 100.565 133.585 89.5209 166.478 85.4528Z`;

  const RH_DOWN = `M304.924 189.606C314.852 185.676 327.32 191.45 332.232 203.859C337.144 216.269 332.006 229.011 322.078 232.941C312.149 236.871 299.682 231.098 294.769 218.689C289.857 206.279 294.995 193.536 304.924 189.606Z`;
  const RH_W1 = `M349.792 148.932C344.392 139.72 348.194 126.517 359.708 119.767C371.221 113.018 384.599 116.15 389.999 125.361C395.399 134.573 391.598 147.776 380.084 154.526C368.571 161.276 355.192 158.144 349.792 148.932Z`;
  const RH_W2 = `M358.634 155.011C348.459 151.772 342.457 139.413 346.505 126.695C350.551 113.977 362.593 107.36 372.768 110.599C382.944 113.837 388.946 126.196 384.898 138.914C380.851 151.632 368.81 158.249 358.634 155.011Z`;

  // Facial feature bases + small drift targets (a fraction of the expressive deltas)
  const L = {
    cx: 125.501,
    cy: 137.5,
    rx: 10.5,
    ry: 12.5,
    rx2: 13.2652,
    ry2: 8.81094,
    rot: -16,
    dx: 127.352 - 125.501,
    dy: 154.303 - 137.5,
  };
  const R = {
    cx: 221.501,
    cy: 137.5,
    rx: 10.5,
    ry: 12.5,
    rx2: 12.9773,
    ry2: 9.00749,
    rot: 16,
    dx: 222.626 - 221.501,
    dy: 142.52 - 137.5,
  };
  const M = {
    cx: 173.501,
    cy: 143,
    rx: 14.5,
    ry: 7,
    rot: -7,
    dx: 175.664 - 173.501,
    dy: 153.87 - 143,
  };

  // Amplitude scales for subtlety
  const EYE_MOVE = 0.3; // 18% of full keyframe shift
  const EYE_ROT = 0.8; // 35% of keyframe rotation
  const EYE_SHAPE = 0.6; // 60% toward squint shape
  const MOUTH_MOVE = 0.3;
  const MOUTH_ROT = 0.8;

  // Derived targets
  const LrxT = L.rx + (L.rx2 - L.rx) * EYE_SHAPE;
  const LryT = L.ry + (L.ry2 - L.ry) * EYE_SHAPE;
  const RrxT = R.rx + (R.rx2 - R.rx) * EYE_SHAPE;
  const RryT = R.ry + (R.ry2 - R.ry) * EYE_SHAPE;

  const ringTimes = [0, 0.25, 0.5, 0.75, 1];
  const ringDur = 4.8 * t;

  const handDur = 3.8 * t;
  const handTimes = [0, 0.18, 0.36, 0.52, 0.68, 0.84, 0.95, 1];

  return (
    <motion.svg
      width={size}
      height={(size * VBY) / VBX}
      viewBox={`0 0 ${VBX} ${VBY}`}
      style={{ color }}
    >
      {/* overall gentle bob */}
      <motion.g
        initial={{ y: 0 }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.6 * t, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Rings morph */}
        <motion.path
          d={OUT_BASE}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ d: [OUT_BASE, OUT_A, OUT_B, OUT_A, OUT_BASE] }}
          transition={{
            duration: ringDur,
            repeat: Infinity,
            ease: "easeInOut",
            times: ringTimes,
          }}
        />
        <motion.path
          d={IN_BASE}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ d: [IN_BASE, IN_A, IN_B, IN_A, IN_BASE] }}
          transition={{
            duration: ringDur,
            repeat: Infinity,
            ease: "easeInOut",
            times: ringTimes,
          }}
        />

        {/* Face: add tiny synchronized drift to avoid stiffness */}
        {/* LEFT EYE */}
        <motion.ellipse
          cx={L.cx}
          cy={L.cy}
          rx={L.rx}
          ry={L.ry}
          fill="currentColor"
          animate={{
            x: [0, L.dx * EYE_MOVE, L.dx * EYE_MOVE * 0.7, L.dx * EYE_MOVE, 0],
            y: [0, L.dy * EYE_MOVE, L.dy * EYE_MOVE * 0.7, L.dy * EYE_MOVE, 0],
            rotate: [
              0,
              L.rot * EYE_ROT,
              L.rot * EYE_ROT * 0.7,
              L.rot * EYE_ROT,
              0,
            ],
            rx: [L.rx, LrxT, LrxT * 0.96 + L.rx * 0.04, LrxT, L.rx],
            ry: [L.ry, LryT, LryT * 0.96 + L.ry * 0.04, LryT, L.ry],
          }}
          transition={{
            duration: ringDur,
            repeat: Infinity,
            ease: "easeInOut",
            times: ringTimes,
          }}
          style={{ transformOrigin: `${L.cx}px ${L.cy}px` }}
        />

        {/* RIGHT EYE */}
        <motion.ellipse
          cx={R.cx}
          cy={R.cy}
          rx={R.rx}
          ry={R.ry}
          fill="currentColor"
          animate={{
            x: [0, R.dx * EYE_MOVE, R.dx * EYE_MOVE * 0.7, R.dx * EYE_MOVE, 0],
            y: [0, R.dy * EYE_MOVE, R.dy * EYE_MOVE * 0.7, R.dy * EYE_MOVE, 0],
            rotate: [
              0,
              R.rot * EYE_ROT,
              R.rot * EYE_ROT * 0.7,
              R.rot * EYE_ROT,
              0,
            ],
            rx: [R.rx, RrxT, RrxT * 0.96 + R.rx * 0.04, RrxT, R.rx],
            ry: [R.ry, RryT, RryT * 0.96 + R.ry * 0.04, RryT, R.ry],
          }}
          transition={{
            duration: ringDur,
            repeat: Infinity,
            ease: "easeInOut",
            times: ringTimes,
          }}
          style={{ transformOrigin: `${R.cx}px ${R.cy}px` }}
        />

        {/* MOUTH */}
        <motion.ellipse
          cx={M.cx}
          cy={M.cy}
          rx={M.rx}
          ry={M.ry}
          fill="currentColor"
          animate={{
            x: [
              0,
              M.dx * MOUTH_MOVE,
              M.dx * MOUTH_MOVE * 0.7,
              M.dx * MOUTH_MOVE,
              0,
            ],
            y: [
              0,
              M.dy * MOUTH_MOVE,
              M.dy * MOUTH_MOVE * 0.7,
              M.dy * MOUTH_MOVE,
              0,
            ],
            rotate: [
              0,
              M.rot * MOUTH_ROT,
              M.rot * MOUTH_ROT * 0.7,
              M.rot * MOUTH_ROT,
              0,
            ],
          }}
          transition={{
            duration: ringDur,
            repeat: Infinity,
            ease: "easeInOut",
            times: ringTimes,
          }}
          style={{ transformOrigin: `${M.cx}px ${M.cy}px` }}
        />

        {/* RIGHT HAND: DOWN → wave ↔ wave' → DOWN */}
        <motion.g
          style={{ transformOrigin: `368px 142px` }}
          animate={{
            rotate: [0, 10, -8, 10, -8, 8, 0, 0],
            x: [0, 4, 0, 4, 0, 4, 0, 0],
            y: [0, 1, 0, 1, 0, 1, 0, 0],
          }}
          transition={{
            duration: handDur,
            repeat: Infinity,
            ease: "easeInOut",
            times: handTimes,
          }}
        >
          <motion.path
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            animate={{
              d: [RH_DOWN, RH_W1, RH_W2, RH_W1, RH_W2, RH_W1, RH_DOWN, RH_DOWN],
            }}
            transition={{
              duration: handDur,
              repeat: Infinity,
              ease: "easeInOut",
              times: handTimes,
            }}
          />
        </motion.g>

        {/* LEFT HAND (idle) */}
        <motion.g
          style={{ transformOrigin: `30px 240px` }}
          animate={{ rotate: [0, -3, 0, 3, 0] }}
          transition={{
            duration: 4.2 * t,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d={`M41.0772 189.606C31.1487 185.676 18.681 191.45 13.7688 203.859C8.85677 216.269 13.9951 229.011 23.9235 232.941C33.8519 236.871 46.3193 231.098 51.2315 218.689C56.1437 206.279 51.0057 193.536 41.0772 189.606Z`}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
          />
        </motion.g>
      </motion.g>
    </motion.svg>
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
          state === "done"
            ? BLACK
            : state === "current"
            ? "#1a1a1a33"
            : "none";
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
        // border: "1px solid #1f2937",
        // background: "#0b1220",
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
  position:"relative"
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
  // border: "1px solid #1f2937",
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

/** -------------------- BLACKBOX APIs -------------------- */
async function BLACKBOX_fetchQuestions(style, count) {
  // Replace with your real question generator. Here is a simple mock.
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
  // Optionally mix tone into question wording (omitted in mock)
  await delay(200);
  return base.slice(0, count);
}

async function BLACKBOX_generateStory({ style, answers }) {
  // Replace with real backend call. This mock stitches answers.
  await delay(800);
  const body = answers
    .filter(Boolean)
    .map((a, i) => `${i + 1}. ${a.trim()}`)
    .join(" ");
  return `(${style})의 분위기로 정리한 생애문 초안입니다.

${body}

원하시면 내용을 자유롭게 다듬고 저장해 주세요.`;
}

async function BLACKBOX_saveStory({ userId, style, answers, story }) {
  // Replace with Firestore write.
  console.log("[SAVE]", { userId, style, answers, story });
  await delay(500);
  return true;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
