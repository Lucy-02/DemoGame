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

export interface CardVM {
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
}
