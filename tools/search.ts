// 탐색 봇: 이번 턴에 놓을 수 있는 카드 순서를 복제한 전투에서 모두 돌려 보고 가장 나은 줄을 골라요.
// 표본마다 새 난수와 다시 섞은 뽑을 더미를 써서 치명타 · 무작위 대상 · 앞으로 뽑을 카드를 엿보지 않아요(결정화).
// 상위 후보는 규칙 봇으로 전투 끝까지 여러 번 굴려(몬테카를로 롤아웃) 평균으로 겨뤄요.
import type { Battle, BCard } from "../src/core/battle";
import { cardDef } from "../src/core/data";
import { Rng } from "../src/core/rng";
import { cloneBattle } from "./clone";
export type Bot = (b: Battle, rng: Rng) => void;

export interface SearchOpts {
  /** determinized samples per candidate for the 1-turn evaluation */
  K: number;
  /** weight of own HP in the static eval (enemy HP = 1) */
  hpW: number;
  downW: number;
  /** candidates kept for rollouts (0 = static eval only) */
  top: number;
  /** rollouts per kept candidate */
  R: number;
  /** rollout horizon in turns */
  depth: number;
  rolloutBot?: Bot;
  maxNodes: number;
  stats?: { turns: number; nodes: number; evals: number; rollouts: number };
}
export const DEFAULTS: SearchOpts = { K: 3, hpW: 0.6, downW: 12, top: 0, R: 0, depth: 0, maxNodes: 400 };

type Tgt = { side: "e"; uid: number } | { side: "s"; id: string } | undefined;
interface Step { uid: number; target: Tgt; draws: boolean }

const burnFuture = (n: number) => { let t = 0; while (n > 0) { t += n; n = Math.floor(n / 2); } return t; };
const threatOf = (b: Battle, e: any) => {
  const pat = e.phase === 2 && e.def.phase2 ? e.def.phase2.pattern : e.def.pattern;
  let t = 0; const n = b.aliveSpirits().length;
  for (const m of pat) for (const a of m.actions) if (a.type === "attack") t += a.dmg * (a.hits ?? 1) * (a.target === "all" ? n : 1);
  return t / pat.length;
};

export function staticEval(b: Battle, o: SearchOpts): number {
  const boss = b.enemies.some((e) => e.def.tier === "boss");
  const hpW = boss ? o.hpW * 0.5 : o.hpW;
  if (b.result === "victory") return 10000 + (boss ? 0 : 3) * b.spirits.reduce((a, s) => a + (s.downed ? -o.downW : s.hp), 0);
  let v = 0;
  for (const e of b.aliveEnemies()) {
    const st: any = e.status;
    const pend = Math.min(e.hp, burnFuture(st.burn?.n ?? 0) * (st.vuln?.n > 0 ? 1.25 : 1) + (st.comet?.n ?? 0));
    const th = threatOf(b, e);
    v -= e.hp - 0.8 * pend;
    v -= th * hpW * 1.5;                                   // staying alive costs us ~1.5 more turns of hits
    v += ((st.chill?.n ?? 0) / b.chillThreshold(e)) * th * hpW * 0.8;
    if (st.vuln?.n > 0) v += 3 * Math.min(2, st.vuln.n);
    if (st.weak?.n > 0) v += 0.25 * th * hpW * Math.min(2, st.weak.n);
    v += 1.5 * (st.stagger?.n ?? 0);
    if (st.cancelNext?.n > 0) v += th * hpW;
    if (e.phase === 1 && e.def.phase2) v -= 0;            // no special handling
  }
  if (b.result === "defeat") return -10000 + v;
  for (const s of b.spirits) { if (s.downed) v -= o.downW; else v += hpW * s.hp + 4 * s.auras.size; }
  v += 5 * b.nextTurnMana + 3 * b.hold.held.length;
  return v;
}

const stateKey = (b: Battle) => {
  const pl = b.planned.map((p) => `${p.card.cardId}|${p.owner}|${p.end}|${p.target ? (p.target.side === "e" ? p.target.uid : p.target.id) : ""}|${p.repeat ? 1 : 0}|${p.card.held ? 1 : 0}|${cardDef(p.card.cardId).effects.some((x) => x.op === "combo") ? p.comboCount : ""}`).sort().join(";");
  const hand = b.hand.map((c) => `${c.cardId}|${c.owner}|${c.tempCostDelta}|${c.locked ? 1 : 0}|${c.held ? 1 : 0}`).sort().join(";");
  const foot = b.spirits.map((s) => (s.status as any).footing?.n ?? 0).join(",");
  return `${pl}#${hand}#${b.mana}#${foot}#${b.repeatNext ? b.repeatNext.maxCost : ""}#${b.stars.choice ? 1 : 0}#${b.enemies.map((e) => e.hp).join(",")}`;
};

