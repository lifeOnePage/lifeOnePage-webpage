// function FriendlyWaver({ size = 180, color = BLACK, speed = 1 }) {
//   // Subtle face drift synced with ring morph: anchors move a tiny fraction of the ring deformation
//   const t = 1 / Math.max(speed, 0.001);
//   const VBX = 406,
//     VBY = 286;

//   // ----- Paths from your three SVGs (rings + right hand) -----
//   const OUT_BASE = `M173.001 4C216.433 4 255.59 16.7688 283.79 37.2139C311.995 57.6623 329.001 85.5681 329.001 116C329.001 146.432 311.995 174.338 283.79 194.786C255.59 215.231 216.433 228 173.001 228C129.569 228 90.4121 215.231 62.2119 194.786C34.0072 174.338 17.001 146.432 17.001 116C17.001 85.5681 34.0072 57.6623 62.2119 37.2139C90.4121 16.7688 129.569 4 173.001 4Z`;
//   const OUT_A = `M159.502 23.6086C202.605 18.2777 243.033 26.1437 273.53 42.9728C304.031 59.8047 324.334 85.412 328.069 115.614C331.805 145.816 318.352 175.598 292.871 199.354C267.393 223.105 230.1 240.584 186.996 245.915C143.893 251.246 103.465 243.38 72.9682 226.551C42.4668 209.719 22.164 184.111 18.4286 153.91C14.6933 123.708 28.1457 93.9257 53.6273 70.1699C79.1048 46.4181 116.398 28.9396 159.502 23.6086Z`;
//   const OUT_B = `M159.281 23.6086C202.385 18.2777 242.813 26.1437 273.309 42.9728C303.81 59.8047 324.113 85.412 327.849 115.614C331.584 145.816 318.132 175.598 292.65 199.354C267.173 223.105 229.879 240.584 186.776 245.915C143.672 251.246 103.244 243.38 72.7477 226.551C42.2462 209.719 21.9434 184.111 18.2081 153.91C14.4727 123.708 27.9251 93.9257 53.4066 70.1699C78.8841 46.4181 116.178 28.9396 159.281 23.6086Z`;

//   const IN_BASE = `M173.001 74C206.144 74 235.951 81.4416 257.331 93.2705C278.85 105.176 291.001 120.981 291.001 137.5C291.001 154.019 278.85 169.824 257.331 181.729C235.951 193.558 206.144 201 173.001 201C139.858 201 110.051 193.558 88.6709 181.729C67.1521 169.824 55.001 154.019 55.001 137.5C55.001 120.981 67.1521 105.176 88.6709 93.2705C110.051 81.4416 139.858 74 173.001 74Z`;
//   const IN_A = `M166.698 85.4528C199.591 81.3847 230.086 85.1114 252.756 94.2267C275.574 103.401 289.573 117.595 291.6 133.989C293.628 150.383 283.509 167.56 263.614 182.017C243.848 196.381 215.179 207.424 182.287 211.492C149.394 215.561 118.899 211.834 96.229 202.719C73.4115 193.544 59.4124 179.35 57.3848 162.956C55.3572 146.562 65.4765 129.386 85.3713 114.929C105.138 100.565 133.806 89.5209 166.698 85.4528Z`;
//   const IN_B = `M166.478 85.4528C199.37 81.3847 229.865 85.1114 252.535 94.2267C275.353 103.401 289.352 117.595 291.38 133.989C293.408 150.383 283.288 167.56 263.393 182.017C243.627 196.381 214.958 207.424 182.066 211.492C149.173 215.561 118.678 211.834 96.008 202.719C73.1905 193.544 59.1914 179.35 57.1638 162.956C55.1362 146.562 65.2555 129.386 85.1506 114.929C104.917 100.565 133.585 89.5209 166.478 85.4528Z`;

//   const RH_DOWN = `M304.924 189.606C314.852 185.676 327.32 191.45 332.232 203.859C337.144 216.269 332.006 229.011 322.078 232.941C312.149 236.871 299.682 231.098 294.769 218.689C289.857 206.279 294.995 193.536 304.924 189.606Z`;
//   const RH_W1 = `M349.792 148.932C344.392 139.72 348.194 126.517 359.708 119.767C371.221 113.018 384.599 116.15 389.999 125.361C395.399 134.573 391.598 147.776 380.084 154.526C368.571 161.276 355.192 158.144 349.792 148.932Z`;
//   const RH_W2 = `M358.634 155.011C348.459 151.772 342.457 139.413 346.505 126.695C350.551 113.977 362.593 107.36 372.768 110.599C382.944 113.837 388.946 126.196 384.898 138.914C380.851 151.632 368.81 158.249 358.634 155.011Z`;

