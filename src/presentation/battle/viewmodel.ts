// 전투 화면이 그리는 값. 화면은 이 모양만 알고 Battle 객체는 몰라요.
// 지금은 정본 고정 장면(fixtures/)으로 채우고, session 층이 생기면 Battle 상태에서 만들어요.
import type { CardVM } from "../card/viewmodel";
import type { RichText } from "../tooltip/content";
import type { FaceId, IconId, UnitFace } from "../faces";
import type { EquipVM } from "../run/viewmodel";

export type { FaceId, IconId, UnitFace };

export interface OrderSlotVM {
  /** 장면이 바뀌어도 같은 토큰임을 알아보는 이름 (모션, 0077). 없으면 움직이지 않아요 */
  key?: string;
  n: number;
  /** 적 그림 기호 (en-*) */
  art: IconId;
  /** 행동 기호 (i-*) */
  action: IconId;
  /** now = 재생 중 지금 차례 (얼굴에 흰 테) · past = 재생 중 지나감 (흐림) (0074) */
  state?: "now" | "past";
  /** 차징 중: 행동 기호 배지의 테와 기호가 보라 (0074 11번) */
  charge?: boolean;
  /** 끊김 (0074 10번): 배지가 브레이크 기호로. plan = 든 카드가 끊을 예정(보라 점선 테), done = 끊김(보라로 채움 + 얼굴 흐림) */
  cut?: "plan" | "done";
  /** 이 행동을 하는 적 (enemies 인덱스). 가리키면 그 적의 풀이와 맞는 아군 강조 */
  enemy?: number;
  tip?: OrderTipVM;
}

/** 순서표 머리: 장소 위, 턴 + 단계 아래 (0038). 없으면 단계만 (고정 장면) */
export interface OrderHeadVM {
  place?: string;
  turn: number;
}

/** 순서표의 아군 토큰: 놓은 카드 한 장 (0038). 주인 얼굴 + 카드 기호, 번호 없음 */
export interface AllyTokenVM {
  /** 장면이 바뀌어도 같은 토큰임을 알아보는 이름 (모션, 0077) */
  key?: string;
  face: UnitFace;
  /** 카드 그림 창의 효과 기호 */
  icon: IconId;
  /** gap = 허점 창에 끝나는 공격(노란 테) · held = 든 카드가 들어갈 자리(흰 점선 테 + 반투명) · release = 해방(보라 테 + 왼쪽 위 ✦) (0074 1번) */
  mark?: "gap" | "held" | "release";
  /** 재생 중 지나감 (흐림) */
  past?: boolean;
  tip?: OrderTipVM;
}

/** 순서표 토큰 풀이 (0074 9번, 결과 먼저): 이름 + 종류 칩 → 결과(크게) → 효과문 → 순서·상태 칩 */
export interface OrderTipVM {
  title: string;
  /** 종류 칩: 카드 · 해방 · 차징 */
  kind?: string;
  /** 결과: 대상 이름 + 값 (18→3, 14) */
  result?: { who?: string; value: string };
  text: RichText;
  /** 순서·상태 칩. tone: warn = 허점(노랑), acc = 브레이크 가능(보라) */
  chips?: { text: string; tone?: "warn" | "acc" }[];
}

export interface StatusVM {
  icon: IconId;
  n: number;
}

export interface AllyVM {
  face: UnitFace;
  /** 이름 (가리키면 뜨는 유닛 풀이) */
  name?: string;
  /** 속성 기호 el-* (정보 묶음의 속성 배지) */
  element?: IconId;
  /** 필드 그림 (지금은 정본의 임시 실루엣 sil-*) */
  art: IconId;
  hp: number;
  maxHp: number;
  block?: number;
  /** 이번 적 차례에 받을 피해 합계. HP 막대에 (방어도를 뺀 만큼) 깎일 구간을 보여요 */
  incoming?: number;
  statuses: StatusVM[];
  /** 앞열 (유닛 앞에 깃발) */
  front?: boolean;
  /** 지닌 장비 (0066: 가리키면 유닛 풀이에 작은 칸 기호만). 빈 칸은 그리지 않아요 */
  equip?: EquipVM[];
}

