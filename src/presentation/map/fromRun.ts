// 판 → 지도 화면 값.
import { TRAIT_NAME } from "../../core/data";
import type { Run } from "../../core/run";
import { activePersonality, resolveStat, round, type StatSource } from "../../core/stats";
import { cardVM, lane } from "../run/fromCore";
import { COPY } from "./copy";
import type { MapLinkVM, MapNodeVM, MapVM, NodeState, SheetStatVM, SheetVM } from "./viewmodel";

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

const SHEET_STATS = ["hp", "power", "guard", "focus"] as const;
const sourceName = (s: StatSource) => (s.startsWith("equipment:") ? COPY.source.equipment : COPY.source[s as keyof typeof COPY.source]);

/** 펼친 정령 줄 아래 판: 능력치가 어디서 왔는지와 이번 판에 받은 카드 */
export function sheetVM(run: Run, id: string): SheetVM | undefined {
  const rs = run.spirits.find((s) => s.id === id);
  if (!rs) return undefined;
  const stats = SHEET_STATS.map((k): SheetStatVM => {
    const calc = resolveStat(rs, k);
    const sum = (f: (s: StatSource) => boolean) => calc.parts.filter((p) => f(p.source)).reduce((a, p) => a + p.delta, 0);
    const base = sum((s) => s === "base"), stage = sum((s) => s === "stage");
    const total = round(calc.value);
    // 같은 출처는 합쳐서 한 번만 써요
    const by = new Map<string, number>();
    for (const p of calc.parts) by.set(sourceName(p.source), (by.get(sourceName(p.source)) ?? 0) + p.delta);
    const detail = [...by].map(([name, v], i) => (i === 0 ? `${name} ${round(v)}` : `${name} ${round(v) < 0 ? "" : "+"}${round(v)}`)).join(COPY.sep);
    return { id: k, name: COPY.stat[k], total, base, stage, rest: Math.max(0, total - base - stage), detail };
  });
  const p = activePersonality(rs);
  return {
    stats, personality: p ? { name: p.name, desc: p.desc } : undefined,
    cards: run.received.filter((c) => c.owner === id).map((c) => ({ ...cardVM(c.cardId, id), key: `r${c.uid}` })),
  };
}
