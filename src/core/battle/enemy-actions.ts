import { C } from "../data";
import { round } from "../stats";
import type { EnemyAction, EnemyTargetRule } from "../types";
import type { Engine } from "./engine";
import { refOf, stackOf, statusN, type BEnemy, type Intent } from "./state";
import { vulnMult } from "./statuses";

type ActionId = EnemyAction["type"];
type ActionOf<K extends ActionId> = Extract<EnemyAction, { type: K }>;

/** 적 행동 하나의 규칙: 의도 표기, 종류, 처리 */
export interface EnemyActionHandler<K extends ActionId = ActionId> {
  /** 의도 종류. 한 행동에 여럿이면 attack > defend > buff > debuff 순으로 대표를 골라요 */
  kind: Exclude<Intent["kind"], "charge" | "chargeReady" | "skip">;
  text: (b: Engine, e: BEnemy, a: ActionOf<K>) => string;
  run: (b: Engine, e: BEnemy, a: ActionOf<K>) => void;
}

const TARGET_NAME: Record<EnemyTargetRule, string> = { front: "앞열", random: "무작위", lowest: "HP 최저", all: "전체" };

export const ENEMY_ACTIONS: { [K in ActionId]: EnemyActionHandler<K> } = {
  attack: {
    kind: "attack",
    text(b, e, a) {
      const d = b.enemyDmgPreview(e, a.dmg);
      const hits = a.hits && a.hits > 1 ? `${d}×${a.hits}` : `${d}`;
      return `${TARGET_NAME[a.target]} 피해 ${hits}${a.pierce ? " (방어 무시)" : ""}`;
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
    },
  },
  block: {
    kind: "defend",
    text: (_b, _e, a) => `방어도 ${a.value}`,
    run(b, e, a) {
      e.block += a.value;
      b.emit({ k: "block", ref: refOf(e), amount: a.value });
    },
  },
  weak: {
    kind: "debuff",
    text: (_b, _e, a) => `${TARGET_NAME[a.target]} 약화 ${a.turns}턴`,
    run(b, _e, a) {
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "weak", a.turns, { fresh: b.replaying });
    },
  },
  vulnerable: {
    kind: "debuff",
    text: (_b, _e, a) => `${TARGET_NAME[a.target]} 취약 ${a.turns}턴`,
    run(b, _e, a) {
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "vuln", a.turns, { fresh: b.replaying, strength: C.vuln_base });
    },
  },
  burn: {
    kind: "debuff",
    text: (_b, _e, a) => `${TARGET_NAME[a.target]} 화상 ${a.value}`,
    run(b, _e, a) {
      for (const s of b.pickTargets(a.target)) b.addStatus(s, "burn", a.value);
    },
  },
  buffMinions: {
    kind: "buff",
    text: (_b, _e, a) => `새끼 피해 +${a.value}`,
    run(b, _e, a) {
      for (const m of b.aliveEnemies()) if (m.def.tier === "minion") b.addStatus(m, "bonusDmg", a.value);
    },
  },
  costUp: {
    kind: "debuff",
    text: (_b, _e, a) => `손패 1장 비용 +${a.value}`,
    run: (b, _e, a) => b.queueCostUp(a.value),
  },
  sealCards: {
    kind: "debuff",
    text: (_b, _e, a) => `카드 ${a.count}장 봉인`,
    run: (b, _e, a) => b.queueSeal(a.count),
  },
  sapHeal: {
    kind: "defend",
    text: (_b, e, a) => (statusN(e, "burn") > 0 ? `회복 ${a.value} → 화상 ${statusN(e, "burn") * 2} 역류` : `회복 ${a.value}`),
    run(b, e, a) {
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
