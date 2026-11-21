// 툴팁에 들어가는 내용. 어디서 띄우든(카드, 적, 상태이상, 해결 순서표 칸 …) 이 모양으로 넘겨요.
// 어떻게 보일지(크기·색·여백)는 skins.ts가 정해요. 내용은 역할(role)만 말해요.

/** 글 조각: 보통 글, 강조 숫자(strong), 용어(term, 점선 밑줄) */
export type RichText = { text: string; strong?: boolean; term?: boolean }[];

/** 문단 역할. 스킨이 역할마다 글자 크기·색·줄 높이를 정해요. */
/** term = 효과문 밑줄 용어의 풀이 (이름 강조 + 풀이, 0105) */
export type TipRole = "body" | "calc" | "term" | "meta";

export type TipBlock =
  /** 머리: 이름 + 옆 꼬리표 (정예 등) */
  | { kind: "title"; text: string; tag?: string }
  /** 결과 한 줄: 대상 이름 + 크게 쓴 값 (순서표 토큰 풀이, 0074) */
  | { kind: "result"; who?: string; value: string }
  /** 칩 줄: 순서 · 상태 (문장 대신 칩, 0019). tone: warn = 허점, acc = 브레이크 */
  | { kind: "chips"; items: { text: string; tone?: "warn" | "acc" }[] }
  /** 문단: 판 폭에 맞춰 줄바꿈 */
  | { kind: "text"; role: TipRole; text: RichText };

export type TipContent = TipBlock[];