//   // Facial feature bases + small drift targets (a fraction of the expressive deltas)
//   const L = {
//     cx: 125.501,
//     cy: 137.5,
//     rx: 10.5,
//     ry: 12.5,
//     rx2: 13.2652,
//     ry2: 8.81094,
//     rot: -16,
//     dx: 127.352 - 125.501,
//     dy: 154.303 - 137.5,
//   };
//   const R = {
//     cx: 221.501,
//     cy: 137.5,
//     rx: 10.5,
//     ry: 12.5,
//     rx2: 12.9773,
//     ry2: 9.00749,
//     rot: 16,
//     dx: 222.626 - 221.501,
//     dy: 142.52 - 137.5,
//   };
//   const M = {
//     cx: 173.501,
//     cy: 143,
//     rx: 14.5,
//     ry: 7,
//     rot: -7,
//     dx: 175.664 - 173.501,
//     dy: 153.87 - 143,
//   };

//   // Amplitude scales for subtlety
//   const EYE_MOVE = 0.3; // 18% of full keyframe shift
//   const EYE_ROT = 0.8; // 35% of keyframe rotation
//   const EYE_SHAPE = 0.6; // 60% toward squint shape
//   const MOUTH_MOVE = 0.3;
//   const MOUTH_ROT = 0.8;

//   // Derived targets
//   const LrxT = L.rx + (L.rx2 - L.rx) * EYE_SHAPE;
//   const LryT = L.ry + (L.ry2 - L.ry) * EYE_SHAPE;
//   const RrxT = R.rx + (R.rx2 - R.rx) * EYE_SHAPE;
//   const RryT = R.ry + (R.ry2 - R.ry) * EYE_SHAPE;

//   const ringTimes = [0, 0.25, 0.5, 0.75, 1];
//   const ringDur = 4.8 * t;

//   const handDur = 3.8 * t;
//   const handTimes = [0, 0.18, 0.36, 0.52, 0.68, 0.84, 0.95, 1];

//   return (
//     <motion.svg
//       width={size}
//       height={(size * VBY) / VBX}
//       viewBox={`0 0 ${VBX} ${VBY}`}
//       style={{ color }}
//     >
//       {/* overall gentle bob */}
//       <motion.g
//         initial={{ y: 0 }}
//         animate={{ y: [0, -2, 0] }}
//         transition={{ duration: 2.6 * t, repeat: Infinity, ease: "easeInOut" }}
//       >
//         {/* Rings morph */}
//         <motion.path
//           d={OUT_BASE}
//           fill="none"
//           stroke="currentColor"
//           strokeWidth={8}
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           animate={{ d: [OUT_BASE, OUT_A, OUT_B, OUT_A, OUT_BASE] }}
//           transition={{
//             duration: ringDur,
//             repeat: Infinity,
//             ease: "easeInOut",
//             times: ringTimes,
//           }}
//         />
//         <motion.path
//           d={IN_BASE}
//           fill="none"
//           stroke="currentColor"
//           strokeWidth={8}
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           animate={{ d: [IN_BASE, IN_A, IN_B, IN_A, IN_BASE] }}
//           transition={{
//             duration: ringDur,
//             repeat: Infinity,
//             ease: "easeInOut",
//             times: ringTimes,
//           }}
//         />

//         {/* Face: add tiny synchronized drift to avoid stiffness */}
//         {/* LEFT EYE */}
//         <motion.ellipse
//           cx={L.cx}
//           cy={L.cy}
//           rx={L.rx}
//           ry={L.ry}
//           fill="currentColor"
//           animate={{
//             x: [0, L.dx * EYE_MOVE, L.dx * EYE_MOVE * 0.7, L.dx * EYE_MOVE, 0],
//             y: [0, L.dy * EYE_MOVE, L.dy * EYE_MOVE * 0.7, L.dy * EYE_MOVE, 0],
//             rotate: [
//               0,
//               L.rot * EYE_ROT,
//               L.rot * EYE_ROT * 0.7,
//               L.rot * EYE_ROT,
//               0,
//             ],
//             rx: [L.rx, LrxT, LrxT * 0.96 + L.rx * 0.04, LrxT, L.rx],
//             ry: [L.ry, LryT, LryT * 0.96 + L.ry * 0.04, LryT, L.ry],
//           }}
//           transition={{
//             duration: ringDur,
//             repeat: Infinity,
//             ease: "easeInOut",
//             times: ringTimes,
//           }}
//           style={{ transformOrigin: `${L.cx}px ${L.cy}px` }}
//         />

