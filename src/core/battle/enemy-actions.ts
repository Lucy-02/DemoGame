import type { Clause } from "../clauses";
import { C } from "../data";
import { round } from "../stats";
import type { EnemyAction, EnemyTargetRule } from "../types";
import type { Engine } from "./engine";
import { refOf, stackOf, statusN, type BEnemy, type Intent } from "./state";
import { vulnMult } from "./statuses";

type ActionId = EnemyAction["type"];
type ActionOf<K extends ActionId> = Extract<EnemyAction, { type: K }>;

/** 적 행동 하나의 규칙: 풀이 문장, 종류, 처리 */
export interface EnemyActionHandler<K extends ActionId = ActionId> {
  /** 의도 종류. 한 행동에 여럿이면 attack > defend > buff > debuff 순으로 대표를 골라요 */
  kind: Exclude<Intent["kind"], "charge" | "chargeReady" | "skip">;
  /** 호버 풀이의 한 문장 (TEXT_RULES 1절 문장 틀). 숫자는 지금 상태를 넣은 실제 값이에요 */
  text: (b: Engine, e: BEnemy, a: ActionOf<K>) => Clause;
  run: (b: Engine, e: BEnemy, a: ActionOf<K>) => void;
}

/** 적이 노리는 대상 (효과문의 대상 자리) */
const TO: Record<EnemyTargetRule, string> = { front: "앞열 아군에게 ", random: "무작위 아군에게 ", lowest: "HP가 가장 낮은 아군에게 ", all: "모든 아군에게 " };
const hitsOf = (d: number, hits?: number) => (hits && hits > 1 ? `${d}씩 ${hits}번` : `${d}`);

