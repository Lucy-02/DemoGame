// 카드 한 장이 그리는 값 (0159 두 얼굴: 작은 얼굴 = 그림 + 비용 + 수치 + 이름, 큰 얼굴 = 그 위에 효과문 · 주인 · 속성 · 희귀도)
import type { FaceId, IconId } from "../faces";
import type { CardArtId } from "./art";

/** 희귀도 보석 (0050). 기본 카드는 보석이 없어요 */
export type CardRarity = "common" | "advanced" | "rare";

export interface CardValueVM {
  /** 수치 기호 (i-hit 피해, i-shield 방어 …) */
  icon: IconId;
  n: number;
  /** 연타 표기 ×N */
  mult?: number;
  /** 카드에 찍힌 값보다 오름 (능력치 · 강화): 숫자 색으로 알려요 (0159) */
  up?: boolean;
}

import type { RichText } from "../tooltip/content";

export type { RichText };

/** 큰 얼굴과 곁쪽지에 들어가는 글 */
export interface CardDetailVM {
  text: RichText;
  /** 계산 줄 (기본 6 + 파워 1 = 7) */
  calc?: RichText;
  /** 못 내는 사유 (큰 얼굴 윗선 표지) */
  why?: string;
  /** 주인 · 속성 · 희귀도 (곁쪽지 첫 줄) */
  owner: string;
  /** 강화하면 바뀌는 효과문 (아직 강화하지 않은, 강화할 수 있는 카드만) */
  upgrade?: { label: string; text: RichText };
}

export interface CardVM {
  /** 손패에서 이 카드를 가리키는 이름 (호버·선택) */
  key: string;
  name: string;
  cost: number;
  /** 마력 부족 → 비용 동전 테 */
  costShort?: boolean;
  /** 주인 정령: 큰 얼굴 기호 줄의 얼굴 (face가 없을 때) */
  owner: FaceId;
  /** 큰 얼굴 기호 줄에 넣을 얼굴 텍스처 키 (원으로 구운 그림). 없으면 owner의 얼굴 그림 */
  face?: string;
  /** 주인 정령의 역할 기호. 얼굴 그림이 없으면 얼굴 자리에 이 기호를 그려요 (0153) */
  role?: IconId;
  /** 희귀도. 보석은 큰 얼굴 기호 줄에만 그려요 */
  rarity?: CardRarity;
  /** 속성 기호 (e-*) */
  element: IconId;
  /** 카드 일러스트. 없으면 그림 자리를 비워 둬요 */
  illustration?: CardArtId;
  values: CardValueVM[];
  /** 못 내는 카드: 카드째 회색으로 흐려요. 자물쇠 꼬리표와 비용 동전은 또렷하게 (0043) */
  off?: boolean;
  /** 마력 말고 다른 조건이 모자라요: 필요한 조건 기호 (오른쪽 위 자물쇠 표지). 사유 글은 큰 얼굴(detail.why)에만 */
  need?: IconId;
  /** 무작위 같은 표식 기호 */
  mark?: IconId;
  /** 강화한 카드: 큰 얼굴 기호 줄과, 덱 보기 · 휴식의 작은 얼굴에 화살 기호 */
  upgraded?: boolean;
  detail: CardDetailVM;
}
