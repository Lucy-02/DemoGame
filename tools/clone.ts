// 전투 복제: 탐색 봇(search.ts)이 "이 카드를 놓으면 어떻게 되나"를 미리 돌려 보는 데 써요.
// src/core를 건드리지 않으려고 새 Battle을 만든 뒤 데이터 필드를 깊은 복사로 덮어써요.
// Battle에 필드가 늘면 여기도 고쳐야 해요. clone.test.ts가 필드 목록과 복제 뒤 재생 결과로 지켜요.
import { Battle } from "../src/core/battle";
import { Rng } from "../src/core/rng";

const cloneStatus = (st: any) => { const o: any = {}; for (const k in st) o[k] = { ...st[k] }; return o; };

export function cloneRng(r: Rng): Rng { const n = new Rng(0); (n as any).s = (r as any).s; return n; }

export function cloneBattle(src: Battle, rng?: Rng): Battle {
  const s: any = src;
  const b: any = new Battle(s.spirits.map((x: any) => ({ ...x.run, hp: 1 })), [], s.enemies.map((e: any) => e.def.id), s.frontId, new Rng(1));
  const cards = new Map<any, any>();
  const cc = (c: any) => { let n = cards.get(c); if (!n) { n = { ...c }; cards.set(c, n); } return n; };
  b.spirits = s.spirits.map((x: any) => ({ ...x, status: cloneStatus(x.status), auras: new Map(x.auras) }));
  b.enemies = s.enemies.map((e: any) => ({ ...e, status: cloneStatus(e.status) }));
  for (const k of ["draw", "hand", "discard", "exhaust", "sealed", "playedThisTurn"]) b[k] = s[k].map(cc);
  b.planned = s.planned.map((p: any) => ({ ...p, card: cc(p.card) }));
  b.slots = s.slots.map((x: any) => ({ ...x }));
  b.stars = { ...s.stars, choice: s.stars.choice ? { ...s.stars.choice, options: [...s.stars.choice.options] } : null };
  b.hold = { ...s.hold, picks: [...s.hold.picks], held: s.hold.held.map(cc) };
  b.playedByElement = { ...s.playedByElement };
  b.repeatNext = s.repeatNext ? { ...s.repeatNext } : null;
  for (const k of ["mana", "turn", "frontId", "result", "nextTurnMana", "replaying", "now", "pendingCostUp", "pendingSeal", "nextUid", "echoingReady"]) b[k] = s[k];
  b.events = [];
  b.rng = rng ?? cloneRng(s.rng);
  return b as Battle;
}

/** 복제가 아는 Battle 필드. 여기에 없는 필드가 생기면 테스트가 실패해요. */
export const CLONED_FIELDS = ["spirits", "enemies", "draw", "hand", "discard", "exhaust", "sealed", "playedThisTurn", "planned", "slots", "stars", "hold",
  "playedByElement", "repeatNext", "mana", "turn", "frontId", "result", "nextTurnMana", "replaying", "now", "pendingCostUp", "pendingSeal", "nextUid", "echoingReady", "events", "rng",
  // 생성자가 새 전투에 묶어 만드는 단계 목록이라 복사하지 않아요
  "turnStartSteps", "turnEndSteps", "roundEndSteps"];
