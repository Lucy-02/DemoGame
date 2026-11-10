import { join, type Part, type TextContext } from "../clauses";
import { C, ELEMENT_NAME } from "../data";
import { polite } from "../korean";
import { round, scale } from "../stats";
import type { CardDef, CardOp } from "../types";
import type { Engine } from "./engine";
import { AURAS } from "./passives";
import { refOf, stackOf, statusN, type BCard, type BEnemy, type BSpirit } from "./state";
import { vulnMult } from "./statuses";

/** 효과 하나를 처리할 때 받는 것 */
export interface EffectContext {
  b: Engine;
  card: BCard;
  def: CardDef;
  owner: BSpirit;
  enemies: BEnemy[];
  allies: BSpirit[];
  /** 이 카드보다 먼저 이번 턴에 놓은 카드 수 */
  comboCount: number;
  /** 카드의 주 수치: 첫 호출에만 성장분을 더해요 */
  main: (v: number) => number;
  /** 효과 목록을 이어서 처리해요 (연속) */
  run: (ops: CardOp[]) => void;
}

type OpId = CardOp["op"];
type OpOf<K extends OpId> = Extract<CardOp, { op: K }>;

/** 효과 하나의 규칙: 처리, 놓는 즉시인지, 효과문 */
export interface EffectHandler<K extends OpId = OpId> {
  /** 놓는 즉시 처리하고, 재생 때는 건너뛰어요 (0036) */
  immediate?: boolean;
  /** 이 효과가 있는 카드는 쓰고 나서 소멸해요 */
  exhausts?: boolean;
  resolve: (ctx: EffectContext, op: OpOf<K>) => void;
  describe: (op: OpOf<K>, t: TextContext) => Part[];
}

const hitEach = (ctx: EffectContext, base: number, noPower = false) => {
  for (const e of ctx.enemies) if (!e.dead) ctx.b.hit(ctx.owner, e, base, ctx.def.element, noPower);
};

