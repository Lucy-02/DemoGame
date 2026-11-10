// 판단하는 자동 플레이 봇. 균형을 볼 때 써요 (runsim의 smart, 탐색 봇의 롤아웃).
// 골든 테스트는 예전 봇(autoplay.ts의 autoPlayTurn)을 그대로 써서 스냅샷이 흔들리지 않아요.
// 한 장씩 "지금 놓으면 가장 값진 카드와 대상"을 골라 마력이 떨어질 때까지 놓아요.
import type { Battle, BCard } from "../src/core/battle";
import { C, cardDef } from "../src/core/data";
import type { Rng } from "../src/core/rng";
import { scale } from "../src/core/stats";
import type { CardOp } from "../src/core/types";

type Enemy = ReturnType<Battle["aliveEnemies"]>[number];
type Spirit = ReturnType<Battle["aliveSpirits"]>[number];
type Target = { side: "e"; uid: number } | { side: "s"; id: string } | undefined;

/** 값을 매길 때 쓰는 무게. 피해 1 = 1점이 기준이에요. */
const W = { block: 1.3, burn: 0.9, chill: 1, draw: 3, kill: 5, breakCharge: 1.2, hide: 0.5, setup: 4, small: 2  };

interface Plan {
  /** 이번 턴 적 공격이 아군마다 입힐 피해 (막기 전) */
  incoming: Map<string, number>;
  /** 적마다 이번 턴 입힐 피해 합 */
  threat: Map<number, number>;
  /** 가장 이른 적 공격 시각 */
  firstHit: number;
  /** 이미 놓은 카드가 줄 피해 · 방어도 */
  dealt: Map<number, number>;
  guarded: Map<string, number>;
}

function readThreat(b: Battle): Plan {
  const plan: Plan = { incoming: new Map(), threat: new Map(), firstHit: Infinity, dealt: new Map(), guarded: new Map() };
  const spirits = b.aliveSpirits();
  const lowest = [...spirits].sort((a, z) => a.hp - z.hp)[0];
  const add = (s: Spirit | undefined, e: Enemy, v: number) => {
    if (!s) return;
    plan.incoming.set(s.id, (plan.incoming.get(s.id) ?? 0) + v);
    plan.threat.set(e.uid, (plan.threat.get(e.uid) ?? 0) + v);
  };
  for (const e of b.aliveEnemies()) {
    const slot = b.slots.find((x) => x.uid === e.uid && !x.done);
    if (!slot) continue;
    for (const a of b.currentMove(e).actions) {
      if (a.type !== "attack") continue;
      const dmg = b.enemyDmgPreview(e, a.dmg) * (a.hits ?? 1);
      plan.firstHit = Math.min(plan.firstHit, slot.at);
      if (a.target === "all") for (const s of spirits) add(s, e, dmg);
      else if (a.target === "front") add(spirits.find((s) => s.id === b.frontId) ?? spirits[0], e, dmg);
      else add(lowest, e, dmg);
    }
  }
  return plan;
}

/** 이 아군이 아직 못 막은 피해 */
const unblocked = (plan: Plan, s: Spirit) => Math.max(0, (plan.incoming.get(s.id) ?? 0) - s.block - (plan.guarded.get(s.id) ?? 0));