function options(b: Battle): { c: BCard; target: Tgt }[] {
  const out: { c: BCard; target: Tgt }[] = []; const seen = new Set<string>();
  for (const c of b.hand) {
    if (!b.canPlay(c).ok) continue;
    const sig = `${c.cardId}|${c.owner}|${c.tempCostDelta}|${c.held ? 1 : 0}|${c.heldFast ? 1 : 0}|${c.grow}|${c.isCopy ? 1 : 0}`;
    if (seen.has(sig)) continue; seen.add(sig);
    const need = b.needsTarget(c);
    if (need === "enemy") for (const e of b.aliveEnemies()) out.push({ c, target: { side: "e", uid: e.uid } });
    else if (need === "ally") for (const s of b.aliveSpirits()) out.push({ c, target: { side: "s", id: s.id } });
    else out.push({ c, target: undefined });
  }
  return out;
}

const FALLS = [["meteor", "comet", "meteor_shower", "star_veil"], ["comet", "meteor", "star_veil", "meteor_shower"], ["meteor_shower", "meteor", "comet", "star_veil"], ["star_veil", "comet", "meteor", "meteor_shower"]];

function determinize(src: Battle, seed: number): Battle {
  const r = new Rng(seed);
  const c = cloneBattle(src, r);
  r.shuffle(c.draw);
  return c;
}

export function makeSearchBot(opts: Partial<SearchOpts> = {}, seed = 12345): Bot {
  const o: SearchOpts = { ...DEFAULTS, ...opts };
  const srng = new Rng(seed);
  return (b: Battle) => {
    for (const s of b.aliveSpirits()) if (b.canRelease(s.id)) b.release(s.id);
    while (b.stars.choice) b.chooseFall(FALLS[0]);
    for (let round = 0; round < 12 && b.result === "ongoing"; round++) {
      if (o.stats) o.stats.turns++;
      const seeds = Array.from({ length: Math.max(o.K, o.R) }, () => Math.floor(srng.next() * 2 ** 31));
      // enumerate
      const root = determinize(b, seeds[0] ^ 0x5bd1e995);
      const nodes: { seq: Step[]; st: Battle }[] = [{ seq: [], st: root }];
      const seen = new Set<string>([stateKey(root)]);
      for (let i = 0; i < nodes.length && nodes.length < o.maxNodes; i++) {
        const n = nodes[i];
        for (const op of options(n.st)) {
          const c = cloneBattle(n.st);
          if (!c.play(op.c.uid, op.target)) continue;
          while (c.stars.choice) c.chooseFall(FALLS[0]);
          const k = stateKey(c);
          if (seen.has(k)) continue; seen.add(k);
          nodes.push({ seq: [...n.seq, { uid: op.c.uid, target: op.target, draws: cardDef(op.c.cardId).effects.some((x) => x.op === "draw" || x.op === "fallNow") }], st: c });
        }
      }
      if (o.stats) o.stats.nodes += nodes.length;
      if (nodes.length === 1) return;
      // 1-turn determinized evaluation
      const scored = nodes.map((n) => {
        let v = 0;
        for (let k = 0; k < o.K; k++) { const c = determinize(n.st, seeds[k]); c.endTurn(); v += staticEval(c, o); }
        return { n, v: v / o.K };
      }).sort((a, z) => z.v - a.v);
      if (o.stats) o.stats.evals += nodes.length * o.K;
      let best = scored[0];
      if (o.top > 0 && o.R > 0 && scored.length > 1) {
        const bot = o.rolloutBot!;
        let bv = -Infinity;
        for (const s of scored.slice(0, o.top)) {
          let v = 0;
          for (let k = 0; k < o.R; k++) {
            const c = determinize(s.n.st, seeds[k]); const r = (c as any).rng as Rng;
            c.endTurn();
            const until = c.turn + o.depth;
            while (c.result === "ongoing" && c.turn < until) { bot(c, r); c.events.length = 0; if (c.result === "ongoing") c.endTurn(); }
            v += staticEval(c, o);
          }
          if (o.stats) o.stats.rollouts += o.R;
          v /= o.R;
          if (v > bv) { bv = v; best = s; }
        }
      }
      // commit: play until (and including) the first card that reveals hidden info, then re-plan
      let replan = false;
      for (const st of best.n.seq) {
        if (!b.play(st.uid, st.target)) { replan = true; break; }
        while (b.stars.choice) b.chooseFall(FALLS[0]);
        if (st.draws) { replan = true; break; }
      }
      if (!replan) return;
    }
  };
}
