// 전투 화면이 그리는 값. 화면은 이 모양만 알고 Battle 객체는 몰라요.
// 지금은 정본 고정 장면(fixtures/)으로 채우고, session 층이 생기면 Battle 상태에서 만들어요.

export type IconId = string;

export interface OrderSlotVM {
  n: number;
  /** 적 그림 기호 (en-*) */
  art: IconId;
  /** 행동 기호 (i-*) */
  action: IconId;
  /** now = 지금 차징 완료(곧 해결), cut = 끊김 */
  state?: "now" | "cut";
}

export interface BattleVM {
  where: { area: string; floor: number; turn: number };
  order: { slots: OrderSlotVM[]; nextTurn: number };
}