//         {/* RIGHT EYE */}
//         <motion.ellipse
//           cx={R.cx}
//           cy={R.cy}
//           rx={R.rx}
//           ry={R.ry}
//           fill="currentColor"
//           animate={{
//             x: [0, R.dx * EYE_MOVE, R.dx * EYE_MOVE * 0.7, R.dx * EYE_MOVE, 0],
//             y: [0, R.dy * EYE_MOVE, R.dy * EYE_MOVE * 0.7, R.dy * EYE_MOVE, 0],
//             rotate: [
//               0,
//               R.rot * EYE_ROT,
//               R.rot * EYE_ROT * 0.7,
//               R.rot * EYE_ROT,
//               0,
//             ],
//             rx: [R.rx, RrxT, RrxT * 0.96 + R.rx * 0.04, RrxT, R.rx],
//             ry: [R.ry, RryT, RryT * 0.96 + R.ry * 0.04, RryT, R.ry],
//           }}
//           transition={{
//             duration: ringDur,
//             repeat: Infinity,
//             ease: "easeInOut",
//             times: ringTimes,
//           }}
//           style={{ transformOrigin: `${R.cx}px ${R.cy}px` }}
//         />

//         {/* MOUTH */}
//         <motion.ellipse
//           cx={M.cx}
//           cy={M.cy}
//           rx={M.rx}
//           ry={M.ry}
//           fill="currentColor"
//           animate={{
//             x: [
//               0,
//               M.dx * MOUTH_MOVE,
//               M.dx * MOUTH_MOVE * 0.7,
//               M.dx * MOUTH_MOVE,
//               0,
//             ],
//             y: [
//               0,
//               M.dy * MOUTH_MOVE,
//               M.dy * MOUTH_MOVE * 0.7,
//               M.dy * MOUTH_MOVE,
//               0,
//             ],
//             rotate: [
//               0,
//               M.rot * MOUTH_ROT,
//               M.rot * MOUTH_ROT * 0.7,
//               M.rot * MOUTH_ROT,
//               0,
//             ],
//           }}
//           transition={{
//             duration: ringDur,
//             repeat: Infinity,
//             ease: "easeInOut",
//             times: ringTimes,
//           }}
//           style={{ transformOrigin: `${M.cx}px ${M.cy}px` }}
//         />

//         {/* RIGHT HAND: DOWN → wave ↔ wave' → DOWN */}
//         <motion.g
//           style={{ transformOrigin: `368px 142px` }}
//           animate={{
//             rotate: [0, 10, -8, 10, -8, 8, 0, 0],
//             x: [0, 4, 0, 4, 0, 4, 0, 0],
//             y: [0, 1, 0, 1, 0, 1, 0, 0],
//           }}
//           transition={{
//             duration: handDur,
//             repeat: Infinity,
//             ease: "easeInOut",
//             times: handTimes,
//           }}
//         >
//           <motion.path
//             fill="none"
//             stroke="currentColor"
//             strokeWidth={8}
//             animate={{
//               d: [RH_DOWN, RH_W1, RH_W2, RH_W1, RH_W2, RH_W1, RH_DOWN, RH_DOWN],
//             }}
//             transition={{
//               duration: handDur,
//               repeat: Infinity,
//               ease: "easeInOut",
//               times: handTimes,
//             }}
//           />
//         </motion.g>

//         {/* LEFT HAND (idle) */}
//         <motion.g
//           style={{ transformOrigin: `30px 240px` }}
//           animate={{ rotate: [0, -3, 0, 3, 0] }}
//           transition={{
//             duration: 4.2 * t,
//             repeat: Infinity,
//             ease: "easeInOut",
//           }}
//         >
//           <path
//             d={`M41.0772 189.606C31.1487 185.676 18.681 191.45 13.7688 203.859C8.85677 216.269 13.9951 229.011 23.9235 232.941C33.8519 236.871 46.3193 231.098 51.2315 218.689C56.1437 206.279 51.0057 193.536 41.0772 189.606Z`}
//             fill="none"
//             stroke="currentColor"
//             strokeWidth={8}
//           />
//         </motion.g>
//       </motion.g>
//     </motion.svg>
//   );
// }
