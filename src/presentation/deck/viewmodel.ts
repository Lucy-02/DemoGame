// 덱 보기가 그리는 값: 정령별 한 줄 (0012 A)
import type { CardVM } from "../card/viewmodel";
import type { LaneVM } from "../run/viewmodel";

export interface DeckRowVM {
  id: string;
  name: string;
  face?: LaneVM["face"];
  /** 이번 탐험에서 받은 수 (줄 머리 +n) */
  gained: number;
  cards: CardVM[];
}

export interface DeckVM {
  rows: DeckRowVM[];
}
