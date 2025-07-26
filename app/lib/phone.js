export function toE164(koreanNumber) {
  const cleaned = koreanNumber.replace(/\D/g, "");
  if (cleaned.startsWith("010")) {
    return "+82" + cleaned.substring(1); // 01012345678 → +821012345678
  }
  throw new Error("지원되지 않는 번호 형식");
}

export function formatPhoneWithHyphen(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length < 4) return numbers;
  if (numbers.length < 8) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}
