// 헤드리스 런 시뮬레이터: 자동 플레이로 1막 한 판을 처음부터 보스까지 돌려요.
// 인카운터 하나만 보는 sim.ts와 달리 덱이 자라고 HP가 깎인 채 보스를 만나요.
// 사용: pnpm runsim [반복 수] [파티 a,b,c] [--adult] [--all] [--bot basic|smart|search|ladder]
// 봇은 실력이 다른 셋이에요. 숫자는 절댓값이 아니라 봇 사이 · 바꾸기 전후 비교로 읽어요 (`design/canon/BALANCE_BASELINE.md` 7절).
//   basic  공격 카드부터 내고 보상은 아무거나 (골든 테스트와 같은 봇)
//   smart  한 장씩 값을 매겨 놓고, 보상 · 이벤트 · 빼기를 가려 골라요 (기본)
//   search 턴 안의 모든 순서를 돌려 보고 끝까지 굴려 고르는 탐색 봇 (느려요)
import { Battle } from "../src/core/battle";
import { C, cardDef, spiritDef } from "../src/core/data";
import { newGarden } from "../src/core/garden";
import { Rng } from "../src/core/rng";
import { Run, type MapNode, type RewardCard } from "../src/core/run";
import { maxHpOf } from "../src/core/stats";
import type { EncounterDef, EventDef } from "../src/core/types";
import { autoPlayTurn } from "./autoplay";
import { smartPlayTurn } from "./bot";
import { makeSearchBot, type Bot } from "./search";

const MAX_TURNS = 40;
/** 성체 문 레벨(Lv4)에 닿는 경험 (growth.json levels) */
const ADULT_EXP = 150;

export type BotKind = "basic" | "smart" | "search";
export const BOT_KINDS: BotKind[] = ["basic", "smart", "search"];

/** 판 단위 판단: 보상 · 이벤트 · 카드 빼기 */
interface Policy {
  /** 받을 카드 id, 넘기면 null */
  reward(cards: RewardCard[], rng: Rng): string | null;
  event(run: Run, ev: EventDef, rng: Rng): number;
  /** 뺄 카드의 uid */
  remove(run: Run): number | undefined;
}

const has = (id: string, ...ops: string[]) => cardDef(id).effects.some((o) => ops.includes(o.op));

const NAIVE: Policy = {
  reward: (cards, rng) => rng.pick(cards).cardId,
  event: (_run, ev, rng) => Math.floor(rng.next() * ev.options.length),
  remove: (run) => (run.deck.find((c) => cardDef(c.cardId).rarity === "basic") ?? run.deck[0])?.uid,
};

/** 가려 고르기: 피해 · 화상 카드만 받고 아니면 넘겨요. 뺄 때는 막기 → 할퀴기 순서로, 화상 카드는 남겨요. */
const SENSIBLE: Policy = {
  reward: (cards, rng) => {
    const good = cards.filter((c) => has(c.cardId, "damage", "burn"));
    return good.length ? rng.pick(good).cardId : null;
  },
  event: (run, ev) => (ev.id === "ev_spring" ? (hpPct(run) < 0.85 ? 0 : 1) : ev.id === "ev_scroll" ? 1 : 0),
  remove: (run) => (run.deck.find((c) => c.cardId === "basic_block") ?? run.deck.find((c) => c.cardId === "basic_claw"))?.uid,
};

function player(kind: BotKind, seed: number): { bot: Bot; policy: Policy } {
  if (kind === "basic") return { bot: autoPlayTurn, policy: NAIVE };
  if (kind === "smart") return { bot: smartPlayTurn, policy: SENSIBLE };
  return { bot: makeSearchBot({ K: 3, top: 6, R: 8, depth: 30, rolloutBot: smartPlayTurn }, 12345 + seed), policy: SENSIBLE };
}

export interface RunSimResult {
  won: boolean;
  /** 끝난 곳: 인카운터 id 또는 "clear" */
  endedAt: string;
  floor: number;
  reachedBoss: boolean;
  /** 보스를 만났을 때의 덱 장수와 HP 비율 */
  bossDeck?: number;
  bossHpPct?: number;
  bossTurns?: number;
  battles: number;
}

