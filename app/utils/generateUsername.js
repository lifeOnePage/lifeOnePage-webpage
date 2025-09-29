// 기억하기 쉬운 3단어 + 숫자: shyTinyDragon123 형태
// 중복 체크는 서버(파이어베이스 등) 블랙박스로 가정

import {isUsernameTaken} from "./isUsernameTaken";

const ADJECTIVES_MOOD = [
  "brave","calm","chill","clever","cosy","eager","gentle","honest","kind",
  "lucky","merry","noble","pure","quiet","shy","swift","tidy","witty"
];

const ADJECTIVES_SIZE = [
  "tiny","mini","small","little","petite","compact","light","slim",
  "mighty","grand","giant"
];

const ANIMALS = [
  "ant","bunny","cat","coyote","crane","deer","dolphin","eagle","falcon",
  "fox","hedgehog","jaguar","koala","lynx","otter","owl","panda","puppy",
  "raven","seal","swan","tiger","wolf","yak","zebra","dragon","phoenix"
];

// 금칙어(원하면 확장)
const FORBIDDEN = new Set(["admin","root","staff","official","support"]);

// 소문자 시작 camelCase + 숫자 꼬리: shyTinyDragon123
export function toCamelId(words, num) {
  const [h, ...rest] = words;
  const camel =
    (h || "").toLowerCase() +
    rest.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
  const suffix = String(num).padStart(num < 100 ? 2 : 0, "0");
  return camel + suffix;
}

function rand(maxExclusive) {
  // 브라우저 환경의 crypto 사용 (Next.js 클라이언트에서 OK)
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % maxExclusive;
}

function pick(arr) { return arr[rand(arr.length)]; }

// 형식/금칙 검증
export function isValidFormat(id) {
  return /^[a-z][a-zA-Z0-9]{3,23}$/.test(id) && !FORBIDDEN.has(id.toLowerCase());
}

// 후보 하나 만들기
export function generateCandidate(seedShift = 0) {
  const mood = ADJECTIVES_MOOD[(rand(ADJECTIVES_MOOD.length) + seedShift) % ADJECTIVES_MOOD.length];
  const size = ADJECTIVES_SIZE[(rand(ADJECTIVES_SIZE.length) + seedShift) % ADJECTIVES_SIZE.length];
  const animal = ANIMALS[(rand(ANIMALS.length) + seedShift) % ANIMALS.length];
  const n = 10 + rand(90) + (seedShift % 10) * 11; // 2~3자리 느낌
  return toCamelId([mood, size, animal], n);
}

// 고유 닉네임 보장 생성기
export async function generateUniqueUsername({ maxTries = 25 } = {}) {
  for (let i = 0; i < maxTries; i++) {
    const candidate = generateCandidate(i);
    if (!isValidFormat(candidate)) continue;
    if (await isUsernameTaken(candidate)) return candidate;
  }
  // 최후 보장: 짧은 base36 tail로 충돌 해소
  for (let i = 0; i < 25; i++) {
    const base = generateCandidate(i);
    const tail = (Date.now() + rand(1e6)).toString(36).slice(-2);
    const candidate = (base + tail).slice(0, 24);
    if (await isUsernameTaken(candidate)) return candidate;
  }
  // 정말 불가하면 타임스탬프 기반 fallback
  return ("guest" + Date.now().toString(36)).slice(0, 24);
}
