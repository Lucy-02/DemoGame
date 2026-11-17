// 자람 조건 세기 (0021 · 0045): 전투가 확정한 이벤트에서 정령마다 역할대로 한 일을 세요. 전투 규칙은 건드리지 않아요.
// 준 피해 = 그 정령의 카드가 재생되는 동안 적이 실제로 받은 피해, 막은 피해 = 자기 방어도와 벽으로 막은 피해, 빙결 = 그 정령의 카드가 건 빙결.
import type { BattleEvent } from "../core/battle";
import type { DeedDef } from "../core/types";

export type DeedKind = DeedDef["kind"];
/** 정령 id → 종류별 센 수 */
export type DeedTally = Record<string, Partial<Record<DeedKind, number>>>;

function add(t: DeedTally, id: string, kind: DeedKind, n: number) {
  if (n <= 0) return;
  const row = (t[id] ??= {});
  row[kind] = (row[kind] ?? 0) + n;
}

/** 이벤트 묶음을 tally에 더해요 */
export function tallyDeeds(t: DeedTally, events: readonly BattleEvent[]): DeedTally {
  for (const e of events) {
    if (e.k === "freeze") {
      if (e.by) add(t, e.by, "freeze", 1);
    } else if (e.k === "damage") {
      if (e.ref.side === "e") {
        if (e.by) add(t, e.by, "dealt", e.amount);
      } else {
        add(t, e.ref.id, "blocked", e.blocked);
        if (e.keeper) add(t, e.keeper, "blocked", e.wall ?? 0);
      }
    }
  }
  return t;
}
