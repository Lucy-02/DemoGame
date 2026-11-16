// 지도 화면이 그리는 값.
import type { NodeType } from "../../core/run";
import type { CardVM } from "../card/viewmodel";
import type { LaneVM } from "../run/viewmodel";

/** past = 지나온 칸 · here = 지금 있는 칸 · open = 지금 갈 수 있는 칸 · far = 아직 못 가는 칸 */
export type NodeState = "past" | "here" | "open" | "far";

export interface MapNodeVM {
  id: string;
  kind: NodeType | "start";
  floor: number;
  /** 가로 자리 (0 ~ cols - 1, 소수 가능) */
  col: number;
  state: NodeState;
  /** 정예의 거친 특성 이름 (호버) */
  trait?: string;
}

export interface MapLinkVM {
  from: string;
  to: string;
  /** 지나온 길 */
  walked: boolean;
}

export interface MapVM {
  nodes: MapNodeVM[];
  links: MapLinkVM[];
  /** 지금 층 (출발 전 0) */
  floor: number;
  /** 가장 높은 층 (보스) */
  top: number;
  cols: number;
  gold: number;
  party: LaneVM[];
}

/** 능력치 한 줄의 출처별 몫 (0046): 기본 · 단계 · 그 밖(레벨 · 성격 · 장비 · 이번 판) */
export interface SheetStatVM {
  id: "hp" | "power" | "guard" | "focus";
  name: string;
  total: number;
  base: number;
  stage: number;
  rest: number;
  /** 호버 풀이: "기본 32 · 단계 +6 · 레벨 +6" */
  detail: string;
}

/** 펼친 정령 줄 아래 판 */
export interface SheetVM {
  stats: SheetStatVM[];
  /** 성격 (유체는 아직 없어요) */
  personality?: { name: string; desc: string };
  /** 이번 판에 받은 카드 */
  cards: CardVM[];
}
