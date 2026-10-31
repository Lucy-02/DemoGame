// 한국어 글 도우미: 받침에 따라 조사를 고르고, 동사 줄기를 합니다체·연결형으로 바꿔요 (문구 규칙 0022).
// 화면에 `이(가)`, `을(를)`을 그대로 내보내지 않으려고 둬요.

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const JONG = 28;
/** ㄹ 받침 (종성 번호) */
const RIEUL = 8;
/** ㅂ 받침 (종성 번호) */
const BIEUP = 17;

/** 숫자 끝자리 읽기의 받침: 영·일·삼·육·칠·팔·십·백·천은 있고 이·사·오·구는 없어요 */
const DIGIT_BATCHIM = [true, true, false, true, false, false, true, true, true, false];

/** 마지막 글자의 종성 번호 (0 = 받침 없음). 한글·숫자가 아니면 null */
function jong(word: string): number | null {
  const ch = word.trim().slice(-1);
  if (!ch) return null;
  const code = ch.charCodeAt(0);
  if (code >= HANGUL_START && code <= HANGUL_END) return (code - HANGUL_START) % JONG;
  // 0으로 끝나는 수(10 십, 100 백, 1000 천)는 모두 받침이 있어서 DIGIT_BATCHIM[0]과 같아요
  if (/[0-9]/.test(ch)) return DIGIT_BATCHIM[Number(ch)] ? 1 : 0;
  return null;
}

export function hasBatchim(word: string): boolean {
  return (jong(word) ?? 0) > 0;
}

type Josa = "을/를" | "이/가" | "은/는" | "과/와" | "으로/로";

/** 낱말 + 알맞은 조사. 예: josa("불여우", "이/가") → "불여우가" */
export function josa(word: string, pair: Josa): string {
  const j = jong(word) ?? 0;
  const [withB, without] = pair.split("/");
  // "으로/로": ㄹ 받침 뒤에는 "로"
  const useB = pair === "으로/로" ? j > 0 && j !== RIEUL : j > 0;
  return word + (useB ? withB : without);
}

/** 동사 줄기의 마지막 글자에 받침을 붙여요 */
function addJong(stem: string, n: number): string {
  const code = stem.charCodeAt(stem.length - 1);
  return stem.slice(0, -1) + String.fromCharCode(code + n);
}

/** 합니다체 평서형. 예: "입히" → "입힙니다", "얻" → "얻습니다", "오르" → "오릅니다" */
export function polite(stem: string): string {
  return jong(stem) === 0 ? `${addJong(stem, BIEUP)}니다` : `${stem}습니다`;
}

/** 연결형 "~고". 예: "입히" → "입히고" */
export function andThen(stem: string): string {
  return `${stem}고`;
}
