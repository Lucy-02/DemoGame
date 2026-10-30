// 전투 화면이 그리는 값. 화면은 이 모양만 알고 Battle 객체는 몰라요.
// 지금은 정본 고정 장면(fixtures/)으로 채우고, session 층이 생기면 Battle 상태에서 만들어요.
import type { CardVM } from "../card/viewmodel";
import type { RichText } from "../tooltip/content";
import type { FaceId, IconId } from "../faces";

export type { FaceId, IconId };

export interface OrderSlotVM {
  n: number;
  /** 적 그림 기호 (en-*) */
  art: IconId;
  /** 행동 기호 (i-*) */
  action: IconId;
  /** now = 지금 차징 완료(곧 해결) */
  state?: "now";
  /** 미리보기에서 끊김 (사선, .rs-slot.cut). now와 함께 올 수 있어요 */
  cut?: boolean;
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
export type TipLine = RichText;

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
  /** 낼 수 있는 카드마다 대상 규칙과 결과 미리보기 (card key). 없는 카드는 끌거나 집을 수 없어요 */
  plays: Record<string, PlayVM>;
  /** 시각 검증용 시작 상태 (?scene=aim 등). 없으면 쉬는 상태 */
  start?: StartVM;
}

/** 바뀌기 전 → 뒤 */
export interface Change {
  from: number;
  to: number;
}

export type Side = "enemy" | "ally";

/** 필드의 캐릭터 하나 (그 편 배열의 인덱스) */
export interface UnitRef {
  side: Side;
  i: number;
}

/** 카드 대상 규칙. pick = 플레이어가 하나 고름, all = 그 편 전체, random = 카드가 무작위로 (정본 규칙 상태 3) */
export interface TargetRule {
  kind: "pick" | "all" | "random";
  side: Side;
}

/** 카드를 낼 때 필드에 그리는 결과 (결정 0007 "미리보기 예산", 0013 끌어 대기).
 *  필드엔 ① 대상의 결과 ② 아군마다 받을 피해 a→b 두 가지만. 연쇄·지연·다음 턴 효과는 카드 설명에만.
 *  값은 아직 전투 규칙(src/core)에서 계산하지 않아요. session 층이 생기면 거기서 채워요. */
export interface OutcomeVM {
  /** 적마다 결과 (enemies 인덱스). 없는 적은 그대로 */
  enemies: Partial<Record<number, EnemyOutcomeVM>>;
  /** 아군마다 받을 피해 a→b (allies 순서). 비어 있으면 그 아군은 그대로 */
  incoming: (Change | undefined)[];
}

export interface EnemyOutcomeVM {
  /** 머리 위 타격 알약 (때리는 순서대로) */
  hits: number[];
  block?: Change;
  hp: Change;
  /** 이번에 깰 실드 칸 수 */
  shieldBreak?: number;
  /** 차징이 끊기면 의도 알약·순서표에 끊김 표시 */
  cut?: boolean;
}

export interface PlayVM {
  target: TargetRule;
  /** pick: 고른 대상 인덱스마다 결과. all·random: 한 가지 결과("all"). 없으면 강조만 해요 */
  outcomes?: Partial<Record<number | "all", OutcomeVM>>;
}

export interface StartVM {
  /** 집은(클릭) 카드, 또는 끄는 중인 카드 */
  card: string;
  mode: "held" | "drag";
  /** 포인터가 올라간 대상 (없으면 필드 빈 곳 또는 손패) */
  over?: UnitRef;
}
