import { join, type Part, type TextContext } from "../clauses";
import { C, ELEMENT_NAME } from "../data";
import { polite } from "../korean";
import { round, scale } from "../stats";
import type { CardDef, CardOp } from "../types";
import type { Engine } from "./engine";
import { AURAS } from "./passives";
import { refOf, spendStatus, stackOf, statusN, type BCard, type BEnemy, type BSpirit } from "./state";
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
  /** 카드의 주 수치: 첫 호출에만 성장분을 더하고 효과 배율(품기 · 받아치기)을 곱해요 */
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
  /** 이 효과가 있는 카드는 받아칠 기회를 쓰지 않아요 */
  keepsReady?: boolean;
  resolve: (ctx: EffectContext, op: OpOf<K>) => void;
  describe: (op: OpOf<K>, t: TextContext) => Part[];
}

const hitEach = (ctx: EffectContext, base: number, noPower = false) => {
  for (const e of ctx.enemies) if (!e.dead) ctx.b.hit(ctx.owner, e, base, ctx.def.element, noPower);
};
const starsOnAll = (b: Engine) => b.aliveEnemies().reduce((a, e) => a + statusN(e, "star"), 0);

export const EFFECTS: { [K in OpId]: EffectHandler<K> } = {
  damage: {
    resolve(ctx, op) {
      const base = ctx.main(op.value);
      for (const e of ctx.enemies) {
        const times = op.againIf === "burned" && statusN(e, "burn") > 0 ? 2 : 1;
        const hits = op.hitsPerStar ? statusN(e, "star") : (op.hits ?? 1);
        const perHit = base + (op.perStar ?? 0) * statusN(e, "star");
        for (let t = 0; t < times; t++)
          for (let h = 0; h < hits; h++) if (!e.dead) ctx.b.hit(ctx.owner, e, perHit, ctx.def.element, false);
      }
    },
    describe(op, t) {
      const d = t.dmg(t.main(op.value));
      if (op.hitsPerStar) return [{ to: t.foe, core: `대상의 별 하나마다 피해를 ${d} 입히` }];
      const star = op.perStar ? `대상의 별 하나마다 피해가 ${op.perStar} ${polite("늘어나")}.` : "";
      const hits = op.hits && op.hits > 1 ? `${d}씩 ${op.hits}번` : `${d}`;
      const again = op.againIf === "burned" ? `대상이 화상 상태이면 피해를 추가로 ${hits} ${polite("입히")}.` : undefined;
      return [{ to: t.foe, core: `피해를 ${hits} 입히`, after: again ?? (star || undefined) }];
    },
  },
  damageFromBlock: {
    resolve(ctx, op) {
      hitEach(ctx, ctx.owner.block, true);
      if (op.spend) ctx.owner.block = 0;
    },
    describe: (op, t) => [{
      to: t.foe,
      core: op.spend ? "남은 방어도를 모두 써서 그만큼 피해를 입히" : "현재 방어도만큼 피해를 입히",
      after: `파워의 영향을 받지 ${polite("않")}.`,
    }],
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
      const { b, owner } = ctx;
      const guard = b.stat(owner, "guard");
      const mult = b.passiveMult(owner, "supportMult");
      const stars = op.perStar ? starsOnAll(b) * op.perStar : 0;
      for (const s of ctx.allies) {
        const base = op.heldOwner !== undefined && b.holdsHeldCard(s) ? op.heldOwner : op.value;
        b.gainBlock(s, round(scale(ctx.main(base) + stars, guard) * mult));
      }
    },
    describe(op, t) {
      const c = t.ally("block", `방어도를 ${t.sc(t.main(op.value), "guard")}`);
      const after = [
        op.perStar ? `모든 적의 별 하나마다 ${op.perStar} ${polite("늘어나")}.` : "",
        op.heldOwner !== undefined ? `대상이 품었던 카드의 주인이면 대신 방어도를 ${t.sc(op.heldOwner, "guard")} ${polite("주")}.` : "",
      ].filter(Boolean).join(" ");
      return [after ? { ...c, after } : c];
    },
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
    resolve: (ctx, op) => ctx.b.drawCards(op.ifReady !== undefined && statusN(ctx.owner, "ready") > 0 ? op.ifReady : op.value),
    describe: (op) => [{
      to: "", core: `카드를 ${op.value}장 뽑`,
      after: op.ifReady !== undefined ? `받아칠 기회가 있으면 ${op.ifReady}장 ${polite("뽑")}.` : undefined,
    }],
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
      const holder = AURAS[op.aura].scope === "target" ? (ctx.allies[0] ?? ctx.owner) : ctx.owner;
      ctx.b.addAura(holder, op.aura, op.value);
      ctx.b.emit({ k: "status", ref: refOf(holder), text: `지속: ${ctx.def.name}` });
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
  hitBonus: {
    resolve(ctx, op) {
      for (const s of ctx.allies) ctx.b.addStatus(s, "hitBonus", op.hits, { strength: op.value });
    },
    describe(op, t) {
      const who = t.allyWho;
      return [{ to: "", core: `${who}다음 타격 ${op.hits}번의 피해가 ${op.value} 늘어나` }];
    },
  },

  // ───────────── 별 정령 ─────────────
  starlight: {
    resolve(ctx, op) {
      for (const s of ctx.allies) ctx.b.addStatus(s, "starlight", op.hits);
    },
    describe: (op, t) => [{ to: "", core: `${t.allyWho}다음 타격 ${op.hits}번이 맞힌 적에게 별을 1씩 새기` }],
  },
  star: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) {
        if (e.dead || (op.ifStarred && statusN(e, "star") === 0)) continue;
        ctx.b.markStar(ctx.owner, e, op.value);
      }
    },
    describe: (op, t) => [{
      to: t.foe, core: `별을 ${op.value} 새기`,
      after: op.ifStarred ? `별이 없는 적에게는 새기지 ${polite("않")}.` : undefined,
    }],
  },
  clearStars: {
    resolve(ctx) {
      const targets = ctx.enemies.length ? ctx.enemies : ctx.b.aliveEnemies();
      for (const e of targets) {
        if (statusN(e, "star") === 0) continue;
        delete e.status.star;
        ctx.b.emit({ k: "status", ref: refOf(e), text: "별 0" });
      }
    },
    describe: (_op, t) => [{ to: "", core: `${t.enemies ? t.foeOf : "모든 적의"} 별을 모두 지우` }],
  },
  starThresholdCut: {
    resolve(ctx, op) {
      ctx.b.stars.thresholdCut += op.value;
      ctx.b.log(`별 문턱 -${op.value}`);
    },
    describe: (op) => [{ to: "", core: `이번 전투 동안 낙하에 필요한 별이 ${op.value} 줄어들` }],
  },
  fallNow: {
    immediate: true,
    resolve(ctx) {
      for (const e of ctx.b.aliveEnemies()) {
        if (statusN(e, "star") === 0) continue;
        delete e.status.star;
        ctx.b.emit({ k: "status", ref: refOf(e), text: "별 0" });
      }
      ctx.b.offerFall();
    },
    describe: () => [{ to: "", core: "모든 적의 별을 지우고 지금 낙하 하나를 골라 손에 받" }],
  },
  delayedHit: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) if (!e.dead) ctx.b.addStatus(e, "comet", ctx.main(op.value));
    },
    describe: (op, t) => [{ to: t.foe, core: `다음 턴 시작에 피해를 ${op.value} 입히` }],
  },

  // ───────────── 유리 도롱뇽 ─────────────
  wall: {
    resolve(ctx, op) {
      ctx.b.gainWall(ctx.owner, round(scale(ctx.main(op.value), ctx.b.stat(ctx.owner, "guard")) * ctx.b.passiveMult(ctx.owner, "supportMult")));
    },
    describe: (op, t) => [{ to: "", core: `벽 방어도를 ${t.sc(t.main(op.value), "guard")} 얻` }],
  },
  wallHeat: {
    resolve: (ctx, op) => ctx.b.addStatus(ctx.owner, "wallHeat", op.value),
    describe: (op) => [{ to: "", core: `이번 턴에 다음으로 얻는 벽이 ${op.value} 늘어나` }],
  },
  afterglow: {
    resolve: (ctx, op) => ctx.b.addStatus(ctx.owner, "afterglow", ctx.main(op.value)),
    describe: (op, t) => [{ to: "", core: `이번 턴에 벽이 깨지면 다음 턴 시작에 벽 방어도를 ${t.sc(op.value, "guard")} 얻` }],
  },
  ricochet: {
    resolve(ctx, op) {
      for (const e of ctx.b.aliveEnemies()) {
        const taken = statusN(e, "wallTaken");
        if (taken === 0) continue;
        const back = round(taken * op.pct);
        ctx.b.log(`되튕김: ${e.def.name}에게 ${back}`);
        ctx.b.hurtEnemy(e, back, false);
      }
    },
    describe: (op) => [{ to: "", core: `이번 턴에 벽이 막은 피해의 ${Math.round(op.pct * 100)}%를 공격한 적에게 되돌리` }],
  },

  // ───────────── 진주조개 ─────────────
  hold: {
    resolve(ctx, op) {
      ctx.b.hold.thisTurn += op.value;
      ctx.b.log(`이번 턴 끝에 ${op.value}장 품기`);
    },
    describe: (op) => [{ to: "", core: `이번 턴 끝에 손에 남은 카드를 ${op.value}장 품` }],
  },
  highTide: {
    resolve: (ctx) => void (ctx.b.hold.highTide = true),
    describe: () => [{ to: "", core: "다음 턴에 돌아오는 품은 카드의 기본 시간이 절반이 되" }],
  },
  growOnHold: {
    resolve: () => {},
    describe: (op) => [{ to: "", core: `이 카드를 품을 때마다 이번 전투 동안 이 카드의 수치가 ${op.value} 늘어나` }],
  },

  // ───────────── 산양 ─────────────
  ram: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) {
        if (e.dead) continue;
        if (e.charging) {
          ctx.b.breakCharge(e);
          ctx.b.addStatus(e, "stagger", op.onBreak);
        } else if (ctx.b.inOpening(e, ctx.b.now)) ctx.b.addStatus(e, "stagger", op.value);
      }
    },
    describe: (op) => [{ to: "", core: `허점 창에 닿으면 대상이 휘청을 ${op.value} 받`, after: `차징 중인 적이면 브레이크하고 휘청을 ${op.onBreak} ${polite("주")}.` }],
  },
  staggerIfOpening: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) if (!e.dead && ctx.b.inOpening(e, ctx.b.now)) ctx.b.addStatus(e, "stagger", op.value);
    },
    describe: (op, t) => [{ to: "", core: `허점 창에 닿으면 ${t.foeOf === "모든 적의" ? "허점 창에 든 적이 모두" : "대상이"} 휘청을 ${op.value} 받` }],
  },
  staggerIfStaggered: {
    resolve(ctx, op) {
      for (const e of ctx.enemies) if (!e.dead && statusN(e, "stagger") > 0) ctx.b.addStatus(e, "stagger", op.value);
    },
    describe: (op) => [{ to: "", core: `대상이 휘청 중이면 휘청을 ${op.value} 더 받` }],
  },
  timeCutNext: {
    immediate: true,
    resolve: (ctx, op) => ctx.b.addStatus(ctx.owner, "footing", op.value),
    describe: (op) => [{ to: "", core: `이 정령의 다음 카드 시간이 ${op.value}ms 줄어들` }],
  },
  breakCharging: {
    resolve(ctx) {
      for (const e of ctx.enemies) if (!e.dead && e.charging) ctx.b.breakCharge(e);
    },
    describe: () => [{ to: "", core: "차징 중인 적을 모두 브레이크하" }],
  },
  cancelNext: {
    resolve(ctx) {
      for (const e of ctx.enemies) if (!e.dead) ctx.b.cancelNextMove(e);
    },
    describe: () => [{ to: "", core: "대상의 다음 행동을 없애" }],
  },

  // ───────────── 카멜레온 ─────────────
  hide: {
    keepsReady: true,
    resolve(ctx, op) {
      const to = op.readyTo === "target" ? ctx.allies[0] : undefined;
      ctx.b.addStatus(ctx.owner, "hidden", 1, { ref: to && to !== ctx.owner ? to.id : undefined });
    },
    describe: (op) => [{
      to: "", core: "이 정령이 숨",
      after: `다음 적 공격을 끌어와 절반만 ${polite("받")}. 받아내면 ${op.readyTo === "target" ? "고른 아군이 " : ""}받아칠 기회를 ${polite("얻")}.`,
    }],
  },
  keepReady: {
    keepsReady: true,
    resolve: () => {},
    describe: () => [{ to: "", core: "받아칠 기회를 쓰지 않" }],
  },
  passReady: {
    keepsReady: true,
    resolve(ctx) {
      const to = ctx.allies[0];
      const n = statusN(ctx.owner, "ready");
      if (!to || to === ctx.owner || n === 0) return;
      const from = ctx.owner.status.ready!;
      const st = stackOf(to, "ready");
      st.n += n;
      st.until = Math.max(st.until ?? 0, from.until ?? 0);
      spendStatus(ctx.owner, "ready", n);
      ctx.b.emit({ k: "status", ref: refOf(to), text: `받아칠 기회 ${st.n}` });
      ctx.b.emit({ k: "ready", id: to.id });
    },
    describe: () => [{ to: "", core: "이 정령의 받아칠 기회를 고른 아군에게 넘기" }],
  },
};

export const handlerOf = (op: CardOp) => EFFECTS[op.op] as EffectHandler;

export const resolveOp = (ctx: EffectContext, op: CardOp) => handlerOf(op).resolve(ctx, op);
export const describeOp = (op: CardOp, t: TextContext): Part[] => handlerOf(op).describe(op, t);

/** 이 카드는 쓰고 나서 소멸하는지 */
export const exhaustsAfterUse = (def: CardDef, card: BCard) =>
  def.exhaust || card.isCopy || def.effects.some((o) => handlerOf(o).exhausts);

/** 이 카드가 재생될 때 받아칠 기회를 쓰는지: 재생 효과가 있고, 기회를 아끼는 효과가 없을 때 */
export const usesReady = (def: CardDef) =>
  def.effects.some((o) => !handlerOf(o).immediate) && !def.effects.some((o) => handlerOf(o).keepsReady);
