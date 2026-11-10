// 헤드리스 런 시뮬레이터: 단순 AI로 1막 한 판을 처음부터 보스까지 돌려요.
// 인카운터 하나만 보는 sim.ts와 달리 덱이 자라고 HP가 깎인 채 보스를 만나요.
// 사용: pnpm runsim [반복 수] [파티 a,b,c] [--adult] [--all]
import { Battle } from "../src/core/battle";
import { C, cardDef } from "../src/core/data";
import { Rng } from "../src/core/rng";
import { Run, type MapNode } from "../src/core/run";
import { maxHpOf } from "../src/core/stats";
import { autoPlayTurn } from "./autoplay";

const MAX_TURNS = 40;

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
function fight(run: Run, enemies: string[], rng: Rng): { won: boolean; turns: number } {
  const b = new Battle(run.spirits, run.deck, enemies, run.frontId, rng);
  while (b.result === "ongoing" && b.turn < MAX_TURNS) {
    autoPlayTurn(b, rng);
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

/** 가장 값싼 기본 카드부터 한 장 빼요 */
function removeWorst(run: Run) {
  const basic = run.deck.find((c) => cardDef(c.cardId).rarity === "basic") ?? run.deck[0];
  if (basic && run.deck.length > 5) run.removeCard(basic.uid);
}

export function simulateRun(seed: number, party?: string[], adult = false): RunSimResult {
  const frontId = party?.[0] ?? "glass_salamander";
  const run = new Run({ seed: 5000 + seed, frontId, party, adult, unlockAll: false });
  const rng = new Rng(seed * 13 + 5);
  let battles = 0;
  for (let guard = 0; guard < 30; guard++) {
    const node = pickNode(run, rng);
    run.enter(node);
    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      const enc = run.pickEncounter(node.type);
      const before = { bossDeck: run.deck.length, bossHpPct: hpPct(run) };
      const { won, turns } = fight(run, enc.enemies, rng);
      battles++;
      if (node.type === "boss") return { won, endedAt: won ? "clear" : enc.id, floor: node.floor, reachedBoss: true, ...before, bossTurns: turns, battles };
      if (!won) return { won: false, endedAt: enc.id, floor: node.floor, reachedBoss: false, battles };
      const reward = run.rollBattleReward(node.type);
      if (!reward.cardsDone) run.takeRewardCard(reward, rng.pick(reward.cards).cardId);
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
        removeWorst(run);
      }
    } else if (node.type === "event") {
      const ev = run.pickEvent();
      for (const o of rng.pick(ev.options).outcome) {
        if (o.type === "healPct") run.healAllPct(o.value);
        else if (o.type === "gold") run.gold += o.value;
        else if (o.type === "damageAll") for (const s of run.spirits) s.hp = Math.max(1, s.hp - o.value);
        else if (o.type === "damageFront") run.spirit(run.frontId).hp = Math.max(1, run.spirit(run.frontId).hp - o.value);
        else if (o.type === "maxHpAll") for (const s of run.spirits) { s.maxHpBonus += o.value; s.hp = Math.min(maxHpOf(s), s.hp + o.value); }
        else if (o.type === "cardReward") {
          const cards = run.rollCards(3, C.reward.rarity_normal as Record<string, number>, o.rarity);
          if (cards.length) { const c = rng.pick(cards); run.addCard(c.id, rng.pick(run.learnersOf(c.id)).id); }
        } else if (o.type === "removeCard") removeWorst(run);
      }
    }
  }
  throw new Error("런이 끝나지 않았어요");
}

function report(label: string, n: number, party?: string[], adult = false) {
  const rs = Array.from({ length: n }, (_, i) => simulateRun(i, party, adult));
  const boss = rs.filter((r) => r.reachedBoss);
  const wins = rs.filter((r) => r.won);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
  const deaths = new Map<string, number>();
  for (const r of rs) if (!r.won) deaths.set(r.endedAt, (deaths.get(r.endedAt) ?? 0) + 1);
  const top = [...deaths].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${((v / n) * 100).toFixed(0)}%`).join(" · ");
  const pct = (x: number) => `${(x * 100).toFixed(0).padStart(3)}%`;
  console.log(
    `${label.padEnd(34)} 클리어 ${pct(wins.length / n)}  보스 도달 ${pct(boss.length / n)}  보스전 승률 ${pct(boss.length ? wins.length / boss.length : 0)}  ` +
    `보스 때 덱 ${avg(boss.map((r) => r.bossDeck!)).toFixed(1).padStart(4)}장 · HP ${pct(avg(boss.map((r) => r.bossHpPct!)))} · ${avg(boss.map((r) => r.bossTurns!)).toFixed(1)}턴  끝난 곳: ${top}`,
  );
}

if (process.argv[1]?.endsWith("runsim.ts")) {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const rest = args.filter((a) => !a.startsWith("--"));
  const n = Number(rest[0] ?? 200);
  const adult = flags.has("--adult");
  if (flags.has("--all")) {
    const { SPIRITS } = await import("../src/core/data");
    for (const s of SPIRITS) report(`혼자 ${s.id}${adult ? " (성체)" : ""}`, n, [s.id], adult);
  } else {
    const party = rest[1]?.split(",");
    report(`${party?.join(",") ?? "기본 파티"}${adult ? " (성체)" : ""}`, n, party, adult);
  }
}
