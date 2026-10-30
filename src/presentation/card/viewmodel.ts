// 카드 한 장이 그리는 값 (확정 구조: 그림 창 + 얇은 이름 띠, 5:7, SD 초상 홈, 기호 + 최종 수치, 단색 속성 기호. 0005·0008~0011)
import type { FaceId, IconId } from "../faces";

export type Material = "none" | "fire" | "water" | "wind";

export interface CardValueVM {
  /** 수치 기호 (i-hit 피해, i-shield 방어 …) */
  icon: IconId;
  n: number;
  /** 연타 표기 ×N */
  mult?: number;
  /** ▲ 성장으로 오름 */
  up?: boolean;
}

/** 설명 글 조각: 보통 글, 강조 숫자(b), 용어(밑줄 점선) */
export type RichText = { text: string; strong?: boolean; term?: boolean }[];

/** 호버 말풍선에 들어가는 글 (정본 .bub: .txt, .calc, .bwhy, .ownl) */
export interface CardDetailVM {
  text: RichText;
  /** 계산 줄 (기본 6 + 파워 1 = 7) */
  calc?: RichText;
  /** 못 내는 사유 */
  why?: string;
  /** 주인 · 속성 · 재질 */
  owner: string;
}

export interface CardVM {
  /** 손패에서 이 카드를 가리키는 이름 (호버·선택) */
  key: string;
  name: string;
  cost: number;
  /** 마력 부족 → 비용 동전 테 */
  costShort?: boolean;
  /** 주인 정령: 초상 홈 얼굴, 그림 창 윗선 모양 */
  owner: FaceId;
  /** 속성 재질(이름 띠) */
  material: Material;
  /** 속성 기호 (e-*) */
  element: IconId;
  /** 그림 자리 기호 (임시 그림) */
  art: IconId;
  values: CardValueVM[];
  /** 못 쓰는 카드 (몸체만 가라앉힘) */
  off?: boolean;
  /** 마력 말고 다른 사유 글 꼬리표 */
  why?: string;
  /** 무작위 같은 표식 기호 */
  mark?: IconId;
  detail: CardDetailVM;
}
