// 지도 화면이 그리는 값.
import type { NodeType } from "../../core/run";
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