/** 의도의 대상: 아군 얼굴, 전체, 무작위, 없음(자기 자신·새끼에게) */
export type IntentTarget = UnitFace | "all" | "random" | "none";

export type IntentVM =
  | { kind: "attack" | "charge" | "defend" | "buff"; order?: number; icon: IconId; amount: string; target: IntentTarget }
  | { kind: "debuff"; order?: number; icon: IconId; amount: string; target: IntentTarget };
// order: 이번 턴 순서표 번호. 차징 중처럼 이번 턴에 행동하지 않으면 없어요

export interface EnemyVM {
  art: IconId;
  hp: number;
  maxHp: number;
  block?: number;
  element: IconId;
  /** 약점 속성. 바람·무속성처럼 약점이 없으면 비움 (0028). 있으면 약점 배지를 늘 그리고, 맞는 속성 카드를 들면 켜요 */
  weakTo?: IconId;
  statuses: StatusVM[];
  /** 이번 턴 행동. 없으면 의도 알약을 그리지 않아요 */
  intent?: IntentVM;
  hovered?: boolean;
  /** 가리키면 뜨는 유닛 풀이: 이름 + 등급, 행동 문장 (lines 첫 줄. 나머지는 이름 줄에 덧붙여요) */
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
  /** bundles: 적 칸마다 그 앞에 묶인 아군 토큰, 마지막은 꼬리 묶음 (길이 = slots + 1, 0038). 없으면 적 칸만 */
  order: {
    slots: OrderSlotVM[]; bundles?: AllyTokenVM[][]; head?: OrderHeadVM;
    /** 턴 재생 중: 머리가 "재생 중"(빈 점), 지나가지 않은 첫 칸 앞에 흰 재생 위치 선 (0074) */
    playing?: boolean;
  };
  allies: AllyVM[];
  enemies: EnemyVM[];
  mana: { n: number; max: number };
  /** 정령별 손패 묶음 (왼쪽부터). 각성체 묶음 끝에는 해방 카드가 붙어요 (0075) */
  hand: { owner: UnitFace; cards: CardVM[] }[];
  /** 지금 낼 수 있는 카드 수 */
  playable: number;
  piles: { draw: number; discard: number; exhaust: number };
  /** 낼 수 있는 카드마다 대상 규칙과 결과 미리보기 (card key). 없는 카드는 끌거나 집을 수 없어요 */
  plays: Record<string, PlayVM>;
  /** 열린 고르기 창. 닫힐 때까지 다른 조작은 쉬어요 */
  pick?: PickVM;
  /** 시각 검증용 시작 상태 (?scene=aim 등). 없으면 쉬는 상태 */
  start?: StartVM;
  /** 턴 재생 중 이 장면에서 일어난 일 (유닛 반응 모션, 0086). 없으면 움직이지 않아요 */
  acted?: ActedVM;
}

/** 재생 한 걸음: 행동한 유닛과, 그 행동으로 유닛마다 뜬 수 (일어난 순서대로) */
export interface ActedVM {
  actor?: UnitRef;
  pops: PopVM[];
}

/** 유닛 머리 위에 잠깐 뜨는 알약. damage = HP가 깎임, heal = 회복, block = 방어도 얻음 */
export interface PopVM {
  ref: UnitRef;
  kind: "damage" | "heal" | "block";
  n: number;
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
  /** pick: 이 인덱스만 고를 수 있어요 (해방 카드는 그 정령에게만) */
  only?: number;
}

/** 가운데 고르기 창 (0075): 낙하(턴 시작)와 품기(재생 뒤)가 같이 써요 */
export interface PickVM {
  /** fall = 고르면 바로 받아요 · hold = 미리 골라져 있고 버튼으로 닫아요 */
  kind: "fall" | "hold";
  /** 고를 장 수 */
  n: number;
  cards: CardVM[];
  /** 미리 골라진 카드 key */
  picked: string[];
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
  /** 차징이 끊기면 의도 알약·순서표에 끊김 표시 */
  cut?: boolean;
}

export interface PlayVM {
  target: TargetRule;
  /** 지금 놓으면 순서표에 들어갈 자리: bundles[bundle]의 i번째 (든 동안 흰 점선 토큰, 0074) */
  slot?: { bundle: number; i: number; token: AllyTokenVM };
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
