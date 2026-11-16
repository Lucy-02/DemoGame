// 판 → 지도 화면 값.
import { TRAIT_NAME } from "../../core/data";
import type { Run } from "../../core/run";
import { lane } from "../run/fromCore";
import type { MapLinkVM, MapNodeVM, MapVM, NodeState } from "./viewmodel";

export const START = "start";

export function mapVM(run: Run): MapVM {
  const all = [...run.map.values()];
  const open = new Set(run.reachable().map((n) => n.id));
  const here = run.current?.id ?? START;
  const visited = new Set(run.visited);
  const state = (id: string): NodeState => (id === here ? "here" : visited.has(id) ? "past" : open.has(id) ? "open" : "far");
  const cols = Math.max(...all.filter((n) => n.type !== "boss").map((n) => n.col)) + 1;
  const firsts = all.filter((n) => n.floor === 1);
  const nodes: MapNodeVM[] = [
    { id: START, kind: "start", floor: 0, col: (cols - 1) / 2, state: run.current ? "past" : "here" },
    ...all.map((n) => ({ id: n.id, kind: n.type, floor: n.floor, col: n.col, state: state(n.id), trait: n.trait && TRAIT_NAME[n.trait] })),
  ];
  const links: MapLinkVM[] = [
    ...firsts.map((n) => ({ from: START, to: n.id, walked: visited.has(n.id) })),
    ...all.flatMap((n) => n.next.map((to) => ({ from: n.id, to, walked: visited.has(n.id) && visited.has(to) }))),
  ];
  return {
    nodes, links, floor: run.current?.floor ?? 0, top: Math.max(...all.map((n) => n.floor)), cols,
    gold: run.gold, party: run.spirits.map((rs) => lane(rs)),
  };
}