const hpPct = (run: Run) => run.spirits.reduce((a, s) => a + s.hp, 0) / run.spirits.reduce((a, s) => a + maxHpOf(s), 0);

/** 전투 하나. 이기면 true. HP를 런에 되돌려요 (쓰러진 정령은 복귀 HP). */
function fight(run: Run, enc: EncounterDef, rng: Rng, bot: Bot): { won: boolean; turns: number } {
  const b = new Battle(run.spirits, run.deck, enc.enemies, run.frontId, rng, run.enemyScale());
  while (b.result === "ongoing" && b.turn < MAX_TURNS) {
    bot(b, rng);
    b.drain();
    if (b.result === "ongoing") b.endTurn();
    b.drain();
  }
  for (const s of b.spirits) run.spirit(s.id).hp = s.downed ? (C.downed_return_hp as number) : s.hp;
  return { won: b.result === "victory", turns: b.turn };
}

/** 길 고르기: HP가 낮으면 휴식 · 상점을, 아니면 아무 칸이나. 정예는 HP가 넉넉할 때만. */
function pickNode(run: Run, rng: Rng): MapNode {
  const options = run.reachable();
  const low = hpPct(run) < 0.5;
  const safe = options.filter((n) => n.type !== "elite");
  const heal = options.filter((n) => n.type === "rest" || n.type === "shop");
  if (low && heal.length) return rng.pick(heal);
  if (low && safe.length) return rng.pick(safe);
  return rng.pick(options);
}

function removeOne(run: Run, policy: Policy) {
  const uid = policy.remove(run);
  if (uid !== undefined && run.deck.length > 5) run.removeCard(uid);
}

export function simulateRun(seed: number, kind: BotKind = "smart", party?: string[], adult = false): RunSimResult {
  const ids = party ?? (C.default_party as string[]);
  // 앞열은 가장 튼튼한 정령(HP + 방어)에게 맡겨요. 앞열을 잘못 세우면 같은 파티도 보스를 못 넘어요.
  const sturdy = (id: string) => { const st = spiritDef(id).stats; return st.hp + st.guard * 2; };
  const frontId = [...ids].sort((a, z) => sturdy(z) - sturdy(a))[0];
  // 성체는 정원을 만들어 넘겨요. Lv2 · Lv3 해금 카드도 보상에 나와야 실제 성체 판과 같아요.
  const base = newGarden(seed, ids);
  const garden = adult ? { ...base, spirits: base.spirits.map((s) => ({ ...s, exp: ADULT_EXP, stage: "adult" as const })) } : undefined;
  const run = new Run({ seed: 5000 + seed, frontId, party, garden, adult, unlockAll: false });
  // 전투와 판 단위 판단의 난수를 나눠요. 봇이 달라도 같은 시드면 같은 지도 · 같은 길 고르기 난수를 써요.
  const battleRng = new Rng(seed * 13 + 5);
  const rng = new Rng(seed * 31 + 7);
  const { bot, policy } = player(kind, seed);
  let battles = 0;
  for (let guard = 0; guard < 30; guard++) {
    const node = pickNode(run, rng);
    run.enter(node);
    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      const enc = run.pickEncounter(node.type);
      const before = { bossDeck: run.deck.length, bossHpPct: hpPct(run) };
      const { won, turns } = fight(run, enc, battleRng, bot);
      battles++;
      if (node.type === "boss") return { won, endedAt: won ? "clear" : enc.id, floor: node.floor, reachedBoss: true, ...before, bossTurns: turns, battles };
      if (!won) return { won: false, endedAt: enc.id, floor: node.floor, reachedBoss: false, battles };
      const reward = run.rollBattleReward(node.type);
      if (!reward.cardsDone) {
        const id = policy.reward(reward.cards, rng);
        if (id) run.takeRewardCard(reward, id);
        else run.skipRewardCards(reward);
      }
      if (reward.equipment && !reward.equipDone) run.giveRewardEquipment(reward, rng.pick(run.equipTakers(reward.equipment.equipId)).id);
    } else if (node.type === "rest") {
      run.healAllPct(C.rest_heal_pct as number);
    } else if (node.type === "shop") {
      const shop = C.shop as { heal_price: number; heal_pct: number };
      if (hpPct(run) < 0.7 && run.gold >= shop.heal_price) {
        run.gold -= shop.heal_price;
        run.healAllPct(shop.heal_pct);
      }
      if (run.gold >= run.removePrice()) {
        run.gold -= run.removePrice();
        run.removals++;
        removeOne(run, policy);
      }
    } else if (node.type === "event") {
      const ev = run.pickEvent();
      for (const o of ev.options[policy.event(run, ev, rng)].outcome) {
        if (o.type === "healPct") run.healAllPct(o.value);
        else if (o.type === "gold") run.gold += o.value;
        else if (o.type === "damageAll") for (const s of run.spirits) s.hp = Math.max(1, s.hp - o.value);
        else if (o.type === "damageFront") run.spirit(run.frontId).hp = Math.max(1, run.spirit(run.frontId).hp - o.value);
        else if (o.type === "maxHpAll") for (const s of run.spirits) { s.maxHpBonus += o.value; s.hp = Math.min(maxHpOf(s), s.hp + o.value); }
        else if (o.type === "cardReward") {
          const cards = run.rollCards(3, C.reward.rarity_normal as Record<string, number>, o.rarity);
          if (cards.length) { const c = rng.pick(cards); run.addCard(c.id, rng.pick(run.learnersOf(c.id)).id); }
        } else if (o.type === "removeCard") removeOne(run, policy);
      }
    }
  }
  throw new Error("런이 끝나지 않았어요");
}

