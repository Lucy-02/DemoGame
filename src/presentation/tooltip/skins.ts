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
  /** 아래 꼬리: 45° 돌린 정사각형, 아래 두 변에 선 */
  tail?: { size: number; line: number; lineColor: string };
  /** 나타날 때 이만큼 아래에서 올라와요 (움직임 시간·곡선은 provisional.motion.hover) */
  enterY?: number;
}

/** 카드 말풍선 (.bub): width 240, padding 9 11 8, radius 10, gap 5, 테 1 card-line, 그림자 0 10 24
 *  ::after 14×14 45° 회전, 아래 두 변 1px 선 · .txt line-height 1.5 · .kw 밑줄 offset 3
 *  .calc padding-top 5 (border-top은 var(--me)가 정의되지 않아 정본에서도 안 그려짐) · 바뀔 때 translateY(6)에서 올라옴 */
const role = (size: string, strongSize: string, color: string, strongColor: string, lh: number, padTop?: number): RoleStyle =>
  ({ size, strongSize, color, strongColor, lh, padTop });

export const PAPER: TipSkin = {
  w: 240, pad: [9, 11, 8, 11], radius: 10, gap: 5,
  fill: P.bubble, ring: { width: 1, color: P.cardLine },
  shadow: { y: 10, blur: 24, color: P.bubbleShadow },
  roles: {
    body: role(T.bubbleText, T.bubbleStrong, P.paperInk, P.paperInk, 1.5),
    calc: role(T.bubbleCalc, T.bubbleCalcStrong, P.bubbleSub, P.paperInk, 1.25, 5),
    why: role(T.bubbleWhy, T.bubbleWhy, P.bubbleWhy, P.bubbleWhy, 1.25),
    meta: role(T.bubbleOwner, T.bubbleOwner, P.bubbleSub, P.bubbleSub, 1.25),
  },
  termOffset: 3,
  tail: { size: 14, line: 1, lineColor: P.cardLine },
  enterY: 6,
};

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
};
