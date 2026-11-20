// 툴팁 모양. 수치는 정본 CSS(design/canon/battle-r5) 그대로, 색·글자 크기는 토큰에서.
// 툴팁 디자인을 다듬을 때는 이 파일(과 토큰)만 고치면 모든 툴팁이 같이 바뀌어요.
import { tokens } from "../../design/tokens";
import type { TipRole } from "./content";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

export interface RoleStyle {
  size: string;
  strongSize: string;
  color: string;
  strongColor: string;
  /** line-height 배수 */
  lh: number;
  /** 문단 위 여백 */
  padTop?: number;
}

export interface TipSkin {
  w: number;
  pad: [top: number, right: number, bottom: number, left: number];
  radius: number;
  /** 블록 사이 */
  gap: number;
  fill: string;
  ring: { width: number; color: string };
  shadow: { y: number; blur: number; color: string };
  /** 역할별 문단 모양. 정본에 있는 역할만 채워요 (없는 역할을 쓰면 오류) */
  roles: { body: RoleStyle } & Partial<Record<TipRole, RoleStyle>>;
  /** 용어 점선 밑줄 text-underline-offset (없으면 밑줄 없이) */
  termOffset?: number;
  title?: {
    size: string; color: string; lh: number; gap: number;
    tag: { size: string; color: string; padX: number; radius: number; ring: number; ringColor: string };
  };
  /** 결과 줄의 큰 값 (대상 이름은 body 모양) · 칩 줄의 강조 색 (칩 모양은 title.tag) */
  result?: { size: string; color: string; gap: number };
  tone?: { warn: string; acc: string };
}

const role = (size: string, strongSize: string, color: string, strongColor: string, lh: number, padTop?: number): RoleStyle =>
  ({ size, strongSize, color, strongColor, lh, padTop });

/** 적 설명판 (.etip): width 262, radius 12, padding 10 12 11, gap 5, line-height 1.45, 테 1 glass-line, 그림자 0 10 26
 *  h4 gap 6 · h4 span padding 0 6 radius 8 테 1 */
export const GLASS: TipSkin = {
  w: 262, pad: [10, 12, 11, 12], radius: 12, gap: 5,
  fill: P.glassD, ring: { width: 1, color: P.glassLine },
  shadow: { y: 10, blur: 26, color: P.tipShadow },
  roles: {
    body: role(T.tipBody, T.tipStrong, P.ink2, P.ink, 1.45),
  },
  title: {
    size: T.tipTitle, color: P.ink, lh: 1.45, gap: 6,
    tag: { size: T.tipChip, color: P.ink3, padX: 6, radius: 8, ring: 1, ringColor: P.glassLine },
  },
  /** 0074 시안 .bt .res gap 6 · .big · 칩 강조: 허점 = 노랑, 브레이크 = 보라 */
  result: { size: T.tipResult, color: P.ink, gap: 6 },
  tone: { warn: P.warn, acc: P.accHi },
};

/** 카드 곁쪽지 (0159 L1 시안 .note): 큰 얼굴 옆에 머물면 뜨는 유리 쪽지. width 240, padding 10 12, radius 8, gap 6.
 *  주인 줄 · 계산 줄 · 강화하면 바뀌는 효과문 · 용어 풀이. 글자는 적 설명판과 같은 값 (새 값 없음) */
export const NOTE: TipSkin = {
  w: 240, pad: [10, 12, 10, 12], radius: 8, gap: 6,
  fill: P.glassD, ring: { width: 1, color: P.glassLine },
  shadow: { y: 10, blur: 26, color: P.tipShadow },
  roles: {
    body: role(T.tipBody, T.tipStrong, P.ink2, P.ink, 1.45),
    calc: role(T.tipBody, T.tipStrong, P.ink2, P.ink, 1.45),
    term: role(T.tipBody, T.tipStrong, P.ink2, P.ink, 1.45),
    meta: role(T.tipChip, T.tipChip, P.ink3, P.ink3, 1.45),
  },
  termOffset: 3,
};
