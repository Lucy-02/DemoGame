// 카드 한 장이 그리는 값 (확정 구조: 그림 창 + 얇은 이름 띠, 5:7, SD 초상 홈, 기호 + 최종 수치, 단색 속성 기호. 0005·0008~0011)
import type { FaceId, IconId } from "../faces";
import type { CardArtId } from "./art";

/** 희귀도 보석 (0050). 기본 카드는 보석이 없어요 */
export type CardRarity = "common" | "advanced" | "rare";

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

import type { RichText } from "../tooltip/content";

export type { RichText };

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
  /** 초상 홈에 넣을 얼굴 텍스처 키 (원으로 구운 그림). 없으면 owner의 얼굴 그림 (정본 얼굴이 없는 정령용) */
  face?: string;
  /** 희귀도. 보석은 createHandCard에 showRarity를 준 자리(보상·상점)에서만 그려요. 손패는 안 그려요 (0050) */
  rarity?: CardRarity;
  /** 속성 재질(이름 띠) */
  material: Material;
  /** 속성 기호 (e-*) */
  element: IconId;
  /** 그림 자리 기호 (임시 그림) */
  art: IconId;
  /** 카드 일러스트. 없으면 그림 자리를 비워 둬요 */
  illustration?: CardArtId;
  values: CardValueVM[];
  /** 못 내는 카드: 카드째 회색으로 흐려요. 이유 띠와 비용 동전은 또렷하게 (0043) */
  off?: boolean;
  /** 마력 말고 다른 사유 글 꼬리표 */
  why?: string;
  /** 무작위 같은 표식 기호 */
  mark?: IconId;
  detail: CardDetailVM;
}
