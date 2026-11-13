// 툴팁에 들어가는 내용. 어디서 띄우든(카드, 적, 상태이상, 해결 순서표 칸 …) 이 모양으로 넘겨요.
// 어떻게 보일지(크기·색·여백)는 skins.ts가 정해요. 내용은 역할(role)만 말해요.
import type { Node } from "../style/flex";

/** 글 조각: 보통 글, 강조 숫자(strong), 용어(term, 점선 밑줄) */
export type RichText = { text: string; strong?: boolean; term?: boolean }[];

/** 문단 역할. 스킨이 역할마다 글자 크기·색·줄 높이를 정해요. */
export type TipRole = "body" | "calc" | "why" | "meta";

export type TipBlock =
  /** 문단: 판 폭에 맞춰 줄바꿈 */
  | { kind: "text"; role: TipRole; text: RichText }
  /** 기호 줄 같은 그림 조각 (flex 노드 그대로) */
  | { kind: "node"; node: Node };

export type TipContent = TipBlock[];
