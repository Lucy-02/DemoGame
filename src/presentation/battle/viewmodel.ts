// 전투 화면이 그리는 값. 화면은 이 모양만 알고 Battle 객체는 몰라요.
// 지금은 정본 고정 장면(fixtures/)으로 채우고, session 층이 생기면 Battle 상태에서 만들어요.
import type { CardVM } from "../card/viewmodel";
import type { FaceId, IconId } from "../faces";

export type { FaceId, IconId };

export interface OrderSlotVM {
  n: number;
  /** 적 그림 기호 (en-*) */
  art: IconId;
  /** 행동 기호 (i-*) */
  action: IconId;
  /** now = 지금 차징 완료(곧 해결), cut = 끊김 */
  state?: "now" | "cut";
}

export interface StatusVM {
  icon: IconId;
  n: number;
}

export interface AllyVM {
  face: FaceId;
  /** 필드 그림 (지금은 정본의 임시 실루엣 sil-*) */
  art: IconId;
  hp: number;
  maxHp: number;
  block?: number;
  /** 이번 적 차례에 받을 피해 합계 */
  incoming?: number;
  statuses: StatusVM[];
  sync: number;
  front?: boolean;
}

export type IntentVM =
  | { kind: "attack" | "charge"; order: number; icon: IconId; amount: string; target: FaceId | "all" }
  | { kind: "debuff"; order: number; icon: IconId; label: string; amount: string; target: FaceId | "all" };

export interface EnemyVM {
  art: IconId;
  hp: number;
  maxHp: number;
  block?: number;
  element: IconId;
  weakTo: IconId;
  statuses: StatusVM[];
  intent: IntentVM;
  /** 차징 중인 적의 실드 칸: broken칸 깨짐 / total칸 */
  shield?: { broken: number; total: number };
  hovered?: boolean;
  /** 호버 중일 때 뜨는 설명 (정본 .etip) */
  tip?: EnemyTipVM;
}

/** 설명 한 줄: 보통 글과 강조 숫자(b)의 조각 */
export type TipLine = { text: string; strong?: boolean }[];

export interface EnemyTipVM {
  name: string;
  /** 이름 옆 등급 꼬리표 (정예 등) */
  rank?: string;
  lines: TipLine[];
}

export interface BattleVM {
  where: { area: string; floor: number; turn: number };
  order: { slots: OrderSlotVM[]; nextTurn: number };
  allies: AllyVM[];
  enemies: EnemyVM[];
  mana: { n: number; max: number };
  /** 정령별 손패 묶음 (왼쪽부터) */
  hand: { owner: FaceId; cards: CardVM[] }[];
  /** 지금 낼 수 있는 카드 수 */
  playable: number;
  piles: { draw: number; discard: number; exhaust: number };
}