export const ENEMY_ACTIONS: { [K in ActionId]: EnemyActionHandler<K> } = {
  attack: {
    kind: "attack",
    text(b, e, a) {
      const d = b.enemyDmgPreview(e, a.dmg);
      return { to: TO[a.target], core: `피해를 ${hitsOf(d, a.hits)} 입히`, after: a.pierce ? "방어도를 무시합니다." : undefined };
    },
    run(b, e, a) {
      const hits = a.hits ?? 1;
      const fixed = a.target === "random" ? null : b.pickTargets(a.target);
      for (let h = 0; h < hits; h++) {
        const targets = fixed ?? b.pickTargets("random");
        for (const s of targets) {
          if (s.downed) continue;
          b.enemyHit(e, s, a.dmg, !!a.pierce);
        }
        if (e.dead) break;
      }
      b.settleHidden();
    },
  },
  block: {
    kind: "defend",
    text: (_b, _e, a) => ({ to: "", core: `방어도를 ${a.value} 얻` }),
    run(b, e, a) {
      e.block += a.value;
      b.emit({ k: "block", ref: refOf(e), amount: a.value });
    },
  },
  weak: {
    kind: "debuff",
    text: (_b, _e, a) => ({ to: TO[a.target], core: `약화를 ${a.turns}턴 부여하` }),
    run(b, _e, a) {
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "weak", a.turns, { fresh: b.replaying });
    },
  },
  vulnerable: {
    kind: "debuff",
    text: (_b, _e, a) => ({ to: TO[a.target], core: `취약을 ${a.turns}턴 부여하` }),
    run(b, _e, a) {
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "vuln", a.turns, { fresh: b.replaying, strength: C.vuln_base });
    },
  },
  burn: {
    kind: "debuff",
    text: (_b, _e, a) => ({ to: TO[a.target], core: `화상을 ${a.value} 부여하` }),
    run(b, _e, a) {
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "burn", a.value);
    },
  },
  buffMinions: {
    kind: "buff",
    text: (_b, _e, a) => ({ to: "", core: `새끼가 입히는 피해를 ${a.value} 늘리` }),
    run(b, _e, a) {
      for (const m of b.aliveEnemies()) if (m.def.tier === "minion") b.addStatus(m, "bonusDmg", a.value);
    },
  },
  costUp: {
    kind: "debuff",
    text: (_b, _e, a) => ({ to: "", core: `다음 턴에 손패의 무작위 카드 비용을 ${a.value} 늘리` }),
    run: (b, _e, a) => b.queueCostUp(a.value),
  },
  sealCards: {
    kind: "debuff",
    text: (_b, _e, a) => ({ to: "", core: `다음 턴에 카드를 ${a.count}장 봉인하` }),
    run: (b, _e, a) => b.queueSeal(a.count),
  },
  burnRamp: {
    kind: "debuff",
    text: (_b, e, a) => ({ to: TO[a.target], core: `화상을 ${a.value + e.ramp * a.step} 부여하`, after: `사용할 때마다 화상이 ${a.step} 늘어납니다.` }),
    run(b, e, a) {
      const v = a.value + e.ramp * a.step;
      e.ramp++;
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "burn", v);
    },
  },
  attackRamp: {
    kind: "attack",
    text(b, e, a) {
      const d = b.enemyDmgPreview(e, a.dmg + e.ramp * a.step);
      return { to: TO[a.target], core: `피해를 ${hitsOf(d, a.hits)} 입히`, after: `사용할 때마다 피해가 ${a.step} 늘어납니다.` };
    },
    run(b, e, a) {
      const dmg = a.dmg + e.ramp * a.step;
      e.ramp++;
      ENEMY_ACTIONS.attack.run(b, e, { type: "attack", dmg, hits: a.hits, target: a.target });
    },
  },
  detonateBurn: {
    kind: "attack",
    text: (_b, _e, a) => ({ to: TO.all, core: `화상 수치의 ${a.mult}배만큼 피해를 입히` }),
    run(b, e, a) {
      for (const s of b.aliveSpirits()) {
        const n = statusN(s, "burn");
        if (n > 0) b.hurtSpirit(s, round(n * a.mult), false, { attacker: e });
      }
    },
  },
  burrow: {
    kind: "defend",
    text: () => ({ to: "", core: "땅속으로 숨" }),
    run: (b, e) => b.addStatus(e, "burrow", 1),
  },
  swapFront: {
    kind: "debuff",
    text: () => ({ to: "", core: "HP가 가장 낮은 다른 아군을 앞열로 끌어내" }),
    run(b) {
      const others = b.aliveSpirits().filter((s) => s.id !== b.frontId).sort((x, y) => x.hp - y.hp);
      if (others.length) b.setFront(others[0].id);
    },
  },
  sapHeal: {
    kind: "defend",
    text: (_b, e, a) => (statusN(e, "burn") > 0
      ? { to: "", core: `회복하지 못하고 피해를 ${statusN(e, "burn") * 2} 입` }
      : { to: "", core: `HP를 ${a.value} 회복하` }),
    run(b, e, a) {
      if (b.inGap(e)) {
        b.log(`${e.def.name}: 틈이라 회복하지 못함`);
        return;
      }
      if (statusN(e, "burn") > 0) {
        b.log(`수액에 불 붙음: 화상 피해 2배`);
        b.hurtEnemy(e, round(stackOf(e, "burn").n * 2 * vulnMult(e)), true);
      } else {
        const amt = Math.min(a.value, e.maxHp - e.hp);
        e.hp += amt;
        b.emit({ k: "heal", ref: refOf(e), amount: amt });
      }
    },
  },
};

type ActionKind = EnemyActionHandler["kind"];
const KIND_ORDER: ActionKind[] = ["attack", "defend", "buff", "debuff"];

/** 행동 목록의 대표 의도 종류 */
export function intentKind(actions: EnemyAction[]): Intent["kind"] {
  const kinds = actions.map((a) => ENEMY_ACTIONS[a.type].kind);
  return KIND_ORDER.find((k) => kinds.includes(k)) ?? "debuff";
}