export const EFFECTS: { [K in OpId]: EffectHandler<K> } = {
  damage: {
    resolve(ctx, op) {
      const base = ctx.main(op.value);
      for (const e of ctx.enemies) {
        const times = op.againIf === "burned" && statusN(e, "burn") > 0 ? 2 : 1;
        for (let t = 0; t < times; t++)
          for (let h = 0; h < (op.hits ?? 1); h++) if (!e.dead) ctx.b.hit(ctx.owner, e, base, ctx.def.element, false);
      }
    },
    describe(op, t) {
      const d = t.dmg(t.main(op.value));
      const hits = op.hits && op.hits > 1 ? `${d}씩 ${op.hits}번` : `${d}`;
      const again = op.againIf === "burned" ? `대상이 화상 상태이면 피해를 추가로 ${hits} ${polite("입히")}.` : undefined;
      return [{ to: t.foe, core: `피해를 ${hits} 입히`, after: again }];
    },
  },
  damageFromBlock: {
    resolve: (ctx) => hitEach(ctx, ctx.owner.block, true),
    describe: (_op, t) => [{ to: t.foe, core: "현재 방어도만큼 피해를 입히", after: `파워의 영향을 받지 ${polite("않")}.` }],
  },
  damagePerPlayed: {
    resolve(ctx, op) {
      const n = ctx.b.playedByElement[op.element] ?? 0;
      const base = ctx.main(op.value * n);
      ctx.b.log(`이번 전투 ${ELEMENT_NAME[op.element]} 카드 ${n}장`);
      if (base > 0) hitEach(ctx, base);
    },
    describe: (op, t) => [{ to: "", core: `이번 전투에서 사용한 ${ELEMENT_NAME[op.element]} 카드 1장당 ${t.foe}피해를 ${op.value} 입히` }],
  },
  block: {
    resolve(ctx, op) {
      const v = round(scale(ctx.main(op.value), ctx.b.stat(ctx.owner, "guard")) * ctx.b.passiveMult(ctx.owner, "supportMult"));
      for (const s of ctx.allies) ctx.b.gainBlock(s, v);
    },
    describe: (op, t) => [t.ally("block", `방어도를 ${t.sc(t.main(op.value), "guard")}`)],
  },
  heal: {
    resolve(ctx, op) {
      const { b, owner } = ctx;
      const v = round(scale(ctx.main(op.value), b.stat(owner, "focus")) * b.passiveMult(owner, "healMult") * b.passiveMult(owner, "supportMult"));
      for (const s of ctx.allies) b.healSpirit(s, v);
    },
    describe: (op, t) => [{ to: t.allyOf, core: `HP를 ${t.sc(t.main(op.value), "focus")} 회복하` }],
  },
  burn: {
    resolve(ctx, op) {
      const v = ctx.b.burnAmount(ctx.owner, scale(ctx.main(op.value), ctx.b.stat(ctx.owner, "focus")));
      for (const e of ctx.enemies) if (!e.dead) ctx.b.addStatus(e, "burn", v);
    },
    describe: (op, t) => [{ to: t.foe, core: `화상을 ${t.sc(t.main(op.value), "focus")} 부여하` }],
  },
  ignite: {
    resolve(ctx) {
      for (const e of ctx.enemies) {
        if (e.dead || statusN(e, "burn") <= 0) continue;
        const amt = round(statusN(e, "burn") * vulnMult(e));
        stackOf(e, "burn").n = 0;
        ctx.b.log(`점화: 피해 ${amt}`);
        ctx.b.hurtEnemy(e, amt, true);
      }
    },
    describe: (_op, t) => [{ to: t.foe, core: "화상 수치만큼 피해를 입히고 화상을 모두 없애" }],
  },
  burnMultiply: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) {
        if (e.dead) continue;
        stackOf(e, "burn").n *= op.value;
        ctx.b.emit({ k: "status", ref: refOf(e), text: `화상 ×${op.value}` });
      }
    },
    describe: (op, t) => [{ to: "", core: `${t.foeOf} 화상을 ${op.value}배로 늘리` }],
  },
  chill: {
    resolve(ctx, op) {
      const v = scale(ctx.main(op.value), ctx.b.stat(ctx.owner, "focus")) * ctx.b.passiveMult(ctx.owner, "chillMult");
      for (const e of ctx.enemies) if (!e.dead) ctx.b.addStatus(e, "chill", v);
    },
    describe: (op, t) => [{ to: t.foe, core: `냉기를 ${t.sc(t.main(op.value), "focus")} 부여하` }],
  },
  freeze: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) {
        if (e.dead) continue;
        if (e.def.tier === "boss") ctx.b.addStatus(e, "chill", op.bossChill);
        else ctx.b.freezeEnemy(e);
      }
    },
    describe: (op, t) => [{ to: t.foe, core: "빙결시키", after: `보스에게는 대신 냉기를 ${op.bossChill} ${polite("부여하")}.` }],
  },
  thorns: {
    /** 아군을 고르는 카드는 고른 아군 모두가 받아요. 그 밖에는 카드 주인 */
    resolve(ctx, op) {
      const v = scale(ctx.main(op.value), ctx.b.stat(ctx.owner, "guard"));
      for (const s of ctx.allies.length ? ctx.allies : [ctx.owner]) ctx.b.addStatus(s, "thorns", v);
    },
    describe: (op, t) => [t.ally("thorns", `반격을 ${t.sc(t.main(op.value), "guard")}`)],
  },
  grow: {
    resolve(ctx, op) {
      ctx.card.grow += op.value;
      ctx.b.log(`${ctx.def.name} 성장 +${op.value} (이번 전투 누적 +${ctx.card.grow})`);
    },
    describe: (op) => [{ to: "", core: `이번 전투 동안 이 카드의 수치가 ${op.value} 늘어나` }],
  },
  draw: {
    immediate: true,
    resolve: (ctx, op) => ctx.b.drawCards(op.value),
    describe: (op) => [{ to: "", core: `카드를 ${op.value}장 뽑` }],
  },
  vulnerable: {
    resolve(ctx, op) {
      const focus = ctx.b.stat(ctx.owner, "focus");
      const pct = Math.min(C.vuln_cap, C.vuln_base + Math.max(0, focus - C.stat_base) * C.vuln_focus_step);
      for (const e of ctx.enemies) if (!e.dead) ctx.b.addStatus(e, "vuln", op.turns, { strength: pct });
    },
    describe: (op, t) => [{ to: t.foe, core: `취약을 ${op.turns}턴 부여하` }],
  },
  weak: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) if (!e.dead) ctx.b.addStatus(e, "weak", op.turns);
    },
    describe: (op, t) => [{ to: t.foe, core: `약화를 ${op.turns}턴 부여하` }],
  },
  empower: {
    resolve(ctx, op) {
      const v = scale(ctx.main(op.value), ctx.b.stat(ctx.owner, "focus"));
      for (const s of ctx.allies) ctx.b.addStatus(s, "empower", v);
    },
    describe: (op, t) => [t.ally("empower", `강화를 ${t.sc(t.main(op.value), "focus")}`)],
  },
  keepBlock: {
    resolve(ctx) {
      ctx.b.addStatus(ctx.owner, "keepBlock", 1);
      ctx.b.log(`${ctx.owner.def.name}의 방어도가 이번 전투 동안 사라지지 않아요.`);
    },
    describe: () => [{ to: "", core: "이번 전투 동안 방어도가 내 턴 시작 시 사라지지 않" }],
  },
  taunt: {
    resolve: (ctx) => ctx.b.addStatus(ctx.owner, "taunt", 1),
    describe: (_op, t) => [{ to: t.me, core: "도발을 얻" }],
  },
  moveFront: {
    resolve(ctx) {
      ctx.b.frontId = ctx.owner.id;
      ctx.b.log(`${ctx.owner.def.name}: 앞열로 나섬`);
    },
    describe: () => [{ to: "", core: "이 정령이 앞열로 나서" }],
  },
  manaNextTurn: {
    resolve: (ctx, op) => (ctx.b.nextTurnMana += op.value),
    describe: (op) => [{ to: "", core: `다음 턴에 마력을 ${op.value} 더 얻` }],
  },
  aura: {
    exhausts: true,
    resolve(ctx, op) {
      ctx.b.addAura(ctx.owner, op.aura, op.value);
      ctx.b.emit({ k: "status", ref: refOf(ctx.owner), text: `지속: ${ctx.def.name}` });
    },
    describe: (op, t) => [`지속. ${AURAS[op.aura].text(op.value, t.sc)}`],
  },
  repeatNext: {
    immediate: true,
    resolve: (ctx, op) => (ctx.b.repeatNext = { maxCost: op.maxCost }),
    describe: (op) => [{ to: "", core: `이번 턴에 다음으로 사용하는 비용 ${op.maxCost} 이하 카드가 한 번 더 발동하` }],
  },
  combo: {
    resolve(ctx, op) {
      if (ctx.comboCount < op.n) return;
      ctx.b.log(`연속 ${op.n} 발동`);
      ctx.run(op.then);
    },
    describe: (op, t) => [`연속 ${op.n}: ${join(op.then.flatMap((o) => describeOp(o, t)))}`],
  },
};

export const handlerOf = (op: CardOp) => EFFECTS[op.op] as EffectHandler;

export const resolveOp = (ctx: EffectContext, op: CardOp) => handlerOf(op).resolve(ctx, op);
export const describeOp = (op: CardOp, t: TextContext): Part[] => handlerOf(op).describe(op, t);

/** 이 카드는 쓰고 나서 소멸하는지 */
export const exhaustsAfterUse = (def: CardDef, card: BCard) =>
  def.exhaust || card.isCopy || def.effects.some((o) => handlerOf(o).exhausts);