function scoreCard(b: Battle, c: BCard, plan: Plan, enemy?: Enemy, ally?: Spirit): number {
  const def = cardDef(c.cardId);
  // 적이 하나면 needsTarget이 null이라 대상이 안 넘어와요
  if (def.target === "enemy" && !enemy) enemy = b.aliveEnemies()[0];
  const owner = b.spirit(c.owner);
  const end = b.previewEnd(c);
  const enemies = def.target === "enemy" ? (enemy ? [enemy] : []) : b.aliveEnemies();
  const power = b.stat(owner, "power"), guard = b.stat(owner, "guard"), focus = b.stat(owner, "focus");
  const inTime = end <= plan.firstHit;
  let score = 0;
  const walk = (ops: CardOp[]) => {
    for (const op of ops) {
      switch (op.op) {
        case "damage": {
          const per = scale(op.value, power) * (op.hits ?? 1);
          for (const e of def.target === "enemy" || def.target === "allEnemies" ? enemies : enemies.slice(0, 1)) {
            const left = e.hp + e.block - (plan.dealt.get(e.uid) ?? 0);
            if (left <= 0) continue;
            const v = Math.min(per, left) * (b.inOpening(e, end) ? (C.opening_mult as number) : 1);
            score += v;
            if (per >= left) score += W.kill + (end <= plan.firstHit ? (plan.threat.get(e.uid) ?? 0) : 0);
          }
          break;
        }
        case "burn":
          score += scale(op.value, focus) * W.burn * Math.max(1, enemies.length);
          break;
        case "chill":
          score += scale(op.value, focus) * W.chill + (enemy && (plan.threat.get(enemy.uid) ?? 0) > 0 ? W.small : 0);
          break;
        case "block": case "wall": {
          if (!inTime) break;
          const gain = scale(op.value, guard);
          const who = op.op === "wall" ? b.aliveSpirits() : [ally ?? owner];
          const need = who.reduce((a, s) => a + unblocked(plan, s), 0);
          score += Math.min(gain, need) * W.block;
          break;
        }
        case "ram": case "breakCharging": case "cancelNext": {
          const charging = (def.target === "enemy" ? enemies : b.aliveEnemies()).filter((e) => e.charging);
          for (const e of charging) {
            const hit = b.currentMove(e).actions.reduce((a, x) => a + (x.type === "attack" ? x.dmg * (x.hits ?? 1) : 0), 0);
            score += hit * W.breakCharge;
          }
          break;
        }
        case "hide":
          if (inTime) score += Math.max(0, ...b.aliveSpirits().map((s) => unblocked(plan, s))) * W.hide;
          break;
        case "draw":
          score += op.value * W.draw;
          break;
        case "heal": {
          const s = ally ?? owner;
          score += Math.min(scale(op.value, focus), s.maxHp - s.hp);
          break;
        }
        case "starlight": case "aura": case "empower": case "hitBonus": case "vulnerable":
          score += W.setup;
          break;
        case "weak":
          score += enemies.some((e) => (plan.threat.get(e.uid) ?? 0) > 0) ? W.setup : W.small;
          break;
        default:
          score += W.small;
      }
      if ("then" in op && Array.isArray(op.then)) walk(op.then as CardOp[]);
    }
  };
  walk(def.effects);
  return score;
}

/** 놓은 카드가 줄 피해 · 방어도를 적어 두어 넘치게 놓지 않아요 */
function note(b: Battle, c: BCard, plan: Plan, enemy?: Enemy, ally?: Spirit) {
  const def = cardDef(c.cardId);
  if (def.target === "enemy" && !enemy) enemy = b.aliveEnemies()[0];
  const owner = b.spirit(c.owner);
  for (const op of def.effects) {
    if (op.op === "damage") {
      const per = scale(op.value, b.stat(owner, "power")) * (op.hits ?? 1);
      for (const e of def.target === "enemy" ? (enemy ? [enemy] : []) : b.aliveEnemies()) plan.dealt.set(e.uid, (plan.dealt.get(e.uid) ?? 0) + per);
    } else if (op.op === "block" || op.op === "wall") {
      const gain = scale(op.value, b.stat(owner, "guard"));
      for (const s of op.op === "wall" ? b.aliveSpirits() : [ally ?? owner]) plan.guarded.set(s.id, (plan.guarded.get(s.id) ?? 0) + gain);
    }
  }
}

export function smartPlayTurn(b: Battle, _rng: Rng) {
  for (const s of b.aliveSpirits()) if (b.canRelease(s.id)) b.release(s.id);
  while (b.stars.choice) b.chooseFall(["meteor", "comet", "meteor_shower", "star_veil"]);
  const plan = readThreat(b);
  for (let guard = 0; guard < 40 && b.result === "ongoing"; guard++) {
    let best: { c: BCard; score: number; target: Target; enemy?: Enemy; ally?: Spirit } | null = null;
    for (const c of b.hand) {
      if (!b.canPlay(c).ok) continue;
      const need = b.needsTarget(c);
      const options: { target: Target; enemy?: Enemy; ally?: Spirit }[] =
        need === "enemy" ? b.aliveEnemies().map((e) => ({ target: { side: "e" as const, uid: e.uid }, enemy: e }))
        : need === "ally" ? b.aliveSpirits().map((s) => ({ target: { side: "s" as const, id: s.id }, ally: s }))
        : [{ target: undefined }];
      for (const o of options) {
        const score = scoreCard(b, c, plan, o.enemy, o.ally) / Math.max(0.5, b.cardCost(c));
        if (!best || score > best.score) best = { c, score, ...o };
      }
    }
    if (!best) return;
    note(b, best.c, plan, best.enemy, best.ally);
    if (!b.play(best.c.uid, best.target)) return;
  }
}