/** 승률의 95% 구간 (Wilson) */
export function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), h = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - h) / d, (c + h) / d];
}

function report(label: string, n: number, kind: BotKind, party?: string[], adult = false) {
  const rs = Array.from({ length: n }, (_, i) => simulateRun(i, kind, party, adult));
  const boss = rs.filter((r) => r.reachedBoss);
  const wins = rs.filter((r) => r.won);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
  const deaths = new Map<string, number>();
  for (const r of rs) if (!r.won) deaths.set(r.endedAt, (deaths.get(r.endedAt) ?? 0) + 1);
  const top = [...deaths].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${((v / n) * 100).toFixed(0)}%`).join(" · ");
  const pct = (x: number) => `${(x * 100).toFixed(1).padStart(5)}%`;
  const [lo, hi] = wilson(wins.length, n);
  console.log(
    `${label.padEnd(30)} ${kind.padEnd(6)} n=${String(n).padEnd(5)} 클리어 ${pct(wins.length / n)} [${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}]  보스 도달 ${pct(boss.length / n)}  ` +
    `보스 때 덱 ${avg(boss.map((r) => r.bossDeck!)).toFixed(1).padStart(4)}장 · HP ${pct(avg(boss.map((r) => r.bossHpPct!)))} · ${avg(boss.map((r) => r.bossTurns!)).toFixed(1)}턴  끝난 곳: ${top}`,
  );
}

if (process.argv[1]?.endsWith("runsim.ts")) {
  const args = process.argv.slice(2);
  const botAt = args.indexOf("--bot");
  const botArg = botAt >= 0 ? args.splice(botAt, 2)[1] : "smart";
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const rest = args.filter((a) => !a.startsWith("--"));
  const n = Number(rest[0] ?? 2000);
  const adult = flags.has("--adult");
  const kinds = botArg === "ladder" ? BOT_KINDS : [botArg as BotKind];
  if (!kinds.every((k) => BOT_KINDS.includes(k))) throw new Error(`모르는 봇: ${botArg}`);
  // 탐색 봇은 한 판에 1초쯤 걸려서 판 수를 줄여요
  const runs = (k: BotKind) => (k === "search" ? Math.min(n, 300) : n);
  if (flags.has("--all")) {
    const { SPIRITS } = await import("../src/core/data");
    for (const s of SPIRITS) for (const k of kinds) report(`혼자 ${s.id}${adult ? " (성체)" : ""}`, runs(k), k, [s.id], adult);
  } else {
    const party = rest[1]?.split(",");
    for (const k of kinds) report(`${party?.join(",") ?? "기본 파티"}${adult ? " (성체)" : ""}`, runs(k), k, party, adult);
  }
}
